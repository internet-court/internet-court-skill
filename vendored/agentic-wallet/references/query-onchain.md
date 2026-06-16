# Query Onchain Data on Base

Use the CDP SQL API to query onchain data (events, transactions, blocks, transfers) on Base. Queries are executed via x402 and are charged per query.

If the wallet is not authenticated, see `references/auth.md`.

## Executing a Query

```bash
npx awal@2.10.0 x402 pay https://x402.cdp.coinbase.com/platform/v2/data/query/run -X POST -d '{"sql": "<YOUR_QUERY>"}' --json
```

**IMPORTANT**: Always single-quote the `-d` JSON string to prevent bash variable expansion.

## Input Validation

Before constructing the command, validate inputs to prevent shell injection:

- **SQL query**: Always embed the query inside a single-quoted JSON string (`-d '{"sql": "..."}'`). Never use double quotes for the outer `-d` wrapper, as this enables shell expansion of `$` and backticks within the query.
- **Addresses**: Must be valid `0x` hex addresses (`^0x[0-9a-fA-F]{40}$`). Reject any value containing shell metacharacters.

Do not pass unvalidated user input into the command.

## CRITICAL: Indexed Fields

Queries against `base.events` **MUST** filter on indexed fields to avoid full table scans. The indexed fields are:

| Indexed Field | Use For |
| --- | --- |
| `event_signature` | Filter by event type. Use this instead of `event_name` for performance. |
| `address` | Filter by contract address. |
| `block_timestamp` | Filter by time range. |

**Always include at least one indexed field in your WHERE clause.** Combining all three gives the best performance.

## CoinbaseQL Syntax

CoinbaseQL is a SQL dialect based on ClickHouse. Supported features:

- **Clauses**: SELECT (DISTINCT), FROM, WHERE, GROUP BY, ORDER BY (ASC/DESC), LIMIT, WITH (CTEs), UNION (ALL/DISTINCT)
- **Joins**: INNER, LEFT, RIGHT, FULL with ON
- **Operators**: `=`, `!=`, `<>`, `<`, `>`, `<=`, `>=`, `+`, `-`, `*`, `/`, `%`, AND, OR, NOT, BETWEEN, IN, IS NULL, LIKE
- **Expressions**: CASE/WHEN/THEN/ELSE, CAST (both `CAST()` and `::` syntax), subqueries, array/map indexing with `[]`, dot notation
- **Literals**: Array `[...]`, Map `{...}`, Tuple `(...)`
- **Functions**: Standard SQL functions, lambda functions with `->` syntax

## Available Tables

### base.events

Decoded event logs from smart contract interactions. **This is the primary table for most queries.**

| Column | Type | Description |
| --- | --- | --- |
| log_id | String | Unique log identifier |
| block_number | UInt64 | Block number |
| block_hash | FixedString(66) | Block hash |
| block_timestamp | DateTime64(3, 'UTC') | Block timestamp (**INDEXED**) |
| transaction_hash | FixedString(66) | Transaction hash |
| transaction_to | FixedString(42) | Transaction recipient |
| transaction_from | FixedString(42) | Transaction sender |
| log_index | UInt32 | Log index within block |
| address | FixedString(42) | Contract address (**INDEXED**) |
| topics | Array(FixedString(66)) | Event topics |
| event_name | LowCardinality(String) | Decoded event name |
| event_signature | LowCardinality(String) | Event signature (**INDEXED** - prefer over event_name) |
| parameters | Map(String, Variant(Bool, Int256, String, UInt256)) | Decoded event parameters |
| parameter_types | Map(String, String) | ABI types for parameters |
| action | Enum8('removed' = -1, 'added' = 1) | Added or removed (reorg) |

### base.transactions

Complete transaction data.

| Column | Type | Description |
| --- | --- | --- |
| block_number | UInt64 | Block number |
| block_hash | String | Block hash |
| transaction_hash | String | Transaction hash |
| transaction_index | UInt64 | Index in block |
| from_address | String | Sender address |
| to_address | String | Recipient address |
| value | String | Value transferred (wei) |
| gas | UInt64 | Gas limit |
| gas_price | UInt64 | Gas price |
| input | String | Input data |
| nonce | UInt64 | Sender nonce |
| type | UInt64 | Transaction type |
| max_fee_per_gas | UInt64 | EIP-1559 max fee |
| max_priority_fee_per_gas | UInt64 | EIP-1559 priority fee |
| chain_id | UInt64 | Chain ID |
| v | String | Signature v |
| r | String | Signature r |
| s | String | Signature s |
| is_system_tx | Bool | System transaction flag |
| max_fee_per_blob_gas | String | Blob gas fee |
| blob_versioned_hashes | Array(String) | Blob hashes |
| timestamp | DateTime | Block timestamp |
| action | Int8 | Added (1) or removed (-1) |

### base.blocks

Block-level metadata.

| Column | Type | Description |
| --- | --- | --- |
| block_number | UInt64 | Block number |
| block_hash | String | Block hash |
| parent_hash | String | Parent block hash |
| timestamp | DateTime | Block timestamp |
| miner | String | Block producer |
| nonce | UInt64 | Block nonce |
| sha3_uncles | String | Uncles hash |
| transactions_root | String | Transactions merkle root |
| state_root | String | State merkle root |
| receipts_root | String | Receipts merkle root |
| logs_bloom | String | Bloom filter |
| gas_limit | UInt64 | Block gas limit |
| gas_used | UInt64 | Gas used in block |
| base_fee_per_gas | UInt64 | Base fee per gas |
| total_difficulty | String | Total chain difficulty |
| size | UInt64 | Block size in bytes |
| extra_data | String | Extra data field |
| mix_hash | String | Mix hash |
| withdrawals_root | String | Withdrawals root |
| parent_beacon_block_root | String | Beacon chain parent root |
| blob_gas_used | UInt64 | Blob gas used |
| excess_blob_gas | UInt64 | Excess blob gas |
| transaction_count | UInt64 | Number of transactions |
| action | Int8 | Added (1) or removed (-1) |

## Example Queries

### Get recent USDC Transfer events with decoded parameters

```sql
SELECT
  parameters['from'] AS sender,
  parameters['to'] AS to,
  parameters['value'] AS amount,
  address AS token_address
FROM base.events
WHERE
  event_signature = 'Transfer(address,address,uint256)'
  AND address = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
  AND block_timestamp >= now() - INTERVAL 7 DAY
LIMIT 10
```

### Get transactions from a specific address

```bash
npx awal@2.10.0 x402 pay https://x402.cdp.coinbase.com/platform/v2/data/query/run -X POST -d '{"sql": "SELECT transaction_hash, to_address, value, gas, timestamp FROM base.transactions WHERE from_address = lower('\''0xYOUR_ADDRESS'\'') AND timestamp >= now() - INTERVAL 1 DAY LIMIT 10"}' --json
```

### Count events by type for a contract in the last hour

```bash
npx awal@2.10.0 x402 pay https://x402.cdp.coinbase.com/platform/v2/data/query/run -X POST -d '{"sql": "SELECT event_signature, count(*) as cnt FROM base.events WHERE address = lower('\''0xCONTRACT_ADDRESS'\'') AND block_timestamp >= now() - INTERVAL 1 HOUR GROUP BY event_signature ORDER BY cnt DESC LIMIT 20"}' --json
```

### Get latest block info

```bash
npx awal@2.10.0 x402 pay https://x402.cdp.coinbase.com/platform/v2/data/query/run -X POST -d '{"sql": "SELECT block_number, timestamp, transaction_count, gas_used FROM base.blocks ORDER BY block_number DESC LIMIT 1"}' --json
```

## Common Contract Addresses (Base)

| Token | Address |
| --- | --- |
| USDC | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| WETH | `0x4200000000000000000000000000000000000006` |

## Best Practices

1. **Always filter on indexed fields** (`event_signature`, `address`, `block_timestamp`) in `base.events` queries.
2. **Never use `SELECT *`** - specify only the columns you need.
3. **Always include a `LIMIT`** clause to bound result size.
4. **Use `event_signature` instead of `event_name`** for filtering - it is indexed and much faster.
5. **Use time-bounded queries** with `block_timestamp` to narrow the scan range.
6. **Always wrap address values in `lower()`** - the database stores lowercase addresses but users may provide checksummed (mixed-case) addresses. Use `address = lower('0xAbC...')` not `address = '0xAbC...'`.
7. **Common event signatures**: `Transfer(address,address,uint256)`, `Approval(address,address,uint256)`, `Swap(address,uint256,uint256,uint256,uint256,address)`.

## Prerequisites

- Must be authenticated (`npx awal@2.10.0 status` to check; see `references/auth.md`)
- Wallet must have sufficient USDC balance (`npx awal@2.10.0 balance` to check; see `references/fund.md`)
- Each query costs $0.10 (100000 USDC atomic units)

## Error Handling

- "Not authenticated" - See `references/auth.md`
- "Insufficient balance" - See `references/fund.md`
- Query timeout or error - Ensure you are filtering on indexed fields and using a LIMIT
