# Amount display

All user-facing amounts in BOTH human and atomic form: `<human> (<atomic>)`, e.g. `0.0004 USDC (400)`, `1.5 ETH (1500000000000000000)`. Compute `human = atomic / 10^decimals` from the challenge `currency` token.

| Token | Decimals | 1 unit in minimal | Example |
|---|---|---|---|
| USDC | 6 | `1000000` | `1000000` → 1.00 USDC |
| USDT | 6 | `1000000` | `2500000` → 2.50 USDT |
| USDG | 6 | `1000000` | `500000`  → 0.50 USDG |
| ETH | 18 | `1000000000000000000` | `10000000000000000` → 0.01 ETH |

**Unknown symbol** (not in the table): never assume — query `okx-dex-token` for its decimals first. If you can't resolve them, render `<atomic> <symbol>` and append `unknown decimals — please double-check the seller-provided amount`. Do not block the flow. (`a2a-pay` overrides this — see `references/a2a_charge.md`.)
