---
name: 1inch-infrastructure
description: >-
  Call Web3 JSON-RPC, broadcast transactions via the Transaction Gateway, and
  resolve ENS/domains through the 1inch MCP `product_api` tool.
license: MIT
compatibility: Requires 1inch MCP server with authentication for product_api.
---

# Infrastructure (product_api)

Call the authenticated tool **`product_api`** with the recipes in [references/RECIPES.md](references/RECIPES.md). Call **`authenticate` first** if you are not already a real user (initialize 200 is still anonymous).

## Prefer these intents

| User ask                         | Product                           |
| -------------------------------- | --------------------------------- |
| eth_call / eth_blockNumber / RPC | Web3 RPC — `POST /web3/{chainId}` |
| Broadcast a signed raw tx        | Transaction Gateway               |
| Resolve ENS / domain lookup      | Domains                           |

## Fallback

If a path 404s, read `file://1inch-mcp/guides/api-index` or call `search`, then retry.

## Example prompts

- "Get the latest block number on Ethereum via 1inch Web3 RPC"
- "Broadcast this signed transaction on Base"
- "Resolve vitalik.eth"
