# Vendored Skills

Committed copies of publicly published agent skills, fetched from their
official sources and pinned in `../skills-lock.json` (source, path, hash,
fetch date, refresh command). Never edit these by hand — refresh from
upstream with the lock file's `refreshCommand` and update the hash
(workflow in `../CLAUDE.md`).

Skills are grouped by owner: each one lives at `vendored/<owner>/<skill>/`,
where `<owner>` is the publishing company or protocol.

| Owner (`vendored/<folder>/`) | Skills | Upstream |
|---|---|---|
| MetaMask (`metamask/`) | `smart-accounts-kit/` — smart accounts, ERC-4337/7710/7715 | [metamask/skills](https://github.com/metamask/skills) |
| Coinbase (`coinbase/`) | `agentic-wallet/` — x402: pay, search bazaars, monetize | [coinbase/agentic-wallet-skills](https://github.com/coinbase/agentic-wallet-skills) |
| GenLayer (`genlayer/`) | `write-contract/`, `genlayer-cli/`, `direct-tests/`, `integration-tests/`, `genvm-lint/` — Intelligent Contract development | [genlayerlabs/skills](https://github.com/genlayerlabs/skills) · [skills.genlayer.com](https://skills.genlayer.com/) — licensed per `LICENSE-genlayer-skills` |
| Intelligent Oracle (`intelligent-oracle/`) | `intelligent-oracle/` — web-evidence prediction markets (refetch the canonical URL before schema-sensitive work) | [intelligentoracle.com/skill.md](https://www.intelligentoracle.com/skill.md) |
| Arkhai (`arkhai/`) | `alkahest-user/` — EAS-based conditional escrow with arbiters | [arkhai-io/alkahest](https://github.com/arkhai-io/alkahest) |
| BNB Chain (`bnb-chain/`) | `bnbchain-mcp/` — chain ops, ERC-8004 registration, Greenfield storage | [bnb-chain/bnbchain-skills](https://github.com/bnb-chain/bnbchain-skills) |
| OKX OnchainOS (`okx/`) | 23 `okx-*` skills — `okx-agent-payments-protocol` (unified x402/MPP/a2a-pay), DEX swap/market/strategy, agentic wallet, onchain gateway, security, discovery, … | [okx/onchainos-skills](https://github.com/okx/onchainos-skills) |
| 0G (`0g/`) | `0g-compute/` — verifiable decentralized inference & fine-tuning | [0gfoundation/0g-compute-skills](https://github.com/0gfoundation/0g-compute-skills) |
| AltLayer (`altlayer/`) | `altllm-portal-{cli,auth,api-keys,billing,payments}/`, `cloud-claw/`, `cloud-claw-launch-agent/` — AltLLM portal + agent VM management | [alt-research/altllm-skills](https://github.com/alt-research/altllm-skills) |
| ChainGPT (`chaingpt/`) | `chaingpt/`, `x402/`, `trustless-agents/` (ERC-8004), `agent-wallet/` (policy-gated) — selected from the 25-skill plugin | [ChainGPT-org/chaingpt-claude-skill](https://github.com/ChainGPT-org/chaingpt-claude-skill) |
| Chainbase (`chainbase/`) | `web3-data/` — 90-chain data, x402 pay-per-call | [lxcong/web3-data-skill](https://github.com/lxcong/web3-data-skill) (officially documented by Chainbase) |
| LI.FI (`lifi/`) | `lifi/`, `lifi-stablecoin-swap/` — cross-chain swap/bridge routing | [lifinance/lifi-agent-skills](https://github.com/lifinance/lifi-agent-skills) |
| Tempo (`tempo/`) | `mppx/` — MPP machine payments over HTTP 402 (charges, sessions, streaming) | [tempoxyz/mpp](https://github.com/tempoxyz/mpp) |
| AntSeed (`antseed/`) | `antseed-connect/` — P2P AI inference with USDC payment channels | [antseed.com/skill.md](https://antseed.com/skill.md) |
| TerminalSkills (`terminalskills/`, community) | `a2a-protocol/` — A2A agent cards, task lifecycle (no official a2aproject skill exists) | [TerminalSkills/skills](https://github.com/TerminalSkills/skills) |
| Heurist (`heurist/`) | `heurist-mesh-skill/` — decentralized AI inference + Heurist Mesh crypto agents, x402 facilitator | [heurist-network/heurist-mesh-skill](https://github.com/heurist-network/heurist-mesh-skill) |
| Privy (`privy/`) | `privy/` — embedded + server/agentic wallets, auth, policy-gated signing (refetch the canonical URL before schema-sensitive work) | [docs.privy.io/skill.md](https://docs.privy.io/skill.md) |
| Nansen (`nansen/`) | 7 `nansen-*` skills — token research, wallet profiler, smart-money, holders, general search, prediction markets, MPP payment (evidence/payment subset of 34) | [nansen-ai/nansen-cli](https://github.com/nansen-ai/nansen-cli) |
| OpenServ (`openserv/`) | `openserv-{agent-sdk,client,multi-agent-workflows,launch,ideaboard-api}/` — multi-agent orchestration; mints ERC-8004 identities | [openserv-labs/skills](https://github.com/openserv-labs/skills) |
| Humanode (`humanode/`) | `humanode-agentlink/` — human-backed on-chain agent identity (sign HTTP, on-chain registry, partner endpoints). Note: ships under personal `@techdigger` namespace | [agentlink.id/skill.md](https://agentlink.id/skill.md) |
| Starknet (`starknet/`) | `starknet-{identity,js,defi,wallet}/` — StarkWare ZK-rollup L2 (Cairo, native AA); subset of 18-skill repo | [keep-starknet-strange/starknet-agentic](https://github.com/keep-starknet-strange/starknet-agentic) (StarkWare Exploration) |
| Kleros (`kleros/`) | `kleros-curate/`, `kleros-ipfs-upload/` — decentralized arbitration: token-curated registries + x402 IPFS evidence upload. ⚠️ Layer-6 dispute *alternative* to GenLayer (disclose) | [kleros/kleros-skills](https://github.com/kleros/kleros-skills) (branch `master`) |
| Tersign (`tersign/`) | `tersign-evidence/` — neutral counter-signed evidence: no-trust receipt verification, jury-ready evidence envelopes (Internet Court / Kleros ERC-1497 / UMA), EU AI Act Art-50 action records | [tersignhq/skills](https://github.com/tersignhq/skills) |

Notes:

- Vendored copies are faithful to upstream, including file casing
  (`metamask/smart-accounts-kit/skill.md` is lowercase) and any extra
  upstream files.
- Several skills need provider credentials to act (OKX API keys,
  `CHAINGPT_API_KEY`, `CHAINBASE_API_KEY`, …) — each skill documents its own.
- Review refreshed copies like third-party code before committing: skills
  run with full agent permissions.

## Install into an agent

Copy (or symlink) the skill folders you need into the agent's skills
directory (for Claude Code: `.claude/skills/` in the project), or install
fresh from upstream with the lock file's refresh command.
