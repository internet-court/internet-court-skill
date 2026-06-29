---
name: nansen-wallet-profiler
description: Wallet profiler — balance, PnL, labels, transactions, counterparties, related wallets, batch, trace, compare. Use when analysing a specific wallet address or comparing wallets.
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

# Wallet Profiler

All commands: `nansen research profiler <sub> [options]`

`--address` and `--chain` required for most commands.

## Balance & Identity

```bash
nansen research profiler balance --address <addr> --chain ethereum
nansen research profiler labels --address <addr> --chain ethereum
nansen research profiler search --query "Vitalik"
```

## PnL

```bash
nansen research profiler pnl --address <addr> --chain ethereum --days 30
nansen research profiler pnl-summary --address <addr> --chain ethereum
```

## Transactions & History

```bash
nansen research profiler transactions --address <addr> --chain ethereum --limit 20
nansen research profiler historical-balances --address <addr> --chain solana --days 30
```

## Relationships

```bash
nansen research profiler related-wallets --address <addr> --chain ethereum
nansen research profiler counterparties --address <addr> --chain ethereum --days 30
```

## Perps (no --chain)

```bash
nansen research profiler perp-positions --address <addr>
nansen research profiler perp-trades --address <addr> --days 7
```

## Batch, Trace & Compare

```bash
# Batch — profile multiple wallets at once
nansen research profiler batch \
  --addresses "0xabc,0xdef" --chain ethereum \
  --include labels,balance,pnl

# Trace — BFS multi-hop counterparty trace (makes N*width API calls)
nansen research profiler trace --address <addr> --chain ethereum --depth 2 --width 5

# Compare — shared counterparties and tokens between two wallets
nansen research profiler compare --addresses "0xabc,0xdef" --chain ethereum
```

## Flags

| Flag | Purpose |
|------|---------|
| `--address` | Wallet address (required) |
| `--chain` | Required except for perps and search |
| `--days` | Lookback period (default 30) |
| `--limit` | Number of results |
| `--include` | Batch fields: `labels,balance,pnl` |
| `--depth` | Trace depth 1-5 (default 2) |
| `--width` | Trace width — keep low to save credits |
| `--fields` | Select specific fields |
| `--table` | Human-readable table output |
| `--format csv` | CSV export |

## Notes

- `pnl-summary` has no pagination support (returns aggregate stats, not a list).
- `perp-positions` has no pagination support.
- `labels` has no pagination support — the API ignores `per_page` and always returns all labels for the address. `--limit` is not available for this sub-command.
- `transactions` caps at per_page=100 (API limit).
- `trace` makes many API calls — use `--width` conservatively.
- `batch` accepts `--file <path>` with one address per line as alternative to `--addresses`.
