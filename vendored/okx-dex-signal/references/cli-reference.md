# Onchain OS DEX Signal — CLI Command Reference

Detailed parameter tables, return field schemas, and usage examples for the tracker, signal, and leaderboard commands.

---

## 1. onchainos tracker activities (address tracker)

Get latest DEX activities for tracked addresses. Supports smart money, KOL, or custom multi-address tracking, with filters for trade type, chain, volume, market cap, liquidity, and holder count.

```bash
onchainos tracker activities --tracker-type <type> [options]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--tracker-type` | Yes | - | Tracker type: `smart_money` (or `1`) = platform smart money; `kol` (or `2`) = platform Top 100 KOL addresses; `multi_address` (or `3`) = custom addresses |
| `--wallet-address` | Conditional | - | Required when `--tracker-type multi_address`. Comma-separated wallet addresses, max 20 |
| `--trade-type` | No | `0` (all) | Trade direction: `0`=all, `1`=buy, `2`=sell |
| `--chain` | No | all chains | Chain filter (e.g., `ethereum`, `solana`, `bsc`, `base`, `xlayer`) |
| `--min-volume` | No | - | Minimum trade volume (USD) |
| `--max-volume` | No | - | Maximum trade volume (USD) |
| `--min-holders` | No | - | Minimum number of holding addresses |
| `--min-market-cap` | No | - | Minimum market cap (USD) |
| `--max-market-cap` | No | - | Maximum market cap (USD) |
| `--min-liquidity` | No | - | Minimum liquidity (USD) |
| `--max-liquidity` | No | - | Maximum liquidity (USD) |

**Return fields** (inside `trades` array):

| Field | Type | Description |
|---|---|---|
| `txHash` | String | Transaction hash |
| `walletAddress` | String | Wallet address of the transaction |
| `quoteTokenSymbol` | String | Pricing token symbol (mainnet native token) |
| `quoteTokenAmount` | String | Amount of pricing token traded |
| `tokenSymbol` | String | Trading token symbol |
| `tokenContractAddress` | String | Trading token contract address |
| `chainIndex` | String | Chain identifier where the trading token is located |
| `tokenPrice` | String | Trading price of the token (USD) |
| `marketCap` | String | Market cap at the transaction price (USD) |
| `realizedPnlUsd` | String | Realized PnL of the trading token (USD) |
| `tradeType` | String | Trade direction: `1`=buy, `2`=sell |
| `tradeTime` | String | Transaction time (Unix milliseconds) |

**Examples**:

```bash
# Latest trades by platform smart money (all chains)
onchainos tracker activities --tracker-type smart_money

# Latest buys by KOL addresses on Solana
onchainos tracker activities --tracker-type kol --chain solana --trade-type 1

# Latest trades for custom wallet addresses
onchainos tracker activities --tracker-type multi_address \
  --wallet-address 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045,0xab5801a7d398351b8be11c439e05c5b3259aec9b

# Smart money buys with volume filter
onchainos tracker activities --tracker-type smart_money --trade-type 1 --min-volume 10000
```

---

## 2. onchainos signal chains

Get supported chains for market signals. No parameters required.

```bash
onchainos signal chains
```

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `chainIndex` | String | Chain identifier (e.g., `"1"`, `"501"`) |
| `chainName` | String | Human-readable chain name (e.g., `"Ethereum"`, `"Solana"`) |
| `chainLogo` | String | Chain logo image URL |

> Call this first when signal data is needed — confirm chain support before calling `onchainos signal list`.

## 3. onchainos signal list

Get latest buy-direction token signals sorted descending by time.

```bash
onchainos signal list --chain <chain> [--limit <n>] [--cursor <cursor>] [options]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--chain` | Yes | - | Chain name (e.g., `ethereum`, `solana`, `base`) |
| `--wallet-type` | No | all types | Wallet classification, comma-separated: `1`=Smart Money, `2`=KOL/Influencer, `3`=Whale (e.g., `"1,2"`) |
| `--min-amount-usd` | No | - | Minimum transaction amount in USD |
| `--max-amount-usd` | No | - | Maximum transaction amount in USD |
| `--min-address-count` | No | - | Minimum triggering wallet address count |
| `--max-address-count` | No | - | Maximum triggering wallet address count |
| `--token-address` | No | - | Token contract address (filter signals for a specific token) |
| `--min-market-cap-usd` | No | - | Minimum token market cap in USD |
| `--max-market-cap-usd` | No | - | Maximum token market cap in USD |
| `--min-liquidity-usd` | No | - | Minimum token liquidity in USD |
| `--max-liquidity-usd` | No | - | Maximum token liquidity in USD |
| `--limit` | No | `20` | Number of results per page (max 100) |
| `--cursor` | No | - | Pagination cursor — pass the `cursor` field from the last item of the previous response to get the next page |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `timestamp` | String | Signal timestamp (Unix milliseconds) |
| `chainIndex` | String | Chain identifier |
| `price` | String | Token price at signal time (USD) |
| `walletType` | String | Wallet classification: `"1"`=Smart Money, `"2"`=KOL/Influencer, `"3"`=Whale |
| `triggerWalletCount` | String | Number of wallets that triggered this signal |
| `triggerWalletAddress` | String | Comma-separated wallet addresses that triggered the signal |
| `amountUsd` | String | Total transaction amount in USD |
| `soldRatioPercent` | String | Percentage of tokens sold (lower = still holding) |
| `token.tokenAddress` | String | Token contract address |
| `token.symbol` | String | Token symbol |
| `token.name` | String | Token name |
| `token.logo` | String | Token logo URL |
| `token.marketCapUsd` | String | Token market cap in USD |
| `token.holders` | String | Number of token holders |
| `token.top10HolderPercent` | String | Percentage of supply held by top 10 holders |
| `cursor` | String | Per-item pagination cursor — pass the `cursor` of the **last item** as the next request's `--cursor` to fetch the next page |

## Input / Output Examples

**User says:** "What are smart money wallets buying on Solana?" (transaction-level)

```bash
onchainos tracker activities --tracker-type smart_money --chain solana --trade-type 1
# -> Display latest smart money buy transactions on Solana
```

**User says:** "Show me smart money buy signal alerts on Solana" (aggregated alerts)

```bash
onchainos signal chains   # confirm Solana is supported
onchainos signal list --chain solana --wallet-type 1
# -> Display aggregated smart money buy signals with token info
```

**User says:** "Show me whale buys above $10k on Ethereum" (signal alerts)

```bash
onchainos signal list --chain ethereum --wallet-type 3 --min-amount-usd 10000
# -> Display whale-only buy signal alerts, min $10k
```

---

## 4. onchainos leaderboard supported-chains


Get supported chains for the leaderboard. No parameters required.

```bash
onchainos leaderboard supported-chains
```

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `chainIndex` | String | Chain identifier (e.g., `"1"`, `"501"`) |
| `chainName` | String | Human-readable chain name (e.g., `"Ethereum"`, `"Solana"`) |
| `chainLogo` | String | Chain logo URL |

> Call this first to confirm chain support before calling `onchainos leaderboard list`.

---

## 5. onchainos leaderboard list

Get top trader leaderboard ranked by PnL, win rate, volume, tx count, or ROI. Returns at most 20 entries per request.

```bash
onchainos leaderboard list --chain <chain> --time-frame <tf> --sort-by <sort> [options]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--chain` | Yes | - | Chain name (e.g., `ethereum`, `solana`, `base`) |
| `--time-frame` | Yes | - | Statistics window: `1`=1D, `2`=3D, `3`=7D, `4`=1M, `5`=3M |
| `--sort-by` | Yes | - | Sort field: `1`=PnL, `2`=Win Rate, `3`=Tx number, `4`=Volume, `5`=ROI |
| `--wallet-type` | No | all types | Single-select wallet type: `sniper`, `dev`, `fresh`, `pump`, `smartMoney`, `influencer` |
| `--min-realized-pnl-usd` | No | - | Minimum realized PnL (USD) |
| `--max-realized-pnl-usd` | No | - | Maximum realized PnL (USD) |
| `--min-win-rate-percent` | No | - | Minimum win rate % (0–100) |
| `--max-win-rate-percent` | No | - | Maximum win rate % (0–100) |
| `--min-txs` | No | - | Minimum number of transactions |
| `--max-txs` | No | - | Maximum number of transactions |
| `--min-tx-volume` | No | - | Minimum transaction volume (USD) |
| `--max-tx-volume` | No | - | Maximum transaction volume (USD) |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `walletAddress` | String | Wallet address |
| `realizedPnlUsd` | String | Cumulative realized PnL (USD) in the selected time frame |
| `realizedPnlPercent` | String | Cumulative realized PnL % in the selected time frame |
| `winRatePercent` | String | Win rate % (profitable tokens / total traded tokens) |
| `avgBuyValueUsd` | String | Average buy value (USD) |
| `topPnlTokenList` | Array | Top 3 tokens by PnL |
| `topPnlTokenList[].tokenContractAddress` | String | Token contract address |
| `topPnlTokenList[].tokenSymbol` | String | Token symbol |
| `topPnlTokenList[].tokenPnLUsd` | String | Token PnL (USD) |
| `topPnlTokenList[].tokenPnLPercent` | String | Token PnL % |
| `txVolume` | String | Total transaction volume (USD) in the selected time frame |
| `txs` | String | Total transaction count in the selected time frame |
| `lastActiveTimestamp` | String | Last active time (Unix milliseconds) |

**Examples**:

```bash
# Top traders on Solana by PnL over last 7D
onchainos leaderboard list --chain solana --time-frame 3 --sort-by 1

# Top smart money on Ethereum by win rate over last 30D
onchainos leaderboard list --chain ethereum --time-frame 4 --sort-by 2 --wallet-type smartMoney

# Top snipers on BSC by volume over last 1D, min 10 txs
onchainos leaderboard list --chain bsc --time-frame 1 --sort-by 4 --wallet-type sniper --min-txs 10
```
