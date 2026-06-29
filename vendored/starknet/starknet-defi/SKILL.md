---
name: starknet-defi
description: Execute DeFi operations on Starknet including token swaps via avnu aggregator, DCA recurring buys, STRK staking, and lending/borrowing. Supports gasless transactions.
license: Apache-2.0
metadata: {"author":"starknet-agentic","version":"1.0.0","org":"keep-starknet-strange"}
keywords: [starknet, defi, swap, dca, staking, lending, avnu, ekubo, jediswap, zklend, nostra, aggregator, yield]
allowed-tools: [Bash, Read, Write, Glob, Grep, Task]
user-invocable: true
---

# Starknet DeFi Skill

Execute DeFi operations on Starknet using avnu aggregator and native protocols.

## When to Use

- Swaps, DCA orders, staking, and lending or borrowing flows on Starknet.
- Agent workflows that need AVNU routing, paymaster support, or protocol-specific DeFi execution.

## When NOT to Use

- Plain wallet management without DeFi intent.
- Cairo contract authoring, deployment operations, or security auditing.

## Quick Start

1. Install the AVNU + starknet.js dependencies and point the skill at a funded Starknet account.
2. Use [skills catalog](../README.md) when the flow expands into wallet setup, deployment, or auditing.

## Prerequisites

```bash
npm install starknet@^8.9.1 @avnu/avnu-sdk@^4.0.1
```

## Token Swaps (avnu SDK v4)

### Get Quote and Execute Swap

```typescript
import { getQuotes, executeSwap, type QuoteRequest } from "@avnu/avnu-sdk";
import { Account, RpcProvider, ETransactionVersion } from "starknet";

const provider = new RpcProvider({ nodeUrl: process.env.STARKNET_RPC_URL });

// starknet.js v8: Account uses options object
const account = new Account({
  provider,
  address,
  signer: privateKey,
  transactionVersion: ETransactionVersion.V3,
});

// Resolve token addresses via avnu SDK (or use MCP server's TokenService)
import { fetchVerifiedTokenBySymbol } from '@avnu/avnu-sdk';

const eth = await fetchVerifiedTokenBySymbol('ETH');
const strk = await fetchVerifiedTokenBySymbol('STRK');

// SDK v4: getQuotes takes QuoteRequest object directly
const quoteParams: QuoteRequest = {
  sellTokenAddress: eth.address,
  buyTokenAddress: strk.address,
  sellAmount: BigInt(10 ** 17), // 0.1 ETH
  takerAddress: account.address,
};

const quotes = await getQuotes(quoteParams);
const bestQuote = quotes[0];

// SDK v4: executeSwap takes single object param
const result = await executeSwap({
  provider: account,
  quote: bestQuote,
  slippage: 0.01, // 1%
  executeApprove: true,
});
console.log("Tx:", result.transactionHash);
```

### Quote Response Fields (SDK v4)

```typescript
interface Quote {
  quoteId: string;
  sellTokenAddress: string;
  buyTokenAddress: string;
  sellAmount: bigint;
  buyAmount: bigint;
  sellAmountInUsd: number;
  buyAmountInUsd: number;
  priceImpact: number;        // In basis points (15 = 0.15%)
  gasFeesInUsd: number;
  routes: Array<{
    name: string;             // e.g., "Ekubo", "JediSwap"
    percent: number;          // e.g., 0.8 = 80%
  }>;
  fee: {
    avnuFees: bigint;
    integratorFees: bigint;
  };
}
```

### Build Swap Calls (for multicall composition)

```typescript
import { quoteToCalls } from "@avnu/avnu-sdk";

const calls = await quoteToCalls({
  quote: bestQuote,
  takerAddress: account.address,
  slippage: 0.01,
  includeApprove: true,
});
// `calls` can be combined with other calls in account.execute([...calls, ...otherCalls])
```

### Gasless Swap (Pay Gas in Token) - SDK v4 + PaymasterRpc

```typescript
import { getQuotes, executeSwap } from "@avnu/avnu-sdk";
import { PaymasterRpc } from "starknet";

const quotes = await getQuotes(quoteParams);
const bestQuote = quotes[0];

// SDK v4: Use PaymasterRpc from starknet.js
// Mainnet: https://starknet.paymaster.avnu.fi
// Sepolia: https://sepolia.paymaster.avnu.fi
const paymaster = new PaymasterRpc({
  nodeUrl: process.env.AVNU_PAYMASTER_URL || "https://starknet.paymaster.avnu.fi",
});

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
        gasToken: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8", // USDC
      },
    },
  },
});
```

## DCA (Dollar Cost Averaging)

### Create DCA Order

```typescript
import { executeCreateDca } from "@avnu/avnu-sdk";
import moment from "moment";

const dcaOrder = {
  sellTokenAddress: usdcAddress,
  buyTokenAddress: strkAddress,
  totalAmount: parseUnits("100", 6),   // Total 100 USDC
  numberOfOrders: 10,                   // Split into 10 orders
  frequency: moment.duration(1, "day"), // moment.Duration object, not string
  startAt: Math.floor(Date.now() / 1000),
};

const result = await executeCreateDca({
  provider: account,
  order: dcaOrder,
});
```

### Check and Cancel DCA

```typescript
import { getDcaOrders, executeCancelDca, DcaOrderStatus } from "@avnu/avnu-sdk";

const orders = await getDcaOrders({
  traderAddress: account.address,
  status: DcaOrderStatus.OPEN,  // Use enum, not string
});

// Cancel an order
await executeCancelDca({
  provider: account,
  orderAddress: orders[0].orderAddress,
});
```

## STRK Staking

### Stake STRK

```typescript
import { executeStake, getAvnuStakingInfo } from "@avnu/avnu-sdk";

// Get pool info
const stakingInfo = await getAvnuStakingInfo();
// stakingInfo.pools[0] = { address, apy, tvl, token, minStake }

const result = await executeStake({
  provider: account,
  poolAddress: stakingInfo.pools[0].address,
  amount: parseUnits("100", 18), // 100 STRK
});
```

### Get User Staking Info

```typescript
import { getUserStakingInfo } from "@avnu/avnu-sdk";

const userInfo = await getUserStakingInfo(TOKENS.STRK, account.address);
console.log("Staked:", userInfo.amount);
console.log("Unclaimed rewards:", userInfo.unclaimedRewards);
```

### Claim Rewards

```typescript
import { executeClaimRewards } from "@avnu/avnu-sdk";

// Claim and restake (compound)
await executeClaimRewards({
  provider: account,
  poolAddress: poolAddress,
  restake: true,
});
```

### Unstake

```typescript
import { executeInitiateUnstake, executeUnstake } from "@avnu/avnu-sdk";

// Step 1: Initiate (starts cooldown -- 21 days for STRK)
await executeInitiateUnstake({
  provider: account,
  poolAddress: poolAddress,
  amount: parseUnits("50", 18),
});

// Step 2: Complete unstake (after cooldown period)
await executeUnstake({
  provider: account,
  poolAddress: poolAddress,
});
```

## Market Data

### Token Prices

```typescript
import { getPrices, fetchTokens, fetchVerifiedTokenBySymbol } from "@avnu/avnu-sdk";

// Get token by symbol
const strk = await fetchVerifiedTokenBySymbol("STRK");

// Get prices for multiple tokens
const prices = await getPrices([ethAddress, strkAddress, usdcAddress]);
// prices = { "0x049d...": 3200.50, "0x047...": 1.23, ... }

// Browse tokens with pagination
const tokens = await fetchTokens({ page: 0, size: 20, tags: ["verified"] });
```

## Protocol Reference

| Protocol | Operations | Notes |
|----------|-----------|-------|
| **avnu** | Swap aggregation, DCA, gasless | Best-price routing across all DEXs |
| **Ekubo** | AMM, concentrated liquidity | Highest TVL on Starknet |
| **JediSwap** | AMM, classic pools | V2 with concentrated liquidity |
| **zkLend** | Lending, borrowing | Variable and stable rates |
| **Nostra** | Lending, borrowing | Multi-asset pools |

## Configuration

| Variable | Purpose | Default |
|----------|---------|---------|
| `STARKNET_RPC_URL` | Starknet JSON-RPC endpoint | Required |
| `STARKNET_ACCOUNT_ADDRESS` | Agent's account address | Required |
| `STARKNET_PRIVATE_KEY` | Agent's signing key | Required |
| `AVNU_BASE_URL` | avnu API base URL | `https://starknet.api.avnu.fi` |
| `AVNU_PAYMASTER_URL` | avnu paymaster URL | `https://starknet.paymaster.avnu.fi` |
| `AVNU_API_KEY` | Optional avnu integrator key | None |

### avnu URL Reference

| Network | API URL | Paymaster URL |
|---------|---------|---------------|
| Mainnet | `https://starknet.api.avnu.fi` | `https://starknet.paymaster.avnu.fi` |
| Sepolia | `https://sepolia.api.avnu.fi` | `https://sepolia.paymaster.avnu.fi` |

## Error Handling

```typescript
async function safeSwap(account, quote, slippage = 0.01) {
  try {
    return await executeSwap({
      provider: account,
      quote,
      slippage,
      executeApprove: true,
    });
  } catch (error) {
    if (error.message?.includes("INSUFFICIENT_BALANCE")) {
      throw new Error("Not enough tokens for swap");
    }
    if (error.message?.includes("SLIPPAGE") || error.message?.includes("Insufficient tokens received")) {
      // Retry with higher slippage
      return await executeSwap({
        provider: account,
        quote,
        slippage: slippage * 2,
        executeApprove: true,
      });
    }
    if (error.message?.includes("QUOTE_EXPIRED")) {
      throw new Error("Quote expired. Please retry the operation.");
    }
    if (error.message?.includes("INSUFFICIENT_LIQUIDITY")) {
      throw new Error("Insufficient liquidity. Try a smaller amount.");
    }
    throw error;
  }
}
```

## References

- [avnu SDK Documentation](https://docs.avnu.fi/)
- [avnu Skill (detailed)](https://github.com/avnu-labs/avnu-skill)
- [Ekubo Protocol](https://docs.ekubo.org/)
- [zkLend Documentation](https://docs.zklend.com/)
- [Nostra Finance](https://docs.nostra.finance/)
