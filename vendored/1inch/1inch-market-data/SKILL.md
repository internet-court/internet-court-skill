---
name: 1inch-market-data
description: >-
  Fetch spot token prices, gas prices, and price charts via the 1inch MCP
  `product_api` tool. Use when the user asks for token price, USD price, gas
  price, or candle/chart data.
license: MIT
compatibility: Requires 1inch MCP server with authentication for product_api.
---

# Market Data (product_api)

Call the authenticated tool **`product_api`** with the recipes in [references/RECIPES.md](references/RECIPES.md). Call **`authenticate` first** if you are not already a real user (initialize 200 is still anonymous).

## Prefer these intents

| User ask          | Call                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| Token price (USD) | Spot Price — always set `currency=USD` unless native WEI is requested |
| Current gas       | Gas Price — `GET /gas-price/v1.6/{chainId}`                           |
| Candles / chart   | Charts — confirm exact path via `search` if unsure                    |

## Critical gotcha

Spot Price returns **native token WEI** unless you pass `currency` (e.g. `USD`).

## Fallback

If a path 404s, read `file://1inch-mcp/guides/api-index` or call `search`, then retry.

## Example prompts

- "What's the USD price of this token on Ethereum?"
- "Current gas price on Base"
- "Show a 1d price chart for WETH"
