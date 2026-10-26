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
| Solana (`solana/`) | `solana-dev/` — the Solana Foundation's single catch-all dev skill (Anchor/Pinocchio programs, SPL + Solana Pay, confidential transfers, RPC lookups, security/testing), with its own on-demand `references/`. Non-EVM: no ERC-8004/7710 here | [solana-foundation/solana-dev-skill](https://github.com/solana-foundation/solana-dev-skill) (the only install [solana.com/skills](https://solana.com/skills) advertises) |
| SendAI (`sendaifun/`, community) | 9-skill on-theme subset of 48: `squads/` (V4 multisig/smart accounts), `pyth/` + `switchboard/` (oracles, VRF), `helius/` + `birdeye/` (on-chain data), `debridge/` (Solana↔EVM), `metengine/` (x402-metered analytics), `glam/` (vault delegate permissions), `solana-agent-kit/` | [sendaifun/skills](https://github.com/sendaifun/skills) (a community marketplace, **not** the protocol teams' own repos) |
| MagicBlock (`magicblock/`) | `magicblock-dev/` — Ephemeral Rollups: delegated state, **temporary scoped authority** (nearest Solana analogue to ERC-7710), oracles/VRF, private payments | [magicblock-labs/magicblock-dev-skill](https://github.com/magicblock-labs/magicblock-dev-skill) |
| QuickNode (`quicknode/`) | `quicknode-skill/` — 80+ chain RPC, DAS, Streams/Webhooks, Swap API, and **x402 + MPP + agent subscriptions** | [quiknode-labs/blockchain-skills](https://github.com/quiknode-labs/blockchain-skills) |
| Jupiter (`jupiter/`) | `integrating-jupiter/`, `jupiter-lend/`, `jupiter-swap-migration/`, `jupiter-vrfd/` — Solana's dominant liquidity/execution layer | [jup-ag/agent-skills](https://github.com/jup-ag/agent-skills) |
| Octav (`octav/`) | `octav-api/` — multi-chain wallet portfolio, tx history, DeFi positions (50+ chains); pay-per-request via x402 | [Octav-Labs/octav-api-skill](https://github.com/Octav-Labs/octav-api-skill) |
| DFlow (`dflow/`) | `dflow-phantom-connect/` — Phantom Connect wallet SDKs, signing, token gating, crypto payments + DFlow spot trading | [DFlowProtocol/dflow_phantom-connect-skill](https://github.com/DFlowProtocol/dflow_phantom-connect-skill) |
| Metaplex (`metaplex/`) | `metaplex/` — Token Metadata, Core NFTs, Bubblegum, Candy Machine + **Agent Registry** (the Layer-1 reason it's here; the NFT bulk is off-theme). ⚠️ Upstream publishes **no license** — see its `LICENSE` | [metaplex-foundation/skill](https://github.com/metaplex-foundation/skill) |
| PNP Protocol (`pnp/`) | `pnp-solana/` — permissionless prediction markets, P2P betting, custom oracle resolution. ⚠️ Layer-6 *alternative* to GenLayer (disclose); upstream publishes **no license** and is near-dormant | [pnp-protocol/solana-skill](https://github.com/pnp-protocol/solana-skill) |
| Yellow (`yellow/`) | `yellow-settlement-room/`: Yellow Network app sessions over `@yellow-org/sdk` v1: N agents pool funds in one shared off-chain room, reallocate with no gas per step, co-sign one final on-chain settlement. ⚠️ Not trustless escrow: the Yellow node is trusted for liveness, and a session has no dispute mechanism or timeout of its own | [layer-3/nitrolite](https://github.com/layer-3/nitrolite) (`agent-skills/yellow-settlement-room`) |
| Certisyn (`certisyn/`) | `certisyn-independent-verification/`: independent verification of what a counterparty claims about itself, BEFORE funds move; four outcomes incl. `UNDETERMINED`, mandatory `could_not_determine`. ⚠️ Narrow declared coverage (vehicle telemetry, orbital node claims) and a single verifier; does not adjudicate. Licensed `LicenseRef-Certisyn-Skill-1.0` (file MIT, formats royalty-free, names/marks and engines reserved) | [certisyn/genlayer-attestation](https://github.com/certisyn/genlayer-attestation) (`skills/certisyn-independent-verification`) |
| Kleros (`kleros/`) | `kleros-curate/`, `kleros-ipfs-upload/` — decentralized arbitration: token-curated registries + x402 IPFS evidence upload. ⚠️ Layer-6 dispute *alternative* to GenLayer (disclose) | [kleros/kleros-skills](https://github.com/kleros/kleros-skills) (branch `master`) |

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
