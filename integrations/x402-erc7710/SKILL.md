---
name: x402-erc7710
description: Design and implement demos combining x402 HTTP payments with ERC-7710 smart contract delegations and ERC-7715 wallet permission requests for subscriptions, bounded agent budgets, recurring spend, pay-per-use APIs, and agentic commerce.
---

# x402 + ERC-7710

Use this skill when a user wants a payment or subscription demo where an agent pays for HTTP resources through x402 and spends only within a bounded delegated permission.

## Core Model

- x402 is the per-request payment rail. A protected resource can respond with HTTP `402 Payment Required`, payment requirements, and a retry path where the client submits a signed payment payload. A facilitator can verify and settle the payment before the server returns the resource.
- ERC-7710 is the capability redemption interface. It standardizes how a delegation manager validates permission context and executes delegated actions on behalf of a delegator.
- ERC-7715 is the wallet permission request layer that can be used to obtain scoped permissions for ERC-7710-style delegation.

Use x402 for "pay now for this HTTP request." Use ERC-7710/7715 for "this agent may keep paying under these constraints."

## Discovery-First Boundary

When the user has only asked to use or inspect a paid HTTP service, stay in discovery mode:

1. Identify the relevant endpoint or resource.
2. Confirm whether it returns `402 Payment Required`.
3. Summarize the advertised x402 requirements: network, token, amount, payee, route, and `extra.assetTransferMethod` when present.
4. State that no paid request has been made.
5. Ask whether the user wants to set up bounded payment authority.

Do not draft a subscription, mandate, cadence, schedule, spend cap, expiration, or wallet permission until the user asks for setup or confirms they want to continue. Do not infer "daily", "weekly", or "recurring" authority from a product objective alone; wait for the user to approve delegation design.

Good discovery response shape:

```text
I found the paid endpoint and its x402 requirements.

- Endpoint: GET /path
- Network: ...
- Token: ...
- Price: ...
- Payee: ...

I have not made a paid request. Do you want me to help set up bounded payment authority for this task?
```

## Trust Objection Mode

When the user objects to trusting the agent with money, keep the options distinct:

- **Basic:** an agent-controlled funded wallet. This is not a scoped x402/ERC-7710 permission unless another component enforces it. The main limit is the wallet balance.
- **Guarded:** a user-approved smart-account or wallet permission that limits service, route, token, payee, amount, budget period, request count, and expiry.
- **Adjudicated:** guarded permission plus signed intent/receipt evidence and a review path that can continue, constrain, or revoke future use.

Do not assign exact route, price, cadence, or expiry values to the Basic option. Those constraints belong in Guarded or Adjudicated setup after the user chooses that path.

## Adjudicated Setup Mode

When the user selects adjudicated authority, proceed to setup instead of drafting a final mandate artifact immediately.

The right response is operational:

1. confirm adjudicated mode;
2. state that setup may take a while;
3. list the steps to create an agent session key, prepare the bounded wallet permission request, open user wallet approval, store the permission artifact, verify the x402 requirements, configure signed evidence, and prepare the review path;
4. ask the user to approve the guarded wallet permission in their wallet UI;
5. wait for the user's approval message.

Do not ask for arbitrary expiration, schedule, or spend-cap choices in this beat unless the previous conversation lacks enough facts to create a safe testnet permission request. Do not claim the permission is ready before the user approves it.

## Subscription Pattern

For subscriptions, do not make x402 stateful. Keep x402 as the request payment protocol and put recurrence in the delegated spend policy.

Recommended policy fields:

```ts
type AgentSpendPolicy = {
  delegator: `0x${string}`;
  delegate: `0x${string}`;
  token: `0x${string}`;
  allowedPayTo: `0x${string}`;
  allowedResourcePattern: string;
  maxPerRequest: bigint;
  maxPerPeriod: bigint;
  periodSeconds: number;
  validAfter: number;
  validUntil: number;
  chainId: number;
  revocable: boolean;
};
```

Execution flow:

1. User grants a scoped permission through wallet UX, ideally ERC-7715 when available.
2. The returned permission context is stored by the agent or subscription manager.
3. Agent requests an x402-protected endpoint.
4. Server returns payment requirements.
5. Agent verifies requirements against the policy: network, token, amount, merchant, route, expiry, and remaining budget.
6. Agent redeems the ERC-7710 delegation or otherwise executes through the user's smart account to produce the payment authorization.
7. Agent retries the HTTP request with the x402 payment payload.
8. Server or facilitator verifies and settles payment.
9. Subscription manager records spend and receipt for audit, revocation, and disputes.
10. For supervised wallets, a reporter contract or watcher submits spend snapshots to GenLayer on the review cadence.

## Default Demo

Build **Agent Research Pass** unless the user asks otherwise:

- Resource: `/api/evidence/report`.
- Price: 0.05 USDC per report over x402.
- Delegation: agent can spend up to 5 USDC per week, max 0.25 USDC per request, only to the provider wallet, only on Base Sepolia or another agreed testnet, expiring in seven days.
- Result: the provider returns a signed evidence report with sources and timestamp.
- Dispute: if the report is missing, malformed, late, or source-incompatible, route the receipt and report to Internet Court, Arkhai, or GenLayer for refund/release.

## Browser Lab Pattern

When building an exploratory dashboard, use this shape:

- The user connects their wallet on Base Sepolia and requests ERC-7715 execution permissions.
- The page generates a real agent EOA for the demo and exports a JSON package containing the agent private key, ERC-7710 permission context, permission manager, x402 policy, and GenLayer control metadata.
- Keep the first asset to Base Sepolia USDC unless the user asks for multi-chain or multi-token support.
- Prefer `erc20-token-periodic` for recurring agent spend, `erc20-token-allowance` for one-shot budgets, and `erc20-token-stream` only when continuous accrual is central to the demo.
- The x402 service must advertise `extra.assetTransferMethod = "erc7710"` or the MetaMask x402 client should refuse the payment.
- Support multiple allowed HTTP resources in the exported agent package when the service exposes more than one paid route.
- Route allowlists are initially enforced by the agent policy before each request. Do not claim route-level malicious-agent resistance unless a custom caveat, smart-account module, or facilitator-bound route proof is implemented.

The exported agent package is a bearer capability in demo form. Include explicit warnings, keep caps tiny, and never export production private keys.

The same delegated-wallet pattern can support non-x402 actions when the wallet and delegation manager expose them: ERC-20 allowance, ERC-20 periodic spend, ERC-20 streams, native token permissions, token approval revocation, and general contract executions through delegation scopes.

## Conversational Operator Mode

When the user wants to operate this demo by talking to Codex instead of using a UI, offer a concrete menu before implementing:

1. Inspect x402 resources and confirm `extra.assetTransferMethod = "erc7710"`.
2. Generate or import a real Base Sepolia agent wallet.
3. Draft an ERC-7715 permission request for MetaMask approval.
4. Build an agent JSON package containing agent key, permission context, allowed resources, budgets, and GenLayer control metadata.
5. Run or prepare an agent x402 payment attempt from that package.
6. Build a GenLayer decision payload for `continue`, `warn`, `constrain`, `revoke`, or `escalate`.
7. Apply a revocation/constrain decision through the local EVM controller path when configured.
8. Extend the demo to non-x402 delegated actions such as token budgets, native token budgets, approval revocation, or contract calls.

Ask direct implementation choices when the user has not specified them, especially:

- dashboard vs chat-first flow;
- generated agent wallet vs imported agent wallet;
- include private key in exported JSON or omit it;
- allowed resource paths;
- permission type: ERC-20 periodic, ERC-20 allowance, ERC-20 stream, native token allowance, approval revocation, or contract call;
- manual demo relay vs trusted watcher vs production bridge for GenLayer decisions.

State the wallet boundary clearly: Codex can prepare the ERC-7715 request, scripts, and artifact, but the user must approve MetaMask wallet prompts. Do not claim Codex can silently grant wallet permissions.

## MetaMask Transaction Cards

When the user wants to deploy or configure contracts from MetaMask or WalletConnect:

- Never ask for private keys.
- Do not invent constructor args or calldata from contract names. Read the source, ABI, or deployment script first.
- Show one approval card at a time unless the user asks for a batch.
- Do not mark a step complete until the user provides a tx hash, signed artifact, deployed address, or receipt.
- Validate receipt proofs before advancing: EVM tx hashes are `0x` plus 64 hex characters, and EVM addresses are `0x` plus 40 hex characters. Malformed values are not receipts.
- If the user explicitly says a proof is simulated or mocked, label the resulting state as simulated and never present it as actually deployed.
- If no QR backend exists, show an approval-card summary and say the QR is pending UI implementation.
- Do not paste full deployment bytecode or full calldata in chat by default, including permission grants, wallet delegation artifacts, review relay calls, and payment cards. Show selector, hash, byte length, exact args, expected reads, and proof needed; provide the raw payload only on request or as a hidden wallet/backend field.

For the local Internet Court x402 demo, `WalletSpendReporter` takes the Base `BridgeSender.sol` address `0x7AB80AE93246108bd1e80b8215c5F1147Ca56af0` as `initialBridgeSender`. Do not use the Base `BridgeReceiver` address `0xF92d8e5F1620E464eEac5fab5472dA06fbfA5C73` or the GenLayer `BridgeSender` Intelligent Contract there. The GenLayer `BridgeSender` Intelligent Contract is only for the GenLayer supervisor constructor.

For the local Internet Court x402 demo, `GenLayerDecisionReceiver.initialSourceContract` is the GenLayer supervisor address once known. If the supervisor is not deployed yet, ask for an explicit temporary nonzero placeholder and label it as temporary; never silently use the GenLayer `BridgeSender` Intelligent Contract as that placeholder.

## Periodic GenLayer Control

For supervised delegated payments, model review cadence in the mandate and artifact:

- demo cadence: one minute is acceptable for visible iteration;
- production-style cadence: twenty-four hours or a risk-based window;
- decisions: `continue`, `warn`, `constrain`, `revoke`, or `escalate`;
- effect path: Base spend reporter -> GenLayer Studio bridge -> GenLayer spend supervisor -> GenLayer Studio bridge -> EVM decision receiver -> revocation or constraint controller -> future ERC-7710 redemptions fail or tighten.

Never say GenLayer directly revokes ERC-7710 unless the EVM-side controller or caveat check has been wired into the redemption path.

## Other Demo Ideas

- **Compute Credits:** agent has a daily delegated budget for GPU or inference calls.
- **Oracle Resolution Credits:** prediction-market oracles charge per resolution attempt via x402 while ERC-7710 caps the market operator's spend.
- **Premium Crawler:** agent pays per crawled page but only for whitelisted domains and a fixed monthly budget.
- **SaaS Seat for Agents:** an organization grants an agent a time-bounded subscription permission instead of sharing credentials.
- **Dispute Insurance:** every x402 payment includes a small escrowed premium; disputed deliveries route to GenLayer or Arkhai.

## Implementation Checklist

When asked to implement or spec a demo, produce:

1. Resource server routes and x402 payment requirements.
2. Buyer agent wallet and delegated permission policy.
3. Permission request shape, noting whether ERC-7715 is available in the target wallet.
4. Policy validation before each payment.
5. Payment receipt store with parent request id, route, amount, token, chain, merchant, tx hash, and timestamp.
6. Spend snapshot source, such as an x402 permission manager with `spent`, `requestCount`, and a generic `getDelegatedSpendSnapshot`.
7. GenLayer bridge reporter and decision receiver addresses for Base Sepolia when the demo needs bridge-backed revocation.
8. Revocation and expiry behavior.
9. Dispute path and evidence bundle.
10. Test plan with over-budget, wrong merchant, expired permission, wrong route, failed settlement, stale bridge decision, duplicate bridge message, and replay attempts.

## Guardrails

- ERC-7710 is draft. Verify the target wallet/delegation manager implementation before promising compatibility.
- Always simulate delegation redemption before submitting on-chain.
- Never create unlimited approvals or open-ended agent authority.
- Keep recurrence off the x402 protocol itself; model it as policy plus accounting.
- Prefer testnets for demos. If using mainnet, require explicit confirmation and a hard spend cap.

## Signed Evidence Pattern

For paid report or API-resource demos using x402 plus review guardrails:

- The x402 paid response should include a service-signed receipt with stable JSON canonicalization, payload hash, signer, route, method, request parameters, response hash, price, and issue time.
- The agent should sign an intent envelope before spending: agent address, service origin, route, method, request parameters, instruction hash, permission context hash, user mandate, timestamp, and nonce.
- Reject evidence before review unless the paid request returned HTTP 200, produced an x402 payment response header, and the service receipt signature verifies.
- If the EVM guardrail permission is separate from the wallet x402 permission context, carry both hashes in evidence and set the review target to the controller-tracked permission hash.
- Keep custom guardrail permissions tiny and fresh for each run. Reusing a revoked permission only proves the final blocked state, not a full happy-path demo.
- A production-quality malicious-agent block needs a wallet caveat/enforcer or smart-account module wired directly to the EVM `RevocationController`; agent-side route checks alone are not malicious-agent resistant.

## References

- `references/demo-blueprints.md` for detailed demo flows and policy variations.
