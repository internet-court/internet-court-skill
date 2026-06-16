# Onchain OS DEX Cross-Chain — CLI Command Reference

Detailed parameter tables, return field schemas, and usage examples for the 7 cross-chain commands. All commands are GET requests under `/api/v6/dex/cross-chain/*`. Authentication via the standard `ApiClient` (JWT from `wallet login` or AK env vars).

## 1. onchainos cross-chain bridges

List bridge protocols. Both flags are independently optional, mapping to `fromChainIndex` / `toChainIndex` query params on the server:

- **Both omitted** → full catalog of every bridge.
- **`--from-chain` only** → bridges on that source chain.
- **`--to-chain` only** → bridges able to reach that destination.
- **Both** → bridges that connect that specific chain pair (the recommended pre-check before `quote` — see SKILL.md Step 3.5).

```bash
onchainos cross-chain bridges                                      # full catalog
onchainos cross-chain bridges --from-chain ethereum                # source-side
onchainos cross-chain bridges --to-chain base                      # destination-side
onchainos cross-chain bridges --from-chain arbitrum --to-chain base  # specific pair
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--from-chain` | No | — | Source chain name or chainIndex. |
| `--to-chain` | No | — | Destination chain name or chainIndex. |

**Empty response** with both flags set → no bridge connects that chain pair on this env. Surface to user as "no bridge currently connects {fromChain} ↔ {toChain}" and skip `quote`.

**Return fields** (per bridge entry):

| Field | Type | Description |
|---|---|---|
| `bridgeId` | Integer | **Bridge protocol ID** (openApiCode). Use directly in `quote`, `approve`, `swap`, `execute --bridge-id`. |
| `bridgeName` | String | Human-readable bridge name (e.g. `STARGATE V2 BUS MODE`, `ACROSS V3`) |
| `logo` | String | Logo URL — **do not display in terminal output** |
| `requireOtherNativeFee` | Boolean | Whether the bridge requires an additional native-token fee on top of `crossChainFee` |
| `supportedChains` | String[] | List of chainIndex values this bridge supports |

**Display format**: agent MUST render the bridge list as a table with exactly these 4 columns:

```
| # | Bridge | Supported Chains | Native Fee |
|---|--------|-----------------|-----------|
| 1 | STARGATE V2 BUS MODE | 1, 56, 137, 42161, 8453, 10, ... | No |
| 2 | ACROSS V3 | 1, 42161, 8453, 10, ... | No |
| 3 | ORBITER | 1, 56, 42161 | No |
```

Do NOT include `logo`, `requireOtherNativeFee` (collapse to "Yes/No"), or other ID fields in the display.

## 2. onchainos cross-chain tokens

List bridgeable from-tokens. Both flags independently optional, mapping to `fromChainIndex` / `toChainIndex` query params:

- **Both omitted** → full catalog.
- **`--from-chain` only** → all bridgeable from-tokens on that source chain.
- **`--to-chain` only** → from-tokens that can reach that destination.
- **Both** → from-tokens routable on that specific from→to pair.

```bash
onchainos cross-chain tokens                                  # full catalog
onchainos cross-chain tokens --from-chain ethereum            # tokens on ethereum
onchainos cross-chain tokens --to-chain base                  # tokens reaching base
onchainos cross-chain tokens --from-chain arbitrum --to-chain base  # pair-specific
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--from-chain` | No | — | Source chain name or chainIndex |
| `--to-chain` | No | — | Destination chain name or chainIndex |

**Return fields** (per token entry):

| Field | Type | Description |
|---|---|---|
| `chainIndex` | String | Chain ID (e.g. `"1"`, `"42161"`) |
| `tokenContractAddress` | String | Token contract address (lowercase for EVM; native may be `""` or the convention address `0xeee...`) |
| `tokenName` | String | Full token name |
| `tokenSymbol` | String | Token symbol (e.g. `USDC`, `ARB_ETH`) |
| `decimals` | Integer | Token decimals |

**Note**: token symbols may be chain-specific aliases (e.g. `ARB_ETH` for native ETH on Arbitrum). Use `tokenContractAddress` as the canonical identifier.

## 3. onchainos cross-chain quote

Get cross-chain quote (read-only). Returns one or more routes in `routerList[]`.

```bash
onchainos cross-chain quote \
  --from <address> --to <address> \
  --from-chain <chain> --to-chain <chain> \
  --readable-amount <amount> \
  [--slippage <s>] \
  [--wallet <addr>] [--check-approve] \
  [--receive-address <addr>] \
  [--bridge-id <id>] \
  [--sort <0|1|2>] \
  [--allow-bridges <ids>] [--deny-bridges <ids>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--from` | Yes | — | Source token address or alias |
| `--to` | Yes | — | Destination token address or alias |
| `--from-chain` | Yes | — | Source chain (name or chainIndex) |
| `--to-chain` | Yes | — | Destination chain (name or chainIndex) |
| `--readable-amount` | One of | — | Human-readable amount (e.g. `"1"` for 1 USDC). CLI fetches token decimals. |
| `--amount` | One of | — | Raw amount in minimal units. Mutually exclusive with `--readable-amount`. |
| `--slippage` | No | `0.01` | Decimal slippage (range `0.002` – `0.5`, i.e. 0.2% – 50%) |
| `--wallet` | No | — | User wallet address. Required when `--check-approve` is set. |
| `--check-approve` | No | false | Have server compare on-chain allowance and fill `routerList[].needApprove` |
| `--receive-address` | Optional (CLI) / always-pass (skill) | sender wallet | Destination receiver. The CLI does not enforce it; the server requires it for heterogeneous (EVM ⇌ non-EVM) bridges and returns 82202 when missing. **Skill rule:** always pass — default to `--wallet` for same-family pairs; collect a destination-format address from the user for heterogeneous pairs. When supplied, address family must match `--to-chain`. |
| `--bridge-id` | No | — | Pin a specific bridge id (openApiCode from `bridges` or previous quote) |
| `--sort` | No | server default (0=optimal) | 0=optimal, 1=fastest, 2=max output |
| `--allow-bridges` | No | — | Comma-separated bridge ids to whitelist |
| `--deny-bridges` | No | — | Comma-separated bridge ids to blacklist |

**Return shape** (`data` is an array with one quote object; `routerList` is a multi-bridge list):

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
    },
    {
      "bridgeId": 639,
      "bridgeName": "STARGATE V2 BUS MODE",
      "toTokenAmount": "999508",
      "minimumReceived": "999508",
      "estimateTime": "354",
      "needApprove": true,
      "needCancelApprove": false,
      "crossChainFee": "0",
      "otherNativeFee": "8031617009308"
    },
    {
      "bridgeId": 640,
      "bridgeName": "STARGATE V2 TAXI MODE",
      "toTokenAmount": "999508",
      "minimumReceived": "999508",
      "estimateTime": "48",
      "needApprove": true,
      "needCancelApprove": false,
      "crossChainFee": "0",
      "otherNativeFee": "30473883753011"
    }
  ]
}
```

**Field notes**:

| Field | Notes |
|---|---|
| `routerList[].bridgeId` | Pass to `approve --bridge-id`, `swap --bridge-id`, `execute --bridge-id` |
| `routerList[].needApprove` | true if user must run approve before swap. Reliable only when `--check-approve` set. |
| `routerList[].needCancelApprove` | true for USDT-pattern tokens (must revoke before re-approve). Backend may not yet emit this field; default false. |
| `routerList[].crossChainFee` | Bridge fee in raw units of `crossChainFeeTokenAddress` token |
| `routerList[].otherNativeFee` | Extra native-token fee (raw native units), 0 for most bridges |
| `routerList[].estimateTime` | Seconds (string). 43 = ~43s. |
| `routerList[].priceImpactPercentage` | May be empty string in pre-prod; treat as 0% |
| `routerList[].estimateGasFee` | May be empty string in pre-prod |
| `routerList[].toTokenAmount` / `minimumReceived` | Destination token raw units |

> **Multi-route**: `routerList[]` is a multi-bridge list by design. Render the comparison table from Step 4 of SKILL.md and let the user pick. To pin a specific bridge for the subsequent `approve` / `swap` / `execute`, pass `--bridge-id <id>` (the same id from the chosen `routerList[].bridgeId`).

## 4. onchainos cross-chain approve

Build ERC-20 approve transaction for a given bridge router (manual use). Most flows should use `execute` instead.

```bash
onchainos cross-chain approve \
  --chain <chain> \
  --token <address> \
  --wallet <addr> \
  --bridge-id <id> \
  --readable-amount <amount> \
  [--check-allowance]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--chain` | Yes | — | Source chain name or chainIndex |
| `--token` | Yes | — | Token contract address to approve |
| `--wallet` | Yes | — | User wallet address |
| `--bridge-id` | Yes | — | Bridge id (openApiCode) from `bridges` or `quote.routerList[]` |
| `--readable-amount` | Yes | — | Human-readable approve amount. Pass `"0"` to revoke. |
| `--check-allowance` | No | false | Have server compare on-chain allowance and skip returning `tx` if already sufficient |

**Return shape**:

```json
{
  "chainIndex": "42161",
  "tokenContractAddress": "0xaf88...",
  "approveAddress": "0xe35e9842fcEACA96570B734083f4a58e8F7C5f2A",
  "needApprove": true,
  "tx": {
    "from": "0xaef7...",
    "to": "0xaf88...",
    "data": "0x095ea7b3...",
    "value": "0",
    "gasLimit": "55000",
    "gasPrice": "50527197",
    "maxPriorityFeePerGas": "23524497"
  }
}
```

**Field notes**:

| Field | Notes |
|---|---|
| `approveAddress` | The bridge router contract that gets the allowance (informational; already encoded in `tx.data`) |
| `needApprove` | Only meaningful when `--check-allowance` was set |
| `tx` | Standard EVM unsigned tx. `tx.to` = token contract. `tx.data` = ABI-encoded `approve(spender, amount)`. `tx.value` always `"0"`. |

When `--check-allowance` is set and on-chain allowance is already sufficient, the response may have `tx: null` and `needApprove: false`. Otherwise `tx` is populated.

> **`approveAmount=MAX` is NOT supported** by the endpoint despite documentation hint — pass a numeric amount only ("0" to revoke, the swap amount or higher to grant). MAX returns code 51000.

## 5. onchainos cross-chain swap

Get unsigned cross-chain swap transaction (calldata only). Does NOT sign or broadcast.

```bash
onchainos cross-chain swap \
  --from <address> --to <address> \
  --from-chain <chain> --to-chain <chain> \
  --readable-amount <amount> \
  --wallet <address> \
  [--slippage <s>] \
  [--receive-address <addr>] \
  [--bridge-id <id>] \
  [--sort <0|1|2>] \
  [--allow-bridges <ids>] [--deny-bridges <ids>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--from` | Yes | — | Source token address or alias |
| `--to` | Yes | — | Destination token address or alias |
| `--from-chain` / `--to-chain` | Yes | — | Source / destination chain |
| `--readable-amount` / `--amount` | One of | — | Same semantics as `quote` |
| `--slippage` | No | `0.01` | Decimal slippage |
| `--wallet` | Yes | — | User wallet address (sender) |
| `--receive-address` | Optional (CLI) / always-pass (skill) | sender wallet | Destination receiver. The CLI does not enforce it; the server requires it for heterogeneous (EVM ⇌ non-EVM) bridges and returns 82202 when missing. **Skill rule:** always pass — default to `--wallet` for same-family pairs; collect a destination-format address from the user for heterogeneous pairs. When supplied, address family must match `--to-chain`. |
| `--bridge-id` | No | — | Pin a specific bridge (must match the one used in approve to ensure spender alignment) |
| `--sort` | No | server default (0=optimal) | 0=optimal, 1=fastest, 2=max output |
| `--allow-bridges` | No | — | Comma-separated bridge ids to whitelist |
| `--deny-bridges` | No | — | Comma-separated bridge ids to blacklist |

**Return shape**:

```json
{
  "fromTokenAmount": "1000000",
  "toTokenAmount": "999555",
  "minimumReceived": "999555",
  "router": {
    "bridgeId": 636,
    "bridgeName": "ACROSS V3",
    "crossChainFee": "444",
    "crossChainFeeTokenAddress": "0xaf88...",
    "estimateTime": "43",
    "needApprove": true,
    "needCancelApprove": false,
    "otherNativeFee": "0"
  },
  "tx": {
    "from": "0xaef7...",
    "to": "0xe35e9842fcEACA96570B734083f4a58e8F7C5f2A",
    "data": "0xad5425c6...",
    "value": "0",
    "gasLimit": "49500",
    "gasPrice": "50527197",
    "maxPriorityFeePerGas": "23524497"
  }
}
```

`/swap` returns the same `router` info as `/quote` plus a ready-to-sign `tx`. Useful when an external wallet handles signing and broadcasting.

> Do NOT call `gateway broadcast` directly with these calldata — that bypasses the agentic wallet's TEE signing. Use `cross-chain execute` for the full flow.

## 6. onchainos cross-chain execute

One-shot: quote → approve (if needed) → swap → sign & broadcast → fromTxHash. Three modes controlled by `--confirm-approve` / `--skip-approve`.

```bash
onchainos cross-chain execute \
  --from <address> --to <address> \
  --from-chain <chain> --to-chain <chain> \
  --readable-amount <amount> \
  --wallet <address> \
  [--slippage <s>] \
  [--receive-address <addr>] \
  [--bridge-id <id> | --route-index <n>] \
  [--sort <0|1|2>] \
  [--allow-bridges <ids>] [--deny-bridges <ids>] \
  [--mev-protection] \
  [--confirm-approve | --skip-approve] \
  [--force]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--from` / `--to` / `--from-chain` / `--to-chain` / `--readable-amount` / `--amount` | Yes / one of | — | Same as `quote` / `swap` |
| `--slippage` | No | `0.01` | Decimal slippage |
| `--wallet` | Yes | — | User wallet address |
| `--receive-address` | Optional (CLI) / always-pass (skill) | sender wallet | Destination receiver. The CLI does not enforce it; the server requires it for heterogeneous (EVM ⇌ non-EVM) bridges and returns 82202 when missing. **Skill rule:** always pass — default to `--wallet` for same-family pairs; collect a destination-format address from the user for heterogeneous pairs. When supplied, address family must match `--to-chain`. |
| `--bridge-id` | No | server picks | Pin a specific bridge id (openApiCode). Mutually exclusive with `--route-index`. |
| `--route-index` | No | 0 | Pick a route by zero-based index in `quote.routerList[]`. Mutually exclusive with `--bridge-id`. |
| `--sort` | No | server default (0=optimal) | 0=optimal, 1=fastest, 2=max output |
| `--allow-bridges` | No | — | Comma-separated bridge ids to whitelist |
| `--deny-bridges` | No | — | Comma-separated bridge ids to blacklist |
| `--mev-protection` | No | false | Enable MEV protection on the swap broadcast (EVM) |
| `--confirm-approve` | No | false | Execute approval (after user confirms). Mutually exclusive with `--skip-approve`. |
| `--skip-approve` | No | false | Skip allowance check, execute swap directly (after approval confirmed) |
| `--force` | No | false | Bypass backend risk warning 81362. Use only after explicit user confirmation. |

### Return: action=approve-required

Returned when allowance is insufficient (default mode, no `--confirm-approve` / `--skip-approve`).

| Field | Type | Description |
|---|---|---|
| `action` | String | `"approve-required"` |
| `tokenAddress` | String | Token contract to approve |
| `tokenSymbol` | String | Token symbol |
| `approveAmount` | String | Required raw amount |
| `readableAmount` | String | Required human-readable amount |
| `bridgeId` | Integer | Selected bridge id |
| `bridgeName` | String | Selected bridge name |
| `needCancelApprove` | Boolean | true=USDT pattern, must revoke first |
| `estimateTime` | String | Estimated seconds |
| `minimumReceived` | String | Destination minimum (raw) |
| `toTokenAmount` | String | Expected destination amount (raw) |
| `crossChainFee` | String | Bridge fee in source token raw units |

### Return: action=approved

Returned after approval broadcast (`--confirm-approve` mode).

| Field | Type | Description |
|---|---|---|
| `action` | String | `"approved"` |
| `approveTxHash` | String | Approval transaction hash |
| `tokenAddress` | String | Token contract approved |
| `tokenSymbol` | String | Token symbol |
| `approveAmount` | String | Approved raw amount |
| `readableAmount` | String | Approved human-readable amount |
| `bridgeId` | Integer | Selected bridge |
| `bridgeName` | String | Bridge name |
| `approveOrderId` | String? | Gas Station order id (only when GS used) |

### Return: action=execute

Returned on swap broadcast completion (default mode with sufficient allowance, or `--skip-approve`).

| Field | Type | Description |
|---|---|---|
| `action` | String | `"execute"` |
| `fromTxHash` | String | **Source chain transaction hash — use this to query status** |
| `approveTxHash` | String? | Approve tx hash (if approve happened in this run) |
| `selectedRoute` | String | Bridge name used |
| `bridgeId` | Integer | Bridge id used |
| `fromAmount` | String | Amount sent (raw) |
| `toAmount` | String | Expected destination amount (raw) |
| `minimumReceived` | String | Destination minimum (raw) |
| `estimateTime` | String | Estimated seconds |
| `crossChainFee` | String | Bridge fee in source token raw units |
| `swapOrderId` | String? | Gas Station order id (only when GS used) |

## 7. onchainos cross-chain status

Query cross-chain status by source chain transaction hash **or** order id.

```bash
onchainos cross-chain status \
  ( --tx-hash <hash> | --order-id <id> ) \
  --bridge-id <id> \
  --from-chain <chain>
```

| Param | Required | Description |
|---|---|---|
| `--tx-hash` | One of | Source chain transaction hash returned by `execute` (`fromTxHash`). Mutually exclusive with `--order-id`. |
| `--order-id` | One of | Order id returned by `execute` (`swapOrderId` / `approveOrderId`). The CLI resolves it to the underlying tx hash via `wallet /order/detail`. **Login required.** Mutually exclusive with `--tx-hash`. |
| `--bridge-id` | Yes | Bridge id used for the transfer (`bridgeId` from prior `execute` / `quote.routerList[]` / `bridges`). Server returns 50014 without it. |
| `--from-chain` | Yes | Source chain (name or chainIndex). Server returns 50014 (chainIndex) without it. |

**Return shape**:

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
| `status` | String | `SUCCESS` / `PENDING` / `NOT_FOUND` |
| `chainIndex` | String | Source chain id (echoed) |
| `txHash` | String | Source chain tx hash (echoed) |
| `toChainIndex` | String | Destination chain id (empty until `SUCCESS`) |
| `toTxHash` | String | Destination chain tx hash (empty until `SUCCESS`) |
| `toTokenAddress` | String | Destination token contract (empty until `SUCCESS`) |
| `toAmount` | String | Destination amount in raw units (empty until `SUCCESS`) |
| `bridgeId` | Integer | Bridge id used for this transfer |

**Status values**:

| `status` | Meaning | User Message |
|---|---|---|
| `SUCCESS` | Funds arrived on destination chain | Show `toAmount` + `toTxHash` |
| `PENDING` | Bridge has indexed source tx; waiting for destination delivery | Suggest checking again shortly |
| `NOT_FOUND` | Bridge has not yet indexed the tx (or src tx not confirmed yet) | First few seconds → expected; long persistence → check source explorer |

When `status != SUCCESS`, fields like `toChainIndex`, `toTxHash`, `toAmount` may be empty/zero. Only rely on them after `SUCCESS`.

## Input / Output Examples

**User says:** "Bridge 1 USDC from Arbitrum to Optimism"

```bash
# 1. Discover bridges (optional — execute can pick automatically)
onchainos cross-chain bridges
# -> [{bridgeId: 636, bridgeName: "ACROSS V3", supportedChains: [...]}, ...]

# 2. Quote with allowance check
onchainos cross-chain quote \
  --from usdc --to usdc \
  --from-chain arbitrum --to-chain optimism \
  --readable-amount 1 \
  --wallet 0xaef7... --check-approve
# -> routerList: [{bridgeId: 636, bridgeName: "ACROSS V3", needApprove: true, ...}]

# 3. Execute (default mode — let CLI decide)
onchainos cross-chain execute \
  --from usdc --to usdc \
  --from-chain arbitrum --to-chain optimism \
  --readable-amount 1 --wallet 0xaef7...
# -> action=approve-required (since needApprove=true)

# 4. Confirm approve
onchainos cross-chain execute \
  --from usdc --to usdc \
  --from-chain arbitrum --to-chain optimism \
  --readable-amount 1 --wallet 0xaef7... --confirm-approve
# -> action=approved, approveTxHash=0x...

# 5. Poll approval (in main conversation, bash loop):
#    Use --order-id when execute returned approveOrderId (pre-prod often returns
#    empty approveTxHash). Read txStatus from data[0].txStatus (data is an array).
#    Put `sleep 2` at the END of the loop so the first check fires immediately.
for i in $(seq 1 30); do
  out=$(onchainos wallet history --order-id <approveOrderId> --chain 42161)
  st=$(echo "$out" | python3 -c "import sys,json; d=json.load(sys.stdin); print((d.get('data') or [{}])[0].get('txStatus',''))")
  echo "Check #$i: status=${st:-pending}"
  case "$st" in
    SUCCESS) break;;
    FAIL|FAILED) break;;
  esac
  sleep 2
done

# 6. Skip approve, execute swap
onchainos cross-chain execute \
  --from usdc --to usdc \
  --from-chain arbitrum --to-chain optimism \
  --readable-amount 1 --wallet 0xaef7... --skip-approve
# -> action=execute, fromTxHash=0x..., selectedRoute=ACROSS V3, bridgeId=636

# 7. Poll status (in main conversation, exponential backoff):
onchainos cross-chain status --tx-hash 0x... --bridge-id 636 --from-chain 42161
# -> status=PENDING (early), eventually SUCCESS with toTxHash
```

**Manual calldata flow (external wallet):**

```bash
# 1. Quote
onchainos cross-chain quote --from usdc --to usdc --from-chain arbitrum --to-chain optimism --readable-amount 1
# -> pick bridgeId, e.g. 636

# 2. Approve calldata
onchainos cross-chain approve \
  --chain arbitrum --token usdc --wallet 0xaef7... \
  --bridge-id 636 --readable-amount 1
# -> tx: { to: 0xaf88..., data: 0x095ea7b3..., value: 0, gasLimit, gasPrice, maxPriorityFeePerGas }
# Sign + broadcast externally on Arbitrum

# 3. Swap calldata
onchainos cross-chain swap \
  --from usdc --to usdc --from-chain arbitrum --to-chain optimism \
  --readable-amount 1 --wallet 0xaef7... --bridge-id 636
# -> tx: { to: 0xe35e9842..., data: 0xad5425c6..., value: 0, gasLimit, gasPrice, ... }
# Sign + broadcast externally on Arbitrum

# 4. Status (using the swap broadcast hash; --bridge-id required by the server)
onchainos cross-chain status --tx-hash <swap_tx_hash> --bridge-id 636 --from-chain 42161
```

## Bridge ID Reference (sample)

`bridgeId` values are stable openApiCodes returned by `cross-chain bridges`. Common ones observed on pre-prod:

| bridgeId | bridgeName |
|---|---|
| 636 | ACROSS V3 |
| 639 | STARGATE V2 BUS MODE |
| (other) | run `cross-chain bridges` for the live list |

Do NOT hardcode bridgeId in skill prompts beyond debugging — always derive from `quote.routerList[]` or `bridges`.

## Cross-chain supported scope

Static hint only — a "Yes" means the chain is in cross-chain scope, NOT that a route exists for a given pair. Real availability is decided at runtime by `cross-chain bridges --from-chain <X> --to-chain <Y>` (SKILL.md Step 2.5).

| # | Chain | chainIndex | Cross-chain |
|---|---|---|---|
| 1 | XLayer | 196 | Yes |
| 2 | Solana | 501 | Yes |
| 3 | Polygon | 137 | Yes |
| 4 | Avalanche C | 43114 | Yes |
| 5 | Optimism | 10 | Yes |
| 6 | Blast | 81457 | Yes |
| 7 | Scroll | 534352 | Yes |
| 8 | Sonic | 146 | Yes |
| 9 | Ethereum | 1 | Yes |
| 10 | BNB Chain | 56 | Yes |
| 11 | Arbitrum One | 42161 | Yes |
| 12 | Base | 8453 | Yes |
| 13 | zkSync Era | 324 | Yes |
| 14 | Linea | 59144 | Yes |
| 15 | Fantom | 250 | No |
| 16 | Monad | 143 | No |
| 17 | Conflux | 1030 | No |
