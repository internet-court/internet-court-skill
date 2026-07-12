---
name: gentech-agent-kit
description: "GenTech Agent Kit — MCP server with 20+ tools for AI agents: real-time crypto market data (quotes, listings, search, trending, DEX pairs), DeFi intelligence, x402 payment rails across 3 chains (Algorand, Robinhood Chain, Base), tokenized stocks (AAPL, NVDA, TSLA), gaming intelligence (deals, releases, POE2 builds), and plugin auto-discovery. Use whenever the user asks about crypto prices, market data, agent payments via x402, DeFi analytics, tokenized stocks, gaming deals, or agent-to-agent commerce on Base, Robinhood Chain, or Algorand — even if they never say 'GenTech'."
user-invocable: true
disable-model-invocation: true
allowed-tools: ["Bash(uvx *)", "Bash(npx *)", "Bash(curl *)", "Bash(git *)"]
---

# GenTech Agent Kit

MCP server for AI agents with 20+ tools across market data, DeFi intelligence, x402 payments, and gaming services. Plugin system with auto-discovery.

## Install

```bash
# uvx (recommended)
uvx --from git+https://github.com/ProtoJay4789/genTech-agent-kit.git gentech-kit

# npx skills
npx skills add ProtoJay4789/genTech-agent-kit

# Or clone and run
git clone https://github.com/ProtoJay4789/genTech-agent-kit.git
cd genTech-agent-kit
uv sync
uv run gentech-kit
```

## Configuration

Set `CMC_API_KEY` in `.env` for market data (free tier available from CoinMarketCap).

## Tools

### Market Data (Layer 5 — Execution)

| Tool | Description |
|------|-------------|
| `get_quote` | Real-time price for any cryptocurrency |
| `get_listings` | Latest market data for top coins |
| `search_symbol` | Search for coins and their IDs |
| `get_trending` | Currently trending coins on CMC |
| `get_dex_pairs` | DEX trading pairs for a token |

### DeFi Intelligence (Layer 4 — Payment)

| Tool | Description |
|------|-------------|
| `get_yields` | Top DeFi lending yields |
| `get_pools` | Liquidity pool data and metrics |
| `get_protocol` | Protocol TVL and breakdown |

### x402 Payments (Layer 4 — Payment & Escrow)

| Tool | Description |
|------|-------------|
| `x402_pay` | Pay an x402 endpoint on Base (USDC) |
| `x402_quote` | Quote cost before paying |
| `rh_x402_pay` | Pay an x402 endpoint on Robinhood Chain (USDG) |
| `rh_x402_quote` | Quote cost before paying on Robinhood Chain |
| `algorand_x402_pay` | Pay an x402 endpoint on Algorand (USDC) |
| `algorand_x402_quote` | Quote cost before paying on Algorand |

### Tokenized Stocks (Layer 5 — Execution)

| Tool | Description |
|------|-------------|
| `buy_stock` | Buy tokenized AAPL, NVDA, or TSLA on Robinhood Chain |
| `sell_stock` | Sell tokenized stock positions |
| `get_portfolio` | View current stock portfolio and balances |
| `get_stock_price` | Real-time price of tokenized stocks |

### Gaming Intelligence (Layer 5 — Execution)

| Tool | Description |
|------|-------------|
| `gaming_deals` | Check Steam wishlist deals |
| `release_calendar` | Upcoming game releases |
| `poe2_build_health` | POE2 patch health for tracked builds |
| `gaming_hub_status` | Gaming data hub sync status |

## Use Cases in Internet Court

### Payable API Access (Guarded/Adjudicated)

When an agent needs to pay for a service via x402, route to GenTech's multi-chain x402 tools. The agent can quote the cost, confirm, and settle in USDC on Base, USDG on Robinhood Chain, or USDC on Algorand.

```text
1. x402_quote(endpoint) → shows cost in USDC/USDG
2. Agent confirms or user approves at chosen trust level
3. x402_pay(endpoint) → settles and returns result
```

### Market Data for Deal Context (Layer 1 — Discovery)

When an agent needs to evaluate a counterparty or deal terms involving crypto assets, GenTech's market data tools provide real-time prices, trending tokens, and DEX liquidity data.

### Execution Layer (Layer 5)

GenTech Agent Kit provides execution tools for agents that need to: check token prices during a deal, research token fundamentals, track trending assets, query DeFi protocol data, or access tokenized equities.

## Reputation & Trust

- **License:** MIT
- **Open source:** https://github.com/ProtoJay4789/genTech-agent-kit
- **Published:** npx skills ecosystem, Atelier agent registry, PortalHQ
- **Audited:** No formal audit yet — community review welcome
- **Contact:** GitHub issues on the repo

## Further Reading

- [GitHub Repository](https://github.com/ProtoJay4789/genTech-agent-kit)
- [Skills Directory](https://github.com/ProtoJay4789/genTech-agent-kit/tree/main/skills)
- [Website](https://gentechlabs.net)
