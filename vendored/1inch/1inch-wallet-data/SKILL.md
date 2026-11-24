---
name: 1inch-wallet-data
description: >-
  Query portfolio value/P&L, wallet balances, transaction history, NFTs, and token
  metadata via the 1inch MCP `product_api` tool. Use when the user asks about
  holdings, balances, history, token search, or NFT inventory.
license: MIT
compatibility: Requires 1inch MCP server with authentication for product_api.
---

# Wallet & Data (product_api)

Call the authenticated tool **`product_api`** with the recipes in [references/RECIPES.md](references/RECIPES.md). Call **`authenticate` first** if you are not already a real user (initialize 200 is still anonymous).

## Prefer these intents

| User ask                    | Product       |
| --------------------------- | ------------- |
| Portfolio value / P&L       | Portfolio     |
| Token balances for a wallet | Balance       |
| Find a token by symbol/name | Token search  |
| Token detail / metadata     | Token Details |
| Transaction history         | History       |
| NFTs owned by a wallet      | NFT           |

## Fallback

If a path 404s, read `file://1inch-mcp/guides/api-index` or call `search`, then retry. Do **not** invent version numbers.

## Example prompts

- "What's my portfolio value on Ethereum for 0x…?"
- "List balances for this wallet on Base"
- "Search tokens for USDC on Arbitrum"
