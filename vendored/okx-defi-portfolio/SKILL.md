---
name: okx-defi-portfolio
description: "Use this skill to 'check my DeFi positions', 'view DeFi holdings', 'show my DeFi portfolio', 'what DeFi am I invested in', 'show my staking positions', 'show my lending positions', 'DeFi balance', 'DeFi 持仓', '查看DeFi持仓', '我的DeFi资产', '持仓详情', '持仓列表', or mentions viewing DeFi holdings, positions, portfolio across protocols — when the user does NOT name a specific DApp. Covers positions overview and per-protocol position detail. Do NOT use for deposit/redeem/claim operations — use okx-defi-invest. Do NOT use for wallet token balances — use okx-wallet-portfolio. Do NOT use for DEX spot swaps — use okx-dex-swap. Do NOT use when the user names a specific third-party DApp by name (e.g. 'show my Aave positions', 'my Hyperliquid balance', 'check my Polymarket holdings') — route to okx-dapp-discovery instead, which loads the DApp's plugin for protocol-native position views."
license: MIT
metadata:
  author: okx
  version: "3.3.12"
  homepage: "https://web3.okx.com"
---

# OKX DeFi Portfolio

2 commands for viewing DeFi positions and holdings across protocols and chains.

## Skill Routing

- For DeFi deposit/redeem/claim → use `okx-defi-invest`
- For token price/chart → use `okx-dex-market`
- For wallet token balances → use `okx-wallet-portfolio`
- For DEX spot swap → use `okx-dex-swap`

## Quickstart

```bash
# Get DeFi holdings overview across chains
onchainos defi positions \
  --address 0xYourWallet \
  --chains ethereum,bsc,solana

# Get detailed holdings for a specific protocol (analysisPlatformId from positions output)
onchainos defi position-detail \
  --address 0xYourWallet \
  --chain ethereum \
  --platform-id 67890
```

## Command Index

| # | Command | Description |
|---|---------|-------------|
| 1 | `onchainos defi support-chains` | Get supported chains for DeFi |
| 2 | `onchainos defi support-platforms` | Get supported platforms for DeFi |
| 3 | `onchainos defi positions --address <addr> --chains <chains>` | Get user DeFi holdings overview |
| 4 | `onchainos defi position-detail --address <addr> --chain <chain> --platform-id <id>` | Get detailed holdings for a protocol |

## Chain Support

| Chain | Name / Aliases | chainIndex |
|-------|----------------|-----------|
| Ethereum | `ethereum`, `eth` | `1` |
| BSC | `bsc`, `bnb` | `56` |
| Polygon | `polygon`, `matic` | `137` |
| Arbitrum | `arbitrum`, `arb` | `42161` |
| Base | `base` | `8453` |
| X Layer | `xlayer`, `okb` | `196` |
| Avalanche | `avalanche`, `avax` | `43114` |
| Optimism | `optimism`, `op` | `10` |
| Fantom | `fantom`, `ftm` | `250` |
| Sui | `sui` | `784` |
| Tron | `tron`, `trx` | `195` |
| TON | `ton` | `607` |
| Linea | `linea` | `59144` |
| Scroll | `scroll` | `534352` |
| zkSync | `zksync` | `324` |
| Solana | `solana`, `sol` | `501` |

## Operation Flow

### Step 0: Address Resolution

When the user does NOT provide a wallet address, resolve it automatically from the Agentic Wallet **before** running any defi command:

```
1. onchainos wallet status          → check if logged in, get active account
2. onchainos wallet addresses       → get addresses grouped by chain category:
                                       - XLayer addresses
                                       - EVM addresses (Ethereum, BSC, Polygon, etc.)
                                       - Solana addresses
3. Match address to target chain:
   - EVM chains → use EVM address
   - Solana     → use Solana address
   - XLayer     → use XLayer address
```

Rules:
- If the user provides an explicit address, use it directly — skip this step
- If wallet is not logged in, ask the user to log in first (→ `okx-agentic-wallet`) or provide an address manually
- If the user says "check all accounts" or "all wallets", use `wallet balance --all` to get all account IDs, then `wallet switch <id>` + `wallet addresses` for each account, and query positions for each
- Always confirm the resolved address with the user before proceeding if the account has multiple addresses of the same type

### Step 1: Identify Intent

| User says | Action |
|-----------|--------|
| View positions / portfolio / holdings | `onchainos defi positions` |
| View detail for a protocol | `onchainos defi position-detail` |
| Redeem / claim after viewing | Suggest → use `okx-defi-invest` |

### Step 2: Collect Parameters

- **Missing wallet address** → resolve via Step 0 (wallet status → wallet addresses), or ask user if not logged in
- **Missing chains** → ask user which chains to query, or suggest common ones (ethereum, bsc, solana)
- **Missing platform-id** → run `defi positions` first to get `analysisPlatformId`

### Step 3: Display Results

#### Displaying Positions Results

When displaying `defi positions` output, you MUST use **exactly** these columns in this order — no substitutions, no omissions:

| # | Platform | analysisPlatformId | Chains | Positions | Value(USD) |
|---|---------|--------------------|----|--------|-----------|
| 1 | Aave V3 | 12345 | ETH,BSC | 2 | $120.00 |

Rules:
- **`analysisPlatformId` is MANDATORY in every row** — users must copy this value to run `position-detail`
- **Never omit, hide, or replace `analysisPlatformId`** with any other field
- **Never group platforms** — show every platform as its own row regardless of value size
- Raw JSON path: `walletIdPlatformList[*].platformList[*]` — each element is one platform row
  - `platformName` → Platform
  - `analysisPlatformId` → analysisPlatformId
  - `networkBalanceList[*].network` → Chains (join with comma)
  - `investmentCount` → Positions
  - `currencyAmount` → Value(USD)

#### Displaying Position Detail Results

**Output shape**: `{ "ok": true, "data": [ { "walletIdPlatformDetailList": [...] }, ... ] }` — `data` is an **array**. Never call `.get()` on `data` directly; iterate over it as a list.

When displaying `defi position-detail` output, render all tokens in a **single flat table** with these exact columns:

| Type | Asset | Amount | Value(USD) | investmentId | aggregateProductId | Token Contract | Rewards |
|------|------|------|-----------|--------------|--------------------|-----------|------|
| Supply | USDT | 1.002285 | $1.0025 | 127 | 71931 | 0x970223...7 | 0.000080 AVAX |
| Pending | sAVAX | 0.00000091 | $0.000012 | – | – | – | Platform reward |

Rules:
- Each token row is one row; merge in `investmentId` and `aggregateProductId` from its parent investment entry
- **`investmentId` is MANDATORY in every row** — users need it for `redeem`/`claim` (via `okx-defi-invest`)
- `aggregateProductId` — show if present, otherwise `–`
- Token Contract: show the **full contract address** without truncation; show `–` if native/empty
- Rewards: show pending reward amount + symbol if present, `–` if none; for platform rewards show `Platform reward`
- Type: map investType → Supply/Borrow/Stake/Farm/Pool etc; pending rewards row uses `Pending`
- **Health rate**: show separately below the table with warning if `healthRate < 1.5`

#### V3 Pool Positions — Extra Fields

For V3 Pool positions (`positionList` present), show an additional section per position:

| tokenId | Status | Range | tickLower | tickUpper |
|---------|--------|-------|-----------|-----------|
| 93828 | ACTIVE | 0.892 – 0.992 USDC/DAI | -33500 | -30450 |

- `tokenId`: from `positionList[].tokenId`
- `positionStatus`: `ACTIVE` or `INACTIVE`
- `range`: from `positionList[].range`
- `tickLower` / `tickUpper`: from `positionList[].rangeInfo.tickLower` / `rangeInfo.tickUpper`
- These fields are critical for V3 operations (add liquidity, withdraw, collect V3 fees)

## investType Reference

| investType | Description |
|------------|-------------|
| 1 | Save (savings/yield) |
| 2 | Pool (liquidity pool) |
| 3 | Farm (yield farming) |
| 4 | Vaults |
| 5 | Stake |
| 6 | Borrow |
| 7 | Staking |
| 8 | Locked |
| 9 | Deposit |
| 10 | Vesting |

## Post-execution Suggestions

| Just completed | Suggest |
|----------------|---------|
| `defi positions` | 1. View detail → `defi position-detail`  2. Redeem → `okx-defi-invest`  3. Claim rewards → `okx-defi-invest` |
| `defi position-detail` | 1. Redeem position → use `okx-defi-invest` with `investmentId` from table  2. Claim rewards → use `okx-defi-invest`  3. Add more → use `okx-defi-invest` |
| `defi position-detail` (V3 Pool) | 1. View depth chart → `defi depth-price-chart --investment-id <id>` (via `okx-defi-invest`)  2. View price history → `defi depth-price-chart --investment-id <id> --chart-type PRICE` |

## Global Notes

- **CRITICAL — Address-chain compatibility**: The `--address` and `--chains` parameters must be compatible. EVM addresses (`0x…`) can only query EVM chains; Solana addresses (base58) can only query `solana`. Never mix them in a single call — the API will return error 84019 (Address format error).
  - `0x…` address → only pass EVM chains: `ethereum,bsc,polygon,arbitrum,base,xlayer,avalanche,optimism,fantom,linea,scroll,zksync`
  - base58 address → only pass `solana`
  - Sui address → only pass `sui`
  - Tron address (`T…`) → only pass `tron`
  - TON address → only pass `ton`
  - If the user wants positions across both EVM and Solana, make **two separate calls** with the respective addresses
- `defi positions` uses `--chains` (plural, comma-separated, e.g. `--chains ethereum,bsc`) — do NOT use `--chain`
- `defi position-detail` uses `--chain` (singular) — do NOT use `--chains`
- The wallet address parameter is `--address` for both commands
- `position-detail` requires `analysisPlatformId` from `positions` output as `--platform-id`
- The CLI resolves chain names automatically (`ethereum` → `1`, `bsc` → `56`, `solana` → `501`)
