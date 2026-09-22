---
name: x402-nano
description: Design and implement x402 payments and agentic commerce settled on Nano (XNO) — feeless, instant, issuer-free settlement for pay-per-use APIs, subscriptions, and agent-to-agent deals through the Nano mainnet exact scheme.
---

# x402 + Nano (XNO)

Use this skill when a user wants an agent to pay for HTTP resources through x402 where
settlement lands on Nano mainnet (`nano:mainnet`) instead of an EVM chain. It pairs the
standard x402 HTTP flow (402 → signed payment payload → facilitator verify/settle) with the
`exact` scheme's Nano implementation.

## Core Model

- x402 is the per-request payment rail. A protected resource responds with HTTP `402 Payment
  Required`, payment requirements, and a retry path where the client submits a signed payment
  payload. A facilitator verifies and settles the payment before the server releases the resource.
- On Nano, the `exact` scheme transfers an exact amount of XNO from the payer to the resource
  server's `payTo` account. The payer signs a Nano `send` block and does **not** submit it; the
  payload carries the signed block, so the proof travels with the request. The facilitator submits
  the block during `settle`, which is what lands it.
- Nano has no issuer and transfers carry no network fee: the settlement's exact `amount` is the
  entire cost to the payer, and no sub-cent minimum applies to a payment. XNO is the network's only
  native unit (fixed supply ~1.33 × 10^8 XNO).

Use x402 for "pay now for this HTTP request." Use Nano's exact scheme when the settled value must
be feeless, sub-second, and owned by a single signed block with no relayer, no bridge, and no
off-chain batching.

## Discovery-First Boundary

When the user has only asked to use or inspect a paid HTTP service, stay in discovery mode:

1. Identify the relevant endpoint or resource.
2. Confirm whether it returns `402 Payment Required`.
3. Summarize the advertised x402 requirements: network, token, amount, payee, and `extra`
   (work / workThreshold) when present.
4. State that no paid request has been made.
5. Ask whether the user wants to set up an XNO-funded payment path.

Do not draft a payment payload, a spend cap, a subscription cadence, or an expiry until the user
asks for setup or confirms they want to continue. Do not infer a budget from a product objective
alone.

Good discovery response shape:

```text
I found the paid endpoint and its x402 requirements.

- Endpoint: GET /api/report
- Network: nano:mainnet
- Asset: XNO
- Amount: 0.01 XNO (raw string on the wire)
- Payee: nano_1111...c8npp

I have not made a paid request. Do you want help setting up an XNO-funded payment path for this task?
```

## Units and Precision

- On the wire, Nano amounts are **raw units as decimal strings**. 1 XNO = 10^30 raw. The value
  `"10000000000000000000000000000"` is 0.01 XNO.
- Implementations MUST NOT put a decimal point on the wire and MUST NOT round to a fiat-style
  precision such as 6 decimals. Parse raw amounts as integers, not floating point.
- A price above the total supply is almost certainly raw units typed where XNO was meant, and
  SHOULD be rejected as such.

## Trust Objection Mode

When the user objects to trusting the agent with money, keep the options distinct:

- **Basic:** an agent-controlled funded wallet. The main limit is the wallet balance; nothing else
  scopes the spend.
- **Guarded:** a scoped x402 payment within a bounded budget the user approves (per-request amount
  and a max spend/period chosen by the user).
- **Adjudicated:** guarded permission plus signed evidence and a review path that can continue,
  constrain, or revoke future use (the Internet Court's role).

Do not assign exact route, price, cadence, or expiry values to the Basic option. Those constraints
belong in Guarded or Adjudicated setup after the user chooses that path.

## Set-up Mode (XNO payment path)

When the user selects a funded path, proceed to setup rather than drafting a payment immediately.

1. Confirm the payer Nano account and that it holds enough XNO (read `account_info`; unauthenticated
   and free).
2. For the chosen facilitator, read its `/supported` for the current `network`, send `workThreshold`,
   and `payTo` conventions — the threshold is a versioned protocol parameter.
3. Prepare the payer account: it must be **open** with a known frontier, balance, and representative
   before any block can verify.
4. State the exact amount in XNO and raw, confirm the recipient `payTo`, and confirm the budget
   boundary.
5. Only after the user approves, proceed to generate work and sign a `send` block for the payment.

Do not claim a payment is ready before the payer account is open and the user approves the spend.

## Verifying a Nano `exact` Payment (server / facilitator side)

The verification rules below are grounded in the Nano exact scheme (spec PR
`x402-foundation/x402#3536`, `specs/schemes/exact/scheme_exact_nano.md`). A conforming verifier
MUST reject any payload that fails a rule.

- **Signature:** the Ed25519–Blake2b signature MUST verify over the block's own fields (account,
  previous, representative, balance, link) with the public key decoded from `account`. A malformed
  or non-canonical signature must be rejected (`invalid_signature`), never repaired.
- **Frontier:** `signedBlock.previous` MUST equal `account_info.frontier`. A frontier mismatch
  (`frontier_mismatch`) or a frontier that moved between verify and settle (`frontier_moved`) fails.
- **Amount:** `account_info.balance - signedBlock.balance` MUST equal the required `amount` exactly
  (`amount_mismatch`). Overpayment is not a passing outcome.
- **Destination:** `link` (or `link_as_account`) MUST equal `payTo` (`destination_mismatch`).
- **Representative:** `signedBlock.representative` MUST equal the account's representative. A block
  that silently re-delegates voting weight MUST NOT be accepted as a plain payment.
- **Work:** validate with `work_validate` over `hash = previous` at the required difficulty
  (`extra.workThreshold` or the implementation's current mainnet send threshold). Work is computed
  over the frontier, not the block hash. Reject on failure (`insufficient_work`).
- **Single-use / expiry:** a signed send block has no expiry; it stays valid until the account's
  frontier changes. Single-use is enforced by the chain itself — consuming the block moves the
  frontier — so a resubmission can never settle twice.

## Settlement

Settlement is one submission of the client's block (the node's `process`), and success reflects
the on-chain effect (confirmation), not the submission's return code. If the frontier has moved
between verify and settle, return `success: false` with `errorReason` `frontier_moved` so the
client can re-sign and re-present. Do not report a generic error for a stale frontier — without a
distinct reason a client cannot tell a stale frontier from a bad payment.

The chain makes double settlement impossible with no blockhash lifetime and no block-height window
to evict on. Facilitators SHOULD keep a short-term in-memory cache keyed by a hash of the signed
block (`previous` + `signature` is sufficient) and reject a duplicate with `duplicate_settlement`.

## Getting XNO / node access

- To fund a payer account, buy XNO on an exchange and withdraw to the Nano address. Settlement is a
  plain Nano transfer, so an XNO balance is all that is required — no approval, no gas token, no
  bridging.
- Verification uses only standard Nano node RPC: `account_info` (frontier/balance/representative,
  open status), `work_validate`, `process`, and `block_confirm` (or `block_info` for confirmation).
  No archival node and no custom endpoint is required. Implementations SHOULD pin one node for a
  verify/settle pair and MUST fail closed when node state cannot be read.

## References

- [x402 Core Specification](https://x402.org/) and the exact scheme overview
  (`specs/schemes/exact/scheme_exact.md`).
- Nano exact scheme on mainnet: spec PR
  [`x402-foundation/x402#3536`](https://github.com/x402-foundation/x402/pull/3536),
  `specs/schemes/exact/scheme_exact_nano.md`.
- [`@x402nano/exact`](https://github.com/x402nano/exact) — TypeScript implementation, both sides.
- [`pursekeeper/x402-nano-exact`](https://github.com/pursekeeper/x402-nano-exact) — Python
  resource-server scheme for the `x402` Python SDK.
- [`facilitator.pursekeeper.dev`](https://facilitator.pursekeeper.dev) — live Nano facilitator; its
  `/supported` is the public reference for `extra` fields.
- [`openai-agents-nano-x402`](https://github.com/PANDeveloper001/openai-agents-nano-x402) — Python
  x402 client for OpenAI Agents that pays XNO (606+ release downloads).
- [Nano block types / state blocks](https://docs.nano.org/protocol-design/blocks/) and
  [node RPC](https://docs.nano.org/commands/rpc-protocol/).
