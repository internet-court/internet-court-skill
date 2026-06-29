---
name: starknet-js
description: "Reference for building Starknet applications using starknet.js v9.x SDK, including contract interaction, account management, transaction handling, fee estimation, wallet integration, and paymaster flows."
license: Apache-2.0
metadata:
  author: 0xlny
  version: "1.0.0"
  org: keep-starknet-strange
compatibility: "Node.js 18+, TypeScript 5+, npm package: starknet@^9.0.0"
keywords:
  - starknet
  - starknet-js
  - sdk
  - typescript
  - smart-contracts
  - account-abstraction
  - paymaster
  - multicall
  - snip-9
  - snip-12
  - erc-20
  - erc-721
  - wallet
  - rpc
  - fee-estimation
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
  - Task
user-invocable: true
---

# starknet.js v9.x SDK

Related modules: [skills catalog](../README.md).

## When to Use

- Building Starknet apps with provider, account, contract, wallet, or paymaster flows.

## When NOT to Use

- Cairo contract authoring, deployment-only runbooks, or security audits.

## Quick Start

```bash
npm install starknet
```

Minimal setup to read from Starknet:

```typescript
import { RpcProvider, Contract } from 'starknet';

const provider = await RpcProvider.create({ nodeUrl: 'https://rpc.starknet.lava.build' });
const contract = new Contract(abi, contractAddress, provider);
const result = await contract.get_balance();
```

## Core Architecture

```
Provider -> Account -> Contract
   |          |          |
Network   Identity   Interaction
```

- **Provider**: Read-only network connection (RpcProvider)
- **Account**: Extends Provider with signing and transaction capabilities
- **Contract**: Type-safe interface to deployed contracts

Use Provider for read operations, Account for write operations.

## Provider Setup

```typescript
import { RpcProvider } from 'starknet';

// Recommended: Auto-detect RPC spec version
const provider = await RpcProvider.create({
  nodeUrl: 'https://rpc.starknet.lava.build'
});
```

**Networks:**
- Mainnet: `https://rpc.starknet.lava.build`
- Sepolia: `https://rpc.starknet-testnet.lava.build`

**Key Methods:**
```typescript
const chainId = await provider.getChainId();
const block = await provider.getBlock('latest');
const nonce = await provider.getNonceForAddress(accountAddress);
await provider.waitForTransaction(txHash);

// Read storage directly
const value = await provider.getStorageAt(contractAddress, storageKey);
```

## Account Management

### Account Creation (4 Steps)

**Step 1: Compute address**
```typescript
import { hash, ec, encode, CallData } from 'starknet';

// IMPORTANT: `stark.randomAddress()` returns an address-like random felt and is NOT a private key.
// Use a real stark curve private key generator.
const privateKey = '0x' + encode.buf2hex(ec.starkCurve.utils.randomPrivateKey());
const publicKey = ec.starkCurve.getStarkKey(privateKey);

// NOTE: account class hashes are network/account-type dependent.
// Treat this as an example only (verify the correct class hash for your setup).
const classHash = '0x540d7f5ec7ecf317e68d48564934cb99259781b1ee3cedbbc37ec5337f8e688'; // example

const constructorCalldata = CallData.compile({ publicKey });
const address = hash.calculateContractAddressFromHash(publicKey, classHash, constructorCalldata, 0);
```

**Step 2: Fund the address** with STRK before deployment.

**Step 3: Deploy**
```typescript
import { Account } from 'starknet';

// NOTE: Account constructor signature varies across starknet.js versions.
// If this doesn't typecheck for your version, refer to the official docs.
const account = new Account({ provider, address, signer: privateKey, cairoVersion: '1' });
const { transaction_hash } = await account.deployAccount({
  classHash,
  constructorCalldata,
  addressSalt: publicKey
});
await provider.waitForTransaction(transaction_hash);
```

**Step 4: Use the account** for transactions.

### Connect to Existing Account

```typescript
const account = new Account({
  provider,
  address: '0x123...',
  signer: privateKey,
  cairoVersion: '1'  // Optional, auto-detected if omitted
});
```

## Contract Interaction

### Connect to Contract

```typescript
import { Contract } from 'starknet';

const contract = new Contract(abi, contractAddress, provider);  // Read-only
const writeContract = new Contract(abi, contractAddress, account);   // Read-write
```

### Typed Contract (Type-Safe)

```typescript
// Get full TypeScript autocomplete and type checking from ABI
const typedContract = contract.typedv2(abi);
const balance = await typedContract.balanceOf(userAddress);
```

### Read State

```typescript
const balance = await contract.get_balance();
const userBalance = await contract.balanceOf(userAddress);
```

### Write (Execute)

```typescript
const tx = await contract.increase_balance(100);
await provider.waitForTransaction(tx.transaction_hash);
```

### Multicall (Batch Transactions)

```typescript
import { CallData, cairo } from 'starknet';

const calls = [
  {
    contractAddress: tokenAddress,
    entrypoint: 'approve',
    calldata: CallData.compile({ spender: bridgeAddress, amount: cairo.uint256(1000n) })
  },
  {
    contractAddress: bridgeAddress,
    entrypoint: 'deposit',
    calldata: CallData.compile({ amount: cairo.uint256(1000n) })
  }
];

const tx = await account.execute(calls);
```

Using `populate()` for type-safety:
```typescript
const approveCall = tokenContract.populate('approve', {
  spender: bridgeAddress,
  amount: cairo.uint256(1000n)
});
const depositCall = bridgeContract.populate('deposit', { amount: cairo.uint256(1000n) });
const tx = await account.execute([approveCall, depositCall]);
```

### Parse Events

```typescript
const receipt = await provider.getTransactionReceipt(txHash);
const events = contract.parseEvents(receipt);
const transferEvents = contract.parseEvents(receipt, 'Transfer');
```

## Transaction Simulation

Simulate before executing to catch reverts and inspect state changes:

```typescript
const simResult = await account.simulateTransaction(
  [{ type: 'INVOKE', payload: calls }],
  { skipValidate: false }
);

console.log('Fee estimate:', simResult[0].fee_estimation);
console.log('Trace:', simResult[0].transaction_trace);

// Check state changes before execution
const trace = simResult[0].transaction_trace;
if (trace?.state_diff) {
  console.log('Storage changes:', trace.state_diff.storage_diffs);
}
```

## Fee Estimation

```typescript
const fee = await account.estimateInvokeFee(calls);
console.log({
  overallFee: fee.overall_fee,
  resourceBounds: fee.resourceBounds  // V3: l1_gas, l2_gas, l1_data_gas
});
```

Execute with custom bounds:
```typescript
const tx = await account.execute(calls, {
  resourceBounds: {
    l1_gas: { amount: '0x2000', price: '0x1000000000' },
    l2_gas: { amount: '0x0', price: '0x0' },
    l1_data_gas: { amount: '0x1000', price: '0x1000000000' }
  }
});
```

With priority tip:
```typescript
const tipStats = await provider.getEstimateTip();
const tx = await account.execute(calls, { tip: tipStats.percentile_75 });
```

## Transaction Receipt Handling

```typescript
const receipt = await provider.waitForTransaction(txHash);

// Status check helpers
if (receipt.isSuccess()) {
  console.log('Transaction succeeded');
} else if (receipt.isReverted()) {
  console.log('Reverted:', receipt.revert_reason);
} else if (receipt.isRejected()) {
  console.log('Rejected');
} else if (receipt.isError()) {
  console.log('Error');
}
```

## Wallet Integration

Connect to browser wallets (ArgentX, Braavos):

```typescript
import { connect } from '@starknet-io/get-starknet';
import { WalletAccount } from 'starknet';

const selectedWallet = await connect({ modalMode: 'alwaysAsk' });
const walletAccount = await WalletAccount.connect(
  { nodeUrl: 'https://rpc.starknet.lava.build' },
  selectedWallet
);

// Use like regular Account
const tx = await walletAccount.execute(calls);

// Event handlers
walletAccount.onAccountChange((accounts) => console.log('New account:', accounts[0]));
walletAccount.onNetworkChanged((chainId) => console.log('Network changed:', chainId));
```

## Paymaster (Gas Sponsorship)

Setup paymaster for sponsored or alternative gas token transactions:

```typescript
import { PaymasterRpc, Account } from 'starknet';

const paymaster = new PaymasterRpc({ nodeUrl: 'https://sepolia.paymaster.avnu.fi' });
const account = new Account({ provider, address, signer: privateKey, paymaster });
```

**Sponsored (dApp pays gas):**
```typescript
const tx = await account.executePaymasterTransaction(calls, { feeMode: { mode: 'sponsored' } });
```

**Alternative token (e.g., USDC):**
```typescript
const tokens = await account.paymaster.getSupportedTokens();
const feeDetails = { feeMode: { mode: 'default', gasToken: USDC_ADDRESS } };
const estimate = await account.estimatePaymasterTransactionFee(calls, feeDetails);
const tx = await account.executePaymasterTransaction(calls, feeDetails, estimate.suggested_max_fee_in_gas_token);
```

## Message Signing (SNIP-12)

```typescript
const typedData = {
  types: {
    StarknetDomain: [
      { name: 'name', type: 'shortstring' },
      { name: 'version', type: 'shortstring' },
      { name: 'chainId', type: 'shortstring' },
      { name: 'revision', type: 'shortstring' }
    ],
    Message: [{ name: 'content', type: 'shortstring' }]
  },
  primaryType: 'Message',
  domain: { name: 'MyDapp', version: '1', chainId: 'SN_SEPOLIA', revision: '1' },
  message: { content: 'Hello Starknet' }
};

const signature = await account.signMessage(typedData);
const msgHash = await account.hashMessage(typedData);
const isValid = ec.starkCurve.verify(signature, msgHash, publicKey);
```

## CallData & Cairo Types

```typescript
import { CallData, cairo, CairoCustomEnum, CairoOption, CairoOptionVariant } from 'starknet';

// Compile with ABI
const calldata = new CallData(abi);
const compiled = calldata.compile('transfer', { recipient: '0x...', amount: cairo.uint256(1000n) });

// Cairo type helpers - always use BigInt (n suffix) for token amounts
cairo.uint256(1000n)          // { low, high } - ALWAYS use BigInt for precision
cairo.felt252(1000)           // BigInt
cairo.felt('0x123')           // hex to felt
cairo.bool(true)              // Cairo bool
cairo.byteArray('Hello')      // ByteArray for long strings

// Short strings (<= 31 chars)
import { shortString } from 'starknet';
shortString.encodeShortString('hello')  // felt252
shortString.decodeShortString('0x...')  // 'hello'

// Enums and Options
const myEnum = new CairoCustomEnum({ Variant1: { value: 123 } });
const some = new CairoOption(CairoOptionVariant.Some, value);
```

**Important:** Always use `BigInt` (e.g., `1000n`) for token amounts and balances. Never use `Number()` or `parseFloat()` on wei values -- JavaScript numbers lose precision above 2^53.

## ERC-20 Token Operations

```typescript
const erc20 = new Contract(erc20Abi, tokenAddress, account);

// Read balance (returns BigInt - do NOT convert with Number())
const balance = await erc20.balanceOf(account.address);
console.log('Balance (wei):', balance.toString());

// Transfer (use BigInt for amount)
const amount = cairo.uint256(1000000000000000000n); // 1 token (18 decimals)
const tx = await erc20.transfer(recipientAddress, amount);
await provider.waitForTransaction(tx.transaction_hash);

// Approve + transferFrom pattern
await erc20.approve(spenderAddress, cairo.uint256(amount));
```

## Utility Functions

```typescript
import { stark, ec, encode, num, hash } from 'starknet';

// Key generation
const privateKey = '0x' + encode.buf2hex(ec.starkCurve.utils.randomPrivateKey());
const publicKey = ec.starkCurve.getStarkKey(privateKey);

// Number conversions
num.toHex(123);           // '0x7b'
num.toBigInt('0x7b');     // 123n

// Hashing
hash.getSelectorFromName('transfer');
hash.calculateContractAddressFromHash(salt, classHash, calldata, deployer);
```

## Contract Deployment

```typescript
// Deploy via UDC
const { transaction_hash, contract_address } = await account.deploy({
  classHash: '0x...',
  constructorCalldata: CallData.compile({ owner: account.address }),
  salt: stark.randomAddress(), // random felt252 salt (not a private key)
  unique: true
});

// Declare first, then deploy
const declareResponse = await account.declare({
  contract: compiledSierra,
  casm: compiledCasm
});
await provider.waitForTransaction(declareResponse.transaction_hash);

const deployResponse = await account.deploy({
  classHash: declareResponse.class_hash,
  constructorCalldata: CallData.compile({ owner: account.address })
});

// Or combined
const result = await account.declareAndDeploy({
  contract: compiledContract,
  casm: compiledCasm,
  constructorCalldata: CallData.compile({ owner: account.address })
});
```

## Outside Execution (SNIP-9)

Execute transactions on behalf of another account (gasless/delegated):

```typescript
const version = await account.getSnip9Version();  // 'V1' | 'V2' | 'UNSUPPORTED'

const outsideTransaction = await account.getOutsideTransaction(
  { caller: executorAddress, execute_after: now, execute_before: now + 3600 },
  calls,
  'V2'
);

// Executor submits the pre-signed transaction
const result = await executorAccount.executeFromOutside(outsideTransaction);
```

## Error Handling

```typescript
import { LibraryError, RpcError } from 'starknet';

try {
  const tx = await account.execute(calls);
} catch (error) {
  if (error instanceof RpcError) {
    console.error('RPC error:', error.code, error.message);
  } else if (error instanceof LibraryError) {
    console.error('Library error:', error.message);
  }
}
```

## Logging & Configuration

```typescript
import { config, setLogLevel } from 'starknet';

// Global config
config.set('transactionVersion', '0x3');
config.get('transactionVersion');

// Logging
setLogLevel('DEBUG');  // ERROR | WARN | INFO | DEBUG
```
