# Onchain OS DEX Cross-Chain — Return Schemas & Semantics

> **Flags are NOT documented here.** Run `onchainos cross-chain <subcommand> --help` for the exact, always-current flag list (name, required-ness, default, mutual exclusivity). This file documents what `--help` cannot express: **return-field schemas, field semantics, worked examples, and cross-command rules**.

The 7 subcommands: `bridges`, `tokens`, `quote`, `approve`, `swap`, `execute`, `status`. For flags, run each command's `--help`.

## 1. bridges — return fields

One entry per bridge protocol. Empty response (both chain flags set) = no bridge connects that pair.

| Field | Type | Description |
|---|---|---|
| `bridgeId` | Integer | **Bridge protocol ID** (openApiCode). Use directly in `quote` / `approve` / `swap` / `execute --bridge-id`. |
| `bridgeName` | String | Human-readable name (e.g. `STARGATE V2 BUS MODE`, `ACROSS V3`). |
| `logo` | String | Logo URL — **do not display in terminal output**. |
| `requireOtherNativeFee` | Boolean | Whether the bridge needs an extra native-token fee on top of `crossChainFee`. |
| `supportedChains` | String[] | chainIndex values this bridge supports. |

**Display**: render exactly 4 columns — `# | Bridge | Supported Chains | Native Fee` (collapse `requireOtherNativeFee` to Yes/No). Do NOT show `logo` or raw ID fields.

## 2. tokens — return fields

One entry per bridgeable from-token.

| Field | Type | Description |
|---|---|---|
| `chainIndex` | String | Chain ID (e.g. `"1"`, `"42161"`). |
| `tokenContractAddress` | String | Token contract (lowercase for EVM; native may be `""` or `0xeee…`). **Canonical identifier.** |
| `tokenName` | String | Full token name. |
| `tokenSymbol` | String | Symbol; may be a chain-specific alias (e.g. `ARB_ETH` for native ETH on Arbitrum). |
| `decimals` | Integer | Token decimals. |

## 3. quote — return shape

`data` is an array with one quote object; `routerList` is a multi-bridge list.

```json
{
  "fromChainIndex": "42161",
  "toChainIndex": "10",
  "fromTokenAmount": "1000000",
  "fromToken": { "decimals": 6, "tokenContractAddress": "0xaf88...", "tokenSymbol": "USDC" },
  "toToken": { "decimals": 6, "tokenContractAddress": "0x0b2c...", "tokenSymbol": "USDC" },
  "routerList": [
    {
      "bridgeId": 636,
      "bridgeName": "ACROSS V3",
      "toTokenAmount": "999533",
      "minimumReceived": "999533",
      "estimateGasFee": "",
      "estimateTime": "43",
      "priceImpactPercentage": "",
      "needApprove": true,
      "needCancelApprove": false,
      "crossChainFee": "466",
      "crossChainFeeTokenAddress": "0xaf88...",
      "otherNativeFee": "0"
    }
  ]
}
```

| Field | Notes |
|---|---|
| `routerList[].bridgeId` | Pass to `approve` / `swap` / `execute --bridge-id`. |
| `routerList[].needApprove` | true if approve needed before swap. Reliable only when `--check-approve` was set. |
| `routerList[].needCancelApprove` | true for USDT-pattern tokens (revoke before re-approve). Backend may not emit it yet; default false. |
| `routerList[].crossChainFee` | Bridge fee in raw units of `crossChainFeeTokenAddress`. |
| `routerList[].otherNativeFee` | Extra native-token fee (raw native units); 0 for most bridges. |
| `routerList[].estimateTime` | Seconds (string). `43` = ~43s. |
| `routerList[].priceImpactPercentage` | May be empty in pre-prod; treat as 0%. |
| `routerList[].estimateGasFee` | May be empty in pre-prod. |
| `routerList[].toTokenAmount` / `minimumReceived` | Destination token raw units. |

> **Empty `routerList`** = no direct route → the backend returns a `fallback` object instead. See [transit-fallback.md](transit-fallback.md).

## 4. approve — return shape

```json
{
  "chainIndex": "42161",
  "tokenContractAddress": "0xaf88...",
  "approveAddress": "0xe35e9842fcEACA96570B734083f4a58e8F7C5f2A",
  "needApprove": true,
  "tx": { "from": "0xaef7...", "to": "0xaf88...", "data": "0x095ea7b3...", "value": "0", "gasLimit": "55000", "gasPrice": "50527197", "maxPriorityFeePerGas": "23524497" }
}
```

| Field | Notes |
|---|---|
| `approveAddress` | The bridge router that receives the allowance (informational; already encoded in `tx.data`). |
| `needApprove` | Only meaningful when `--check-allowance` was set. |
| `tx` | Standard EVM unsigned tx. `tx.to` = token contract; `tx.data` = ABI-encoded `approve(spender, amount)`; `tx.value` always `"0"`. |

When `--check-allowance` is set and on-chain allowance is already sufficient, the response may have `tx: null` / `needApprove: false`. **`MAX` is NOT supported** — pass a numeric amount (`"0"` to revoke); the CLI rejects non-numeric `--readable-amount` client-side.

## 5. swap — return shape

Same `router` info as `/quote` plus a ready-to-sign `tx`. Calldata only — does NOT broadcast.

```json
{
  "fromTokenAmount": "1000000",
  "toTokenAmount": "999555",
  "minimumReceived": "999555",
  "router": { "bridgeId": 636, "bridgeName": "ACROSS V3", "crossChainFee": "444", "crossChainFeeTokenAddress": "0xaf88...", "estimateTime": "43", "needApprove": true, "needCancelApprove": false, "otherNativeFee": "0" },
  "tx": { "from": "0xaef7...", "to": "0xe35e98...", "data": "0xad5425c6...", "value": "0", "gasLimit": "49500", "gasPrice": "50527197", "maxPriorityFeePerGas": "23524497" }
}
```

> `--bridge-id` must match the one used in `approve` (spender alignment). Do NOT `gateway broadcast` this calldata directly — that bypasses the agentic-wallet TEE signing. Use `execute` for the full signed flow.

## 6. execute — return: action=execute

The only success return on the default (one-shot) path. Returned once the swap is broadcast — after any in-flight approval (and USDT-pattern revoke) confirmed on-chain.

| Field | Type | Description |
|---|---|---|
| `action` | String | `"execute"`. |
| `fromTxHash` | String | **Source chain tx hash — use this to query status.** |
| `swapOrderId` | String? | Swap broadcast order id (present when non-empty). |
| `approveTxHash` | String? | Approve tx hash (only when an approval ran in this call). |
| `approveOrderId` | String? | Approve broadcast order id (only when the approval returned one). |
| `bridgeId` / `bridgeName` | String | Bridge used. |
| `fromChainIndex` | String | Source chain index. |
| `minimumReceived` / `toTokenAmount` / `crossChainFee` / `estimateTime` | String | Echoed from the chosen route. |
| `nextSteps` | Object | `{ "checkBridgeStatus": "onchainos cross-chain status --tx-hash <fromTxHash> --bridge-id <bridgeId> --from-chain <fromChainIndex>" }` — paste verbatim. |

> The default path is uniquely identified by the **presence of `nextSteps`**. Other `action` values: `blocked` (balance/gas gate) and `fallback` (no route → [transit-fallback.md](transit-fallback.md)).

## 7. status — return shape

```json
{
  "chainIndex": "42161",
  "txHash": "0xabc...",
  "toChainIndex": "10",
  "toTxHash": "0xdef...",
  "toTokenAddress": "0x0b2c...",
  "toAmount": "999555",
  "bridgeId": 636,
  "status": "SUCCESS"
}
```

| Field | Type | Description |
|---|---|---|
| `status` | String | `SUCCESS` / `PENDING` / `NOT_FOUND`. |
| `chainIndex` / `txHash` | String | Source chain id / tx hash (echoed). |
| `toChainIndex` / `toTxHash` / `toTokenAddress` / `toAmount` | String | Destination fields — **empty/zero until `SUCCESS`**; rely on them only after `SUCCESS`. |
| `bridgeId` | Integer | Bridge id used (may disagree with the one passed — trust your own `quote`/`execute` record). |

PENDING/NOT_FOUND diagnosis and polling: [troubleshooting.md](troubleshooting.md).

## Worked examples

**One-shot (recommended) — "Bridge 1 USDC Arbitrum → Optimism":**

```bash
onchainos cross-chain quote --from usdc --to usdc --from-chain arbitrum --to-chain optimism --readable-amount 1 --wallet 0xaef7... --check-approve
onchainos cross-chain execute --from usdc --to usdc --from-chain arbitrum --to-chain optimism --readable-amount 1 --wallet 0xaef7...
# -> action=execute + fromTxHash, bridgeId, fromChainIndex, nextSteps.checkBridgeStatus
onchainos cross-chain status --tx-hash 0x... --bridge-id 636 --from-chain 42161
```

**Manual calldata (external wallet signs):** `quote` → `approve` (sign+broadcast `tx`) → `swap` (sign+broadcast `tx`) → `status --tx-hash <swap_hash> --bridge-id <id> --from-chain <idx>`. `--bridge-id` must match across `approve` and `swap`.

## Cross-command rules

- **`bridgeId` is a stable openApiCode** — always derive it from `quote.routerList[].bridgeId` or `cross-chain bridges`; never hardcode.
- **Bridgeable scope is runtime** — decide a pair via `cross-chain bridges --from-chain <X> --to-chain <Y>`, not a static list.
- **No route** → backend `fallback` object on `quote`/`execute` → [transit-fallback.md](transit-fallback.md).
