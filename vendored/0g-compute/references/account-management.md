# Account Management Reference

Complete guide for managing accounts and funds in 0G Compute Network.

## Overview

The 0G Compute Network uses a unified account system for managing funds across all services. Understanding this system is crucial for using inference and fine-tuning services effectively.

## Account Structure

### Main Account

Your primary account where all deposits from your wallet go first. Think of it as your "bank account" within the 0G Compute Network.

- Receives all deposits from your wallet
- Source for transfers to provider sub-accounts
- Destination for refunds from sub-accounts
- Source for withdrawals back to your wallet

### Sub-Accounts

Provider-specific accounts created automatically when you transfer funds to a provider. Each provider has a separate sub-account.

- One sub-account per provider
- Funds locked exclusively for that provider's services
- Providers deduct fees directly from their sub-account
- Can request refunds back to main account (with 24-hour lock period)

## Fund Flow Diagram

```
Your Wallet
    ↓ deposit
Main Account
    ↓ transfer-fund
Provider Sub-Accounts
    ↓ service usage
[Provider deducts fees]
    ↓ retrieve-fund (24h lock)
Main Account
    ↓ withdraw/refund
Your Wallet
```

### Detailed Flow

1. **Deposit**: Transfer 0G tokens from your wallet to Main Account
2. **Transfer**: Move funds from Main Account to Provider Sub-Accounts
3. **Usage**: Providers automatically deduct from their Sub-Account for services
4. **Refund Request**: Initiate refund from Sub-Account (enters 24-hour lock period)
5. **Complete Refund**: After lock expires, call retrieve-fund again to complete transfer to Main Account
6. **Withdraw**: Transfer funds from Main Account back to your wallet

## Security Features

### 24-Hour Lock Period

When you request a refund from a provider sub-account:

- Funds enter a 24-hour lock period
- This protects providers from abuse
- After 24 hours, call `retrieve-fund` again to complete the transfer
- Check lock status with `get-sub-account` command

### Single-Use Authentication

- Each request uses unique authentication
- Prevents replay attacks
- Automatically handled by SDK/CLI

### On-Chain Verification

- All transactions recorded on blockchain
- Full transparency and auditability
- Verifiable provider interactions

### Provider Acknowledgment

- Must acknowledge provider before first use
- One-time setup per provider
- Ensures you agree to provider's terms

## CLI Commands

### Setup

```bash
# Choose network (testnet or mainnet)
0g-compute-cli setup-network

# Login with wallet private key
0g-compute-cli login
```

### Deposit Funds

Add 0G tokens from your wallet to Main Account:

```bash
0g-compute-cli deposit --amount 10

# With custom gas price
0g-compute-cli deposit --amount 10 --gas-price 20000000000
```

### Check Balance

View complete account overview:

```bash
0g-compute-cli get-account
```

**Example Output:**

```
Overview
┌──────────────────────────────────────────────────┬─────────────────────────────────────────────────────┐
│ Balance                                          │ Value (0G)                                          │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤
│ Total                                            │ 8.822778129999999663                                │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤
│ Locked (transferred to sub-accounts)             │ 8.257334240000000491                                │
├──────────────────────────────────────────────────┼─────────────────────────────────────────────────────┤
│ Available for transfer to sub-accounts           │ 0.265443889999999960                                │
└──────────────────────────────────────────────────┴─────────────────────────────────────────────────────┘

Inference sub-accounts
┌────────────────────────┬──────────────────────────────┬────────────────────────────────────────────────┐
│ Provider               │ Balance (0G)                 │ Requested Return to Main Account (0G)          │
├────────────────────────┼──────────────────────────────┼────────────────────────────────────────────────┤
│ 0x924A2c71...          │ 3.257334240000000047         │ 0.000000000000000000                           │
├────────────────────────┼──────────────────────────────┼────────────────────────────────────────────────┤
│ 0x960E74Fc...          │ 3.000000000000000000         │ 3.000000000000000000                           │
├────────────────────────┼──────────────────────────────┼────────────────────────────────────────────────┤
│ 0x4f371f6e...          │ 3.299999999999999822         │ 0.000000000000000000                           │
└────────────────────────┴──────────────────────────────┴────────────────────────────────────────────────┘
```

**Understanding the Output:**

- **Total**: Total balance across all accounts
- **Locked**: Sum of all funds in provider sub-accounts
- **Available**: Funds in Main Account ready to transfer
- **Provider columns**:
  - Balance: Current funds with provider
  - Requested Return: Funds in refund process (24h lock)

### Check Sub-Account Details

View specific provider sub-account:

```bash
0g-compute-cli get-sub-account --provider <PROVIDER_ADDRESS>
```

**Example Output with Pending Refund:**

```
Details of Each Amount Applied for Return to Main Account
┌──────────────────────────────────────────────────┬──────────────────────────────────────────────────┐
│ Amount (0G)                                      │ Remaining Locked Time                            │
├──────────────────────────────────────────────────┼──────────────────────────────────────────────────┤
│ 0.099785050000000000                             │ 23h 43min 15s                                    │
└──────────────────────────────────────────────────┴──────────────────────────────────────────────────┘
```

### Transfer to Provider

Move funds from Main Account to Provider Sub-Account:

```bash
0g-compute-cli transfer-fund --provider <PROVIDER_ADDRESS> --amount 5
```

**When to use:**

- Before using a provider's service
- When sub-account balance runs low
- Based on expected usage

### Request Refund (Two-Step Process)

Return unused funds from sub-account to Main Account:

```bash
# Step 1: Initiate refund (starts 24h lock)
0g-compute-cli retrieve-fund

# Step 2: After 24 hours, complete the refund
0g-compute-cli retrieve-fund
```

**Important:**

- First call: Initiates refund, starts 24-hour lock
- Second call: After 24 hours, completes transfer to Main Account
- Check lock status: `0g-compute-cli get-sub-account --provider <ADDRESS>`
- Applies to ALL sub-accounts with available balance

### Withdraw to Wallet

Transfer funds from Main Account back to your wallet:

```bash
0g-compute-cli refund --amount 5
```

## SDK Integration

### Initialize Broker

```typescript
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

const RPC_URL = process.env.NODE_ENV === 'production'
  ? "https://evmrpc.0g.ai"  // Mainnet
  : "https://evmrpc-testnet.0g.ai";  // Testnet

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const broker = await createZGComputeNetworkBroker(wallet);
```

### Check Account Balance

```typescript
// Get account overview
const account = await broker.ledger.getLedger();

console.log(`Total Balance: ${ethers.formatEther(account.totalBalance)} 0G`);
console.log(`Available: ${ethers.formatEther(account.availableBalance)} 0G`);
console.log(`Locked: ${ethers.formatEther(account.lockedBalance)} 0G`);
```

### Deposit Funds

```typescript
// Deposit 10 0G to Main Account
await broker.ledger.depositFund(10);

// Or use Wei units
const amount = ethers.parseEther("10");
await broker.ledger.depositFund(amount);
```

### Transfer to Provider

```typescript
const providerAddress = "<PROVIDER_ADDRESS>";

// Transfer 5 0G to inference sub-account
const amount = ethers.parseEther("5");
await broker.ledger.transferFund(providerAddress, "inference", amount);

// Transfer to fine-tuning sub-account
await broker.ledger.transferFund(providerAddress, "fine-tuning", amount);
```

### Check Sub-Account Details

```typescript
// For inference sub-account
const [subAccount, refunds] = await broker.inference.getAccountWithDetail(providerAddress);
console.log(`Sub-account balance: ${ethers.formatEther(subAccount.balance)} 0G`);

// Check pending refunds
if (refunds.length > 0) {
  refunds.forEach((refund, index) => {
    console.log(`Refund ${index + 1}:`);
    console.log(`  Amount: ${ethers.formatEther(refund.amount)} 0G`);
    console.log(`  Unlock time: ${new Date(refund.unlockTime * 1000)}`);
  });
}

// For fine-tuning sub-account
const { account: ftSubAccount, refunds: ftRefunds } =
  await broker.fineTuning.getAccountWithDetail(providerAddress);
console.log(`Fine-tuning sub-account balance: ${ethers.formatEther(ftSubAccount.balance)} 0G`);
```

### Request Refund

```typescript
// Request refund from all inference sub-accounts
await broker.ledger.retrieveFund("inference");

// Request refund from all fine-tuning sub-accounts
await broker.ledger.retrieveFund("fine-tuning");

// After 24 hours, call again to complete the refund
await broker.ledger.retrieveFund("inference");
await broker.ledger.retrieveFund("fine-tuning");
```

### Withdraw to Wallet

```typescript
// Withdraw 5 0G from Main Account to wallet
await broker.ledger.refund(5);

// Or use Wei units
const amount = ethers.parseEther("5");
await broker.ledger.refund(amount);
```

## Web UI

### Launch Web UI

```bash
0g-compute-cli ui start-web

# Custom port if 3090 is busy
0g-compute-cli ui start-web --port 3091
```

### Access Dashboard

Navigate to `http://localhost:3090/wallet` to:

- View account balance in real-time
- See all provider sub-accounts
- Deposit funds with MetaMask
- Transfer funds to providers
- Monitor spending history
- Request refunds visually
- Track pending refunds with countdown

## Best Practices

### For Inference Services

1. **Initial Setup**
   - Deposit enough for expected usage (at least 5-10 0G)
   - Transfer to providers you'll use frequently
   - Keep buffer in sub-accounts for uninterrupted service

2. **During Usage**
   - Monitor sub-account balances regularly
   - Top up before balance runs low
   - Use `processResponse()` to enable automatic fee management

3. **Cost Management**
   - Track usage with `get-account` command
   - Set up monitoring for low balances
   - Review spending patterns periodically

### For Fine-tuning Services

1. **Before Training**
   - Calculate dataset size: `calculate-token` command
   - Estimate total cost: size × provider price
   - Transfer 10-20% extra for buffer

2. **During Training**
   - Don't initiate refund during active jobs
   - Keep enough balance for full job completion
   - Monitor with `get-sub-account` command

3. **After Completion**
   - Wait for job to finish completely
   - Request refund for unused funds
   - Wait 24 hours and complete refund

### General Guidelines

1. **Security**
   - Never share private keys
   - Use environment variables for keys
   - Monitor transactions on blockchain explorer
   - Keep small amounts in hot wallets

2. **Fund Management**
   - Keep main account funded for flexibility
   - Don't lock all funds in sub-accounts
   - Plan refunds considering 24h lock period
   - Maintain buffer for gas fees

3. **Monitoring**
   - Check balances before operations
   - Review spending regularly
   - Set up alerts for low balances
   - Keep transaction receipts

## Troubleshooting

### Insufficient Balance Error

**Symptoms:**

```
Error: Insufficient balance
Error: Not enough funds in sub-account
```

**Solutions:**

```bash
# 1. Check which account needs funds
0g-compute-cli get-account

# 2. If Main Account low: deposit from wallet
0g-compute-cli deposit --amount 10

# 3. If Sub-Account low: transfer from main
0g-compute-cli transfer-fund --provider <ADDRESS> --amount 5

# 4. Verify transfer completed
0g-compute-cli get-sub-account --provider <ADDRESS>
```

### Refund Not Available

**Symptoms:**

```
Error: Refund still locked
Refund request pending
```

**Solutions:**

```bash
# Check remaining lock time
0g-compute-cli get-sub-account --provider <PROVIDER_ADDRESS>

# Look for "Remaining Locked Time" in output
# Wait until time expires, then call retrieve-fund again
0g-compute-cli retrieve-fund
```

**Understanding Lock Period:**

- First `retrieve-fund` call: Starts 24h lock
- During lock: Funds shown as "Requested Return"
- After lock: Call `retrieve-fund` again to complete
- Check anytime: Use `get-sub-account` command

### Transaction Failed

**Common Causes:**

1. **Network Issues**
   ```bash
   # Check RPC endpoint
   0g-compute-cli setup-network
   ```

2. **Gas Price Too Low**
   ```bash
   # Specify higher gas price
   0g-compute-cli deposit --amount 10 --gas-price 20000000000
   ```

3. **Insufficient Gas**
   - Ensure wallet has 0G for gas fees
   - Keep at least 0.1 0G for gas in wallet
   - Gas fees are separate from deposit amount

4. **Nonce Issues**
   - Wait for pending transaction to complete
   - Check wallet nonce on block explorer
   - Avoid submitting multiple transactions simultaneously

### Provider Not Acknowledged

**Symptoms:**

```
Error: Provider must be acknowledged first
Error: Acknowledgment required
```

**Solutions:**

```bash
# Acknowledge provider before first use
0g-compute-cli inference acknowledge-provider --provider <PROVIDER_ADDRESS>

# Or in SDK
await broker.inference.acknowledgeProviderSigner(providerAddress);
```

### Balance Not Updating

**Causes:**

- Blockchain sync delay
- Transaction still pending
- Cache issue

**Solutions:**

```bash
# Wait 30-60 seconds for blockchain confirmation
# Check transaction on block explorer
# Retry get-account command
0g-compute-cli get-account
```

## Complete Examples

### Example 1: Setup New Account

```bash
# Install CLI
pnpm add @0glabs/0g-serving-broker -g

# Configure network
0g-compute-cli setup-network
# Choose: Testnet

# Login
0g-compute-cli login
# Enter private key when prompted

# Deposit funds
0g-compute-cli deposit --amount 10

# Verify deposit
0g-compute-cli get-account
# Should show 10 0G in Available balance

# Transfer to provider
0g-compute-cli transfer-fund \
  --provider 0xd9966e93b5386f34224f98d539df31c69d1e7fab \
  --amount 5

# Verify transfer
0g-compute-cli get-sub-account \
  --provider 0xd9966e93b5386f34224f98d539df31c69d1e7fab
# Should show 5 0G in sub-account
```

### Example 2: Request Refund After Service

```bash
# Check current balance
0g-compute-cli get-account

# Request refund from all sub-accounts
0g-compute-cli retrieve-fund

# Check refund status
0g-compute-cli get-sub-account --provider <PROVIDER_ADDRESS>
# Note: "Remaining Locked Time: 23h 59min"

# Wait 24 hours...

# Complete refund
0g-compute-cli retrieve-fund

# Verify funds returned to main account
0g-compute-cli get-account
# Available balance should increase
```

### Example 3: SDK Account Management

```typescript
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

async function manageAccount() {
  // Initialize
  const provider = new ethers.JsonRpcProvider("https://evmrpc-testnet.0g.ai");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const broker = await createZGComputeNetworkBroker(wallet);

  // Check initial balance
  let account = await broker.ledger.getLedger();
  console.log(`Initial balance: ${ethers.formatEther(account.totalBalance)} 0G`);

  // Deposit 10 0G
  await broker.ledger.depositFund(10);
  console.log("Deposited 10 0G");

  // Transfer to provider
  const providerAddress = "0xd9966e93b5386f34224f98d539df31c69d1e7fab";
  const amount = ethers.parseEther("5");
  await broker.ledger.transferFund(providerAddress, "inference", amount);
  console.log("Transferred 5 0G to provider");

  // Check sub-account
  const [subAccount, refunds] = await broker.inference.getAccountWithDetail(providerAddress);
  console.log(`Sub-account balance: ${ethers.formatEther(subAccount.balance)} 0G`);

  // Use service...
  // (See inference.md for service usage)

  // Request refund when done
  await broker.ledger.retrieveFund("inference");
  console.log("Refund requested (24h lock started)");

  // After 24 hours, complete refund
  // await broker.ledger.retrieveFund("inference");

  // Final balance
  account = await broker.ledger.getLedger();
  console.log(`Final balance: ${ethers.formatEther(account.totalBalance)} 0G`);
}

manageAccount().catch(console.error);
```

## Related Documentation

- [Inference Services](inference.md) - Using AI inference with funded accounts
- [Fine-tuning Services](fine-tuning.md) - Training models with funded accounts

## Summary

### Key Commands

| Action | CLI Command | SDK Method |
|--------|-------------|------------|
| Deposit | `deposit --amount X` | `broker.ledger.depositFund(X)` |
| Check balance | `get-account` | `broker.ledger.getLedger()` |
| Transfer | `transfer-fund --provider P --amount X` | `broker.ledger.transferFund(P, "inference", X)` |
| Refund | `retrieve-fund` (2× with 24h gap) | `broker.ledger.retrieveFund("inference")` |
| Withdraw | `refund --amount X` | `broker.ledger.refund(X)` |

### Fund Flow Summary

1. **Wallet → Main Account**: `deposit`
2. **Main → Sub-Account**: `transfer-fund`
3. **Sub-Account usage**: Automatic deduction
4. **Sub → Main Account**: `retrieve-fund` (twice, 24h apart)
5. **Main → Wallet**: `refund`

### Security Reminders

- ✅ 24-hour lock protects providers
- ✅ Single-use auth prevents replay attacks
- ✅ On-chain verification ensures transparency
- ✅ Provider acknowledgment required
- ❌ Never share private keys
- ❌ Never commit keys to code
