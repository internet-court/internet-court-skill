# Starknet Wallet Scripts

Example scripts demonstrating wallet operations on Starknet.

## Setup

```bash
cd skills/starknet-wallet
npm install
```

Create a `.env` file:
```bash
STARKNET_RPC_URL=https://starknet-sepolia.g.alchemy.com/v2/YOUR_KEY
STARKNET_ACCOUNT_ADDRESS=0x...
STARKNET_PRIVATE_KEY=0x...
```

## Available Scripts

### Check Balance (Single Token)

```bash
npm run check-balance
```

Checks the balance of a single token (ETH by default). Uses the MCP server's `starknet_get_balance` tool.

**Usage:**
```typescript
// Edit check-balance.ts to change the token
const token = "ETH";  // or "STRK", "USDC", "USDT", or contract address
```

### Check Multiple Balances (Batch)

```bash
npm run check-balances
```

Efficiently queries multiple token balances in a single RPC call using the BalanceChecker contract.

**Features:**
- Queries up to 200 tokens at once
- Single RPC call (very efficient)
- Automatic fallback to batch RPC if contract unavailable
- Formatted output with token symbols and amounts

**Usage:**
```typescript
// Edit check-balances.ts to customize tokens
const tokens = ["ETH", "STRK", "USDC", "USDT"];
```

## Script Structure

Each script demonstrates:
1. Environment setup and validation
2. Connection to Starknet via RPC
3. Executing operations (balance queries, transfers, etc.)
4. Error handling and result formatting
5. Best practices for working with MCP tools

## Adding New Scripts

To add a new script:

1. Create a new TypeScript file in `scripts/`
2. Add npm script to `package.json`:
   ```json
   {
     "scripts": {
       "your-script": "tsx scripts/your-script.ts"
     }
   }
   ```
3. Follow the pattern from existing scripts
4. Document usage in this README

## Common Patterns

### Token Amount Conversion

```typescript
import { cairo } from "starknet";

// Human readable → Wei (for transfers)
const amountWei = BigInt(1.5 * 10**18);  // 1.5 ETH
const uint256Amount = cairo.uint256(amountWei);

// Wei → Human readable (from balance queries)
const balanceBigInt = BigInt(balance.low) + (BigInt(balance.high) << 128n);
const humanReadable = Number(balanceBigInt) / 10**decimals;
```

### Error Handling

```typescript
try {
  const result = await operation();
  console.log("Success:", result);
} catch (error) {
  if (error.message.includes("INSUFFICIENT_BALANCE")) {
    console.error("Not enough tokens");
  } else if (error.message.includes("INVALID_NONCE")) {
    console.error("Nonce mismatch - retry");
  } else {
    console.error("Error:", error.message);
  }
}
```

## References

- [Starknet.js Documentation](https://www.starknetjs.com/)
- [MCP Server Tools](../../packages/starknet-mcp-server/README.md)
- [AVNU SDK](https://docs.avnu.fi/)
