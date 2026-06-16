# web3-data-skill

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skill covering two Chainbase services:

| Service | Description |
|---|---|
| **Web3 Data** | On-chain data via [Chainbase](https://chainbase.com) APIs — tokens, wallets, DeFi, ENS, SQL |
| **Tops** | Crypto social intelligence via [Tops](https://tops.chainbase.com) — trending narratives, Twitter/X mentions |

## Features

### Web3 On-Chain Data (`chainbase`)

- **Token Holders** — Top holders of any ERC20 token with balance and USD value
- **Token Data** — Price, metadata, transfer history
- **Wallet Analytics** — Balances, transaction history, DeFi portfolios, ENS domains
- **SQL Queries** — Custom SQL against any on-chain data when fixed APIs fall short

Supports Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Avalanche, zkSync, and more.

### Crypto Social Intelligence (`chainbase tops`)

- **Trending Topics** — Ranked list of current crypto narratives with heat scores
- **Topic Details** — AI summary, keywords, and representative tweets for any topic
- **Topic Posts** — Raw tweets under a topic for sentiment/stance analysis
- **Narrative Search** — Discover topics from a vague keyword (e.g. "RWA", "AI Agent")
- **Social Mentions** — Recent Twitter/X mentions of any project or keyword

No API key required for Tops — free to use.

## Install

```bash
claude install-skill /path/to/web3-data-skill
```

Or install from GitHub:

```bash
claude install-skill https://github.com/lxcong/web3-data-skill
```

## Usage

Once installed, ask Claude Code in natural language:

**On-chain data:**
```
> USDT 的 top holders 是谁？
> 查一下 vitalik 的地址标签
> ETH 上 USDC 最近 24 小时的转账记录
> 用 SQL 查一下以太坊最近 10 个区块
```

**Crypto social intelligence:**
```
> 现在 crypto 最热的 narrative 是什么？
> Search narrative candidates for "AI Agent"
> Who is talking about Ethereum ETF on Twitter?
> Get posts for the top trending topic
```

## API Keys

- **Web3 Data**: Uses Chainbase `demo` key by default. For higher limits, register at [console.chainbase.com](https://console.chainbase.com) and set `CHAINBASE_API_KEY`.
- **Tops**: No API key needed. Rate limit: 10 req/s · 60 req/min · 600 req/hour per IP.

## Structure

```
├── SKILL.md                    # Skill definition and routing logic (both services)
└── references/
    ├── api-endpoints.md        # Chainbase Web3 API reference (38 endpoints)
    └── tops-api.md             # Tops Social Intelligence API reference
```

## License

MIT
