# Onchain OS Gateway — CLI Command Reference

Detailed parameter tables, return field schemas, and usage examples for all 6 gateway commands.

## 1. onchainos gateway chains

Get supported chains for gateway. No parameters required.

```bash
onchainos gateway chains
```

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `chainIndex` | String | Chain identifier (e.g., `"1"`, `"501"`) |
| `name` | String | Human-readable chain name (e.g., `"Ethereum"`) |
| `logoUrl` | String | Chain logo image URL |
| `shortName` | String | Chain short name (e.g., `"ETH"`) |

## 2. onchainos gateway gas

Get current gas prices for a chain.

```bash
onchainos gateway gas --chain <chain>
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--chain` | Yes | - | Chain name (e.g., `ethereum`, `solana`, `xlayer`) |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `normal` | String | Normal gas price (legacy) |
| `min` | String | Minimum gas price |
| `max` | String | Maximum gas price |
| `supporteip1559` | Boolean | Whether EIP-1559 is supported |
| `eip1559Protocol.suggestBaseFee` | String | Suggested base fee |
| `eip1559Protocol.baseFee` | String | Current base fee |
| `eip1559Protocol.proposePriorityFee` | String | Proposed priority fee |
| `eip1559Protocol.safePriorityFee` | String | Safe (slow) priority fee |
| `eip1559Protocol.fastPriorityFee` | String | Fast priority fee |

For Solana chains: `proposePriorityFee`, `safePriorityFee`, `fastPriorityFee`, `extremePriorityFee`.

## 3. onchainos gateway gas-limit

Estimate gas limit for a transaction.

```bash
onchainos gateway gas-limit --from <address> --to <address> --chain <chain> [--amount <amount>] [--data <hex>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--from` | Yes | - | Sender address |
| `--to` | Yes | - | Recipient / contract address |
| `--chain` | Yes | - | Chain name |
| `--amount` | No | `"0"` | Transfer value in minimal units |
| `--data` | No | - | Encoded calldata (hex, for contract interactions) |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `gasLimit` | String | Estimated gas limit for the transaction |

## 4. onchainos gateway simulate

Simulate a transaction (dry-run).

```bash
onchainos gateway simulate --from <address> --to <address> --data <hex> --chain <chain> [--amount <amount>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--from` | Yes | - | Sender address |
| `--to` | Yes | - | Recipient / contract address |
| `--data` | Yes | - | Encoded calldata (hex) |
| `--chain` | Yes | - | Chain name |
| `--amount` | No | `"0"` | Transfer value in minimal units |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `intention` | String | Transaction intent description |
| `assetChange[]` | Array | Asset changes from the simulation |
| `assetChange[].symbol` | String | Token symbol |
| `assetChange[].rawValue` | String | Raw amount change |
| `gasUsed` | String | Gas consumed in simulation |
| `failReason` | String | Failure reason (empty string = success) |
| `risks[]` | Array | Risk information |

## 5. onchainos gateway broadcast

Broadcast a signed transaction.

```bash
onchainos gateway broadcast --signed-tx <tx> --address <address> --chain <chain> [--mev-protection]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--signed-tx` | Yes | - | Fully signed transaction (hex for EVM, base58 for Solana) |
| `--address` | Yes | - | Sender wallet address |
| `--chain` | Yes | - | Chain name |
| `--mev-protection` | No | `false` | Boolean flag (no value). Enable MEV protection on EVM chains — sends `enableMevProtection: true`. See the SKILL's MEV Protection section for per-chain support. |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `orderId` | String | OKX order tracking ID (use for order status queries) |
| `txHash` | String | On-chain transaction hash |

## 6. onchainos gateway orders

Track broadcast order status.

```bash
onchainos gateway orders --address <address> --chain <chain> [--order-id <id>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--address` | Yes | - | Wallet address |
| `--chain` | Yes | - | Chain name |
| `--order-id` | No | - | Specific order ID (from broadcast response) |

**Return fields**:

| Field | Type | Description |
|---|---|---|
| `cursor` | String | Pagination cursor for next page |
| `orders[]` | Array | List of order objects |
| `orders[].orderId` | String | OKX order tracking ID |
| `orders[].txHash` | String | On-chain transaction hash |
| `orders[].chainIndex` | String | Chain identifier |
| `orders[].address` | String | Wallet address |
| `orders[].txStatus` | String | Transaction status: `1` = Pending, `2` = Success, `3` = Failed |
| `orders[].failReason` | String | Failure reason (empty if successful) |

## Input / Output Examples

**User says:** "What's the current gas price on XLayer?"

```bash
onchainos gateway gas --chain xlayer
# -> Display:
#   Base fee: 0.05 Gwei
#   Max fee: 0.1 Gwei
#   Priority fee: 0.01 Gwei
```

**User says:** "Simulate this swap transaction before I send it"

```bash
onchainos gateway simulate --from 0xYourWallet --to 0xDexContract --data 0x... --chain xlayer --amount 1000000000000000000
# -> Display:
#   Simulation: SUCCESS
#   Estimated gas: 145,000
#   Intent: Token Swap
```

**User says:** "Broadcast my signed transaction"

```bash
onchainos gateway broadcast --signed-tx 0xf86c...signed --address 0xYourWallet --chain xlayer
# -> Display:
#   Broadcast successful!
#   Order ID: 123456789
#   Tx Hash: 0xabc...def
```

**User says:** "Check the status of my broadcast order"

```bash
onchainos gateway orders --address 0xYourWallet --chain xlayer --order-id 123456789
# -> Display:
#   Order 123456789: Success (txStatus=2)
#   Tx Hash: 0xabc...def
#   Confirmed on-chain
```
