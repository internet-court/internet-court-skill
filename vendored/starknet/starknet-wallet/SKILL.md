---
name: starknet-wallet
description: Create and manage Starknet wallets for AI agents. Transfer tokens, check balances, manage session keys, deploy accounts, and interact with smart contracts using native Account Abstraction.
license: Apache-2.0
metadata: {"author":"starknet-agentic","version":"1.0.0","org":"keep-starknet-strange"}
keywords: [starknet, wallet, transfer, balance, session-keys, account-abstraction, paymaster, gasless, agent-wallet, strk, eth]
allowed-tools: [Bash, Read, Write, Glob, Grep, Task]
user-invocable: true
---

# Starknet Wallet Skill

Manage Starknet wallets for AI agents with native Account Abstraction support.

## When to Use

- Creating, funding, and operating Starknet accounts for agent workflows.
- Checking balances, sending transfers, managing session keys, or invoking contracts from an agent wallet.

## When NOT to Use

- DeFi-specific routing, staking, or lending flows better covered by `starknet-defi`.
- Cairo contract authoring, deployment-only operations, or security auditing.

## Quick Start

1. Install the SDK dependencies and set Starknet RPC/account environment variables.
2. Use [skills catalog](../README.md) to pivot to adjacent modules like DeFi, deployment, or auditing.

## Prerequisites

```bash
npm install starknet@^8.9.1 @avnu/avnu-sdk@^4.0.1
```

Environment variables:
```
STARKNET_RPC_URL=https://starknet-mainnet.g.alchemy.com/v2/YOUR_KEY
STARKNET_ACCOUNT_ADDRESS=0x...
STARKNET_PRIVATE_KEY=0x...
AVNU_BASE_URL=https://starknet.api.avnu.fi (optional)
AVNU_PAYMASTER_URL=https://starknet.paymaster.avnu.fi (optional)
AVNU_PAYMASTER_API_KEY=your_key (optional, for free gas)
```

## Available MCP Tools

The Starknet MCP Server provides these tools for wallet operations:

| Tool | Purpose | Key Features |
|------|---------|--------------|
| `starknet_get_balance` | Check single token balance | Simple, fast queries |
| `starknet_get_balances` | Check multiple token balances | Batch queries (up to 200 tokens), single RPC call |
| `starknet_transfer` | Send tokens | Supports gasless mode (paymaster) |
| `starknet_call_contract` | Read contract state | Call view functions |
| `starknet_invoke_contract` | Execute contract functions | Write operations, supports gasless |
| `starknet_swap` | Execute token swaps | AVNU integration, best price routing |
| `starknet_get_quote` | Get swap quotes | Price estimation before swap |
| `starknet_register_agent` | Register agent identity | ERC-8004 on-chain identity |

### Balance Tools Detail

#### starknet_get_balance (Single Token)

Query balance for one token. Use for simple cases.

**Input:**
- `token` (required): Token symbol (ETH, STRK, USDC, USDT) or contract address
- `address` (optional): Wallet address (defaults to agent's address)

**Response:**
```json
{
  "address": "0x...",
  "token": "ETH",
  "tokenAddress": "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
  "balance": "1.5",
  "raw": "1500000000000000000",
  "decimals": 18
}
```

#### starknet_get_balances (Multiple Tokens)

Query balances for multiple tokens in a single RPC call. More efficient for portfolio views.

**Input:**
- `tokens` (required): Array of token symbols or addresses (max 200)
- `address` (optional): Wallet address

**Response:**
```json
{
  "address": "0x...",
  "balances": [
    { "token": "ETH", "tokenAddress": "0x...", "balance": "1.5", "raw": "...", "decimals": 18 },
    { "token": "USDC", "tokenAddress": "0x...", "balance": "100", "raw": "...", "decimals": 6 }
  ],
  "tokensQueried": 2,
  "method": "balance_checker"
}
```

**When to use:**
- **starknet_get_balance**: Quick single-token check
- **starknet_get_balances**: Portfolio overview, multi-token operations

## Core Operations

### Check Balance (Single Token)

Use the `starknet_get_balance` MCP tool for simple single-token queries:

```typescript
// Via MCP tool (recommended)
const result = await mcpClient.callTool({
  name: "starknet_get_balance",
  arguments: {
    address: "0x...",  // Account address
    token: "ETH",      // Symbol (ETH, STRK, USDC, USDT) or contract address
  }
});
// Returns: { address, token, tokenAddress, balance, raw, decimals }
```

**Direct starknet.js usage:**

```typescript
import { RpcProvider, Contract } from "starknet";

const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });

// ETH balance (starknet.js v8 uses options object for Contract)
const ethAddress = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
const ethContract = new Contract({
  abi: erc20Abi,
  address: ethAddress,
  providerOrAccount: provider,
});
const balance = await ethContract.balanceOf(accountAddress);

// starknet.js v8: Convert uint256 to bigint
const balanceBigInt = BigInt(balance.low) + (BigInt(balance.high) << 128n);
// Format: (balanceBigInt / 10n ** 18n).toString() for whole units
```

### Check Multiple Balances (Batch)

Use `starknet_get_balances` for efficient multi-token queries (single RPC call):

```typescript
// Via MCP tool (recommended for multiple tokens)
const result = await mcpClient.callTool({
  name: "starknet_get_balances",
  arguments: {
    address: "0x...",
    tokens: ["ETH", "STRK", "USDC", "USDT"],  // Up to 200 tokens
  }
});

// Returns:
// {
//   address: "0x...",
//   balances: [
//     { token: "ETH", tokenAddress: "0x...", balance: "1.5", raw: "1500000000000000000", decimals: 18 },
//     { token: "STRK", tokenAddress: "0x...", balance: "100", raw: "100000000000000000000", decimals: 18 },
//     ...
//   ],
//   tokensQueried: 4,
//   method: "balance_checker"  // Uses BalanceChecker contract for efficiency
// }
```

**Direct starknet.js usage with BalanceChecker contract:**

```typescript
import { RpcProvider, Contract } from "starknet";

const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });

// BalanceChecker contract (returns non-zero balances only)
const BALANCE_CHECKER_ADDRESS = "0x031ce64a666fbf9a2b1b2ca51c2af60d9a76d3b85e5fbfb9d5a8dbd3fedc9716";
const BALANCE_CHECKER_ABI = [
  {
    type: "struct",
    name: "core::integer::u256",
    members: [
      { name: "low", type: "core::integer::u128" },
      { name: "high", type: "core::integer::u128" },
    ],
  },
  {
    type: "struct",
    name: "governance::balance_checker::NonZeroBalance",
    members: [
      { name: "token", type: "core::starknet::contract_address::ContractAddress" },
      { name: "balance", type: "core::integer::u256" },
    ],
  },
  {
    type: "function",
    name: "get_balances",
    inputs: [
      { name: "address", type: "core::starknet::contract_address::ContractAddress" },
      { name: "tokens", type: "core::array::Span::<core::starknet::contract_address::ContractAddress>" },
    ],
    outputs: [{ type: "core::array::Span::<governance::balance_checker::NonZeroBalance>" }],
    state_mutability: "view",
  },
];

const balanceChecker = new Contract({
  abi: BALANCE_CHECKER_ABI,
  address: BALANCE_CHECKER_ADDRESS,
  providerOrAccount: provider,
});

// Query multiple tokens at once
const tokens = [
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7", // ETH
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d", // STRK
  "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8", // USDC
];

const result = await balanceChecker.get_balances(accountAddress, tokens);

// Parse response (only non-zero balances returned)
for (const item of result) {
  const tokenAddr = "0x" + BigInt(item.token).toString(16).padStart(64, "0");
  const balance = BigInt(item.balance); // starknet.js converts u256 to bigint
  console.log(`${tokenAddr}: ${balance}`);
}
```

**When to use which:**
- `starknet_get_balance`: Single token, simple use case
- `starknet_get_balances`: Multiple tokens, portfolio view, more efficient


### Transfer Tokens

Use the `starknet_transfer` MCP tool with optional gasless mode:

```typescript
// Via MCP tool (recommended)
const result = await mcpClient.callTool({
  name: "starknet_transfer",
  arguments: {
    recipient: "0x...",
    token: "STRK",        // Symbol or contract address
    amount: "10.5",       // Human-readable amount
    gasfree: false,       // Optional: use paymaster
  }
});
// Returns: { transactionHash, recipient, token, amount, gasfree }
```

**Gasless Transfer (Pay gas in token instead of ETH/STRK):**

```typescript
// Pay gas in USDC instead of ETH/STRK
const result = await mcpClient.callTool({
  name: "starknet_transfer",
  arguments: {
    recipient: "0x...",
    token: "STRK",
    amount: "100",
    gasfree: true,
    gasToken: "USDC",    // Gas paid in USDC
  }
});
```

**Direct starknet.js usage:**

```typescript
import { Account, RpcProvider, CallData, cairo, ETransactionVersion } from "starknet";

const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });

// starknet.js v8: Account uses options object
const account = new Account({
  provider,
  address: process.env.STARKNET_ACCOUNT_ADDRESS,
  signer: process.env.STARKNET_PRIVATE_KEY,
  transactionVersion: ETransactionVersion.V3,
});

const tokenAddress = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"; // STRK

// starknet.js v8: Use cairo.uint256() instead of uint256.bnToUint256()
const { transaction_hash } = await account.execute({
  contractAddress: tokenAddress,
  entrypoint: "transfer",
  calldata: CallData.compile({
    recipient: recipientAddress,
    amount: cairo.uint256(amountInWei),
  }),
});
await account.waitForTransaction(transaction_hash);
```

### Estimate Fees

```typescript
const estimatedFee = await account.estimateInvokeFee({
  contractAddress: tokenAddress,
  entrypoint: "transfer",
  calldata: CallData.compile({
    recipient: recipientAddress,
    amount: cairo.uint256(amountInWei),
  }),
});
// estimatedFee.overall_fee -- total fee in STRK (V3 transactions)
```

### Contract Interactions

**Read contract state (view functions):**

```typescript
// Via MCP tool
const result = await mcpClient.callTool({
  name: "starknet_call_contract",
  arguments: {
    contractAddress: "0x...",
    entrypoint: "balanceOf",
    calldata: [accountAddress],
  }
});
```

**Write to contracts (state-changing functions):**

```typescript
// Via MCP tool with gasless option
const result = await mcpClient.callTool({
  name: "starknet_invoke_contract",
  arguments: {
    contractAddress: "0x...",
    entrypoint: "approve",
    calldata: [spenderAddress, ...uint256Amount],
    gasfree: true,         // Optional: use paymaster
    gasToken: "USDC",      // Optional: pay gas in token
  }
});
```

### Multi-Call (Batch Transactions)

```typescript
// Execute multiple operations in a single transaction
const { transaction_hash } = await account.execute([
  {
    contractAddress: tokenA,
    entrypoint: "approve",
    calldata: CallData.compile({
      spender: routerAddress,
      amount: cairo.uint256(amount),
    }),
  },
  {
    contractAddress: routerAddress,
    entrypoint: "swap",
    calldata: CallData.compile({ /* swap params */ }),
  },
]);
```

### Gasless Transfer (Pay Gas in Token) - SDK v4 + PaymasterRpc

```typescript
import { getQuotes, executeSwap } from "@avnu/avnu-sdk";
import { PaymasterRpc } from "starknet";

// SDK v4: Use PaymasterRpc from starknet.js
// Mainnet: https://starknet.paymaster.avnu.fi
// Sepolia: https://sepolia.paymaster.avnu.fi
const paymaster = new PaymasterRpc({
  nodeUrl: process.env.AVNU_PAYMASTER_URL || "https://starknet.paymaster.avnu.fi",
});

// Any swap can be made gasless by adding paymaster option
const result = await executeSwap({
  provider: account,
  quote: bestQuote,
  slippage: 0.01,
  executeApprove: true,
  paymaster: {
    active: true,
    provider: paymaster,
    params: {
      feeMode: {
        mode: "default",
        gasToken: usdcAddress, // Pay gas in USDC instead of ETH/STRK
      },
    },
  },
});
```

## Token Resolution

The MCP server uses TokenService to resolve token symbols and addresses. Static tokens (ETH, STRK, USDC, USDT) are always available. For other tokens, the service fetches metadata from avnu SDK.

```typescript
import { fetchTokenByAddress, fetchVerifiedTokenBySymbol } from '@avnu/avnu-sdk';

// Get token by symbol (verified tokens only)
const lords = await fetchVerifiedTokenBySymbol('LORDS');
console.log(lords.address, lords.decimals); // 0x0124aeb..., 18

// Get token by address (any token)
const token = await fetchTokenByAddress('0x...');
console.log(token.symbol, token.name, token.decimals);

// Get all verified tokens
import { fetchTokens } from '@avnu/avnu-sdk';
const page = await fetchTokens({ tags: ['Verified'], size: 100 });
page.content.forEach(t => console.log(t.symbol, t.address));
```

Static tokens available without network calls: ETH, STRK, USDC, USDT

## Session Keys (Agent Autonomy)

Session keys allow agents to execute pre-approved transactions without per-action human approval:

1. Human owner creates a session key with policies:
   - Allowed contract addresses and methods
   - Maximum spending per transaction/period
   - Expiry timestamp
2. Agent uses the session key for autonomous operations
3. Owner can revoke at any time

Reference implementation: [Cartridge Controller](https://docs.cartridge.gg/controller/getting-started)

## Configuration

| Variable | Purpose | Default |
|----------|---------|---------|
| `STARKNET_RPC_URL` | Starknet JSON-RPC endpoint | Required |
| `STARKNET_ACCOUNT_ADDRESS` | Agent's account address | Required |
| `STARKNET_PRIVATE_KEY` | Agent's signing key | Required |
| `AVNU_BASE_URL` | avnu API base URL | `https://starknet.api.avnu.fi` |
| `AVNU_PAYMASTER_URL` | avnu paymaster URL | `https://starknet.paymaster.avnu.fi` |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `INSUFFICIENT_BALANCE` | Not enough tokens | Check balance before transfer |
| `INVALID_NONCE` | Nonce mismatch | Retry with fresh nonce |
| `TRANSACTION_REVERTED` | Contract execution failed | Check calldata and allowances |
| `FEE_TRANSFER_FAILURE` | Can't pay gas fee | Use paymaster or add ETH/STRK |

## References

- [starknet.js Documentation](https://www.starknetjs.com/)
- [Starknet Account Abstraction](https://www.starknet.io/blog/native-account-abstraction/)
- [Session Keys Guide](https://www.starknet.io/blog/session-keys-on-starknet-unlocking-gasless-secure-transactions/)
- [avnu Paymaster](https://docs.avnu.fi/paymaster)
