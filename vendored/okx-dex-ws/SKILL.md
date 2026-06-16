---
name: okx-dex-ws
description: "Use this skill when the user mentions 'onchainos ws', 'ws start', 'ws poll', 'ws stop', 'ws channels', 'ws session', 'ws channel-info', 'idle-timeout', 'idle timeout', 'WebSocket channels', 'WS频道', or asks about managing WebSocket sessions/会话管理. Also use when writing a custom WebSocket script/脚本/bot for real-time on-chain data. Covers: onchainos ws CLI commands (start/poll/stop/list/channels/channel-info), session lifecycle, idle-timeout configuration, and all 9 DEX WebSocket channels (price, candle, trades, price-info, signals, tracker, meme scanning)."
license: MIT
metadata:
  author: okx
  version: "3.3.12"
  homepage: "https://web3.okx.com"
---

# Onchain OS DEX WebSocket — Unified Skill

Two ways to consume real-time DEX data:
1. **CLI** (`onchainos ws`) — start a background session, poll events incrementally. Best for monitoring and agent-driven workflows.
2. **Script** — write a custom WebSocket client in Python/Node/Rust. Best for bots and custom logic.

## Pre-flight Checks

> Read `../okx-agentic-wallet/_shared/preflight.md`. If that file does not exist, read `_shared/preflight.md` instead.

## Prerequisites

This skill references `ws-protocol.md` files from `okx-dex-market`, `okx-dex-token`, `okx-dex-signal`, and `okx-dex-trenches`. If a referenced file is not found, the corresponding skill may not be installed — inform the user and suggest installing the missing skill from the onchainos-skills plugin.

## Related Workflows

When one of the following commands is used, show the related workflow hint after displaying results:

| Command | Workflow | File |
|---------|----------|------|
| `ws start`, `ws poll`, `ws stop` | Wallet Monitor (WebSocket) | `~/.onchainos/workflows/wallet-monitor-ws.md` |

> Hint format: *"You can also try out our **Wallet Monitor (WebSocket)** workflow for more comprehensive results. Would you like to try it?"*

## Approach 1: CLI (`onchainos ws`)

### Discover Channels

```
onchainos ws channels                          # list all 9 supported channels
onchainos ws channel-info --channel <name>     # detailed info + example for a channel
```

### Start / Poll / Stop

```
onchainos ws start --channel <channel> [params]   # start background session
onchainos ws poll --id <ID> [--channel <ch>]       # pull new events
onchainos ws list                                  # list sessions
onchainos ws stop [--id <ID>]                      # stop session(s)
```

### Channel Quick Reference

| Channel | Group | Pattern | Required Params |
|---------|-------|---------|-----------------|
| `kol_smartmoney-tracker-activity` | signal | global | (none) |
| `address-tracker-activity` | signal | per-wallet | `--wallet-addresses` |
| `dex-market-new-signal-openapi` | signal | per-chain | `--chain-index` |
| `price` | market | per-token | `--token-pair` |
| `dex-token-candle{period}` | market | per-token | `--token-pair` |
| `price-info` | token | per-token | `--token-pair` |
| `trades` | token | per-token | `--token-pair` |
| `dex-market-memepump-new-token-openapi` | trenches | per-chain | `--chain-index` |
| `dex-market-memepump-update-metrics-openapi` | trenches | per-chain | `--chain-index` |

### Parameter Formats

- `--token-pair`: `chainIndex:tokenContractAddress` (e.g. `1:0xdac17f958d2ee523a2206206994597c13d831ec7`)
- `--chain-index`: comma-separated chain IDs (e.g. `1,501,56`)
- `--wallet-addresses`: comma-separated addresses, max 200
- `--idle-timeout`: auto-stop if no poll within this duration (default `30m`; `1h`, `2h`, `300s`, `0` to disable)

### Examples

```bash
# Smart money trade feed
onchainos ws start --channel kol_smartmoney-tracker-activity

# Track specific wallets
onchainos ws start --channel address-tracker-activity --wallet-addresses 0xAAA,0xBBB

# Token price monitoring
onchainos ws start --channel price --token-pair 1:0xdac17f958d2ee523a2206206994597c13d831ec7

# Buy signal alerts on Ethereum + Solana
onchainos ws start --channel dex-market-new-signal-openapi --chain-index 1,501

# New meme token launches on Solana
onchainos ws start --channel dex-market-memepump-new-token-openapi --chain-index 501

# K-line 1-minute candles
onchainos ws start --channel dex-token-candle1m --token-pair 1:0xdac17f958d2ee523a2206206994597c13d831ec7
```

### Poll Filters (tracker channels only)

When polling `kol_smartmoney-tracker-activity` or `address-tracker-activity`, these filters are available:
- `--min-quote-amount`, `--min-market-cap`, `--min-pnl`
- `--trader` (wallet address prefix match)
- `--tag` (smart_money or kol)
- `--trade-type` (buy or sell)
- `--since` (ms timestamp)

## Approach 2: Custom Script

When the user wants to build a custom WebSocket client with their own logic, read the corresponding protocol reference file:

### Market Data (price & candlestick streams)

**Read**: `../okx-dex-market/references/ws-protocol.md`

Channels: `price`, `dex-token-candle{period}`

### Token Data (detailed token streams)

**Read**: `../okx-dex-token/references/ws-protocol.md`

Channels: `price-info`, `trades`

### Signal & Wallet Tracking

**Read**: `../okx-dex-signal/references/ws-protocol.md`

Channels: `dex-market-new-signal-openapi`, `kol_smartmoney-tracker-activity`, `address-tracker-activity`

### Meme/Trenches

**Read**: `../okx-dex-trenches/references/ws-protocol.md`

Channels: `dex-market-memepump-new-token-openapi`, `dex-market-memepump-update-metrics-openapi`

## Common Protocol (all channels share)

- **Endpoint**: `wss://wsdex.okx.com/ws/v6/dex`
- **Auth**: HMAC-SHA256 login required before subscribing
- **Heartbeat**: send `"ping"` every 25s, expect `"pong"`
- **Subscribe**: `{"op": "subscribe", "args": [...]}`
- **Unsubscribe**: `{"op": "unsubscribe", "args": [...]}`
