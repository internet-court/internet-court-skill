---
name: 1inch-aqua
description: >-
  Read 1inch Aqua shared-liquidity analytics (maker TVL, fees, APY, strategies,
  activity, volume) via the MCP `aqua` tool. Use for Aqua strategy questions;
  prefer aqua over raw product_api.
license: MIT
compatibility: Requires 1inch MCP server with aqua tool enabled (Unleash mcp-service.tool.aqua).
---

# Aqua strategy analytics

Prefer the MCP tool **`aqua`** (public reads). Full playbook (action examples, priceRange semantics, maker/taker flows, compliance): [references/WORKFLOW.md](references/WORKFLOW.md). Same content is served live as MCP resource `file://1inch-mcp/guides/aqua-workflow` for clients that read resources.

## Read actions

- `maker_stats` — TVL, fees, APY for a maker
- `list_maker_strategies` — strategies for a maker
- `strategy_overview` / `strategy_activity` / `strategy_volume`
- `list_opened` — open strategies feed

## Write actions (when enabled)

`build_ship`, `build_dock`, `quote`, `build_swap` — non-custodial; the user's wallet signs everything.

**Recommended: connect the user's wallet first (WalletConnect).** Pair via the `walletconnect` tool (see the `1inch-walletconnect` skill). With an active session, `build_ship` / `build_dock` / `build_swap` default to sending the transaction through the connected wallet — the user simply approves each prompt in their wallet app. Set `execute: false` to receive calldata only. `quote` is never executed (pure eth_call simulation). For anonymous (no-OAuth) writes, the WalletConnect flow also handles the one-time Terms-of-Use acceptance (`accept_terms`).

## Fallback

Raw paths: `/aqua/v1.0/strategies/...` via `product_api` — only if the `aqua` tool is unavailable.
