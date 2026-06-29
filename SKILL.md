---
name: internet-court
description: Entry point for Internet Court — the trust layer for agent-to-agent commerce. Use whenever an agent needs to transact with another agent or a paid service, or a user mentions agent payments, paid APIs (HTTP 402/x402), wallet custody or trust concerns, spending mandates, delegated permissions (ERC-7710/7715), escrow, agent identity or reputation (ERC-8004), negotiation between agents (A2A), agent jobs (ERC-8183), machine payments (MPP, AP2), supervision of agent behavior, revocation, verification, or dispute resolution (GenLayer) — even if they never say "Internet Court". Routes to the vendored protocol skills and connector skills in this package.
---

# Internet Court

Internet Court is the entry skill for agent-to-agent commerce. It turns "I
want my agent to transact, but I don't trust it with money" into an
enforceable workflow: a natural-language mandate becomes bounded authority,
payments, escrow, signed evidence, independent review, and revocation or
dispute resolution when something goes wrong.

The core sentence:

```text
Internet Court creates the mandate. Delegated permissions grant bounded
authority. Payment rails move the funds. Independent reviewers judge what
happened. Connectors turn judgment into enforcement.
```

This package contains two kinds of material. Route accordingly:

- **Vendored protocol skills** (`vendored/`) — official, publicly published
  skills from the protocols themselves. Always prefer these for protocol
  mechanics; never re-derive what they already document.
- **Connector skills** (`integrations/genlayer-erc7710-connector/`,
  `integrations/genlayer-intelligent-contracts/`, `integrations/x402-erc7710/`) — the Internet
  Court-specific glue that makes the protocols work together.

## Where this package lives

This is the entry skill of the Internet Court package, published at
**`https://github.com/internet-court/internet-court-skill`**. Every path this
file routes to — `vendored/<owner>/<skill>/SKILL.md`,
`integrations/<connector>/SKILL.md` — is relative to that repository root.

Resolve those paths before relying on a skill's contents:

- **Installed as a whole** (normal case — `git clone …/internet-court-skill
  .claude/skills/internet-court`): read the path directly from disk.
- **Only this `SKILL.md` is present** (the master skill was loaded on its
  own): the sibling skills are not local. Fetch the file from the raw
  repository at
  `https://raw.githubusercontent.com/internet-court/internet-court-skill/main/<path>`
  — e.g. `…/main/vendored/okx/okx-dex-swap/SKILL.md` — or clone the repo
  first. The pinned source and refresh command for each vendored skill live
  in `skills-lock.json` at the repo root.

Never invent a referenced skill's contents — load the real file (from disk or
the raw URL) first.

## First Response Mode

When a user asks to load, install, or introduce Internet Court, start broad.
Do not lead with protocol names, payment rails, or standards unless the user
asks for implementation details.

Good default response:

```text
Internet Court is installed.

I can now help you give an agent bounded authority to do useful work, pay
for services, keep a record of what it did, have an independent reviewer
check whether it followed your mandate, and change or revoke that authority
when the evidence shows it should.
```

After the user asks for a concrete demo, integration, or deployment, use the
stack and routing below.

## Discovery-First Boundary

When the user asks to use a paid service, first inspect and report only what
is observable:

- service origin;
- relevant endpoint or resource;
- whether it is paywalled (HTTP 402);
- payment rail, network, token, amount, payee, and required transfer method
  when advertised.

Do not invent cadence, schedules, spend caps, expiration, delegated
authority, review policy, or a full mandate at this stage. State the boundary
plainly — the agent has no funds, and the user is the one who must provide
them — then stop and let the user's reply start the trust conversation:

```text
The endpoint is paywalled. I don't have funds to access it — you would need
to fund a wallet for me to pay with.
```

Never make a paid request before the user has chosen a trust mode and the
required wallet exists.

## Trust Objection Mode

When the user says they can fund a wallet but do not trust the agent with
money, present the custody and enforcement difference honestly:

- **Basic** — the user funds a wallet the agent controls. Fastest and
  weakest: unless a separate control exists, the practical limit is the
  wallet balance. Do not claim route, merchant, cadence, or topic limits are
  enforced in this mode.
- **Guarded** — the user keeps custody and approves a smart-account or wallet
  permission with explicit limits (allowed service, route, token, payee,
  per-request cap, period budget, expiry). The agent never receives the
  user's private key. Load `vendored/metamask/smart-accounts-kit/skill.md` for the
  ERC-7710/7715 mechanics.
- **Adjudicated** — Guarded, plus signed evidence and an independent review
  path that can continue, constrain, or revoke future permission use through
  a wired controller. Load `integrations/genlayer-intelligent-contracts/SKILL.md` for the
  review interface and `integrations/genlayer-erc7710-connector/SKILL.md` for enforcement.

Do not invent exact caps, cadence, or expiry in this answer; say they will be
set from the discovered payment requirements during setup.

## Adjudicated Setup Mode

When the user chooses adjudicated authority, move into setup. Derive budget
and expiry from the discovered payment requirements instead of asking for
arbitrary values; ask only for genuinely missing facts.

1. Create or select an agent session key for the task.
2. Prepare a guarded smart-account or wallet permission request.
3. Open a wallet approval flow for the user. The approval is the user's act
   in their wallet UI — the chat is only the command surface.
4. Store the returned permission artifact; never claim approval happened
   until the user or a verifiable artifact says it did.
5. Confirm the paid service requirements before spending.
6. Configure the review mandate and evidence requirements.
7. Submit or prepare the guardrail metadata for review.

End your turn while waiting for user approvals — do not promise background
polling, and do not make a paid request during setup.

## The Agentic Commerce Stack

Internet Court spans six layers. Route each layer to the skill or reference
that owns it:

| # | Layer | Protocols | Load |
|---|---|---|---|
| 1 | Discovery, identity & reputation | ERC-8004, ERC-7857 | `vendored/chaingpt/trustless-agents/SKILL.md` (ERC-8004 registries), `vendored/openserv/openserv-multi-agent-workflows/SKILL.md` (mints ERC-8004 agent identities), `vendored/privy/privy/SKILL.md` (embedded/server wallet identity & auth), `vendored/humanode/humanode-agentlink/SKILL.md` (human-backed agent identity), `vendored/starknet/starknet-identity/SKILL.md` (ERC-8004 on Starknet); ERC-7857 has no public skill yet |
| 2 | Negotiation | A2A | `vendored/terminalskills/a2a-protocol/SKILL.md` (agent cards, task lifecycle), `vendored/openserv/openserv-multi-agent-workflows/SKILL.md` (multi-agent orchestration) |
| 3 | Contracts & obligations | Arkhai/Alkahest, ERC-8183 | `vendored/arkhai/alkahest-user/SKILL.md` (conditional escrow, arbiters); ERC-8183 has no neutral public skill yet |
| 4 | Payment & escrow | x402, MPP, AP2, ERC-7710/7715 | `vendored/coinbase/agentic-wallet/SKILL.md` + `vendored/chaingpt/x402/SKILL.md` (x402), `vendored/tempo/mppx/SKILL.md` (MPP), `vendored/okx/okx-agent-payments-protocol/SKILL.md` (unified x402/MPP/a2a-pay), `vendored/metamask/smart-accounts-kit/skill.md` (delegations), `vendored/chaingpt/agent-wallet/SKILL.md` (policy-gated wallet), `integrations/x402-erc7710/SKILL.md` (combined rail); AP2 has no public skill yet |
| 5 | Execution | the transacting agents + compute/data/value rails | `vendored/antseed/antseed-connect/SKILL.md` + `vendored/0g/0g-compute/SKILL.md` + `vendored/heurist/heurist-mesh-skill/SKILL.md` (paid/decentralized inference), `vendored/lifi/lifi/SKILL.md` (cross-chain value movement), `vendored/chainbase/web3-data/SKILL.md` + `vendored/nansen/nansen-token-research/SKILL.md` (on-chain data/evidence), `vendored/starknet/starknet-defi/SKILL.md` (Starknet L2 contracts/DeFi), `vendored/bnb-chain/bnbchain-mcp/SKILL.md`, the `vendored/okx/*` and `vendored/altlayer/*` packs |
| 6 | Verification & disputes | GenLayer (Kleros is an alternative) | `integrations/genlayer-intelligent-contracts/SKILL.md`, `vendored/intelligent-oracle/intelligent-oracle/SKILL.md`, `integrations/genlayer-erc7710-connector/SKILL.md`. Alternative third-party arbitration (disclose; not GenLayer's own): `vendored/kleros/kleros-curate/SKILL.md` (token-curated registries / challenges) |

## Skill Routing

Load these only when the task needs them:

| Need | Skill |
|---|---|
| Pay an x402 service, search x402 bazaars, monetize an endpoint | `vendored/coinbase/agentic-wallet/SKILL.md`, `vendored/chaingpt/x402/SKILL.md` |
| Machine payments over HTTP 402 (Tempo/Stripe MPP: charges, sessions, streaming) | `vendored/tempo/mppx/SKILL.md` |
| Unified agent-payment dispatch (x402 + MPP + a2a-pay via OKX OnchainOS) | `vendored/okx/okx-agent-payments-protocol/SKILL.md` |
| Smart accounts, ERC-7710 delegations, ERC-7715 permission requests, caveats, revocation | `vendored/metamask/smart-accounts-kit/skill.md` |
| Custody-free agent wallet with policy gate (per-tx caps, velocity, session keys) | `vendored/chaingpt/agent-wallet/SKILL.md` |
| x402 payments executed through ERC-7710 delegated permissions (combined rail, spend/subscription policies) | `integrations/x402-erc7710/SKILL.md` |
| Register/discover/trust agents on-chain (ERC-8004 identity, reputation, validation) | `vendored/chaingpt/trustless-agents/SKILL.md` |
| Talk to another agent: agent cards, offers, task lifecycle (A2A) | `vendored/terminalskills/a2a-protocol/SKILL.md` |
| Escrow funds that unlock on arbiter decisions (Alkahest) | `vendored/arkhai/alkahest-user/SKILL.md` |
| Write a GenLayer Intelligent Contract | `vendored/genlayer/write-contract/SKILL.md` |
| Deploy/call GenLayer contracts via CLI | `vendored/genlayer/genlayer-cli/SKILL.md` |
| Test GenLayer contracts | `vendored/genlayer/direct-tests/SKILL.md`, `vendored/genlayer/integration-tests/SKILL.md` |
| Lint GenLayer contracts | `vendored/genlayer/genvm-lint/SKILL.md` |
| Review rubrics, evidence schemas, decision payloads for agent supervision | `integrations/genlayer-intelligent-contracts/SKILL.md` |
| Turn a GenLayer decision into ERC-7710 revocation/constraint (relayer/controller pattern) | `integrations/genlayer-erc7710-connector/SKILL.md` |
| Binary public-web prediction markets / factual oracles | `vendored/intelligent-oracle/intelligent-oracle/SKILL.md` (refetch `https://www.intelligentoracle.com/skill.md` before schema-sensitive work) |
| Buy/sell P2P AI inference with USDC payment channels | `vendored/antseed/antseed-connect/SKILL.md` |
| Decentralized compute, storage, verifiable inference (0G) | `vendored/0g/0g-compute/SKILL.md` |
| Cross-chain swaps/bridging to move value anywhere | `vendored/lifi/lifi/SKILL.md`, `vendored/lifi/lifi-stablecoin-swap/SKILL.md` |
| On-chain data, balances, tx history, labels (evidence) | `vendored/chainbase/web3-data/SKILL.md` |
| BNB Chain ops incl. ERC-8004 registration & Greenfield storage | `vendored/bnb-chain/bnbchain-mcp/SKILL.md` |
| ChainGPT AI tools (contract gen/audit, news) + 140-tool MCP | `vendored/chaingpt/chaingpt/SKILL.md` |
| OKX DEX/wallet/gateway/security pack | `vendored/okx/okx-dex-swap/SKILL.md`, `vendored/okx/okx-agentic-wallet/SKILL.md`, `vendored/okx/okx-onchain-gateway/SKILL.md`, `vendored/okx/okx-security/SKILL.md`, … |
| AltLayer AltLLM portal + Cloud Claw agent VMs | `vendored/altlayer/altllm-portal-cli/SKILL.md`, `vendored/altlayer/cloud-claw/SKILL.md`, … |
| Embedded & server (agentic) wallets, auth, policy-gated signing across chains (Privy) | `vendored/privy/privy/SKILL.md` |
| Decentralized AI inference + Heurist Mesh crypto agents (x402 pay-per-call) | `vendored/heurist/heurist-mesh-skill/SKILL.md` |
| On-chain intelligence/evidence: token research, wallet profiling, smart-money, holders, prediction markets (Nansen) | `vendored/nansen/nansen-token-research/SKILL.md`, `vendored/nansen/nansen-wallet-profiler/SKILL.md`, `vendored/nansen/nansen-smart-money-tracker/SKILL.md`, … |
| Multi-agent orchestration & agent SDK; mint ERC-8004 agent identities (OpenServ) | `vendored/openserv/openserv-multi-agent-workflows/SKILL.md`, `vendored/openserv/openserv-agent-sdk/SKILL.md`, … |
| Human-backed agent identity: sign HTTP requests, on-chain registry, partner endpoints (Humanode AgentLink) | `vendored/humanode/humanode-agentlink/SKILL.md` |
| Build on Starknet L2 (Cairo, native AA): identity (ERC-8004), starknet.js SDK, DeFi, wallet | `vendored/starknet/starknet-identity/SKILL.md`, `vendored/starknet/starknet-js/SKILL.md`, `vendored/starknet/starknet-defi/SKILL.md`, `vendored/starknet/starknet-wallet/SKILL.md` |
| Token-curated registries / challenges + IPFS evidence upload via Kleros (third-party arbitration — alternative to GenLayer disputes, disclose) | `vendored/kleros/kleros-curate/SKILL.md`, `vendored/kleros/kleros-ipfs-upload/SKILL.md` |

The official GenLayer skill hub is `https://skills.genlayer.com/`; the
vendored copies are pinned in `skills-lock.json`. Do not duplicate GenLayer
deployment workflow in this package — hand it to the vendored skills.

## Workflow

1. Classify the deal:
   - Delegated agent authority or revocable mandate.
   - Pay-per-use API or content access.
   - Recurring spend or subscription.
   - Escrowed service delivery.
   - Web-evidence oracle or prediction market.
   - Disputed job, SLA, or refund.
2. Extract commercial terms:
   - Parties, objective, authority, prohibited actions, amount, cadence, max
     spend, expiration, deliverable, evidence source, review cadence,
     revocation path, refund path, and dispute window.
3. Select rails (see the stack table):
   - x402 for immediate HTTP payment.
   - ERC-7710 plus ERC-7715 when an agent needs bounded delegated capability.
   - MPP sessions for streamed micropayments; AP2 mandates for
     user-authorized purchases.
   - Escrow (ERC-8183, Arkhai) when funds should stay locked until a
     fulfillment attestation satisfies an arbiter.
   - GenLayer Intelligent Contracts when the outcome depends on qualitative
     review of agent behavior or natural-language judgment.
   - Intelligent Oracle when the outcome is a narrow binary question settled
     from public web evidence.
   - GenLayer Intelligent Contracts also when a disputed job, SLA, or
     refund needs an independent verdict.
4. Produce a flow artifact:
   - User story, sequence steps, data model, permission policy, review
     contract, evidence schema, revocation path, failure cases, and minimal
     implementation plan.
5. Add dispute handling:
   - Define what can go wrong, who can trigger a dispute, what evidence is
     accepted, how finality is reached, and what happens to funds.

## Revocable Agent Mandates

Use this pattern when the user wants to delegate authority for a meaningful
period and revoke it if the agent performs poorly.

Internet Court outputs:

1. Natural-language mandate.
2. Machine-readable `AgentMandate`.
3. ERC-7710 `AgentDelegationPolicy`.
4. GenLayer Intelligent Contract review rubric.
5. Action receipt and evidence schema.
6. GenLayer-to-ERC-7710 connector path: decision payload, relayer/bridge
   mode, EVM controller, and redemption check.
7. Failure and appeal paths.

Do not claim GenLayer can directly cancel an ERC-7710 delegation unless the
revocation bridge/controller is part of the design. For long-lived
permissions, prefer an active revocation controller plus absolute expiry as
a fail-safe.

## Wallet-UI Deployment Mode

When the user deploys contracts, grants permissions, or relays decisions from
MetaMask, WalletConnect, or another user-controlled wallet UI:

- Never ask for a private key, seed phrase, or unrestricted bearer wallet.
- Never claim a contract, wallet, delegation, permission, review, relay, or
  payment exists until a proof arrives: transaction hash (`0x` + 64 hex),
  address (`0x` + 40 hex), signed artifact, or receipt. Malformed proof →
  ask again; do not advance.
- If the user says a proof is simulated, you may continue a rehearsal, but
  label that state as simulated in every later mention.
- Build transaction cards from source, ABI, or deployment metadata — never
  invent constructor fields from contract names. A card includes chain,
  sender, target, value, exact arguments, expected post-transaction reads,
  and the proof needed before proceeding.
- Do not paste full bytecode or calldata into chat; show the selector,
  payload hash, byte length, and exact arguments instead.

## Output Shape

When designing a demo or integration, return:

1. Deal summary in plain English.
2. Stack selection and why each rail is used.
3. Sequence diagram in text form.
4. Data model or policy object.
5. Happy path.
6. Failure and dispute paths.
7. Smallest credible implementation plan.
8. Open assumptions and test plan.

## Guardrails

- Treat Internet Court as protocol and demo design, not legal advice.
- Do not assume x402 provides escrow, refunds, or chargebacks. Pair it with
  escrow or adjudication when performance risk matters.
- Treat ERC-7710/7715 as draft unless the target wallet stack proves
  support. Simulate redemptions before execution; design for revocation,
  expiration, and stale permissions.
- Never recommend unlimited token approvals or unbounded agent spend.
- Keep demos testnet-first unless the user explicitly requests production.
- Report failures faithfully — a refused payment after revocation is the
  system working, not an error to hide.
