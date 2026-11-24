# Swap Quote — Choosing Swap Type

Use `quoteOnly=true` to get a swap quote for a specific type (classic, Fusion, or cross-chain). The response returns only one `recommended` type and its quote:

- If you pass `preferredType` explicitly, the response returns that exact type (when a quote for it is available).
- If `preferredType` is omitted, the tool compares classic, Fusion, and cross-chain internally and picks the best one.

## Response

```json
{
  "quotes": "fusion:Z",
  "recommended": "fusion"
}
```

The `quotes` string contains only the recommended leg:

- `classic:X gas:Y`
- `fusion:Z`
- `crosschain:W dst:8453`

## Presenting results to the user

When `recommended` is set and that type is available, present **only** that type. Do not mention classic, Fusion, or cross-chain alternatives unless the user explicitly asks to compare.

## Approval & gas

When the response includes an `approval` block, the source token needs a one-time ERC-20 approval before the swap can proceed. Tell the user upfront, before executing:

- Relay `approval.reason` and `approval.gasNote`: the approval is paid in the source chain's **native token**, even for gasless Fusion/cross-chain swaps.
- `approval.estimatedCost.costNative` (when present) is the estimated approval cost in native units; `costWei`, `gasLimit`, and `maxFeePerGasWei` give the breakdown.
- Do not check the user's native balance on their behalf — mention the requirement and let the user decide.

## Next Steps

1. Use the `recommended` swap type (or override with your own `preferredType`).
2. Call swap again **without** `quoteOnly`, set `preferredType` to the recommended type:
   - `preferredType="classic"` — on-chain, user pays gas
   - `preferredType="fusion"` — gasless, resolvers fill
   - `preferredType="crosschain"` — cross-chain (also set `dstChain`)

## Shortcut

Skip the quote and call swap directly. Omit `preferredType` to let the tool pick a type, or set it explicitly. Set `dstChain` for cross-chain.

## Common Chain IDs

| Chain    | ID    |
| -------- | ----- |
| Ethereum | 1     |
| Arbitrum | 42161 |
| Base     | 8453  |
| Polygon  | 137   |
| BSC      | 56    |
