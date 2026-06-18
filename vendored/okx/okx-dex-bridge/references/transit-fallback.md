# Cross-Chain Fallback — No Direct Route

> Load this file when `quote` returns an empty `routerList`, or `execute` returns `action=fallback`. These are normal branches (not errors): the backend auto-probes transit assets and hands you the result — you do NOT run any discovery loop yourself.

## Response shapes

Both commands surface the same `fallback` object, just nested differently:

- **`quote`**: `data[0]` = `{ "routerList": [], "fallback": {...} }` (same array shape as a normal quote).
- **`execute`**: `data` = `{ "action": "fallback", "routerList": [], "fallback": {...} }`.

Branch on `fallback.outcome`.

## `outcome = transit_available`

`fallback.transitOptions[]` lists bridgeable transit tokens. The amounts already account for the source→transit swap **and** the bridge leg, so display them directly — format `toTokenAmount` / `minimumReceived` / `crossChainFee` with `toTokenDecimals` exactly like the main quote table.

```
{fromToken} cannot be bridged directly from {fromChain} to {toChain}. These transit tokens work:

| # | Transit Token  | Est. Receive    | Fee             | Est. Time      |
|---|----------------|-----------------|-----------------|----------------|
| 1 | {transitToken} | {toTokenAmount} | {crossChainFee} | {estimateTime} |

Pick a transit token. Steps:
1. Swap {fromToken} → {transitToken} on {fromChain} (use okx-dex-swap)
2. Bridge {transitToken} from {fromChain} to {toChain} (use okx-dex-bridge)
3. Swap {transitToken} → {targetToken} on {toChain} (use okx-dex-swap) — only when target ≠ transit
```

Let the user pick, then run each leg with the corresponding skill. The bridge leg (step 2) is a normal same-token bridge: `--from {transitToken} --to {transitToken}`.

## `outcome = no_path`

No indirect path exists either. Relay `fallback.message` translated to the user's language. Optionally suggest a manual two-hop via a common chain (Ethereum / Arbitrum) if the user wants to explore alternatives.

## `outcome = env_unavailable`

The bridge adapter is offline on this environment (empty backend `msg` across all transit probes). Tell the user the route is temporarily unavailable here and to retry later — don't imply the pair is permanently unsupported.
