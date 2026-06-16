# Onchain OS DEX Swap — CLI Command Reference

Detailed parameter tables, return field schemas, and usage examples for all 6 swap commands.

## 1. onchainos swap chains

Get supported chains for DEX aggregator. No parameters required.

```bash
onchainos swap chains
```

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `chainIndex` | String | Chain identifier (e.g., `"1"`, `"501"`) |
| `chainName` | String | Human-readable chain name |
| `dexTokenApproveAddress` | String | DEX router address for token approvals on this chain |

## 2. onchainos swap liquidity

Get available liquidity sources on a chain.

```bash
onchainos swap liquidity --chain <chain>
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--chain` | Yes | - | Chain name (e.g., `ethereum`, `solana`, `xlayer`) |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `id` | String | Liquidity source ID |
| `name` | String | Liquidity source name (e.g., `"Uniswap V3"`, `"CurveNG"`) |
| `logo` | String | Liquidity source logo URL |

## 3. onchainos swap approve

Get ERC-20 approval transaction data.

```bash
onchainos swap approve --token <address> --amount <amount> --chain <chain>
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--token` | Yes | - | Token contract address to approve |
| `--amount` | Yes | - | Amount in minimal units |
| `--chain` | Yes | - | Chain name |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `data` | String | Approval calldata (hex) — use as tx `data` field |
| `dexContractAddress` | String | Spender address (already encoded in `data`). **NOT** the tx `to` — send tx to the token contract |
| `gasLimit` | String | Estimated gas limit for the approval tx |
| `gasPrice` | String | Recommended gas price |

## 4. onchainos swap quote

Get swap quote (read-only price estimate).

```bash
onchainos swap quote --from <address> --to <address> --readable-amount <amount> --chain <chain> [--swap-mode <mode>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--from` | Yes | - | Source token contract address |
| `--to` | Yes | - | Destination token contract address |
| `--readable-amount` | One of | - | Human-readable sell amount (e.g. `"1.5"` for 1.5 USDC). CLI fetches token decimals and converts automatically. |
| `--amount` | One of | - | Amount in minimal units — use only when raw units are explicitly known. Mutually exclusive with `--readable-amount`. |
| `--chain` | Yes | - | Chain name |
| `--swap-mode` | No | `exactIn` | `exactIn` or `exactOut` |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `toTokenAmount` | String | Expected output amount in minimal units |
| `fromTokenAmount` | String | Input amount in minimal units |
| `estimateGasFee` | String | Estimated gas fee (native token units) |
| `tradeFee` | String | Trade fee estimate in USD |
| `priceImpactPercent` | String | Price impact as percentage (e.g., `"0.05"`) |
| `router` | String | Router type used |
| `dexRouterList[]` | Array | DEX routing path details |
| `dexRouterList[].dexName` | String | DEX name in the route |
| `dexRouterList[].percentage` | String | Percentage of amount routed through this DEX |
| `fromToken.isHoneyPot` | Boolean | `true` = source token is a honeypot (cannot sell) |
| `fromToken.taxRate` | String | Source token buy/sell tax rate |
| `fromToken.decimal` | String | Source token decimals |
| `fromToken.tokenUnitPrice` | String | Source token unit price in USD |
| `toToken.isHoneyPot` | Boolean | `true` = destination token is a honeypot (cannot sell) |
| `toToken.taxRate` | String | Destination token buy/sell tax rate |
| `toToken.decimal` | String | Destination token decimals |
| `toToken.tokenUnitPrice` | String | Destination token unit price in USD |

## 5. onchainos swap execute

One-shot swap: quote → approve (if needed) → sign → broadcast → txHash. Honeypot and price impact >10% are blocked internally.

```bash
onchainos swap execute --from <address> --to <address> --readable-amount <amount> --chain <chain> --wallet <address> [--slippage <pct>] [--gas-level <level>] [--swap-mode <mode>] [--mev-protection] [--tips <sol_amount>] [--max-auto-slippage <pct>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--from` | Yes | - | Source token contract address |
| `--to` | Yes | - | Destination token contract address |
| `--readable-amount` | One of | - | Human-readable sell amount (e.g. `"1.5"` for 1.5 USDC). CLI fetches token decimals and converts automatically. |
| `--amount` | One of | - | Amount in minimal units — use only when raw units are explicitly known. Mutually exclusive with `--readable-amount`. |
| `--chain` | Yes | - | Chain name |
| `--wallet` | Yes | - | User's wallet address |
| `--slippage` | No | autoSlippage | Slippage tolerance in percent (e.g., `"1"` for 1%). Omit to use autoSlippage. |
| `--gas-level` | No | `average` | Gas priority: `slow`, `average`, `fast` |
| `--swap-mode` | No | `exactIn` | `exactIn` or `exactOut` |
| `--mev-protection` | No | - | Enable MEV protection (EVM chains: Ethereum, BSC, Base) |
| `--tips` | No | - | Jito tips in SOL for MEV protection (Solana only, e.g. `0.001`). Mutually exclusive with `computeUnitPrice`. |
| `--max-auto-slippage` | No | - | Upper bound for autoSlippage in percent (e.g. `"3"` for 3%). Only applies when `--slippage` is omitted (i.e. autoSlippage is active). Has no effect if `--slippage` is passed explicitly. |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `approveTxHash` | String? | Approval tx hash (only if approval was needed) |
| `swapTxHash` | String | Swap transaction hash |
| `fromAmount` | String | Input amount in UI units |
| `toAmount` | String | Output amount in UI units |
| `priceImpact` | String | Price impact percentage |
| `gasUsed` | String | Gas used (USD estimate) |

## Input / Output Examples

**User says:** "Swap 100 USDC for OKB on XLayer"

```bash
# 1. Quote
onchainos swap quote --from 0x74b7f16337b8972027f6196a17a631ac6de26d22 --to 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee --readable-amount 100 --chain xlayer
# -> Expected output: 3.2 OKB, Gas fee: ~$0.001, Price impact: 0.05%

# 2. Execute (approve + swap + broadcast in one shot)
onchainos swap execute --from 0x74b7f16337b8972027f6196a17a631ac6de26d22 --to 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee --readable-amount 100 --chain xlayer --wallet <wallet_addr>
# -> { approveTxHash: "0x...", swapTxHash: "0x...", fromAmount: "100", toAmount: "3.2", priceImpact: "0.05%", gasUsed: "$0.001" }
```

**User says:** "What DEXes are available on XLayer?"

```bash
onchainos swap liquidity --chain xlayer
# -> Display: CurveNG, XLayer DEX, ... (DEX sources on XLayer)
```

## 6. onchainos swap swap

Calldata only — returns unsigned transaction data. Does NOT sign or broadcast.

```bash
onchainos swap swap --from <address> --to <address> --readable-amount <amount> --chain <chain> --wallet <address> [--slippage <pct>] [--swap-mode <mode>] [--tips <sol_amount>] [--max-auto-slippage <pct>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--from` | Yes | - | Source token contract address |
| `--to` | Yes | - | Destination token contract address |
| `--readable-amount` | One of | - | Human-readable sell amount (e.g. `"1.5"` for 1.5 USDC). CLI fetches token decimals and converts automatically. |
| `--amount` | One of | - | Amount in minimal units — use only when raw units are explicitly known. Mutually exclusive with `--readable-amount`. |
| `--chain` | Yes | - | Chain name |
| `--wallet` | Yes | - | User's wallet address |
| `--slippage` | No | autoSlippage | Slippage tolerance in percent (e.g., `"1"` for 1%). Omit to use autoSlippage. |
| `--swap-mode` | No | `exactIn` | `exactIn` or `exactOut` |
| `--tips` | No | - | Jito tips in SOL for MEV protection (Solana only, e.g. `0.001`). Jito calldata embedded in returned tx data. |
| `--max-auto-slippage` | No | - | Upper bound for autoSlippage in percent (e.g. `"3"` for 3%). Only applies when `--slippage` is omitted (i.e. autoSlippage is active). Has no effect if `--slippage` is passed explicitly. |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `routerResult` | Object | Same structure as `swap quote` return |
| `tx.to` | String | Target contract address |
| `tx.data` | String | Transaction calldata (hex) |
| `tx.gas` | String | Gas limit |
| `tx.gasPrice` | String | Gas price |
| `tx.value` | String | Native token transfer value (minimal units) |
| `tx.minReceiveAmount` | String | Minimum receive amount after slippage |

### Calldata Usage

Returns unsigned tx data: `{ routerResult, tx: { to, data, gas, gasPrice, value, minReceiveAmount } }`

Present to user: token pair summary + tx fields (`to`, `data`, `value`, `gas`).
EVM non-native token → also run `swap approve` first, present approve calldata separately.
Remind: calldata expires in minutes, re-run if stale.

> Do NOT call `gateway broadcast`. User handles signing and broadcasting.

### MEV Notes

- **Solana**: `--tips` applies — Jito calldata is embedded in the returned tx data.
- **EVM**: `--mev-protection` is not supported for `swap swap`. Recommend submitting via a MEV-protected RPC (e.g. Flashbots Protect) if needed.
