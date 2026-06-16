# Onchain OS DEX Token — CLI Command Reference

Detailed parameter tables, return field schemas, and usage examples for all 13 token commands.

## 1. onchainos token search

Search for tokens by name, symbol, or contract address.

```bash
onchainos token search --query <query> [--chains <chains>] [--limit <n>] [--cursor <cursor>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--query` | Yes | - | Keyword: token name, symbol, or contract address |
| `--chains` | No | `"1,501"` | Chain names or IDs, comma-separated (e.g., `"ethereum,solana"` or `"196,501"`) |
| `--limit` | No | `20` | Number of results per page (max 100) |
| `--cursor` | No | - | Pagination cursor — pass the `cursor` field from the last item of the previous response to get the next page |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `tokenContractAddress` | String | Token contract address |
| `tokenSymbol` | String | Token symbol (e.g., `"ETH"`) |
| `tokenName` | String | Token full name |
| `tokenLogoUrl` | String | Token logo image URL |
| `chainIndex` | String | Chain identifier |
| `decimal` | String | Token decimals (e.g., `"18"`) |
| `price` | String | Current price in USD |
| `change` | String | 24-hour price change percentage |
| `marketCap` | String | Market capitalization in USD |
| `liquidity` | String | Liquidity in USD |
| `holders` | String | Number of token holders |
| `explorerUrl` | String | Block explorer URL for the token |
| `tagList.communityRecognized` | Boolean | `true` = listed on Top 10 CEX or community verified |
| `cursor` | String | Per-item pagination cursor — pass the `cursor` of the **last item** as the next request's `--cursor` to fetch the next page |

## 2. onchainos token info

Get token basic info (name, symbol, decimals, logo).

```bash
onchainos token info --address <address> [--chain <chain>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Token contract address |
| `--chain` | No | `ethereum` | Chain name |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `tokenName` | String | Token full name |
| `tokenSymbol` | String | Token symbol (e.g., `"ETH"`) |
| `tokenLogoUrl` | String | Token logo image URL |
| `decimal` | String | Token decimals (e.g., `"18"`) |
| `tokenContractAddress` | String | Token contract address |
| `tagList.communityRecognized` | Boolean | `true` = listed on Top 10 CEX or community verified |

## 3. onchainos token price-info

Get detailed price info including market cap, liquidity, volume, and multi-timeframe price changes.

```bash
onchainos token price-info --address <address> [--chain <chain>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Token contract address |
| `--chain` | No | `ethereum` | Chain name |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `price` | String | Current price in USD |
| `time` | String | Timestamp (Unix milliseconds) |
| `marketCap` | String | Market capitalization in USD |
| `liquidity` | String | Total liquidity in USD |
| `circSupply` | String | Circulating supply |
| `holders` | String | Number of token holders |
| `tradeNum` | String | 24-hour trade count |
| `priceChange5M` | String | Price change percentage — last 5 minutes |
| `priceChange1H` | String | Price change percentage — last 1 hour |
| `priceChange4H` | String | Price change percentage — last 4 hours |
| `priceChange24H` | String | Price change percentage — last 24 hours |
| `volume5M` | String | Trading volume (USD) — last 5 minutes |
| `volume1H` | String | Trading volume (USD) — last 1 hour |
| `volume4H` | String | Trading volume (USD) — last 4 hours |
| `volume24H` | String | Trading volume (USD) — last 24 hours |
| `txs5M` | String | Transaction count — last 5 minutes |
| `txs1H` | String | Transaction count — last 1 hour |
| `txs4H` | String | Transaction count — last 4 hours |
| `txs24H` | String | Transaction count — last 24 hours |
| `maxPrice` | String | 24-hour highest price |
| `minPrice` | String | 24-hour lowest price |

## 4. onchainos token holders

Get token holder distribution (top 100), with optional tag filter.

```bash
onchainos token holders --address <address> [--chain <chain>] [--tag-filter <n>] [--limit <n>] [--cursor <cursor>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Token contract address |
| `--chain` | No | `ethereum` | Chain name |
| `--tag-filter` | No | - | Filter by holder tag: 1=KOL, 2=Developer, 3=Smart Money, 4=Whale, 5=Fresh Wallet, 6=Insider, 7=Sniper, 8=Suspicious Phishing, 9=Bundler |
| `--limit` | No | `20` | Number of results per page (max 100) |
| `--cursor` | No | - | Pagination cursor — pass the `cursor` field from the last item of the previous response to get the next page |

**Return fields** (top 100 holders):

| Field | Type | Description |
|---|---|---|
| `holderWalletAddress` | String | Holder wallet address |
| `holdAmount` | String | Token amount held |
| `holdPercent` | String | Percentage of total supply held |
| `nativeTokenBalance` | String | Native token (mainnet) balance |
| `boughtAmount` | String | Total buy quantity |
| `avgBuyPrice` | String | Average buy price (USD) |
| `totalSellAmount` | String | Total sell quantity |
| `avgSellPrice` | String | Average sell price (USD) |
| `totalPnlUsd` | String | Total PnL (USD) |
| `realizedPnlUsd` | String | Realized PnL (USD) |
| `unrealizedPnlUsd` | String | Unrealized PnL (USD) |
| `fundingSource` | String | Source of funding for the wallet |

## 5. onchainos token liquidity

Get top 5 liquidity pools for a token.

```bash
onchainos token liquidity --address <address> [--chain <chain>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Token contract address |
| `--chain` | No | `ethereum` | Chain name (e.g., `ethereum`, `base`, `bsc`) |

**Return fields** (array of pool objects):

| Field | Type | Description |
|---|---|---|
| `pool` | String | Pool name (e.g., `"Punch/SOL"`) |
| `protocolName` | String | Protocol name |
| `liquidityUsd` | String | Liquidity value in USD |
| `liquidityAmount` | Array | Liquidity amounts |
| `liquidityAmount[].tokenAmount` | String | Token amount in the liquidity pool |
| `liquidityAmount[].tokenSymbol` | String | Token symbol in the liquidity pool |
| `liquidityProviderFeePercent` | String | Liquidity provider fee percentage |
| `poolAddress` | String | Pool contract address |
| `poolCreator` | String | Pool creator address |

## 6. onchainos token hot-tokens

Get hot token list ranked by trending score or X/Twitter mentions (max 100 results).

```bash
onchainos token hot-tokens [--ranking-type <type>] [--chain <chain>] [--rank-by <field>] [--time-frame <frame>] [--limit <n>] [--cursor <cursor>] [options]
```

**Core parameters**:

| Param | Required | Default | Description |
|---|---|---|---|
| `--ranking-type` | Yes | `"4"` | `4`=Trending (token score), `5`=Xmentioned (Twitter mentions) |
| `--chain` | No | all chains | Chain name (e.g., `solana`, `ethereum`). Omit for all chains |
| `--rank-by` | No | - | Sort field: `1`=price, `2`=price change, `3`=txs, `4`=unique traders, `5`=volume, `6`=market cap, `7`=liquidity, `8`=created time, `9`=OKX search count, `10`=holders, `11`=mention count, `12`=social score, `14`=net inflow, `15`=token score |
| `--time-frame` | No | - | Window: `1`=5min, `2`=1h, `3`=4h, `4`=24h |
| `--limit` | No | `20` | Number of results per page (max 100) |
| `--cursor` | No | - | Pagination cursor — pass the `cursor` field from the last item of the previous response to get the next page |

**Filter parameters** (all optional):

| Param | Description |
|---|---|
| `--risk-filter` | Hide risky tokens (`true`/`false`, default: `true`) |
| `--stable-token-filter` | Filter stable coins (`true`/`false`, default: `true`) |
| `--project-id` | Protocol ID filter, comma-separated (e.g., `120596` for Pump.fun) |
| `--price-change-min` / `--price-change-max` | Price change % range (supports negative values, e.g., `--price-change-min -5`) |
| `--volume-min` / `--volume-max` | Volume range in USD |
| `--market-cap-min` / `--market-cap-max` | Market cap range in USD |
| `--liquidity-min` / `--liquidity-max` | Liquidity range in USD |
| `--transaction-min` / `--transaction-max` | Trade amount (tradeAmount) range |
| `--txs-min` / `--txs-max` | Transaction count (txs) range |
| `--unique-trader-min` / `--unique-trader-max` | Unique trader count range |
| `--holders-min` / `--holders-max` | Holder count range |
| `--inflow-min` / `--inflow-max` | Net inflow USD range |
| `--fdv-min` / `--fdv-max` | Fully diluted valuation range in USD |
| `--mentioned-count-min` / `--mentioned-count-max` | Mention count range (for Xmentioned ranking) |
| `--social-score-min` / `--social-score-max` | Social score range |
| `--top10-hold-percent-min` / `--top10-hold-percent-max` | Top-10 holder % range |
| `--dev-hold-percent-min` / `--dev-hold-percent-max` | Dev holding % range |
| `--bundle-hold-percent-min` / `--bundle-hold-percent-max` | Bundle holding % range |
| `--suspicious-hold-percent-min` / `--suspicious-hold-percent-max` | Suspicious holding % range |
| `--is-lp-burnt` | LP burned filter (`true`/`false`) |
| `--is-mint` | Mintable filter (`true`/`false`) |
| `--is-freeze` | Freeze filter (`true`/`false`) |

**Return fields** (array of token objects):

| Field | Type | Description |
|---|---|---|
| `chainIndex` | String | Chain identifier |
| `tokenSymbol` | String | Token symbol |
| `tokenLogoUrl` | String | Token logo image URL |
| `tokenContractAddress` | String | Token contract address |
| `marketCap` | String | Market capitalization in USD |
| `volume` | String | Trading volume in USD |
| `firstTradeTime` | String | First trade timestamp (Unix ms) |
| `change` | String | Price change percentage (for selected time frame) |
| `liquidity` | String | Total liquidity in USD |
| `price` | String | Current price in USD |
| `holders` | String | Number of token holders |
| `uniqueTraders` | String | Number of unique traders |
| `txsBuy` | String | Buy transaction count |
| `txsSell` | String | Sell transaction count |
| `txs` | String | Total transaction count |
| `inflowUsd` | String | Net inflow in USD |
| `riskLevelControl` | String | Risk control level |
| `devHoldPercent` | String | Developer holding percentage |
| `top10HoldPercent` | String | Top-10 holders combined percentage |
| `insiderHoldPercent` | String | Insider holding percentage |
| `bundleHoldPercent` | String | Bundle holding percentage |
| `vibeScore` | String | Vibe score |
| `mentionsCount` | String | X/Twitter mention count |

## 7. onchainos token advanced-info

Get advanced token info including risk level, creator details, dev stats, and holder concentration.

```bash
onchainos token advanced-info --address <address> [--chain <chain>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Token contract address |
| `--chain` | No | `ethereum` | Chain name |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `riskControlLevel` | String | Risk control level: `0`=Undefined, `1`=Low Risk, `2`=Medium Risk, `3`=Medium-High Risk, `4`=High Risk, `5`=High Risk (manual) |
| `totalFee` | String | Total fee collected |
| `lpBurnedPercent` | String | Percentage of LP tokens burned |
| `isInternal` | Boolean | Whether the token is internal |
| `protocolId` | String | Protocol identifier |
| `progress` | String | Token progress (e.g., bonding curve %) |
| `tokenTags` | Array\<String\> | Active tag labels for the token. Possible values: `honeypot`, `dexBoost`, `lowLiquidity`, `communityRecognized`, `devHoldingStatusSell`, `devHoldingStatusSellAll`, `devHoldingStatusBuy`, `initialHighLiquidity`, `smartMoneyBuy`, `devAddLiquidity`, `devBurnToken`, `volumeChangeRateHoldersPlunge`, `holdersChangeRateHoldersSurge`, `dexScreenerTokenCommunityTakeOver`, `dexScreenerPaid` |
| `createTime` | String | Token creation timestamp |
| `creatorAddress` | String | Creator wallet address |
| `devRugPullTokenCount` | String | Number of tokens by dev that were rug pulls |
| `devCreateTokenCount` | String | Total tokens created by dev |
| `devLaunchedTokenCount` | String | Number of tokens by dev that launched |
| `top10HoldPercent` | String | Top 10 holders combined percentage |
| `devHoldingPercent` | String | Developer holding percentage |
| `bundleHoldingPercent` | String | Bundle holding percentage |
| `suspiciousHoldingPercent` | String | Suspicious holding percentage |
| `sniperHoldingPercent` | String | Sniper holding percentage |
| `snipersClearAddressCount` | String | Number of sniper addresses that cleared |
| `snipersTotal` | String | Total sniper count |

## 8. onchainos token top-trader

Get top traders (profit addresses) for a token.

```bash
onchainos token top-trader --address <address> [--chain <chain>] [--tag-filter <n>] [--limit <n>] [--cursor <cursor>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Token contract address |
| `--chain` | No | `ethereum` | Chain name |
| `--tag-filter` | No | - | Filter by trader tag: 1=KOL, 2=Developer, 3=Smart Money, 4=Whale, 5=Fresh Wallet, 6=Insider, 7=Sniper, 8=Suspicious Phishing, 9=Bundler |
| `--limit` | No | `20` | Number of results per page (max 100) |
| `--cursor` | No | - | Pagination cursor — pass the `cursor` field from the last item of the previous response to get the next page |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `holderWalletAddress` | String | Trader wallet address |
| `holdAmount` | String | Token amount held |
| `holdPercent` | String | Percentage of total supply held |
| `nativeTokenBalance` | String | Native token balance |
| `boughtAmount` | String | Total amount bought |
| `avgBuyPrice` | String | Average buy price (USD) |
| `soldAmount` | String | Total amount sold |
| `avgSellPrice` | String | Average sell price (USD) |
| `totalPnlUsd` | String | Total PnL (USD) |
| `realizedPnlUsd` | String | Realized PnL (USD) |
| `unrealizedPnlUsd` | String | Unrealized PnL (USD) |
| `fundingSource` | String | Funding source of the wallet |

## 9. onchainos token trades

Get token DEX trade history with optional tag and wallet address filters.

```bash
onchainos token trades --address <address> [--chain <chain>] [--limit <n>] [--tag-filter <n>] [--wallet-filter <addrs>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Token contract address |
| `--chain` | No | `ethereum` | Chain name |
| `--limit` | No | `100` | Number of trades (max 500) |
| `--tag-filter` | No | - | Filter by trader tag: `1`=KOL, `2`=Developer, `3`=Smart Money, `4`=Whale, `5`=Fresh Wallet, `6`=Insider, `7`=Sniper, `8`=Suspicious Phishing, `9`=Bundler |
| `--wallet-filter` | No | - | Wallet address filter, comma-separated (max 10 addresses) |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `id` | String | Trade ID |
| `type` | String | Trade direction: `buy` or `sell` |
| `price` | String | Trade price in USD |
| `volume` | String | Trade volume in USD |
| `time` | String | Trade timestamp (Unix milliseconds) |
| `dexName` | String | DEX name where trade occurred |
| `txHashUrl` | String | Transaction hash explorer URL |
| `userAddress` | String | Wallet address of the trader |
| `isFiltered` | String | `"1"` if this trade matched the tag/wallet filter, `"0"` otherwise |
| `poolLogoUrl` | String | Pool logo URL |
| `changedTokenInfo` | Array | Token change details for the trade |
| `changedTokenInfo[].tokenSymbol` | String | Token symbol |
| `changedTokenInfo[].tokenAddress` | String | Token contract address |
| `changedTokenInfo[].tokenLogoUrl` | String | Token logo URL |
| `changedTokenInfo[].amount` | String | Token amount changed |

## Input / Output Examples

**User says:** "Search for xETH token on XLayer"

```bash
onchainos token search --query xETH --chains xlayer
# -> Display:
#   xETH (0xe7b0...) - XLayer
#   Price: $X,XXX.XX | 24h: +X% | Market Cap: $XXM | Liquidity: $XXM
#   Community Recognized: Yes
```

**User says:** "What's trending on Solana by volume?"

```bash
onchainos token hot-tokens --chain solana --rank-by 5 --time-frame 4
# -> Display top tokens sorted by 24h volume:
#   #1 SOL  - Vol: $1.2B | Change: +3.5% | MC: $80B
#   #2 BONK - Vol: $450M | Change: +12.8% | MC: $1.5B
#   ...
```

**User says:** "Who are the top holders of this token?"

```bash
onchainos token holders --address 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee --chain xlayer
# -> Display top 100 holders with amounts and addresses
```

---

## 10. onchainos token cluster-overview

Get token holder cluster concentration overview — cluster level, rug pull probability, new address ratio, same-fund-source ratio, and same-creation-time ratio.

```bash
onchainos token cluster-overview --address <address> [--chain <chain>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Token contract address |
| `--chain` | No | `ethereum` | Chain name (e.g., `solana`, `ethereum`) |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `clusterConcentration` | String | Cluster concentration level: `Low`, `Medium`, or `High` |
| `top100HoldingsPercent` | String | % of token supply held by top 100 addresses |
| `rugPullPercent` | String | Rug pull probability % |
| `holderNewAddressPercent` | String | % of top 1,000 holders created in the last 3 days |
| `holderSameFundSourcePercent` | String | % of top 1,000 holders with mutual mainstream token transfer activity |
| `holderSameCreationTimePercent` | String | % of top 1,000 holders created at around the same time |

**Examples**:

```bash
# Cluster concentration overview for a Solana token
onchainos token cluster-overview --address EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v --chain solana

# EVM token cluster overview
onchainos token cluster-overview --address 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 --chain ethereum
```

---

## 11. onchainos token cluster-top-holders

Get overview statistics for the top 10, 50, or 100 holders of a token — including average holding period, average PnL, average cost price, and trend direction.

```bash
onchainos token cluster-top-holders --address <address> --range-filter <1|2|3> [--chain <chain>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Token contract address |
| `--range-filter` | Yes | - | Holder rank tier: `1` = top 10, `2` = top 50, `3` = top 100 |
| `--chain` | No | `ethereum` | Chain name |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `holdingAmount` | String | Sum of all tokens held by top N addresses (excludes blackhole and LP addresses) |
| `holdingPercent` | String | % of token supply held by top N addresses |
| `clusterTrendType` | Array\<String\> | Overall position direction; possible values: `buy`, `sell`, `neutral`, `transfer`, `transferIn`. May be absent if no trend data. |
| `averageHoldingPeriod` | String | Weighted average holding time across the top N holders |
| `averagePnlUsd` | String | Weighted average profit/loss of top N holders (USD) |
| `averageBuyPriceUsd` | String | Weighted average cost price for the top N holders (USD) |
| `averageBuyPricePercent` | String | % difference between avg cost price and current token price |
| `averageSellPriceUsd` | String | Weighted average selling price for the top N holders (USD) |
| `averageSellPricePercent` | String | % difference between avg selling price and current token price |

**Examples**:

```bash
# Top 100 holder behavior on Solana
onchainos token cluster-top-holders --address EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v --chain solana --range-filter 3

# Top 10 holder behavior on Ethereum
onchainos token cluster-top-holders --address 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 --chain ethereum --range-filter 1
```

---

## 12. onchainos token cluster-list

Get holder cluster list — groups of top 300 holders organized into clusters, with per-cluster holding stats and individual address details.

```bash
onchainos token cluster-list --address <address> [--chain <chain>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Token contract address |
| `--chain` | No | `ethereum` | Chain name |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `clusterList` | Array | List of holder clusters (top 100 clusters of the top 300 holders) |
| `clusterList[].holdingAmount` | String | Sum of all tokens held by cluster addresses (excludes blackhole and LP) |
| `clusterList[].holdingValueUsd` | String | USD value of all tokens held by cluster addresses |
| `clusterList[].holdingPercent` | String | % of token supply held by cluster addresses |
| `clusterList[].trendType` | Object | Overall position direction; nested `trendType` field: `buy`, `sell`, `neutral`, or `transfer` |
| `clusterList[].averageHoldingPeriod` | String | Weighted average holding time of cluster holders |
| `clusterList[].pnlUsd` | String | Total profit/loss of cluster holders (USD) |
| `clusterList[].pnlPercent` | String | Total profit/loss percentage of cluster holders |
| `clusterList[].buyVolume` | String | Total bought volume of the cluster (USD) |
| `clusterList[].averageBuyPriceUsd` | String | Weighted average cost price of cluster holders |
| `clusterList[].sellVolume` | String | Total sold volume of the cluster (USD) |
| `clusterList[].averageSellPriceUsd` | String | Weighted average selling price of cluster holders |
| `clusterList[].lastActiveTimestamp` | String | Last active time (Unix milliseconds) |
| `clusterList[].clusterAddressList` | Array | List of cluster holder addresses |
| `clusterList[].clusterAddressList[].address` | String | Wallet address |
| `clusterList[].clusterAddressList[].holdingAmount` | String | Tokens held by this address |
| `clusterList[].clusterAddressList[].holdingValueUsd` | String | USD value held by this address |
| `clusterList[].clusterAddressList[].holdingPercent` | String | % of supply held by this address |
| `clusterList[].clusterAddressList[].averageHoldingPeriod` | String | Average holding time of this address |
| `clusterList[].clusterAddressList[].lastActiveTimestamp` | String | Last active time (Unix milliseconds) |
| `clusterList[].clusterAddressList[].isContract` | Boolean | Whether it is a contract address |
| `clusterList[].clusterAddressList[].isExchange` | Boolean | Whether it is an exchange address |
| `clusterList[].clusterAddressList[].isKol` | Boolean | Whether it is a KOL address |
| `clusterList[].clusterAddressList[].addressRank` | String | Address ranking among all holders |

**Examples**:

```bash
# Holder cluster list for a Solana token
onchainos token cluster-list --address EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v --chain solana

# EVM token cluster list
onchainos token cluster-list --address 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 --chain ethereum
```

---

## 13. onchainos token cluster-supported-chains

**Description**: Get the list of chains that support holder cluster analysis.

```bash
onchainos token cluster-supported-chains
```

**Parameters**: None

**Return fields** (array of chain objects):

| Field | Type | Description |
|---|---|---|
| `chainIndex` | String | Chain identifier (e.g. `"1"` for Ethereum, `"501"` for Solana) |
| `chainName` | String | Chain display name (e.g. `"Ethereum"`, `"Solana"`) |
| `chainLogo` | String | Chain logo URL |

**Examples**:

```bash
# Get all chains that support holder cluster analysis
onchainos token cluster-supported-chains
```
