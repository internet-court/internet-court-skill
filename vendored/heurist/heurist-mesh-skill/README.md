# Heurist Mesh Skill

[![Claude Code](https://img.shields.io/badge/Claude%20Code-Compatible-blue)](https://claude.ai/code)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Compatible-blue)](https://openclaw.ai)
[![Heurist](https://img.shields.io/badge/Heurist-Mesh-purple)](https://mesh.heurist.ai)

Access Web3 and crypto intelligence via [Heurist Mesh](https://mesh.heurist.ai) — 30+ specialized AI agents for cryptocurrency analytics, token data, wallet analysis, Twitter/X intelligence, and blockchain research, optimized for AI with fewer tool calls and less token usage.

## Quick Start

### Install via Skills CLI (Recommended)

```bash
npx skills add heurist-network/heurist-mesh-skill
```

This works with Claude Code, OpenCode, Cursor, Codex, Cline, Windsurf, and [37+ other agents](https://github.com/vercel-labs/skills#supported-agents).

### Manual

Paste this into any AI agent that supports SKILL.md:

> Clone https://github.com/heurist-network/heurist-mesh-skill, read SKILL.md, and help me query crypto data

The agent will read the skill, fetch tool schemas, and become a crypto analyst.

## Structure

```
heurist-mesh-skill/
├── SKILL.md                          # Main skill — agent discovery, API usage, payment
└── references/
    ├── heurist-api-key.md            # Credit purchase, free tweet claim, API key auth
    ├── x402-payment.md               # On-chain USDC payment on Base
    ├── inflow-payment.md             # Pay with Inflow (currently in testnet)
    └── discover-agents.md            # Full agent registry discovery workflow
```

## Recommended Agents

| Agent | What it does |
|-------|-------------|
| **TrendingTokenAgent** | Trending tokens from CEXs/DEXs, market news summary |
| **TokenResolverAgent** | Find tokens by address/symbol/name, detailed profiles |
| **DefiLlamaAgent** | DeFi protocol and chain metrics (TVL, fees, volume) |
| **TwitterIntelligenceAgent** | Twitter/X timeline, tweet detail, search |
| **ExaSearchDigestAgent** | Web search with LLM summarization |
| **ChainbaseAddressLabelAgent** | EVM address labels (identity, ENS, wallet behavior) |
| **ZerionWalletAnalysisAgent** | EVM wallet token and NFT holdings |
| **ProjectKnowledgeAgent** | Crypto project database with semantic search |
| **AskHeuristAgent** | Crypto Q&A and deep analysis (by https://ask.heurist.ai. This is recommended for any in-depth crypto analysis) |
| **CaesarResearchAgent** | Expert-level agentic research |

## Payment Options

1. **API Key (credits)** — Buy at [heurist.ai/credits](https://heurist.ai/credits) or claim 100 free credits via tweet
2. **x402 (USDC on Base)** — Pay-per-call with crypto, no account needed
3. **Inflow** — Agentic payment with https://www.inflowpay.ai

## Links

- [Heurist Mesh](https://mesh.heurist.ai)
- [API Documentation](https://docs.heurist.ai)
- [Telegram Support](https://t.me/heuristsupport)
- [X / Twitter](https://x.com/heurist_ai)
