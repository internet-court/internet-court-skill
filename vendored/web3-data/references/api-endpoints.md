# Chainbase API Endpoint Reference

## Base URLs

- **Web3 API**: `https://api.chainbase.online`
- **SQL API**: `https://api.chainbase.com/api/v1`
- **SQL Classic**: `https://api.chainbase.online/v1`

## Authentication

All endpoints require API key in header:
- Web3 API: `x-api-key: <key>` (default: `demo`)
- SQL API: `X-API-KEY: <key>`

## Chain IDs

| Chain | ID |
|---|---|
| Ethereum | 1 |
| BSC | 56 |
| Polygon | 137 |
| Avalanche | 43114 |
| Arbitrum One | 42161 |
| Optimism | 10 |
| Base | 8453 |
| zkSync | 324 |
| Merlin | 4200 |

## Standard Response

```json
{ "code": 0, "message": "ok", "data": ..., "next_page": int, "count": int }
```

Pagination: `page` (default 1), `limit` (default 20, max 100).

---

## TOKEN API

### GET /v1/token/top-holders
Top token holders with balances and USD value.

| Param | Required | Description |
|---|---|---|
| chain_id | Yes | Chain ID |
| contract_address | Yes | Token contract (0x...) |
| page | No | Page (default 1) |
| limit | No | Page size (default 20, max 100) |

Response `data`: `[{ wallet_address, original_amount, amount, usd_value }]`

### GET /v1/token/holders
Token holder address list.

Same params as top-holders.
Response `data`: `["0x...", ...]`

### GET /v1/token/price
Current token USD price.

| Param | Required |
|---|---|
| chain_id | Yes |
| contract_address | Yes |

Response `data`: `{ price, symbol, decimals, updated_at }`

### GET /v1/token/price/history
Historical token price (max 90-day range).

| Param | Required |
|---|---|
| chain_id | Yes |
| contract_address | Yes |
| from_timestamp | Yes (Unix) |
| end_timestamp | Yes (Unix) |

Response `data`: `[{ price, symbol, decimals, updated_at }]`

### GET /v1/token/metadata
Token metadata (name, symbol, supply, logos, price).

| Param | Required |
|---|---|
| chain_id | Yes |
| contract_address | Yes |

Response `data`: `{ contract_address, decimals, name, symbol, total_supply, logos, urls, current_usd_price }`

### GET /v1/token/transfers
ERC20 transfer history.

| Param | Required |
|---|---|
| chain_id | Yes |
| contract_address | No |
| address | No |
| from_block / to_block | No |
| from_timestamp / end_timestamp | No |
| page, limit | No |

Response `data`: `[{ block_number, block_timestamp, transaction_hash, from_address, to_address, value, ... }]`

---

## BASIC API

### GET /v1/address/labels
Address labels and tags.

| Param | Required |
|---|---|
| chain_id | Yes |
| address | Yes |

Response `data`: `{ "0xAddr": [{ category, tags: [...] }] }`

### GET /v1/account/txs
Account transaction history.

| Param | Required |
|---|---|
| chain_id | Yes |
| address | Yes |
| from_block / to_block | No |
| from_timestamp / end_timestamp | No |
| page, limit | No |

Response `data`: `[{ type, status, block_number, block_timestamp, transaction_hash, from_address, to_address, value, gas_used, tx_fee, ... }]`

### GET /v1/tx/detail
Single transaction by hash or block+index.

| Param | Required |
|---|---|
| chain_id | Yes |
| hash | No (or block_number + tx_index) |

### GET /v1/block/number/latest
Latest block number.

| Param | Required |
|---|---|
| chain_id | Yes |

Response `data`: `{ number, hash }`

### GET /v1/block/detail
Block details by number.

| Param | Required |
|---|---|
| chain_id | Yes |
| number | Yes |

### POST /v1/contract/call
Call smart contract read function.

Body: `{ chain_id, contract_address, function_name, abi (JSON string), params (array), to_block }`

---

## BALANCE API

### GET /v1/account/balance
Native token balance (wei).

| Param | Required |
|---|---|
| chain_id | Yes |
| address | Yes |
| to_block | No |

Response `data`: `"1000000000000000000"`

### GET /v1/account/tokens
ERC20 token balances for address.

| Param | Required |
|---|---|
| chain_id | Yes |
| address | Yes |
| contract_address | No (filter, up to 100) |
| page, limit | No |

Response `data`: `[{ contract_address, decimals, name, symbol, balance, total_supply, logos, urls, current_usd_price }]`

### GET /v1/account/nfts
NFTs owned by address.

| Param | Required |
|---|---|
| chain_id | Yes |
| address | Yes |
| contract_address | No |
| page, limit | No |

### GET /v1/account/portfolios
DeFi portfolio positions.

| Param | Required |
|---|---|
| address | Yes |
| chain_id | No (array, e.g. ["ethereum"]) |

Response `data`: `[{ id, name, blockchain, logo_url, portfolios: [{ pool, type, assets_deposited, assets_rewarded, stats }] }]`

---

## DOMAIN API

### GET /v1/account/ens
ENS domains held by address.

| Param | Required |
|---|---|
| chain_id | Yes |
| address | Yes |

### GET /v1/ens/records
Resolve ENS domain to address.

| Param | Required |
|---|---|
| chain_id | Yes |
| domain | Yes |

### GET /v1/ens/reverse
Reverse resolve address to ENS.

| Param | Required |
|---|---|
| chain_id | Yes |
| address | Yes |

### GET /v1/space-id/records / /v1/space-id/reverse
SPACE ID domain resolution (same params as ENS equivalents).

---

## NFT API

### GET /v1/nft/metadata
NFT asset metadata. Params: chain_id, contract_address, token_id.

### GET /v1/nft/collection
Collection metadata. Params: chain_id, contract_address.

### GET /v1/nft/collection/items
Collection items. Params: chain_id, contract_address, page, limit.

### GET /v1/nft/search
Search collections by name. Params: chain_id, name, contract_address, page, limit.

### GET /v1/nft/owner
NFT owner. Params: chain_id, contract_address, token_id.

### GET /v1/nft/owners
Collection owners. Params: chain_id, contract_address, page, limit.

### GET /v1/nft/owner/history
NFT ownership history. Params: chain_id, contract_address, token_id, from_block, to_block, page, limit.

### GET /v1/nft/transfers
NFT transfers. Params: chain_id, contract_address, token_id, address, from_block, to_block, page, limit.

### GET /v1/nft/floor_price
Collection floor price. Params: chain_id, contract_address.

### GET /v1/nft/price/history
NFT price history. Params: chain_id, contract_address, from_timestamp, end_timestamp.

### GET /v1/nft/collection/trending
Trending collections. Params: chain_id, range (1h/12h/24h/7d/30d/90d), exchange_name (opensea/x2y2/looksrare/all), sort, page, limit.

### GET /v1/nft/rarity
NFT rarity scores. Params: chain_id, contract_address, token_id, rank_min, rank_max, page, limit.

---

## SQL API

### POST /query/execute (Alpha)
Base URL: `https://api.chainbase.com/api/v1`

Body: `{ "sql": "SELECT * FROM ethereum.blocks LIMIT 10" }`
Max 100,000 results.

### GET /execution/{execution_id}/results (Alpha)
Fetch results of async query.

### GET /execution/{execution_id}/status (Alpha)
Check query execution status. Status values: FINISHED, RUNNING, etc.

### POST /dw/query (Classic)
Base URL: `https://api.chainbase.online/v1`

Body: `{ "query": "SQL...", "task_id": "optional", "page": 1 }`
1,000 results per page, task_id valid for 1 hour, max 100,000 records.

### Common SQL Tables
- `ethereum.blocks` - Block data
- `ethereum.transactions` - Transaction data
- `ethereum.token_transfers` - ERC20 transfers
- `ethereum.token_metas` - Token metadata
- `ethereum.logs` - Event logs
- Replace `ethereum` with chain name: `polygon`, `bsc`, `avalanche`, `arbitrum`, `optimism`, `base`, etc.
