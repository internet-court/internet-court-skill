---
name: x402
description: x402 agentic payments (Coinbase's HTTP 402 protocol). Custody-free tools to pay x402-protected endpoints (build the EIP-3009 transferWithAuthorization the payer signs, assemble the X-PAYMENT header), call a facilitator (verify/settle/supported), and monetize your own API by generating PaymentRequirements. USDC on Base. Triggers: x402, HTTP 402, pay per request, agentic payment, machine payment, X-PAYMENT, transferWithAuthorization, EIP-3009, facilitator, monetize API, pay for API, agent pays.
---

# x402 Payments skill

x402 turns HTTP `402 Payment Required` into a real payment rail for agents: a
server replies `402` with what it wants paid; the client signs an off-chain
authorization and retries with an `X-PAYMENT` header; a facilitator broadcasts
it. Settlement uses EIP-3009 `transferWithAuthorization` (e.g. USDC on Base) —
the facilitator can only broadcast the signed authorization, never alter the
amount or destination.

**Custody-free:** the plugin builds the EIP-712 the payer signs and assembles
the header; it never holds a key.

## Tools

| Tool | Purpose |
|---|---|
| `chaingpt_x402_decode` | Decode a 402 body or X-PAYMENT header into human terms (amount/token/recipient/expiry) before paying. |
| `chaingpt_x402_build_payment` | Build the UNSIGNED EIP-3009 typed data; pass a signature back to get the final `X-PAYMENT` header. |
| `chaingpt_x402_facilitator` | Call a facilitator: `supported` / `verify` / `settle`. |
| `chaingpt_x402_create_requirements` | Server side: generate the `PaymentRequirements` + 402 body to monetize your endpoint. |
| `chaingpt_x402_fetch` | The whole client loop in one tool: fetch a URL; on 402 it decodes the challenge and (given `from`) emits the unsigned typed data; re-call with `xPaymentHeader` to complete the paid request. |

## Pay an endpoint (client flow)

Fast path — one tool drives the loop:

1. `chaingpt_x402_fetch url=<resource> from=<payer>` → on 402 you get the decoded price/payee AND the unsigned EIP-3009 typed data.
2. Sign the typed data in the payer's wallet.
3. `chaingpt_x402_build_payment from=<payer> requirements=<from step 1> signature=0x…` → the `X-PAYMENT` header.
4. `chaingpt_x402_fetch url=<resource> xPaymentHeader=<header>` → the paid response.

Manual path (same primitives, finer control): `_decode` → `_build_payment` → sign → `_build_payment +signature` → retry yourself.

## Monetize your endpoint (server flow)

`chaingpt_x402_create_requirements network=base amount=0.01 payTo=<you>` → serve
the returned JSON with HTTP 402. Verify/settle incoming payments via a
facilitator (`chaingpt_x402_facilitator`).

Known EIP-3009 tokens: USDC on `base` and `base-sepolia`. For other tokens pass
full `PaymentRequirements` (with `asset` + `extra.name`/`extra.version`).
0 ChainGPT credits.
