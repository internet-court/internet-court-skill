# Internet Court Skill

**The trust layer for agent-to-agent commerce.**

Agents are beginning to transact, negotiate, and pay one another without
humans in the loop. What they still lack is a way to trust each other. The
landscape is fragmented: many protocols solve one layer of the stack and
leave the rest for the agents to figure out. Internet Court brings payment,
escrow, and dispute resolution into a single open skill, so any two agents
can structure a deal, hold funds safely, and settle disagreements fairly —
all in natural language.

This repository is that skill: a master router (`SKILL.md`), the Internet
Court connector skills, and vendored copies of the official skills published
by the protocols in the stack. It gives an agent all the tools it needs to
perform agentic commerce.

## The stack

| # | Layer | Protocols | In this repo |
|---|---|---|---|
| 1 | Discovery, identity & reputation | ERC-8004, ERC-7857 | [`vendored/trustless-agents/`](vendored/trustless-agents/) (ERC-8004 registries); ERC-7857 has no public skill yet |
| 2 | Negotiation | A2A | [`vendored/a2a-protocol/`](vendored/a2a-protocol/) |
| 3 | Contracts & obligations | Arkhai/Alkahest, ERC-8183 | [`vendored/alkahest-user/`](vendored/alkahest-user/); ERC-8183 has no public skill yet |
| 4 | Payment & escrow | x402, MPP, AP2, ERC-7710/7715 | [`vendored/agentic-wallet/`](vendored/agentic-wallet/), [`vendored/x402/`](vendored/x402/), [`vendored/mppx/`](vendored/mppx/), [`vendored/okx-agent-payments-protocol/`](vendored/okx-agent-payments-protocol/), [`vendored/smart-accounts-kit/`](vendored/smart-accounts-kit/), [`vendored/agent-wallet/`](vendored/agent-wallet/); connector [`integrations/x402-erc7710/`](integrations/x402-erc7710/); AP2 has no public skill yet |
| 5 | Execution | compute, data & value rails | [`vendored/antseed-connect/`](vendored/antseed-connect/), [`vendored/0g-compute/`](vendored/0g-compute/), [`vendored/lifi/`](vendored/lifi/), [`vendored/web3-data/`](vendored/web3-data/), [`vendored/bnbchain-mcp/`](vendored/bnbchain-mcp/), OKX + AltLayer packs |
| 6 | Verification & disputes | GenLayer | GenLayer dev skills + [`vendored/intelligent-oracle/`](vendored/intelligent-oracle/); connectors [`integrations/genlayer-intelligent-contracts/`](integrations/genlayer-intelligent-contracts/), [`integrations/genlayer-erc7710-connector/`](integrations/genlayer-erc7710-connector/) |

## Repository layout

```
SKILL.md                            Master skill — start here; routes to everything below
integrations/                       Internet Court connector & adapter skills
  genlayer-erc7710-connector/       Connector: GenLayer decision → ERC-7710 revocation/constraint
  genlayer-intelligent-contracts/   Adapter: review rubrics, evidence schemas, decision payloads
  x402-erc7710/                     Connector: x402 payments through ERC-7710 delegations
vendored/                           Committed copies of official protocol skills (51 skills)
skills-lock.json                    Pinned source + hash + refresh command per vendored skill
```

Two kinds of content:

- **First-party** — only the master skill and the connectors. This repo
  never re-implements a protocol's own skill.
- **Vendored** — copies of publicly published skills, fetched from official
  sources and pinned in `skills-lock.json`.

## Vendored skills

| Source | Skills | Repo |
|---|---|---|
| MetaMask | `smart-accounts-kit` (ERC-4337/7710/7715) | [metamask/skills](https://github.com/metamask/skills) |
| Coinbase | `agentic-wallet` (x402 pay/search/monetize) | [coinbase/agentic-wallet-skills](https://github.com/coinbase/agentic-wallet-skills) |
| GenLayer | `write-contract`, `genlayer-cli`, `direct-tests`, `integration-tests`, `genvm-lint` | [genlayerlabs/skills](https://github.com/genlayerlabs/skills) · [skills.genlayer.com](https://skills.genlayer.com/) |
| Intelligent Oracle | `intelligent-oracle` (web-evidence prediction markets) | [intelligentoracle.com/skill.md](https://www.intelligentoracle.com/skill.md) |
| Arkhai | `alkahest-user` (conditional escrow & arbitration) | [arkhai-io/alkahest](https://github.com/arkhai-io/alkahest) |
| BNB Chain | `bnbchain-mcp` (chain ops, ERC-8004 registration, Greenfield) | [bnb-chain/bnbchain-skills](https://github.com/bnb-chain/bnbchain-skills) |
| OKX OnchainOS | 23 `okx-*` skills incl. `okx-agent-payments-protocol` (x402/MPP/a2a-pay) | [okx/onchainos-skills](https://github.com/okx/onchainos-skills) |
| 0G | `0g-compute` (verifiable decentralized inference) | [0gfoundation/0g-compute-skills](https://github.com/0gfoundation/0g-compute-skills) |
| AltLayer | 7 `altllm-portal-*` / `cloud-claw*` skills | [alt-research/altllm-skills](https://github.com/alt-research/altllm-skills) |
| ChainGPT | `chaingpt`, `x402`, `trustless-agents` (ERC-8004), `agent-wallet` | [ChainGPT-org/chaingpt-claude-skill](https://github.com/ChainGPT-org/chaingpt-claude-skill) |
| Chainbase | `web3-data` (90-chain data, x402 pay-per-call) | [lxcong/web3-data-skill](https://github.com/lxcong/web3-data-skill) (officially documented) |
| LI.FI | `lifi`, `lifi-stablecoin-swap` (cross-chain routing) | [lifinance/lifi-agent-skills](https://github.com/lifinance/lifi-agent-skills) |
| AntSeed | `antseed-connect` (P2P inference, USDC channels) | [antseed.com/skill.md](https://antseed.com/skill.md) |
| TerminalSkills | `a2a-protocol` (community — no official A2A skill exists) | [TerminalSkills/skills](https://github.com/TerminalSkills/skills) |

Pinned hashes and refresh commands per skill: [`skills-lock.json`](skills-lock.json)
and [`vendored/README.md`](vendored/README.md).

## Install

Copy or clone this repository into your agent's skills directory. For
Claude Code:

```bash
git clone <this-repo> .claude/skills/internet-court
```

Then start a session and give the agent a task — the master skill routes to
the sub-skills — or say "Install the Internet Court skill" for the guided
introduction.

Some vendored skills need their provider's credentials to act (e.g. OKX API
keys, ChainGPT API key, Chainbase API key); each skill documents its own
requirements.

## Status

- Draft ERCs (7710, 7715, 7857, 8004, 8183) are implementation-dependent;
  treat wallet/contract support as unproven until demonstrated.
- Keep demos testnet-first. Never grant unlimited approvals or unbounded
  agent spend.
- Some protocols (ERC-7857, ERC-8183, AP2) and several partners have no
  public skill yet; those layers are noted inline in the stack table above.

© 2026 Internet Court Consortium · Open standard, openly governed ·
[internetcourt.org](https://internetcourt.org)
