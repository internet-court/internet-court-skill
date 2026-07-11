# Internet Court Skill

**An open skill for agent-to-agent contracts.**

Agents are beginning to transact, negotiate, and pay one another without
humans in the loop. What they still lack is a way to trust each other. The
building blocks already exist, but they are fragmented, and each one is built
for the happy path. When a deal goes wrong, every layer passes the problem
down the line.

Internet Court does two things. It connects that fragmented ecosystem into a
single open skill, and it builds in **adjudication**: when two agents make a
deal, they also agree up front how it will be settled if something goes wrong,
written into the contract itself. Payments let agents transact. Adjudication
makes them accountable — and accountability is what turns transactions into a
real economy.

This repository is that skill: a master router (`SKILL.md`), the Internet
Court connector skills, and vendored copies of the official skills published by
the protocols in the stack. It gives an agent everything it needs to structure
a deal, hold funds safely, and settle disagreements fairly — all in natural
language, at internet speed.

## The stack

From discovery to disputes, agentic commerce runs through six layers. Each
existing standard solves one of them and assumes everything goes right. Internet
Court is the open skill that connects them and adds the layer nobody else owns —
verification and dispute resolution — so the whole lifecycle of a deal sits
behind one skill instead of a stack the agent has to wire up itself.

| # | Layer | Standards | In this repo |
|---|---|---|---|
| 1 | Discovery, identity & reputation | ERC-8004, ERC-7857 | [`chaingpt/trustless-agents/`](vendored/chaingpt/trustless-agents/) (ERC-8004 registries), [`bnb-chain/bnbchain-mcp/`](vendored/bnb-chain/bnbchain-mcp/) (ERC-8004 registration), [`starknet/starknet-identity/`](vendored/starknet/starknet-identity/); ERC-7857 has no public skill yet |
| 2 | Negotiation | A2A | [`terminalskills/a2a-protocol/`](vendored/terminalskills/a2a-protocol/), [`openserv/openserv-multi-agent-workflows/`](vendored/openserv/openserv-multi-agent-workflows/) |
| 3 | Contracts & obligations | ERC-7710, ERC-8183, Arkhai | [`arkhai/`](vendored/arkhai/) (Alkahest escrow, natural-language agreements, git escrow), [`metamask/smart-accounts-kit/`](vendored/metamask/smart-accounts-kit/) (ERC-7710 delegations); connector [`integrations/genlayer-erc7710-connector/`](integrations/genlayer-erc7710-connector/); ERC-8183 has no public skill yet |
| 4 | Payment & escrow | x402, MPP, APP | [`coinbase/agentic-wallet/`](vendored/coinbase/agentic-wallet/), [`chaingpt/x402/`](vendored/chaingpt/x402/) + [`agent-wallet/`](vendored/chaingpt/agent-wallet/), [`okx/okx-agent-payments-protocol/`](vendored/okx/okx-agent-payments-protocol/), [`tempo/mppx/`](vendored/tempo/mppx/), [`nansen/nansen-mpp-payment/`](vendored/nansen/nansen-mpp-payment/), [`privy/`](vendored/privy/); connector [`integrations/x402-erc7710/`](integrations/x402-erc7710/) |
| 5 | Execution | compute, data & value rails | [`0g/0g-compute/`](vendored/0g/0g-compute/), [`antseed/antseed-connect/`](vendored/antseed/antseed-connect/), [`lifi/`](vendored/lifi/), [`chainbase/web3-data/`](vendored/chainbase/web3-data/), [`heurist/`](vendored/heurist/), [`near/`](vendored/near/), [`starknet/`](vendored/starknet/), [`nansen/`](vendored/nansen/), OKX + AltLayer + BNB Chain packs |
| 6 | Verification & disputes | GenLayer, Kleros, UMA | GenLayer dev skills + [`intelligent-oracle/`](vendored/intelligent-oracle/), [`kleros/`](vendored/kleros/) (curate, IPFS); connectors [`integrations/genlayer-intelligent-contracts/`](integrations/genlayer-intelligent-contracts/), [`integrations/genlayer-erc7710-connector/`](integrations/genlayer-erc7710-connector/); UMA has no public skill yet; evidence input: [`tersign/`](vendored/tersign/) (counter-signed evidence envelopes for any venue) |

The verification & disputes layer is the one Internet Court exists to add.
Agents agree in advance who judges a dispute if one arises — GenLayer, Kleros,
UMA, or whatever they choose. Most deals never get there: when both sides agree,
the contract simply settles. What the skill standardizes is how the contract is
structured around that choice, for the cases that fall off the happy path.

## The consortium

Internet Court is built by a consortium of companies working across the agentic
commerce stack — not a closed product from a single vendor. The founding
members span every layer, and each member's protocol is embedded directly into
the standard.

**Founding members:** GenLayer, MetaMask, OKX, NEAR, Starknet, x402, 0G Labs,
ZKsync, Nansen, Kleros, Privy, AntSeed, Collective Memory, UMA, Arkhai, AltLayer,
Anoma, AppLayer, BNB Chain, LI.FI, Chainbase, io.net, Heurist, Chutes, ChainGPT,
OpenServ, Humanode, Humanity Protocol.

The standard is open and openly governed — any agent can adopt it now. Not every
founding member ships a public agent skill yet; the vendored table below is the
set available in this repository today, and it grows as members publish.

## Repository layout

```
SKILL.md                            Master skill — start here; routes to everything below
integrations/                       Internet Court connector & adapter skills
vendored/                           Committed copies of official protocol skills (69 skills, 23 owners)
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
| GenLayer | `write-contract`, `genlayer-cli`, `direct-tests`, `integration-tests`, `genvm-lint` | [genlayerlabs/skills](https://github.com/genlayerlabs/skills) · [skills.genlayer.com](https://skills.genlayer.com/) |
| MetaMask | `smart-accounts-kit` (ERC-4337/7710/7715 delegations) | [metamask/skills](https://github.com/metamask/skills) |
| OKX OnchainOS | 8 `okx-*` skills incl. `okx-agent-payments-protocol` (x402/MPP), `okx-agentic-wallet`, `okx-dex`, `okx-defi` | [okx/onchainos-skills](https://github.com/okx/onchainos-skills) |
| NEAR | 6 `near-*` skills (`near-intents`, `near-ai-cloud`, `near-kit`, `near-dapp`, `near-api-js`, `near-smart-contracts`) | [near/agent-skills](https://github.com/near/agent-skills) |
| Starknet | `starknet-defi`, `starknet-dex` … `starknet-identity`, `starknet-wallet`, `starknet-js` | [keep-starknet-strange/starknet-agentic](https://github.com/keep-starknet-strange/starknet-agentic) |
| Coinbase (x402) | `agentic-wallet` (x402 pay/search/monetize) | [coinbase/agentic-wallet-skills](https://github.com/coinbase/agentic-wallet-skills) |
| 0G | `0g-compute` (verifiable decentralized inference) | [0gfoundation/0g-compute-skills](https://github.com/0gfoundation/0g-compute-skills) |
| Nansen | 7 `nansen-*` skills (token research, wallet profiler, smart-money, holder analysis, prediction markets, MPP payment, search) | [nansen-ai/nansen-cli](https://github.com/nansen-ai/nansen-cli) |
| Kleros | `kleros-curate`, `kleros-ipfs-upload` (curated registries, evidence pinning) | [kleros/kleros-skills](https://github.com/kleros/kleros-skills) |
| Privy | `privy` (embedded agent wallets) | [docs.privy.io/skill.md](https://docs.privy.io/skill.md) |
| AntSeed | `antseed-connect` (P2P inference, USDC channels) | [antseed.com/skill.md](https://antseed.com/skill.md) |
| Arkhai | `alkahest-user`, `alkahest-developer` (conditional escrow & arbitration), `nla-*` (natural-language agreements), `*-git-escrow` | [arkhai-io/alkahest](https://github.com/arkhai-io/alkahest) · [natural-language-agreements](https://github.com/arkhai-io/natural-language-agreements) · [git-commit-trading](https://github.com/arkhai-io/git-commit-trading) |
| AltLayer | 7 `altllm-portal-*` / `cloud-claw*` skills (autonomous agent hosting) | [alt-research/altllm-skills](https://github.com/alt-research/altllm-skills) |
| BNB Chain | `bnbchain-mcp` (chain ops, ERC-8004 registration, Greenfield) | [bnb-chain/bnbchain-skills](https://github.com/bnb-chain/bnbchain-skills) |
| LI.FI | `lifi`, `lifi-stablecoin-swap` (cross-chain routing) | [lifinance/lifi-agent-skills](https://github.com/lifinance/lifi-agent-skills) |
| Chainbase | `web3-data` (90-chain data, x402 pay-per-call) | [lxcong/web3-data-skill](https://github.com/lxcong/web3-data-skill) (officially documented) |
| Heurist | `heurist-mesh-skill` (hosted agent-mesh MCP + x402 facilitator) | [heurist-network/heurist-mesh-skill](https://github.com/heurist-network/heurist-mesh-skill) |
| ChainGPT | `chaingpt`, `x402`, `trustless-agents` (ERC-8004), `agent-wallet` | [ChainGPT-org/chaingpt-claude-skill](https://github.com/ChainGPT-org/chaingpt-claude-skill) |
| OpenServ | 5 skills incl. `openserv-multi-agent-workflows` (mints ERC-8004), `agent-sdk`, `client`, `launch`, `ideaboard-api` | [openserv-labs/skills](https://github.com/openserv-labs/skills) |
| Humanode | `humanode-agentlink` (biometric agent identity) | [agentlink.id/skill.md](https://agentlink.id/skill.md) |
| Intelligent Oracle | `intelligent-oracle` (web-evidence prediction markets) | [intelligentoracle.com/skill.md](https://www.intelligentoracle.com/skill.md) |
| Tempo | `mppx` (Merchant Payment Protocol) | [tempoxyz/mpp](https://github.com/tempoxyz/mpp) |
| TerminalSkills | `a2a-protocol` (community — no official A2A skill exists) | [TerminalSkills/skills](https://github.com/TerminalSkills/skills) |
| Tersign | `tersign-evidence` (counter-signed receipt verification, dispute-ready evidence envelopes for Internet Court / Kleros ERC-1497 / UMA, Art-50 action records) | [tersignhq/skills](https://github.com/tersignhq/skills) |

Pinned hashes and refresh commands per skill: [`skills-lock.json`](skills-lock.json)
and [`vendored/README.md`](vendored/README.md).

## Install

Internet Court is **one catch-all skill**. Whatever harness you use, only the
root `SKILL.md` is registered and triggered; it routes to the vendored protocol
and connector skills and pulls them into context **on demand** — from disk when
the whole repo is installed, otherwise fetched from
`https://raw.githubusercontent.com/internet-court/internet-court-skill/main/<path>`.
Installing the whole repository (not just `SKILL.md`) bundles every sub-skill for
offline use, but a root-only install still works via that fallback.

Pick your harness:

### Claude Code (plugin — recommended)

```bash
# in a Claude Code session:
/plugin marketplace add internet-court/internet-court-skill
/plugin install internet-court@internet-court
# update later:  /plugin marketplace update internet-court
```

Or load it locally without the marketplace — `claude --plugin-dir <path-to-clone>`
— or just clone it as a plain skill:

```bash
git clone https://github.com/internet-court/internet-court-skill ~/.claude/skills/internet-court
```

### npx skills (skills.sh)

```bash
npx skills add internet-court/internet-court-skill   # installs the root skill
# update later:  npx skills update
```

### Codex

```bash
git clone https://github.com/internet-court/internet-court-skill ~/.agents/skills/internet-court
# or, per-repo:  .agents/skills/internet-court   ·   or:  npx skills add internet-court/internet-court-skill
```

Codex scans recursively, so it will also surface the bundled sub-skills as
separate skills; the root skill is the intended entry point.

### opencode

```bash
git clone https://github.com/internet-court/internet-court-skill ~/.config/opencode/skills/internet-court
```

opencode also reads `~/.claude/skills/` and `~/.agents/skills/`, so a single
clone into any of those is enough.

### OpenClaw

```bash
openclaw skills install git:internet-court/internet-court-skill
# update later:  openclaw skills update
```

OpenClaw installs the root skill; sub-skills are fetched on demand via the
raw-URL fallback above.

### Hermes

```bash
git clone https://github.com/internet-court/internet-court-skill ~/.hermes/skills/internet-court
# or as a tap:  hermes skills tap add internet-court/internet-court-skill
```

Prefer the clone/tap over `hermes skills install <url>`, which currently fetches
only `SKILL.md` and misses bundled reference files.

---

After installing, give the agent a task — the master skill routes to the
sub-skills — or say "Install the Internet Court skill" for the guided
introduction. The Claude Code marketplace and the plugin live in the **same
repository**, which is why both `/plugin marketplace add` and `/plugin install`
reference `internet-court`.

Some vendored skills need their provider's credentials to act (e.g. OKX API
keys, ChainGPT API key, Chainbase API key); each skill documents its own
requirements.

## License

The first-party work in this repository — the master skill and the connectors —
is released under the [MIT License](LICENSE). Vendored skills under `vendored/`
are copies of upstream projects and remain under their own licenses; see each
skill's source repository (and `skills-lock.json`) for terms.

© 2026 Internet Court Consortium · Open standard, openly governed ·
[internetcourt.org](https://internetcourt.org)
