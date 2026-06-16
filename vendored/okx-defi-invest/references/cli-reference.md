# OKX DeFi — CLI Command Reference

Detailed parameter tables, return field schemas, and usage examples for all 15 DeFi commands.

## 1. onchainos defi support-chains

Get all chains currently supported by DeFi products.

```bash
onchainos defi support-chains
```

No parameters.

**Return fields** (array):

| Field | Type | Description |
|---|---|---|
| `chainIndex` | String | Chain ID (e.g. `"1"` = Ethereum, `"56"` = BSC) |
| `network` | String | Network identifier (e.g. `"ETH"`, `"BSC"`, `"POLYGON"`) |

**Example output:**

```json
[
  {"chainIndex": "1", "network": "ETH"},
  {"chainIndex": "56", "network": "BSC"},
  {"chainIndex": "137", "network": "POLYGON"},
  {"chainIndex": "42161", "network": "ARBITRUM"},
  {"chainIndex": "8453", "network": "BASE"}
]
```

---

## 2. onchainos defi support-platforms

Get all DeFi platforms and their product counts.

```bash
onchainos defi support-platforms
```

No parameters.

**Return fields** (array):

| Field | Type | Description |
|---|---|---|
| `analysisPlatformId` | String | Platform ID (used in `--platform-id` for other commands) |
| `platformName` | String | Platform display name (e.g. `"Aave V3"`, `"Lido"`) |
| `investmentCount` | Integer | Number of products on this platform |

**Example output:**

```json
[
  {"analysisPlatformId": "10", "platformName": "Aave V3", "investmentCount": 68},
  {"analysisPlatformId": "20", "platformName": "Lido", "investmentCount": 1},
  {"analysisPlatformId": "30", "platformName": "PancakeSwap V3", "investmentCount": 120}
]
```

---

## 3. onchainos defi list

List all DeFi products by APY (no filters, paginated).

```bash
onchainos defi list [--page-num <n>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--page-num` | No | 1 | Page number (page size fixed at 20) |

> Internally calls the same API as `defi search` with no filters. Returns products sorted by APY descending.

**Return fields**: Same as `defi search` (see below).

---

## 4. onchainos defi search

Search DeFi products across chains (earn, pools, lending).

```bash
onchainos defi search --token <tokens> [--platform <names>] [--chain <chain>] [--product-group <group>] [--page-num <n>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--token` | No* | — | Comma-separated token keywords (e.g. `"USDC,ETH"`) |
| `--platform` | No* | — | Comma-separated platform keywords (e.g. `"Aave,Compound"`) |
| `--chain` | No | — | Chain name (e.g. `ethereum`, `bsc`, `solana`) |
| `--product-group` | No | `SINGLE_EARN` | Product group filter (see table below) |
| `--page-num` | No | 1 | Page number (page size fixed at 20) |

**`--product-group` values**:

| Value | Description |
|---|---|
| `SINGLE_EARN` | Single token earn (savings, staking, vaults) |
| `DEX_POOL` | DEX liquidity pools (V2/V3 LP) |
| `LENDING` | Lending protocols (supply & borrow) |

> \* At least one of `--token` or `--platform` is **required**. CLI will error if both are omitted.

**Return fields** (`data` object):

| Field | Type | Description |
|---|---|---|
| `total` | Integer | Total number of matching products |
| `list[].investmentId` | Long | Product ID — used in `detail`, `prepare`, `deposit` |
| `list[].name` | String | Product name |
| `list[].platformName` | String | Protocol name (e.g. `"Aave V3"`, `"Compound V3"`) |
| `list[].rate` | String | APY as decimal (e.g. `"0.01820"` = 1.82%) |
| `list[].tvl` | String | Total Value Locked in USD |
| `list[].chainIndex` | String | Chain identifier |
| `list[].feeRate` | String | Protocol fee rate (nullable) |
| `list[].detailPath` | String | Detail page path (nullable) |

---

## 5. onchainos defi detail

Get full product details and live APY.

```bash
onchainos defi detail --investment-id <id>
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--investment-id` | Yes | — | Investment ID from `defi search` results |

**Return fields** (per API doc):

| Field | Type | Description |
|---|---|---|
| `investmentId` | Long | Product ID |
| `investmentName` | String | Product name |
| `platformName` | String | Protocol name |
| `platformLogo` | String | Protocol logo URL |
| `investType` | Integer | Investment type (1=Save, 2=Pool, 3=Farm, 5=Stake, 6=Borrow, etc.) |
| `chainIndex` | String | Chain identifier |
| `network` | String | Network name (e.g. "Ethereum") |
| `rate` | String | APY as decimal (e.g. `"0.01820"` = 1.82%) |
| `tvl` | String | Total Value Locked in USD |
| `feeRate` | String | Protocol fee rate (DEX_POOL only) |
| `hasBonus` | Boolean | Whether bonus rewards are available |
| `isSupportClaim` | Boolean | Whether reward claim is supported |
| `isInvestable` | Boolean | Whether new investment is accepted |
| `isSupportRedeem` | Boolean | Whether redemption is supported |
| `analysisPlatformId` | Long | Platform ID for positions/claim |
| `subscriptionMethod` | Integer | Subscription method (DEX_POOL/LENDING only) |
| `redeemMethod` | Integer | Redeem method (DEX_POOL/LENDING only) |
| `detailPath` | String | Detail page path |
| `underlyingToken[]` | Array | Underlying asset tokens (InvestUnderlyingToken) |
| `underlyingToken[].tokenSymbol` | String | Token symbol (e.g. "USDC") |
| `underlyingToken[].tokenAddress` | String | Token contract address |
| `underlyingToken[].chainIndex` | Integer | Chain ID |
| `underlyingToken[].tokenPrecision` | Integer | Token decimals |
| `underlyingToken[].tokenLogo` | String | Token logo URL |
| `aboutToken[]` | Array | Related tokens with market data (InvestTokenWithMarketCap) |
| `aboutToken[].tokenSymbol` | String | Token symbol |
| `aboutToken[].tokenAddress` | String | Token contract address |
| `aboutToken[].chainIndex` | Integer | Chain ID |
| `aboutToken[].tokenPrecision` | Integer | Token decimals |
| `aboutToken[].tokenLogo` | String | Token logo URL |
| `aboutToken[].marketCap` | String | Market cap (aboutToken only) |
| `aboutToken[].price` | String | Price (aboutToken only) |
| `rateDetails[]` | Array | APY breakdown per token (tokenAddress, tokenSymbol, rate, title) |

---

## 6. onchainos defi prepare

Get pre-investment info: accepted tokens, V3 tick parameters.

```bash
onchainos defi prepare --investment-id <id>
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--investment-id` | Yes | — | Investment ID from `defi search` results |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `investWithTokenList[]` | List\<ApiInvestTokenWithAmount\> | Tokens accepted as input for deposit |
| `investWithTokenList[].tokenId` | String | NFT TokenId |
| `investWithTokenList[].tokenSymbol` | String | Token symbol |
| `investWithTokenList[].tokenName` | String | Token name |
| `investWithTokenList[].tokenAddress` | String | Token contract address (use in `--user-input`) |
| `investWithTokenList[].tokenPrecision` | String | Token decimals |
| `investWithTokenList[].chainIndex` | String | Chain ID (use in `--user-input`) |
| `investWithTokenList[].network` | String | Network name |
| `investWithTokenList[].coinAmount` | String | Current balance |
| `investWithTokenList[].currencyAmount` | String | USD value |
| | | **DEX_POOL specific fields:** |
| `feeRate` | String | Trading fee rate |
| `currentTick` | String | Current tick (corresponds to current price ratio) |
| `currentPrice` | String | Token0 current price ratio |
| `tickSpacing` | String | Tick spacing for this pool |
| `underlyingTokenList[]` | List\<ApiInvestUnderlyingToken\> | Underlying tokens (index0=token0, index1=token1) |
| `underlyingTokenList[].tokenId` | String | NFT Token ID (V3 position) |
| `underlyingTokenList[].tokenSymbol` | String | Token symbol |
| `underlyingTokenList[].tokenName` | String | Token name |
| `underlyingTokenList[].tokenLogo` | String | Token logo URL |
| `underlyingTokenList[].tokenAddress` | String | Token contract address |
| `underlyingTokenList[].network` | String | Network name |
| `underlyingTokenList[].chainIndex` | String | Chain ID |
| `underlyingTokenList[].tokenPrecision` | String | Token decimals |
| `underlyingTokenList[].isBaseToken` | Boolean | Whether it is native token (ETH, BNB, etc.) |

---

## 7. onchainos defi deposit

Generate calldata to enter a DeFi position (subscribe, add liquidity, borrow).

```bash
onchainos defi deposit \
  --investment-id <id> \
  --address <wallet> \
  --user-input '<json-array>' \
  [--slippage <pct>] \
  [--token-id <nft-id>] \
  [--tick-lower <tick>] \
  [--tick-upper <tick>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--investment-id` | Yes | — | Investment ID from `defi search` results |
| `--address` | Yes | — | User wallet address |
| `--user-input` | Yes | — | JSON array of input tokens: `'[{"tokenAddress":"0x...","chainIndex":"1","coinAmount":"50000","tokenPrecision":"6"}]'`. `coinAmount` MUST be minimal units (integer). `tokenPrecision` REQUIRED (from `defi prepare`). CLI converts to decimal internally. Decimal coinAmount or missing tokenPrecision will be rejected. |
| `--slippage` | No | `"0.01"` | Slippage tolerance (`"0.01"` = 1%, `"0.1"` = 10%) |
| `--token-id` | No | — | V3 Pool NFT tokenId (required for adding to existing V3 position) |
| `--tick-lower` | No | — | V3 Pool lower tick (required for new V3 position). **Use `=` for negative values**: `--tick-lower=-11` |
| `--tick-upper` | No | — | V3 Pool upper tick (required for new V3 position) |

> `--user-input` uses tokenAddress, chainIndex, and tokenPrecision from `defi prepare` response (`investWithTokenList`). AI computes `coinAmount` as minimal units: `userAmount × 10^tokenPrecision` (integer). CLI converts back to decimal before sending to API.

**Return fields** (`data.dataList` array — execute in order):

| Field | Type | Description |
|---|---|---|
| `dataList[]` | Array | Ordered list of transactions to execute |
| `dataList[].callDataType` | String | Operation type: `APPROVE`, `DEPOSIT`, `SWAP,DEPOSIT`, `WITHDRAW`, `WITHDRAW,SWAP` |
| `dataList[].from` | String | Sender address (user wallet) |
| `dataList[].to` | String | Target contract address |
| `dataList[].value` | String | Native token value (e.g. `"0x0"` for no native transfer) |
| `dataList[].serializedData` | String | Transaction data: EVM=hex (0x prefix), Solana=base58, Sui=base64 BCS |
| `dataList[].originalData` | String | ABI metadata JSON (EVM only) |
| `dataList[].signatureData` | String | Permit signature data (if applicable) |
| `dataList[].transactionPayload` | String | Transaction payload JSON (Aptos only) |
| `dataList[].gas` | String | Gas limit (non-EVM chains only) |

> **Important**: Execute `dataList` entries strictly in array order. If any step fails, stop — do not continue with remaining steps.
> **Aave borrow**: Returns `callDataType=WITHDRAW` — this is normal Aave internal semantics (borrow = withdraw from pool). Do not expose to user.
> **Aave repay**: Returns `callDataType=DEPOSIT` — this is normal Aave internal semantics (repay = deposit asset back to pool). Do not expose to user.

**`callDataType` enum values**:

| Value | Description |
|---|---|
| `APPROVE` | ERC-20 token approval (approve spender) |
| `DEPOSIT` | Deposit into protocol |
| `SWAP,DEPOSIT` | Swap then deposit (V3 Pool: single token into dual-token pool) |
| `WITHDRAW` | Withdraw from protocol |
| `WITHDRAW,SWAP` | Withdraw then swap back to target token (V3 Pool) |

**Chain-specific `serializedData` handling**:

| Chain | Encoding | Client processing |
|---|---|---|
| EVM (ETH/BSC/AVAX) | Hex (0x prefix) | Use as `tx.data` directly, `to` as target address |
| Solana | Base58 | bs58 decode → skip first 65 bytes (signature placeholder) → VersionedMessage.deserialize() → sign → broadcast within 60s (blockhash expires) |
| Sui | Base64 BCS | base64 decode → prepend intent [0,0,0] → blake2b-256 hash → Ed25519 sign → submit |
| Aptos | — | Use `transactionPayload` field (JSON), build tx via SDK `build.simple()` → sign → submit |

---

## 8. onchainos defi redeem

Generate calldata to exit a DeFi position (redeem, remove liquidity, repay).

```bash
onchainos defi redeem \
  --id <id> \
  --address <address> \
  [--chain <chain>] \
  [--ratio <ratio>] \
  [--token <token>] \
  [--symbol <symbol>] \
  [--amount <amount>] \
  [--precision <decimals>] \
  [--token-id <nft-id>] \
  [--user-input <json>] \
  [--slippage <pct>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--id` | Yes | — | Investment product ID |
| `--address` | Yes | — | User wallet address |
| `--chain` | No | — | Chain name (required for LP token input) |
| `--ratio` | No | — | Redemption ratio: `"1"` = 100%, `"0.5"` = 50%. Use `"1"` for **full exit** (100%); for partial exit use `--user-input` instead |
| `--token` | No | — | Receipt/LP token contract address (single-token shorthand) |
| `--symbol` | No | — | LP token symbol |
| `--amount` | No | — | LP token human-readable amount (use with `--token`) |
| `--precision` | No | — | LP token decimals (use with `--token`) |
| `--token-id` | No | — | V3 Pool NFT tokenId (required for V3 remove liquidity) |
| `--user-input` | No | — | Input tokens as JSON array — required for liquid staking exits (Jito/JitoSOL, Lido/stETH etc.) and other non-lending, non-V3 exits. Format: `'[{"tokenAddress":"<underlying token addr>","chainIndex":"<id>","coinAmount":"<amount to redeem>"}]'`. Takes precedence over `--token`/`--amount` |
| `--slippage` | No | `"0.01"` | Slippage tolerance (e.g. `"0.01"` = 1%, `"0.03"` = 3%) |

> **Always call `defi position-detail` before `defi redeem`** to get `investmentId` and underlying token info.
> **Full exit (100%)**: use `--ratio 1` — pass `--user-input` too if token info is available (preferred but not required).
> **Partial exit**: MUST pass `--user-input '[{"tokenAddress":"<underlying>","chainIndex":"<id>","coinAmount":"<amount>"}]'` with underlying token address and exact amount.
> **Repay (lending)**: always uses `--user-input` with exact repay amount — repay is never a "full exit" in the `--ratio 1` sense.
> **V3 Pool exits**: pass `--token-id` only — no `--user-input` or `--ratio`.

**Return fields**: Same structure as `defi deposit` (`dataList` array — see above).

Common `callDataType` patterns for redeem:

| Pattern | Scenario |
|---|---|
| `[WITHDRAW]` | Standard single-step redemption |
| `[APPROVE, WITHDRAW]` | aToken approval required before withdrawal |
| `[WITHDRAW, SWAP]` | V3 Pool: remove liquidity then swap back to target token |
| `[DEPOSIT]` | Aave repay (deposit asset back to pool — normal Aave behavior) |

---

## 9. onchainos defi claim

Generate calldata to claim DeFi rewards.

```bash
onchainos defi claim \
  --address <address> \
  [--chain <chain>] \
  --reward-type <type> \
  [--id <id>] \
  [--platform-id <id>] \
  [--token-id <nft-id>] \
  [--principal-index <index>] \
  [--expect-output <json>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | — | User wallet address |
| `--chain` | No | — | Chain name |
| `--reward-type` | Yes | — | Reward type (see table below) |
| `--id` | No | — | Investment product ID — required for `REWARD_INVESTMENT`, `REWARD_OKX_BONUS`, `REWARD_MERKLE_BONUS`, and `V3_FEE` |
| `--platform-id` | No | — | Protocol platform ID — required for `REWARD_PLATFORM`; also enables auto-fetch of `expectOutputList` for all reward types |
| `--token-id` | No | — | V3 Pool NFT tokenId — required for `V3_FEE` |
| `--principal-index` | No | — | Principal order index — required for `UNLOCKED_PRINCIPAL` |
| `--expect-output` | No | — | Expected output token list as JSON array `'[{"tokenAddress":"0x...","chainIndex":"1","coinAmount":"0.01"}]'`. **Pass directly if reward token info is available from `position-detail` → `rewardDefiTokenInfo` (preferred)**; auto-fetched via `--platform-id` as fallback |

**`--reward-type` values**:

| rewardType | Description | Required params |
|---|---|---|
| `REWARD_PLATFORM` | Protocol-level rewards (e.g. AAVE token from Aave safety module) | `--platform-id`; pass `--expect-output` directly if token info from `position-detail` available (preferred) |
| `REWARD_INVESTMENT` | Product mining / staking rewards | `--id` + `--platform-id`; pass `--expect-output` directly if token info from `position-detail` available (preferred) |
| `V3_FEE` | Uniswap V3 / PancakeSwap V3 trading fee collection | `--id` + `--token-id` (no `--expect-output` needed) |
| `REWARD_OKX_BONUS` | OKX platform bonus rewards | `--id` + `--platform-id`; pass `--expect-output` directly if token info from `position-detail` available (preferred) |
| `REWARD_MERKLE_BONUS` | Merkle proof-based bonus rewards (airdrop claims) | `--id` + `--platform-id`; pass `--expect-output` directly if token info from `position-detail` available (preferred) |
| `UNLOCKED_PRINCIPAL` | Unlocked principal after lock period expires | `--principal-index` (no `--expect-output` needed) |

**Return fields**: Same structure as `defi deposit` (`dataList` array with calldata).

---

## 10. onchainos defi calculate-entry

Calculate exact token amounts needed for V3 pool entry based on input token and amount. **Must be called after `defi prepare` for V3 pools.**

```bash
onchainos defi calculate-entry \
  --id <id> \
  --address <addr> \
  --input-token <token_addr> \
  --input-amount <amount> \
  --token-decimal <decimals> \
  [--tick-lower <n>] \
  [--tick-upper <n>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--id` | Yes | — | Investment ID from `defi search` results |
| `--address` | Yes | — | User wallet address |
| `--input-token` | Yes | — | Input token contract address |
| `--input-amount` | Yes | — | Input amount (human-readable, e.g. `"100"`) |
| `--token-decimal` | Yes | — | Token decimals (e.g. `"18"` for ETH, `"6"` for USDC) |
| `--tick-lower` | No | — | Lower tick for V3 position. **Use `=` for negative values**: `--tick-lower=-11` |
| `--tick-upper` | No | — | Upper tick for V3 position |

> User provides one token amount, API returns exact amounts for BOTH tokens. Use these amounts in `defi deposit --user-input`.

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `tokenList[]` | Array | Calculated token amounts for both pool tokens |
| `tokenList[].tokenAddress` | String | Token contract address |
| `tokenList[].tokenSymbol` | String | Token symbol |
| `tokenList[].coinAmount` | String | Exact amount needed (human-readable) |
| `tokenList[].chainIndex` | String | Chain ID |

---

## 11. onchainos defi positions

Get user DeFi holdings overview across protocols and chains.

```bash
onchainos defi positions --address <address> --chains <chains>
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | — | User wallet address |
| `--chains` | Yes | — | Comma-separated chain names (e.g. `"ethereum,bsc,solana"`) |

**Return fields** (per platform entry):

| Field | Type | Description |
|---|---|---|
| `analysisPlatformId` | String | Platform ID — used in `position-detail` and `claim --platform-id` |
| `platformName` | String | Protocol name (e.g. `"Aave V3"`) |
| `chainIndex` | String | Chain identifier |
| `totalValue` | String | Total position value in USD |
| `investedValue` | String | Originally invested value in USD |
| `profitValue` | String | Unrealized profit/loss in USD |
| `platformLogo` | String | Protocol logo URL |
| `investTypeList[]` | Array | Investment types active on this platform |
| `rewardDefiTokenInfo[]` | Array | Pending claimable rewards info |

---

## 12. onchainos defi position-detail

Get detailed DeFi holdings for a specific protocol.

```bash
onchainos defi position-detail \
  --address <address> \
  --chain <chain> \
  --platform-id <id>
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | — | User wallet address |
| `--chain` | Yes | — | Chain name |
| `--platform-id` | Yes | — | Protocol platform ID (`analysisPlatformId` from `positions` output) |

**Return fields** (per position entry):

| Field | Type | Description |
|---|---|---|
| `investmentId` | String | Product ID — used in `redeem`, `claim` |
| `investmentName` | String | Product name |
| `investType` | String | Position type (see investType reference below) |
| `coinAmount` | String | Current redeemable balance in token units |
| `coinUsdValue` | String | Current position value in USD |
| `tokenAddress` | String | Receipt/LP token address |
| `tokenSymbol` | String | Receipt/LP token symbol |
| `apy` | String | Current APY |
| `earnedTokenList[]` | Array | Pending reward tokens and amounts |
| `tokenId` | String | V3 Pool NFT tokenId (if applicable — use in `redeem --token-id`) |
| `tickLower` | String | V3 Pool lower tick (if applicable) |
| `tickUpper` | String | V3 Pool upper tick (if applicable) |
| `healthRate` | String | Lending health rate (LENDING type only) |

**investType values**:

| Value | Description |
|---|---|
| `1` | Save (savings / yield) |
| `2` | Pool (liquidity pool) |
| `3` | Farm (yield farming) |
| `4` | Vaults |
| `5` | Stake |
| `6` | Borrow |
| `7` | Staking |
| `8` | Locked |
| `9` | Deposit |
| `10` | Vesting |

---

## 13. onchainos defi rate-chart

Get historical APY chart data for a DeFi product.

```bash
onchainos defi rate-chart --investment-id <id> [--time-range <range>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--investment-id` | Yes | — | Investment ID from `defi search` results |
| `--time-range` | No | `WEEK` | Time range: `DAY` (V3 Pool only), `WEEK`, `MONTH`, `SEASON` (3 months), `YEAR` |

**Return fields** (array):

| Field | Type | Description |
|---|---|---|
| `timestamp` | String | Timestamp in milliseconds |
| `rate` | String | APY (base rate + mining rewards) |
| `bonusRate` | String | Extra reward APY (OKX Bonus / Merkl etc.) |
| `limitValue` | Integer | Extreme value marker: `1` = peak, `-1` = trough, `null` = normal |
| `totalReward` | String | Total fee + bonus reward for this period |

**Example:**

```bash
onchainos defi rate-chart --investment-id 9502 --time-range MONTH
```

```json
[
  {"timestamp": "1741737600000", "rate": "0.0312", "bonusRate": "0.0045", "limitValue": 1, "totalReward": "0.0357"},
  {"timestamp": "1741651200000", "rate": "0.0298", "bonusRate": "0.0045", "limitValue": null, "totalReward": "0.0343"}
]
```

---

## 14. onchainos defi tvl-chart

Get historical TVL chart data for a DeFi product.

```bash
onchainos defi tvl-chart --investment-id <id> [--time-range <range>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--investment-id` | Yes | — | Investment ID from `defi search` results |
| `--time-range` | No | `WEEK` | Time range: `DAY` (V3 Pool only), `WEEK`, `MONTH`, `SEASON` (3 months), `YEAR` |

**Return fields** (`data` object):

| Field | Type | Description |
|---|---|---|
| `chartVos[]` | Array | TVL data points |
| `chartVos[].timestamp` | String | Timestamp in milliseconds |
| `chartVos[].tvl` | String | TVL value in USD |
| `chartVos[].limitValue` | Integer | Extreme value marker: `1` = peak, `-1` = trough, `null` = normal |
| `text` | String | Chart description text (may be null) |

**Example:**

```bash
onchainos defi tvl-chart --investment-id 124 --time-range YEAR
```

```json
{
  "chartVos": [
    {"timestamp": "1741737600000", "tvl": "523847291.45", "limitValue": 1},
    {"timestamp": "1741651200000", "tvl": "498312044.78", "limitValue": null},
    {"timestamp": "1741564800000", "tvl": "480125367.22", "limitValue": -1}
  ],
  "text": null
}
```

---

## 15. onchainos defi depth-price-chart

Get V3 Pool liquidity depth distribution or price history chart. **V3 Pool only.**

```bash
onchainos defi depth-price-chart --investment-id <id> [--chart-type <type>] [--time-range <range>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--investment-id` | Yes | — | Investment ID (must be a V3 Pool product) |
| `--chart-type` | No | `DEPTH` | Chart type: `DEPTH` (liquidity per tick) or `PRICE` (historical token0/token1 prices) |
| `--time-range` | No | `DAY` | Time range, **only for PRICE mode**: `DAY` (default), `WEEK`. Ignored in DEPTH mode |

**Return fields — DEPTH mode** (array):

| Field | Type | Description |
|---|---|---|
| `tick` | Integer | Tick index |
| `liquidity` | String | Total liquidity at this tick |
| `liquidityNet` | String | Net liquidity change at this tick |
| `token0Price` | String | Token0 price at this tick |
| `token1Price` | String | Token1 price at this tick |

**Return fields — PRICE mode** (array):

| Field | Type | Description |
|---|---|---|
| `token0Price` | String | Historical token0 price |
| `token1Price` | String | Historical token1 price |
| `timestamp` | Long | Timestamp in milliseconds |

> **Note**: `--time-range` is only used in PRICE mode. DEPTH mode always returns the current liquidity snapshot — passing `--time-range` has no effect.

**Examples:**

```bash
# Depth chart — see liquidity concentration to pick tick range (no time-range needed)
onchainos defi depth-price-chart --investment-id 1589649169

# Price history — see token0/token1 relative price over past week
onchainos defi depth-price-chart --investment-id 1589649169 --chart-type PRICE --time-range WEEK
```

Depth response:
```json
[
  {"tick": -32932, "liquidity": "1234567890123456", "liquidityNet": "500000000000000", "token0Price": "0.9985", "token1Price": "1.0015"},
  {"tick": -32931, "liquidity": "1234567890123456", "liquidityNet": "0", "token0Price": "0.9986", "token1Price": "1.0014"}
]
```

Price response:
```json
[
  {"token0Price": "0.9985", "token1Price": "1.0015", "timestamp": 1741737600000},
  {"token0Price": "0.9990", "token1Price": "1.0010", "timestamp": 1741651200000}
]
```

---

## Input / Output Examples

### List top yield products

```bash
# List all products by APY (no filters)
onchainos defi list
# → Returns top 20 products sorted by APY descending

# Page 2
onchainos defi list --page-num 2
```

### Find top USDC yield on Ethereum

```bash
# 1. Search products
onchainos defi search --token USDC --chain ethereum --product-group SINGLE_EARN
# → Returns list with investmentId, rate, tvl per product

# 2. Get details for top result (e.g. investmentId=9502)
onchainos defi detail --investment-id 9502
# → rate: "0.01820", tvl: "3.6B", isInvestable: true

# 3. Get accepted tokens
onchainos defi prepare --investment-id 9502
# → investWithTokenList: [{tokenAddress: "0xa0b8...", chainIndex: "1", tokenPrecision: "6"}]

# 4. Build deposit calldata (use tokenAddress + chainIndex from prepare, fill coinAmount)
onchainos defi deposit \
  --investment-id 9502 \
  --address 0xYourWallet \
  --user-input '[{"tokenAddress":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","chainIndex":"1","coinAmount":"100"}]'
# → dataList: [{callDataType: "DEPOSIT", from: "0x...", to: "0x...", serializedData: "0x..."}]
# → sign serializedData → broadcast via okx-onchain-gateway
```

### V3 Pool entry with calculate-entry

```bash
# 1. Search V3 pool
onchainos defi search --token USDT --platform PancakeSwap --chain bsc --product-group DEX_POOL

# 2. Prepare (get ticks, token info)
onchainos defi prepare --investment-id <id>
# → currentTick, tickSpacing, underlyingTokenList

# 3. Calculate exact amounts for both tokens
onchainos defi calculate-entry \
  --id <id> \
  --address 0xYourWallet \
  --input-token 0xTokenAddress \
  --input-amount 100 \
  --token-decimal 18 \
  --tick-lower=-32150 \
  --tick-upper=-31350
# → tokenList: [{tokenAddress: "0xA...", coinAmount: "100"}, {tokenAddress: "0xB...", coinAmount: "52.3"}]

# 4. Deposit using calculated amounts
onchainos defi deposit \
  --investment-id <id> \
  --address 0xYourWallet \
  --user-input '[{"tokenAddress":"0xA...","chainIndex":"56","coinAmount":"100"},{"tokenAddress":"0xB...","chainIndex":"56","coinAmount":"52.3"}]' \
  --tick-lower=-32150 \
  --tick-upper=-31350
```

### Redeem full position from Aave

```bash
# 1. Check positions
onchainos defi positions --address 0xYourWallet --chains ethereum
# → analysisPlatformId: "44" for Aave

# 2. Get position detail
onchainos defi position-detail \
  --address 0xYourWallet \
  --chain ethereum \
  --platform-id 44
# → investmentId: "9502", coinAmount: "100.23" USDC

# 3. Redeem (use --user-input with underlying token address and amount)
onchainos defi redeem \
  --id 9502 \
  --chain ethereum \
  --address 0xYourWallet \
  --ratio 1 \
  --user-input '[{"tokenAddress":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","chainIndex":"1","coinAmount":"100.23"}]'
# → dataList: [{callDataType: "WITHDRAW", ...}]
# → sign → broadcast
```

### Claim rewards (REWARD_INVESTMENT — pass --expect-output directly)

```bash
# 1. Get position detail first (MUST)
onchainos defi position-detail \
  --address 0xYourWallet \
  --chain ethereum \
  --platform-id 44
# → investmentId: "9502", rewardDefiTokenInfo: [{tokenAddress: "0x7Fc...", chainIndex: "1", coinAmount: "0.0169"}]

# 2. Claim — pass --expect-output directly using rewardDefiTokenInfo (preferred over auto-fetch)
onchainos defi claim \
  --address 0xYourWallet \
  --chain ethereum \
  --reward-type REWARD_INVESTMENT \
  --id 9502 \
  --platform-id 44 \
  --expect-output '[{"tokenAddress":"0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9","chainIndex":"1","coinAmount":"0.0169"}]'
```

### Claim V3 trading fees

```bash
# Get tokenId from position-detail first
onchainos defi position-detail \
  --address 0xYourWallet \
  --chain ethereum \
  --platform-id 55
# → tokenId: "99999", investmentId: "67890"

# Claim V3 fees (no --expect-output needed for V3_FEE)
onchainos defi claim \
  --address 0xYourWallet \
  --chain ethereum \
  --reward-type V3_FEE \
  --id 67890 \
  --token-id 99999
```

### Check holdings across multiple chains

```bash
onchainos defi positions \
  --address 0xYourWallet \
  --chains ethereum,bsc,avalanche,solana
# → Returns platform list per chain with totalValue, analysisPlatformId
```
