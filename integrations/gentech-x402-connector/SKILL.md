---
name: gentech-x402-connector
description: Connect an agent to the GenTech cross-chain agentic-treasury gateway as an x402 payment rail. Use when an agent needs to pay per-call USDC over HTTP 402 for DeFi LP analysis, token risk/rugcheck, wallet portfolio valuation, ERC-8004 agent discovery, real-time prices, airdrop/dust-token defense, or on-demand AI research — with no account, no API key, no subscription.
---

# GenTech x402 Connector

Use this skill when an agent wants to call the GenTech cross-chain agentic-treasury
gateway as a paid x402 resource. It is a connector: it documents the live gateway's
x402 surface and how to wire it into an agent's payment flow. It does not re-derive
the x402 protocol — for protocol mechanics use the vendored x402 skill
(`vendored/chaingpt/x402/SKILL.md`).

## Core Model

- The gateway is a pay-per-call HTTP x402 v2 resource server. A protected endpoint
  responds with `402 Payment Required`, the exact price, and the accepted networks.
  A wallet-capable agent signs with its wallet and retries with `Payment-Signature`.
- No account, no API key, no subscription. An agent that calls twice pays twice.
- The service set is treasury-first and DeFi-oriented, so it pairs naturally with
  the Internet Court Layer 4 (Payment & escrow) and Layer 6 (Verification & disputes)
  rails: every paid response can carry a service-signed receipt for evidence.

## Discovery-First Boundary

When the user has only asked to use or inspect the gateway, stay in discovery mode:

1. Identify the relevant endpoint and its path/query inputs.
2. Confirm it returns `402 Payment Required` with the x402 requirements.
3. Summarize: endpoint, network, token (USDC), price, payee, and route.
4. State that no paid request has been made.
5. Ask whether the user wants to set up bounded payment authority (see the
   `x402-erc7710` connector for a delegated budget over this rail).

Do not draft a subscription, mandate, or spend cap until the user asks for setup.

## Live Gateway Surface

Service URL: `https://api.gentechlabs.net`

Accepted networks (USDC): Solana, Base (`eip155:8453`), Avalanche
(`eip155:43114`), X Layer (`eip155:196`), and Algorand. X Layer is a separate
network from Arbitrum — do not configure Arbitrum for an X Layer payment.

| Endpoint | Input | Price |
|----------|-------|-------|
| `GET /v1/defi/lp/{address}` | `address` — pool or LP position address | $0.02 |
| `GET /v1/security/score/{address}` | `address` — token contract address | $0.01 |
| `GET /v1/wallet/portfolio/{address}` | `address` — wallet address (Solana) | $0.02 |
| `GET /v1/agents/search` | `q` — search query | $0.01 |
| `GET /v1/market/price/{symbol}` | `symbol` — e.g. `SOL`, `BTC` | $0.005 |
| `GET /v1/defender/classify/{chainId}/{token}` | `chainId` — CAIP chain id; `token` — address | $0.01 |
| `GET /v1/lineage/guard` | `urn` — dataset URN | $0.02 |
| `GET /v1/deals/deals` | no required params — tracked deal list | $0.005 |
| `GET /v1/agent/research` | `task` — research task; `topic` — topic | $0.05 |
| `GET /v1/nft/search` | `query` — NFT collection name | $0.01 |

## Payment Flow

1. Agent requests the endpoint with its path/query inputs.
2. Server returns `402 Payment Required` with the exact price and accepted networks.
3. Agent verifies the requirements against any delegated policy (network, token,
   amount, payee, route, budget).
4. Agent signs the payment payload with its wallet.
5. Agent retries the request with `Payment-Signature`.
6. Server or facilitator verifies and settles the payment, then returns the resource.

## Spend-Aware Usage

- Prefer a single narrow lookup (one symbol, one address) over broad loops.
- Use `/v1/market/price/{symbol}` for a spot check instead of polling RPC.
- Cache the ERC-8004 `agent/search` result for a session rather than re-searching.
- Confirm the exact price from the 402 challenge before paying; prices range
  $0.005–$0.05 per call depending on the service.
- NFT search returns collections; request only the page you need.

## Evidence / Dispute Integration

For paid report or API-resource demos, treat the paid response as evidence:

- The paid response should include a service-signed receipt with stable JSON
  canonicalization, payload hash, signer, route, method, request parameters,
  response hash, price, and issue time.
- The agent should sign an intent envelope before spending: agent address, service
  origin, route, method, request parameters, instruction hash, permission context
  hash, user mandate, timestamp, and nonce.
- Reject evidence before review unless the paid request returned HTTP 200,
  produced an x402 payment response header, and the service receipt signature
  verifies.
- Route disputed deliveries to Internet Court, Arkhai, or GenLayer for
  refund/release, per the Layer 6 rails.

## Guardrails

- Keep recurrence off the x402 protocol itself; model it as policy plus accounting
  (see the `x402-erc7710` connector for a delegated budget).
- Prefer testnets for demos. If using mainnet, require explicit confirmation and a
  hard spend cap.
- Never create unlimited approvals or open-ended agent authority.
- X Layer is not Arbitrum; configure the exact accepted network from the 402
  challenge, not a guess.

## References

- `vendored/chaingpt/x402/SKILL.md` — the x402 protocol mechanics.
- `integrations/x402-erc7710/SKILL.md` — bounded delegated budget over this rail.
- `integrations/genlayer-intelligent-contracts/SKILL.md` — adjudication of a
  disputed paid delivery.
