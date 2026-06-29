---
name: nansen-prediction-markets
description: "Polymarket screeners — discover trending events, top markets by volume, and search for specific markets. Use when browsing what's happening on prediction markets."
metadata:
  openclaw:
    requires:
      env:
        - NANSEN_API_KEY
      bins:
        - nansen
    primaryEnv: NANSEN_API_KEY
    install:
      - kind: node
        package: nansen-cli
        bins: [nansen]
allowed-tools: Bash(nansen:*)
---

# Prediction Market Screeners

All commands: `nansen research prediction-market <sub> [options]` (alias: `nansen research pm <sub>`)

No `--chain` flag needed — Polymarket runs on Polygon.

```bash
# Top events (groups of related markets)
nansen research pm event-screener --sort-by volume_24hr --limit 20
# → event_title, market_count, total_volume, total_volume_24hr, total_liquidity, total_open_interest, tags

# Top markets by 24h volume
nansen research pm market-screener --sort-by volume_24hr --limit 20
# → market_id, question, best_bid, best_ask, volume_24hr, liquidity, open_interest, unique_traders_24h

# Search for specific markets
nansen research pm market-screener --query "bitcoin" --limit 10

# Find resolved/closed markets
nansen research pm market-screener --status closed --limit 10

# Browse categories
nansen research pm categories --pretty
# → category, active_markets, total_volume_24hr, total_open_interest
```

Sort options: `volume_24hr`, `volume`, `volume_1wk`, `volume_1mo`, `liquidity`, `open_interest`, `unique_traders_24h`, `age_hours`

Screeners return active/open markets by default. Use `--status closed` for resolved markets.
