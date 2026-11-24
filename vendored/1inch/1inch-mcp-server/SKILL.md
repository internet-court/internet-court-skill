---
name: 1inch-mcp-server
description: >-
  Connect to the 1inch MCP server for documentation search, SDK examples, token swaps,
  limit orders, authenticated product API access, WalletConnect, Aqua analytics, and
  (when registered) org-scoped log lookup. Use when the user asks about 1inch integration,
  DeFi swaps, classic or Fusion or cross-chain flows, orderbook, portfolio, gas or spot
  price APIs, API keys, MCP or IDE setup, or blockchain development with 1inch.
license: MIT
compatibility: Requires an MCP-capable client with HTTP transport (preferred) or stdio plus Node.js 18+ for supergateway bridging.
metadata:
  mcp_url_production: https://api.1inch.com/mcp/protocol
  documentation: https://business.1inch.com/portal/documentation/ai-integration
---

# 1inch MCP Server

Hub skill for wiring the **1inch MCP server**. Companion domain skills teach exact workflows:

| Skill                  | When to load                                                         |
| ---------------------- | -------------------------------------------------------------------- |
| `1inch-swap`           | Classic / Fusion / cross-chain swaps                                 |
| `1inch-orderbook`      | Limit orders                                                         |
| `1inch-wallet-data`    | Portfolio, balances, history, NFTs, token metadata via `product_api` |
| `1inch-market-data`    | Spot prices, gas price, charts via `product_api`                     |
| `1inch-infrastructure` | Web3 RPC, tx gateway, domains via `product_api`                      |
| `1inch-walletconnect`  | Non-custodial wallet pairing                                         |
| `1inch-aqua`           | Aqua strategy analytics                                              |
| `1inch-debug`          | Org-scoped request log lookup                                        |

## Server URL (production)

`https://api.1inch.com/mcp/protocol` (Streamable HTTP)

## Tools overview

| Tool                            | Auth                     | Purpose                               |
| ------------------------------- | ------------------------ | ------------------------------------- |
| `search`                        | Public                   | Search 1inch docs and API reference   |
| `list_examples` / `get_example` | Public                   | SDK example packages                  |
| `authenticate`                  | Authenticated            | Start or confirm 1inch Business login |
| `swap`                          | Authenticated            | Quotes and swap execution             |
| `orderbook`                     | Authenticated            | Build/create/list/cancel limit orders |
| `product_api`                   | Authenticated            | Call other 1inch product APIs         |
| `walletconnect`                 | Public (optional)        | Pair/sign/send via WalletConnect      |
| `aqua`                          | Public reads (optional)  | Aqua strategy analytics               |
| `debug`                         | Authenticated (optional) | Org-scoped request log lookup         |

Full parameters: [references/TOOLS.md](references/TOOLS.md). Auth: [references/AUTH.md](references/AUTH.md).

Initialize HTTP 200 is still anonymous. Call `authenticate` before paid tools; on HTTP 401 complete OAuth, then call `authenticate` again.

**Signing flows:** when the `walletconnect` tool is available, prefer connecting the user's wallet first — `swap`, `orderbook`, and `aqua` writes then execute through the connected wallet by default (`execute` defaults to true) and the user only approves prompts in their wallet app. See the `1inch-walletconnect` skill.

## Client setup (summary)

| Client                           | Transport | Config                                                               |
| -------------------------------- | --------- | -------------------------------------------------------------------- |
| Cursor                           | HTTP      | Marketplace plugin **Setup → Edit Values**, or `.cursor/mcp.json`    |
| VS Code Copilot                  | HTTP      | `.vscode/mcp.json` → `type: "http"`, same URL                        |
| Claude Code / Codex / Gemini CLI | HTTP      | CLI `mcp add` with `--transport http`                                |
| Claude Desktop                   | stdio     | `npx -y supergateway --streamableHttp <URL> --outputTransport stdio` |

## Progressive disclosure

Load a domain skill above when the task matches. If a `product_api` path 404s, fetch `file://1inch-mcp/guides/api-index` or call `search`.
