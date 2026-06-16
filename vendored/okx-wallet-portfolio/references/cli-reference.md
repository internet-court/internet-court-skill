# Onchain OS Portfolio — CLI Command Reference

Detailed parameter tables, return field schemas, and usage examples for all 4 portfolio commands.

> PnL / DEX-history / per-token-PnL queries are NOT part of this skill — they live under `onchainos market portfolio-*` and are owned by `okx-dex-market`.

## 1. onchainos portfolio chains

Get supported chains for balance queries. No parameters required.

```bash
onchainos portfolio chains
```

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `name` | String | Chain name (e.g., `"XLayer"`) |
| `logoUrl` | String | Chain logo URL |
| `shortName` | String | Chain short name (e.g., `"OKB"`) |
| `chainIndex` | String | Chain unique identifier (e.g., `"196"`) |

## 2. onchainos portfolio total-value

Get total asset value for a wallet address.

```bash
onchainos portfolio total-value --address <address> --chains <chains> [--asset-type <type>] [--exclude-risk <bool>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Wallet address |
| `--chains` | Yes | - | Chain names or IDs, comma-separated (e.g., `"xlayer,solana"` or `"196,501"`) |
| `--asset-type` | No | `"0"` | `0`=all, `1`=tokens only, `2`=DeFi only |
| `--exclude-risk` | No | `true` | `true`=filter risky tokens, `false`=include. Only ETH/BSC/SOL/BASE |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `totalValue` | String | Total asset value in USD |

## 3. onchainos portfolio all-balances

Get all token balances for a wallet address.

```bash
onchainos portfolio all-balances --address <address> --chains <chains> [--exclude-risk <value>] [--filter <value>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Wallet address |
| `--chains` | Yes | - | Chain names or IDs, comma-separated, max 50 |
| `--exclude-risk` | No | `"0"` | `0`=filter out risky tokens (default), `1`=include. Only ETH/BSC/SOL/BASE |
| `--filter` | No | `"0"` | `0`=default (filters risk/custom/passive tokens), `1`=return all tokens including risk tokens. Use `1` when scanning for security risks. |

**Return fields** (per token in `tokenAssets[]`):

| Field | Type | Description |
|---|---|---|
| `chainIndex` | String | Chain identifier |
| `tokenContractAddress` | String | Token contract address |
| `symbol` | String | Token symbol (e.g., `"OKB"`) |
| `balance` | String | Token balance in UI units (e.g., `"10.5"`) |
| `rawBalance` | String | Token balance in base units (e.g., `"10500000000000000000"`) |
| `tokenPrice` | String | Token price in USD |
| `isRiskToken` | Boolean | `true` if flagged as risky |

## 4. onchainos portfolio token-balances

Get specific token balances for a wallet address.

```bash
onchainos portfolio token-balances --address <address> --tokens <tokens> [--exclude-risk <value>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Wallet address |
| `--tokens` | Yes | - | Token list: `"chainIndex:tokenAddress"` pairs, comma-separated. Use empty address for native token (e.g., `"196:"` for native OKB). Max 20 items. |
| `--exclude-risk` | No | `"0"` | `0`=filter out (default), `1`=include |

**Return fields**: Same schema as `all-balances` (`tokenAssets[]`).

## Input / Output Examples

**User says:** "Check my wallet total assets on XLayer and Solana"

```bash
onchainos portfolio total-value --address 0xYourWallet --chains "xlayer,solana"
# -> Display: Total assets $12,345.67
```

**User says:** "Show all tokens in my wallet"

```bash
onchainos portfolio all-balances --address 0xYourWallet --chains "xlayer,solana,ethereum"
# -> Display:
#   OKB:  10.5 ($509.25)
#   USDC: 2,000 ($2,000.00)
#   USDT: 1,500 ($1,500.00)
#   ...
```

**User says:** "Only check USDC and native OKB balances on XLayer"

```bash
onchainos portfolio token-balances --address 0xYourWallet --tokens "196:,196:0x74b7f16337b8972027f6196a17a631ac6de26d22"
# -> Display: OKB: 10.5 ($509.25), USDC: 2,000 ($2,000.00)
```
