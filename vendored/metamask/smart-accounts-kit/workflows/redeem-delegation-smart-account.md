---
name: Redeem delegation with a smart account delegate
description: Redeem delegations when the delegate is a smart account
---

# Redeem delegation with a smart account delegate

Use this workflow when the delegate is a smart account. If the delegate is an EOA, use [Redeem delegation — EOA](./redeem-delegation-eoa.md) instead.

## Install dependencies

```bash
npm install permissionless
```

## Set up clients

Create a public client for your target network, a bundler client with a paymaster, and a Pimlico client to estimate gas fees:

```typescript
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'
import { createBundlerClient, createPaymasterClient } from 'viem/account-abstraction'
import { createPimlicoClient } from 'permissionless/clients/pimlico'

const chain = baseSepolia
const publicClient = createPublicClient({ chain, transport: http() })

const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http('https://api.pimlico.io/v2/<CHAIN_ID>/rpc?apikey=<PIMLICO_API_KEY>'),
  paymaster: createPaymasterClient({
    transport: http('https://api.pimlico.io/v2/<CHAIN_ID>/rpc?apikey=<PIMLICO_API_KEY>'),
  }),
  chain,
})

const pimlicoClient = createPimlicoClient({
  transport: http('https://api.pimlico.io/v2/<CHAIN_ID>/rpc?apikey=<PIMLICO_API_KEY>'),
})
```

## Create the delegate smart account

Create a MetaMask smart account for the delegate that will redeem the delegation:

```typescript
import { Implementation, toMetaMaskSmartAccount } from '@metamask/smart-accounts-kit'
import { privateKeyToAccount } from 'viem/accounts'

const delegateOwner = privateKeyToAccount('<DELEGATE_PRIVATE_KEY>')

const delegateSmartAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.Hybrid,
  deployParams: [delegateOwner.address, [], [], []],
  deploySalt: '0x',
  signer: { account: delegateOwner },
})
```

## Estimate gas fees

Calculate `maxFeePerGas` and `maxPriorityFeePerGas` using the Pimlico client:

```typescript
const { fast: { maxFeePerGas, maxPriorityFeePerGas } } = await pimlicoClient.getUserOperationGasPrice()
```

## Prepare and encode the execution

Encode the function call you want to execute on behalf of the delegator. Use the `signedDelegation` obtained from the [create delegation](./create-delegation.md) workflow. This example transfers 1 USDC to a recipient:

```typescript
import { createExecution, ExecutionMode } from '@metamask/smart-accounts-kit'
import { DelegationManager } from '@metamask/smart-accounts-kit/contracts'
import { encodeFunctionData, erc20Abi, parseUnits } from 'viem'

const tokenAddress = '<TOKEN_ADDRESS>'
const recipient = '<RECIPIENT_ADDRESS>'

const callData = encodeFunctionData({
  abi: erc20Abi,
  args: [recipient, parseUnits('1', 6)],
  functionName: 'transfer',
})

const execution = createExecution({ target: tokenAddress, callData })

const redeemCalldata = DelegationManager.encode.redeemDelegations({
  delegations: [[signedDelegation]],
  modes: [ExecutionMode.SingleDefault],
  executions: [[execution]],
})
```

## Send the user operation

Submit the user operation to the bundler. The delegate smart account calls the DelegationManager with the redeem calldata:

```typescript
const userOpHash = await bundlerClient.sendUserOperation({
  account: delegateSmartAccount,
  calls: [{ to: delegateSmartAccount.environment.DelegationManager, data: redeemCalldata }],
  maxFeePerGas,
  maxPriorityFeePerGas,
})
```
