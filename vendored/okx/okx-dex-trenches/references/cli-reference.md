# Onchain OS DEX Trenches — CLI Command Reference

Detailed parameter tables, return field schemas, and usage examples for all 7 memepump commands.

## 1. onchainos memepump chains

Get supported chains and protocols for meme pump. No parameters required.

```bash
onchainos memepump chains
```

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `data[].chainIndex` | String | Chain identifier (e.g., `"501"` for Solana, `"56"` for BSC) |
| `data[].chainName` | String | Human-readable chain name |
| `data[].protocolList[].protocolId` | String | Protocol unique ID |
| `data[].protocolList[].protocolName` | String | Protocol display name (e.g., `pumpfun`, `fourmeme`) |

> Currently supports: Solana (501), BSC (56), X Layer (196), TRON (195).

## 2. onchainos memepump tokens

List meme pump tokens with advanced filtering. Returns up to 30 tokens per request.

```bash
onchainos memepump tokens --chain <chain> --stage <stage> [options]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--chain` | Yes | - | Chain name (e.g., `solana`, `bsc`) |
| `--stage` | Yes | `NEW` | Token stage: `NEW`, `MIGRATING`, or `MIGRATED` |
| `--wallet-address` | No | - | Wallet address for position-specific data |
| `--protocol-id-list` | No | - | Comma-separated protocol IDs (get IDs from `memepump chains`) |
| `--quote-token-address-list` | No | - | Comma-separated quote token addresses |
| **Holder analysis** | | | |
| `--min-top10-holdings-percent` | No | - | Min top-10 holder concentration (0–100) |
| `--max-top10-holdings-percent` | No | - | Max top-10 holder concentration (0–100) |
| `--min-dev-holdings-percent` | No | - | Min dev holdings % |
| `--max-dev-holdings-percent` | No | - | Max dev holdings % |
| `--min-insiders-percent` | No | - | Min insider wallet % |
| `--max-insiders-percent` | No | - | Max insider wallet % |
| `--min-bundlers-percent` | No | - | Min bundler wallet % |
| `--max-bundlers-percent` | No | - | Max bundler wallet % |
| `--min-snipers-percent` | No | - | Min sniper wallet % |
| `--max-snipers-percent` | No | - | Max sniper wallet % |
| **Wallet analysis** | | | |
| `--min-fresh-wallets-percent` | No | - | Min newly-created wallet % |
| `--max-fresh-wallets-percent` | No | - | Max newly-created wallet % |
| `--min-suspected-phishing-wallet-percent` | No | - | Min phishing wallet % |
| `--max-suspected-phishing-wallet-percent` | No | - | Max phishing wallet % |
| `--min-bot-traders` | No | - | Min bot trader wallet count |
| `--max-bot-traders` | No | - | Max bot trader wallet count |
| **Dev history** | | | |
| `--min-dev-migrated` | No | - | Min tokens migrated by developer |
| `--max-dev-migrated` | No | - | Max tokens migrated by developer |
| **Market data** | | | |
| `--min-market-cap` | No | - | Min market cap in USD |
| `--max-market-cap` | No | - | Max market cap in USD |
| `--min-volume` | No | - | Min 24h volume in USD |
| `--max-volume` | No | - | Max 24h volume in USD |
| `--min-tx-count` | No | - | Min transaction count |
| `--max-tx-count` | No | - | Max transaction count |
| `--min-bonding-percent` | No | - | Min bonding curve completion (0–100) |
| `--max-bonding-percent` | No | - | Max bonding curve completion (0–100) |
| `--min-holders` | No | - | Min unique holder count |
| `--max-holders` | No | - | Max unique holder count |
| `--min-token-age` | No | - | Min token age in minutes |
| `--max-token-age` | No | - | Max token age in minutes |
| `--min-buy-tx-count` | No | - | Min buy transactions (last 1h) |
| `--max-buy-tx-count` | No | - | Max buy transactions (last 1h) |
| `--min-sell-tx-count` | No | - | Min sell transactions (last 1h) |
| `--max-sell-tx-count` | No | - | Max sell transactions (last 1h) |
| **Token metadata** | | | |
| `--min-token-symbol-length` | No | - | Min ticker symbol length |
| `--max-token-symbol-length` | No | - | Max ticker symbol length |
| `--keywords-include` | No | - | Include tokens matching keyword (case-insensitive) |
| `--keywords-exclude` | No | - | Exclude tokens matching keyword (case-insensitive) |
| **Social filters** | | | |
| `--has-at-least-one-social-link` | No | - | Require at least one social link (`true`/`false`) |
| `--has-x` | No | - | Require X (Twitter) link (`true`/`false`) |
| `--has-telegram` | No | - | Require Telegram link (`true`/`false`) |
| `--has-website` | No | - | Require website link (`true`/`false`) |
| `--website-type-list` | No | - | Website types: `0`=official, `1`=YouTube, `2`=Twitch |
| `--dex-screener-paid` | No | - | Filter by DexScreener promotion status (`true`/`false`) |
| `--live-on-pump-fun` | No | - | Filter by PumpFun live stream status (`true`/`false`) |
| **Dev status** | | | |
| `--dev-sell-all` | No | - | Developer liquidated all holdings (`true`/`false`) |
| `--dev-still-holding` | No | - | Developer still holding (`true`/`false`) |
| **Other** | | | |
| `--community-takeover` | No | - | Community takeover status (`true`/`false`) |
| `--bags-fee-claimed` | No | - | Bags fee claimed (`true`/`false`) |
| `--min-fees-native` | No | - | Min fees in native currency |
| `--max-fees-native` | No | - | Max fees in native currency |

**Return fields**: Array of token objects (same structure as `memepump-token-details` response).

## 3. onchainos memepump token-details

Get detailed information for a specific meme pump token.

```bash
onchainos memepump token-details --address <address> [--chain <chain>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Token contract address |
| `--chain` | No | `solana` | Chain name |
| `--wallet` | No | - | User wallet address (for position and P&L data) |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `chainIndex` | String | Chain identifier |
| `protocolId` | String | Protocol numeric ID (e.g., `"120596"` for pumpfun) |
| `quoteTokenAddress` | String | Quote token contract address |
| `tokenAddress` | String | Token contract address |
| `symbol` | String | Token symbol |
| `name` | String | Token name |
| `logoUrl` | String | Token logo URL |
| `creatorAddress` | String | Token creator wallet address |
| `createdTimestamp` | String | Creation timestamp (Unix ms) |
| `migratedBeginTimestamp` | String | Migration start timestamp (Unix ms, empty if not migrating) |
| `migratedEndTimestamp` | String | Migration end timestamp (Unix ms, empty if not migrated) |
| `market.marketCapUsd` | String | Market cap in USD |
| `market.volumeUsd1h` | String | 1-hour volume in USD |
| `market.txCount1h` | String | 1-hour transaction count |
| `market.buyTxCount1h` | String | 1-hour buy transaction count |
| `market.sellTxCount1h` | String | 1-hour sell transaction count |
| `bondingPercent` | String | Bonding curve progress (0-100) |
| `tags.top10HoldingsPercent` | String | Top 10 holders percentage (0-100) |
| `tags.devHoldingsPercent` | String \| null | Dev holdings percentage (0-100); `null` if token is < 2s old |
| `tags.insidersPercent` | String \| null | Insiders percentage (0-100); `null` if token is < 2s old |
| `tags.bundlersPercent` | String \| null | Bundlers percentage (0-100); `null` if token is < 2s old |
| `tags.snipersPercent` | String \| null | Snipers percentage (0-100); `null` if token is < 2s old |
| `tags.freshWalletsPercent` | String \| null | Fresh wallets percentage (0-100); `null` if token is < 2s old |
| `tags.suspectedPhishingWalletPercent` | String \| null | Phishing wallet percentage (0-100); `null` if token is < 2s old |
| `tags.totalHolders` | String | Total holder count |
| `social.x` | String | X (Twitter) URL |
| `social.telegram` | String | Telegram URL |
| `social.website` | String | Website URL |
| `social.dexScreenerPaid` | Boolean | Paid on DexScreener |
| `social.communityTakeover` | Boolean | Community takeover flag |
| `social.liveOnPumpFun` | Boolean | Currently live on Pump.fun |
| `bagsFeeClaimed` | Boolean | Bags fee claimed |
| `aped` | String | Same-car wallet count |

## 4. onchainos memepump token-dev-info

Get developer analysis including rug pull history, migration stats, and holding info.

```bash
onchainos memepump token-dev-info --address <address> [--chain <chain>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Token contract address |
| `--chain` | No | `solana` | Chain name |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `devLaunchedInfo.totalTokens` | String | Total tokens created by this dev |
| `devLaunchedInfo.rugPullCount` | String | Number of rug pulls |
| `devLaunchedInfo.migratedCount` | String | Number of successfully migrated tokens |
| `devLaunchedInfo.goldenGemCount` | String | Number of golden gem tokens |
| `devHoldingInfo.devHoldingPercent` | String | Dev holding percentage (0-100) |
| `devHoldingInfo.devAddress` | String | Developer wallet address |
| `devHoldingInfo.fundingAddress` | String | Funding source address |
| `devHoldingInfo.devBalance` | String | Dev's current balance |
| `devHoldingInfo.lastFundedTimestamp` | String | Last funded timestamp (Unix ms) |

> **Note**: `devHoldingInfo` may be `null` if the creator address is unavailable.

## 5. onchainos memepump similar-tokens

Find similar tokens created by the same developer. Returns at most 2 results.

```bash
onchainos memepump similar-tokens --address <address> [--chain <chain>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Token contract address |
| `--chain` | No | `solana` | Chain name |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `data[].tokenAddress` | String | Similar token contract address |
| `data[].tokenSymbol` | String | Token symbol |
| `data[].tokenLogo` | String | Token logo URL |
| `data[].marketCapUsd` | String | Market cap in USD |
| `data[].lastTxTimestamp` | String | Last transaction timestamp (Unix ms) |
| `data[].createdTimestamp` | String | Creation timestamp (Unix ms) |

## 6. onchainos memepump token-bundle-info

Get bundle/sniper analysis for a token.

```bash
onchainos memepump token-bundle-info --address <address> [--chain <chain>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Token contract address |
| `--chain` | No | `solana` | Chain name |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `bundlerAthPercent` | String | Bundler all-time-high percentage (0-100) |
| `totalBundlers` | String | Total number of bundlers |
| `bundledValueNative` | String | Total bundled value in native token |
| `bundledTokenAmount` | String | Total bundled token amount |

## 7. onchainos memepump aped-wallet

Get the aped (same-car) wallet list for a token.

```bash
onchainos memepump aped-wallet --address <address> [--chain <chain>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Token contract address |
| `--chain` | No | `solana` | Chain name |
| `--wallet` | No | - | User wallet address (highlights your wallet if present in the aped list) |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `data[].walletAddress` | String | Wallet address |
| `data[].walletType` | String | Wallet type label (e.g., Smart Money, KOL, Whale) |
| `data[].holdingUsd` | String | Holding value in USD |
| `data[].holdingPercent` | String | Holding percentage (0-100) |
| `data[].totalPnl` | String | Total PnL in USD |
| `data[].pnlPercent` | String | PnL percentage |

## Input / Output Examples

**User says:** "Show me new meme tokens on Solana"

```bash
onchainos memepump tokens --chain solana --stage NEW
# -> Display list of new meme pump tokens with market data and audit tags
```

**User says:** "Is this meme token safe? Check the developer"

```bash
onchainos memepump token-dev-info --address <address> --chain solana
# -> Display dev rug pull count, migration count, golden gems, dev holding info
```

**User says:** "Check if this token has bundler activity"

```bash
onchainos memepump token-bundle-info --address <address> --chain solana
# -> Display bundler count, bundled value, bundled token amount
```

**User says:** "Who else has bought this meme token?"

```bash
onchainos memepump aped-wallet --address <address> --chain solana
# -> Display aped wallets with wallet type, holding %, and PnL
```
