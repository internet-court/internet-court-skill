---
name: nansen-general-search
description: Search for tokens or entities by name. Use when you have a token name and need the full address, or want to find an entity.
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

# Search

```bash
nansen research search "jupiter" --type token
nansen research search "Vitalik" --type entity --limit 5
nansen research search "bonk" --chain solana --fields address,name,symbol,chain
```

| Flag | Purpose |
|------|---------|
| `--type` | `token` or `entity` |
| `--chain` | Filter by chain |
| `--limit` | Number of results (default 25, max 50) |
| `--fields` | Select specific output fields |

Case-insensitive. Does NOT match by address — use `profiler labels` for address lookup.
