---
name: internet-court
description: Entry point for Internet Court — the trust layer for agent-to-agent commerce. Use whenever an agent needs to transact with another agent or a paid service, or a user mentions agent payments, paid APIs (HTTP 402/x402), wallet custody or trust concerns, spending mandates, delegated permissions (ERC-7710/7715), escrow, agent identity or reputation (ERC-8004), negotiation between agents (A2A), agent jobs (ERC-8183), machine payments (MPP, AP2), supervision of agent behavior, revocation, verification, or dispute resolution (GenLayer) — even if they never say "Internet Court". Routes to the vendored protocol skills and connector skills in this package.
---

# Internet Court

Internet Court is the entry skill for agent-to-agent commerce. Agents can
already discover each other, negotiate, and pay — what they lack is a way to
trust a counterparty they've never met. Internet Court does two things: it
connects a fragmented stack — identity, negotiation, contracts, payment,
escrow, execution — into one skill, and it builds in adjudication: when two
agents strike a deal, they agree up front how it settles if something goes
wrong.

The core sentence:

```text
Discovery and identity establish who. Negotiation and contracts set the terms.
Payment and escrow move or lock the funds. Execution does the work.
Adjudication decides what happened and writes the verdict back as reputation.
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
  — e.g. `…/main/vendored/genlayer/write-contract/SKILL.md` — or clone the repo
  first.

Never invent a referenced skill's contents — load the real file (from disk or
the raw URL) first.

## First Response Mode

When a user asks to load, install, or introduce Internet Court — or whenever
you first reference it in a conversation — start broad and use the canonical
blurb below **verbatim**. Do not paraphrase it, and do not lead with protocol
names, payment rails, or standards unless the user asks for implementation
details.

```text
Internet Court is installed.

Internet Court does two things: it connects a fragmented stack — identity,
negotiation, contracts, payment, escrow, and execution — into one skill, and
it builds in adjudication, so when two agents strike a deal they agree up
front how it settles if something goes wrong.

I can now help your agent find and vet a counterparty, agree terms, pay or
escrow funds, and do the work — and, if the deal is contested, get an
independent verdict that settles it and updates each side's reputation.
```

(When you are only referencing the skill mid-conversation rather than
reporting a fresh install, drop the first line and keep the rest verbatim.)

After the user asks for a concrete demo, integration, or deployment, use the
stack and routing below.

## Discovery-First Boundary

When the user asks to engage a service, counterparty, or deal, first inspect
and report only what is observable — never assume the rest. Depending on the
deal, that may include:

- who the counterparty is: origin, identity, reputation, the endpoint or
  resource in question;
- what it costs and how: whether it is paywalled, and any advertised rail,
  network, token, amount, payee, or transfer method;
- what it promises: deliverable, terms, and whatever evidence it exposes.

Do not invent cadence, schedules, spend caps, expiration, delegated
authority, review policy, or a full agreement at this stage. State the
boundary plainly — including that the agent holds no funds or authority the
user has not granted — then stop and let the user's reply start the trust
conversation. For example, for a paywalled endpoint:

```text
This endpoint is paywalled. I don't have funds or permission to access it —
you'd need to fund and authorize me before I can proceed.
```

Never commit funds, sign, or transact before the user has chosen a trust
level and the required wallet or permission exists.

## Trust Levels

Any deal that carries risk — the agent could misbehave, a counterparty could
fail to deliver, funds or authority could be misused — can run at one of three
levels of protection. Pick the lightest one that covers the risk, and name the
tradeoff honestly. Weakest to strongest:

- **Basic** — the parties simply trust each other. No bounded authority, no
  escrow, no independent judge; each side acts on whatever it was handed
  directly. Fastest and weakest: the practical limit is whatever was handed
  over, and there is no recourse if it goes wrong. Do not claim any limit is
  enforced at this level.
- **Guarded** — the deal is constrained up front so it can only go so wrong by
  construction. The instrument depends on the deal: bounded authority with
  explicit limits (an ERC-7710/7715 permission with caveats), funds locked in
  escrow until terms are met, or scoped terms both sides sign. Hard limits
  exist, but there is no neutral party to decide a contested outcome. Load
  `vendored/metamask/smart-accounts-kit/skill.md` for permission mechanics, or
  the layer-3/4 escrow skills for locked-funds deals.
- **Adjudicated** — Guarded, plus an independent review path with signed
  evidence that can decide a contested outcome and enforce the consequence:
  release or refund escrow, constrain or revoke the granted authority, and
  write the verdict back to reputation. Load
  `integrations/genlayer-intelligent-contracts/SKILL.md` for the review
  interface and `integrations/genlayer-erc7710-connector/SKILL.md` for
  enforcement.

Match the level to the deal, not the reverse. Do not invent exact caps,
cadence, terms, or expiry here; say they will be set from the discovered terms
during setup.

## The Agentic Commerce Stack

A complete deal moves top to bottom through six layers: find and vet a
counterparty (1), agree terms (2–3), move or lock funds (4), do the work (5),
and — if the outcome is contested — get an independent verdict that settles it
and feeds back into reputation (6). Most layers already have credible skills;
layer 6 is the keystone, since without a neutral verdict escrow cannot safely
release, contracts have no remedy, and reputation has nothing to record. Route
each layer to the skill or reference that owns it:

| # | Layer | Protocols | Load |
|---|---|---|---|
| 1 | Discovery, identity & reputation | ERC-8004, ERC-7857 | `vendored/chaingpt/trustless-agents/SKILL.md` (ERC-8004 registries), `vendored/openserv/openserv-multi-agent-workflows/SKILL.md` (mints ERC-8004 agent identities), `vendored/privy/privy/SKILL.md` (embedded/server wallet identity & auth), `vendored/humanode/humanode-agentlink/SKILL.md` (human-backed agent identity), `vendored/starknet/starknet-identity/SKILL.md` (ERC-8004 on Starknet), `vendored/near/near-api-js/SKILL.md` (named-account identity, e.g. `alice.near`); ERC-7857 has no public skill yet |
| 2 | Negotiation | A2A | `vendored/terminalskills/a2a-protocol/SKILL.md` (agent cards, task lifecycle), `vendored/openserv/openserv-multi-agent-workflows/SKILL.md` (multi-agent orchestration), `vendored/near/near-intents/SKILL.md` (Intents + solver competition for cross-chain fulfilment) |
| 3 | Contracts & obligations | Arkhai/Alkahest, ERC-8183 | `vendored/arkhai/alkahest-user/SKILL.md` (conditional escrow, arbiters) + `vendored/arkhai/alkahest-developer/SKILL.md` (build on Alkahest: custom arbiters/obligations), `vendored/arkhai/nla-create/SKILL.md` + `vendored/arkhai/nla-fulfill/SKILL.md` (natural-language-agreement escrows, AI-oracle arbitrated), `vendored/arkhai/make-git-escrow/SKILL.md` + `vendored/arkhai/fulfill-git-escrow/SKILL.md` (test-suite bounty escrows); ERC-8183 has no neutral public skill yet |
| 4 | Payment & escrow | x402, MPP, AP2, ERC-7710/7715 | `vendored/coinbase/agentic-wallet/SKILL.md` + `vendored/chaingpt/x402/SKILL.md` (x402), `vendored/tempo/mppx/SKILL.md` (MPP), `vendored/okx/okx-agent-payments-protocol/SKILL.md` (unified x402/MPP/a2a-pay), `vendored/metamask/smart-accounts-kit/skill.md` (delegations), `vendored/chaingpt/agent-wallet/SKILL.md` (policy-gated wallet), `integrations/x402-erc7710/SKILL.md` (combined rail); AP2 has no public skill yet |
| 5 | Execution | the transacting agents + compute/data/value rails | `vendored/antseed/antseed-connect/SKILL.md` + `vendored/0g/0g-compute/SKILL.md` + `vendored/heurist/heurist-mesh-skill/SKILL.md` + `vendored/near/near-ai-cloud/SKILL.md` (paid/decentralized/TEE-verifiable inference), `vendored/lifi/lifi/SKILL.md` (cross-chain value movement), `vendored/chainbase/web3-data/SKILL.md` + `vendored/nansen/nansen-token-research/SKILL.md` (on-chain data/evidence), `vendored/starknet/starknet-defi/SKILL.md` (Starknet L2 contracts/DeFi), `vendored/bnb-chain/bnbchain-mcp/SKILL.md`, the `vendored/near/*`, `vendored/okx/*` and `vendored/altlayer/*` packs |
| 6 | Verification & disputes | GenLayer (Kleros is an alternative) | `integrations/genlayer-intelligent-contracts/SKILL.md`, `vendored/intelligent-oracle/intelligent-oracle/SKILL.md`, `integrations/genlayer-erc7710-connector/SKILL.md`. Alternative third-party arbitration (disclose; not GenLayer's own): `vendored/kleros/kleros-curate/SKILL.md` (token-curated registries / challenges), `vendored/arkhai/nla-arbitrate/SKILL.md` (LLM/manual arbitration of natural-language-agreement escrows). Evidence for ANY venue (neutral, venue-agnostic): `vendored/tersign/tersign-evidence/SKILL.md` (counter-signed receipts, verify-without-trust, evidence envelopes) |

## Skill Routing

Load a skill only when the task actually reaches its trigger — never preload.
Each row is a **trigger** on the left and, on the right, the skill(s) to pull
in with what each gives you and which to reach for first. When a need maps to
several sub-bundled skills, load the named entry skill first, then narrow to
the specific one. Owners that ship a whole pack (OKX, AltLayer, Nansen,
OpenServ, Starknet, ChainGPT) get a single **catch-all** row: load the entry
skill, then the specific sub-skill under `vendored/<owner>/` as the task
narrows — the folder listing is the current set of that owner's skills.

Paths are exact and end in `/SKILL.md` — several owners repeat their name in
the path (e.g. `vendored/lifi/lifi/SKILL.md`, `vendored/privy/privy/SKILL.md`,
`vendored/chaingpt/chaingpt/SKILL.md`); never shorten or merge the segments.
When a row lists alternatives, load **one** (the row says how to pick); if the
deciding fact is unknown, ask instead of preloading them all.

### Payment rails

| When you need to… | Load |
|---|---|
| Pay for an HTTP resource that returns **402** (pay-per-call), search x402 bazaars, or monetize your own endpoint | `vendored/coinbase/agentic-wallet/SKILL.md` — Coinbase x402 client: read the price, pay, retry with proof; start here for a one-off paid request. `vendored/chaingpt/x402/SKILL.md` — x402 discovery/monetization: find paid services or put your own endpoint behind 402. |
| Stream micropayments or run metered sessions (per-second / per-token, not per-request) | `vendored/tempo/mppx/SKILL.md` — Tempo/Stripe MPP charges, sessions, and streaming. Load when billing is continuous rather than a single call. **Not** for spending caps on per-request rails: a capped or recurring budget over x402 is `integrations/x402-erc7710/SKILL.md`, not MPP. |
| Dispatch a payment without hard-coding the rail (x402 vs MPP vs a2a-pay) | `vendored/okx/okx-agent-payments-protocol/SKILL.md` — OKX OnchainOS unified payment dispatcher. Load when the counterparty's rail is unknown or may vary. |
| Run a payment *through* a bounded permission (spend/subscription policy on the rail) | `integrations/x402-erc7710/SKILL.md` — connector fusing the x402 rail with an ERC-7710 delegated budget. Load for Guarded/Adjudicated paid access. |

### Authority, custody & delegation

| When you need to… | Load |
|---|---|
| Grant an agent bounded, revocable authority (ERC-7710 delegations, ERC-7715 permission requests, caveats) | `vendored/metamask/smart-accounts-kit/skill.md` — MetaMask smart accounts + delegation mechanics. The Guarded-level instrument for on-chain authority. Also the row for the user **manually revoking** their own delegation. |
| Give an agent a wallet with a built-in policy gate (per-tx caps, velocity limits, session keys) instead of a raw key | `vendored/chaingpt/agent-wallet/SKILL.md` — custody-free policy-gated wallet. Load when the agent must sign but you won't hand over a private key. |
| Provision or authenticate embedded/server wallets, with policy-gated signing across chains | `vendored/privy/privy/SKILL.md` — Privy wallet identity + auth. |

The first two are **mutually exclusive — pick by who holds the key**: the user
keeps custody and delegates → `smart-accounts-kit`; the agent gets its own
wallet (guardrails built in) → `agent-wallet`. Never load both for one design.

### Identity, reputation & negotiation

| When you need to… | Load |
|---|---|
| Register, discover, or vet an agent on-chain (ERC-8004 identity, reputation, validation) | `vendored/chaingpt/trustless-agents/SKILL.md` — ERC-8004 registries; the default identity/reputation skill. Also mintable via `vendored/openserv/openserv-multi-agent-workflows/SKILL.md`, on Starknet via `vendored/starknet/starknet-identity/SKILL.md`, on BNB via `vendored/bnb-chain/bnbchain-mcp/SKILL.md`. For a human-readable named-account identity anchor (`alice.near`), `vendored/near/near-api-js/SKILL.md`. |
| Prove a human stands behind the agent | `vendored/humanode/humanode-agentlink/SKILL.md` — Humanode AgentLink: sign HTTP requests, on-chain registry. |
| Talk to another agent: agent cards, offers, task lifecycle (A2A) | `vendored/terminalskills/a2a-protocol/SKILL.md` — A2A protocol; load at the negotiation step, before terms lock. For orchestrating many agents: `vendored/openserv/openserv-multi-agent-workflows/SKILL.md`. |

### Contracts & escrow

| When you need to… | Load |
|---|---|
| Lock funds that release on an arbiter's decision (conditional escrow) | `vendored/arkhai/alkahest-user/SKILL.md` — Alkahest EAS-based escrow with arbiters; the default escrow instrument. To **build on** Alkahest (write custom arbiters/obligations, integrate it), `vendored/arkhai/alkahest-developer/SKILL.md`. |
| Escrow behind a plain-language demand an AI oracle judges | `vendored/arkhai/nla-create/SKILL.md` (draft the agreement), `vendored/arkhai/nla-fulfill/SKILL.md` (deliver against it), `vendored/arkhai/nla-arbitrate/SKILL.md` (render the verdict) — natural-language-agreement escrows. |
| Bounty escrow that pays out for making a failing test suite pass | `vendored/arkhai/make-git-escrow/SKILL.md` (post the bounty), `vendored/arkhai/fulfill-git-escrow/SKILL.md` (claim it) — git-escrow, for code-delivery deals settled by tests. |

### Verification, adjudication & disputes

| When you need to… | Load |
|---|---|
| Write / deploy / test / lint a GenLayer Intelligent Contract | `vendored/genlayer/write-contract/SKILL.md` (author), `vendored/genlayer/genlayer-cli/SKILL.md` (deploy & call), `vendored/genlayer/direct-tests/SKILL.md` + `vendored/genlayer/integration-tests/SKILL.md` (test), `vendored/genlayer/genvm-lint/SKILL.md` (lint). Load the one matching your build step. |
| Design the adjudication itself: review rubric, evidence schema, decision payload | `integrations/genlayer-intelligent-contracts/SKILL.md` — the Adjudicated-level review interface. Load when the outcome needs qualitative / natural-language judgment. |
| Turn a verdict into enforcement (revoke or constrain an ERC-7710 permission) | `integrations/genlayer-erc7710-connector/SKILL.md` — relayer/controller wiring a decision to on-chain revocation. **Verdict-driven only**: load when adjudication must change the agent's authority; a user manually revoking their own delegation needs only `smart-accounts-kit`. |
| Settle a narrow binary question from public web evidence (prediction market / factual oracle) | `vendored/intelligent-oracle/intelligent-oracle/SKILL.md` — Intelligent Oracle. Refetch `https://www.intelligentoracle.com/skill.md` before schema-sensitive work. |
| Third-party arbitration as an alternative to GenLayer (**disclose** it isn't GenLayer's own) | `vendored/kleros/kleros-curate/SKILL.md` (token-curated registries / challenges) + `vendored/kleros/kleros-ipfs-upload/SKILL.md` (IPFS evidence); or `vendored/arkhai/nla-arbitrate/SKILL.md` for LLM/manual NLA arbitration. |

### Execution, data & value movement (layer 5)

| When you need to… | Load |
|---|---|
| Buy or sell AI inference (compute execution) | Pick **one** by venue: `vendored/0g/0g-compute/SKILL.md` (decentralized compute/storage/verifiable inference — the default when the venue is open), `vendored/antseed/antseed-connect/SKILL.md` (P2P inference over USDC channels), `vendored/heurist/heurist-mesh-skill/SKILL.md` (Heurist Mesh agents, x402 pay-per-call), `vendored/near/near-ai-cloud/SKILL.md` (private inference with **TEE attestation** — verifiable-execution evidence). If the venue is not yet known, load only the 0G default and ask — do not preload the rest. |
| Move value across chains (swaps / bridging) | `vendored/lifi/lifi/SKILL.md` — LI.FI cross-chain routing; `vendored/lifi/lifi-stablecoin-swap/SKILL.md` for stablecoin-specific swaps; `vendored/near/near-intents/SKILL.md` — NEAR Intents: cross-chain fulfilment via solver competition (chain-abstracted, one agent acts across chains). |
| Pull on-chain data as evidence (balances, tx history, labels, holders, smart-money) | `vendored/chainbase/web3-data/SKILL.md` — general on-chain data. For deeper intelligence, the **Nansen** 7-skill pack under `vendored/nansen/`: start with `nansen-token-research`, then `nansen-wallet-profiler` / `nansen-holder-analysis` / `nansen-smart-money-tracker` / `nansen-general-search` / `nansen-prediction-markets` / `nansen-mpp-payment` as the question narrows. |

### Full-platform packs (catch-all entry, then narrow)

| When you need to… | Load |
|---|---|
| Anything on **OKX OnchainOS** (wallet, DEX data, DeFi, payments, agent-commerce) | 8-skill pack under `vendored/okx/`. Start with `okx-ai` — the agent-commerce entry (ERC-8004 identity + task marketplace **with disputes** + A2A chat), the most Internet-Court-relevant. Then narrow: `okx-agentic-wallet` (swap/bridge/strategy/security), `okx-dex` (read-only DEX data), `okx-defi` (invest/portfolio), `okx-agent-payments-protocol` (x402/MPP/a2a-pay), `okx-dapp-discovery` (route to third-party dapps), `okx-guide` (onboarding/support). |
| **ChainGPT** AI tooling (contract gen/audit, news) + 140-tool MCP | `vendored/chaingpt/chaingpt/SKILL.md` is the catch-all hub. Its focused siblings are routed above: `x402`, `agent-wallet`, `trustless-agents`. |
| **AltLayer** AltLLM portal + Cloud-Claw agent VMs | 7-skill pack under `vendored/altlayer/`. Entry: `altllm-portal-cli` (portal ops) and `cloud-claw` / `cloud-claw-launch-agent` (spin up agent VMs). The rest are plumbing: `altllm-portal-auth`, `-api-keys`, `-billing`, `-payments`. |
| **OpenServ** multi-agent orchestration + SDK (mints ERC-8004 identities) | 5-skill pack under `vendored/openserv/`. Entry: `openserv-multi-agent-workflows`. Others: `openserv-agent-sdk`, `openserv-client`, `openserv-launch`, `openserv-ideaboard-api`. |
| **Starknet** L2 (Cairo, native account abstraction) | 4-skill pack under `vendored/starknet/`. Entry: `starknet-js` (SDK). Others: `starknet-identity` (ERC-8004), `starknet-defi`, `starknet-wallet`. |
| **BNB Chain** ops incl. ERC-8004 registration & Greenfield storage | `vendored/bnb-chain/bnbchain-mcp/SKILL.md`. |
| **NEAR** — AI-native L1 (Shade Agents / TEE inference, named-account identity, chain-abstracted payment) | 6-skill pack under `vendored/near/`. Reach for the on-theme ones first: `near-intents` (cross-chain payment/fulfilment), `near-ai-cloud` (TEE-verifiable inference as evidence), `near-api-js` (chain interaction + named-account identity). Also: `near-kit` (type-safe TS SDK + sandbox testing), `near-smart-contracts` (Rust contracts), `near-dapp` (full-stack React/Next.js + wallet). |

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
   - Check for a **chain mismatch** between where the funds sit and where the
     payee is paid — if they differ, the plan also needs the value-movement
     row (LI.FI / NEAR Intents) before any payment step.
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

Use this pattern when the user delegates authority for a meaningful period and
wants to constrain or revoke it if the agent underperforms. The outputs, from
plain language down to enforcement:

1. Natural-language mandate — what the agent may and may not do.
2. Machine-readable policy object capturing the same limits.
3. A bounded on-chain permission that grants only that authority (for example,
   an ERC-7710 delegation with caveats).
4. A review rubric an independent adjudicator applies to the agent's actions.
5. An action-receipt and evidence schema the review consumes.
6. A path from verdict to enforcement — how a review decision constrains or
   revokes the granted authority (for example, a controller wired to the
   permission).
7. Failure and appeal paths.

Match each output to the trust level and rails chosen for the deal; not every
mandate needs all seven. Do not claim a reviewer can directly cancel a
permission unless a revocation controller is actually part of the design. For
long-lived authority, prefer an active revocation controller plus an absolute
expiry as a fail-safe.

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
- End your turn while waiting for a user approval or signature — the approval
  is the user's act in their wallet UI, and the chat is only the command
  surface. Never promise background polling, and never advance a step until
  its proof arrives.

## Output Shape

When designing a flow or integration, return:

1. Deal summary in plain English.
2. Stack selection and why each rail is used.
3. Sequence diagram in text form.
4. Data model or policy object.
5. Happy path.
6. Failure and dispute paths.
7. Smallest credible implementation plan.
8. Open assumptions and test plan.

## Guardrails

- Treat Internet Court as protocol and integration design, not legal advice.
- Do not assume a payment rail provides escrow, refunds, or chargebacks. Pair
  it with escrow or adjudication when performance risk matters.
- Treat draft or unproven standards as draft — confirm the target stack
  actually supports a permission or delegation scheme before relying on it.
  Simulate execution before doing it for real; design for revocation,
  expiration, and stale permissions.
- Never recommend unlimited token approvals or unbounded agent spend.
- Keep integrations testnet-first unless the user explicitly requests
  production.
- Report failures faithfully — a refused payment after revocation is the
  system working, not an error to hide.

## Reporting Coverage Gaps

Internet Court is an evolving package, and its coverage is not complete. When
you hit a wall — a legitimate agent-commerce use case you cannot complete
because no skill in this package handles it, a routed skill is missing, broken,
or out of date, or a capability works poorly — do **both** of the following:

1. Tell the user plainly what is missing or failing. Never fabricate a result,
   never silently route around the gap, and never claim something works when it
   does not.
2. Open an issue on the package repo so maintainers can add or fix coverage:
   **`https://github.com/internet-court/internet-court-skill/issues`**. If you
   have a GitHub tool available (for example `gh issue create`), file it
   directly; otherwise hand the user a ready-to-file title and body and the
   link above. Search existing issues first and don't file duplicates — one
   issue per distinct gap.

Put this in the issue:

- the use case / user goal, in one line;
- which layer or need it maps to (reference the stack and routing tables);
- what is missing or failing — no skill for X, skill `Y` errored, or `Z`
  produced a wrong or low-quality result — with the exact skill path when
  there is one;
- what a fix would look like: a skill to vendor, a connector to add, or a doc
  to update.

Filing the gap is part of doing the job well: it is how the package learns
what to cover next.
