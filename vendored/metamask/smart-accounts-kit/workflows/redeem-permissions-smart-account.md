---
name: Redeem Advanced Permissions with a smart account session
description: Redeem ERC-7715 Advanced Permissions when the session account is a smart account
---

# Redeem Advanced Permissions with a smart account session

Use this workflow when the session account is a smart account. If the session account is an EOA, use [Redeem permissions — EOA](./redeem-permissions-eoa.md) instead.

## Install dependencies

```bash
npm install permissionless
```

## Set up clients

Create a public client for your target network, a bundler client extended with `erc7710BundlerActions` to enable `sendUserOperationWithDelegation`, and a Pimlico client to estimate gas fees:

```typescript
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'
import { createBundlerClient } from 'viem/account-abstraction'
import { erc7710BundlerActions } from '@metamask/smart-accounts-kit/actions'
import { createPimlicoClient } from 'permissionless/clients/pimlico'

const chain = baseSepolia
const publicClient = createPublicClient({ chain, transport: http() })

const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http('https://api.pimlico.io/v2/<CHAIN_ID>/rpc?apikey=<PIMLICO_API_KEY>'),
  paymaster: true,
}).extend(erc7710BundlerActions())

const pimlicoClient = createPimlicoClient({
  transport: http('https://api.pimlico.io/v2/<CHAIN_ID>/rpc?apikey=<PIMLICO_API_KEY>'),
})
```

## Create the session smart account

Create a MetaMask smart account for the session key that was granted permissions:

```typescript
import { Implementation, toMetaMaskSmartAccount } from '@metamask/smart-accounts-kit'
import { privateKeyToAccount } from 'viem/accounts'

const sessionOwner = privateKeyToAccount('<SESSION_PRIVATE_KEY>')

const sessionAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.Hybrid,
  deployParams: [sessionOwner.address, [], [], []],
  deploySalt: '0x',
  signer: { account: sessionOwner },
})
```

## Estimate gas fees

Calculate `maxFeePerGas` and `maxPriorityFeePerGas` using the Pimlico client:

```typescript
const { fast: { maxFeePerGas, maxPriorityFeePerGas } } = await pimlicoClient.getUserOperationGasPrice()
```

## Extract the permission context

Extract the `context` and `delegationManager` from the `grantedPermissions` response returned by [`requestExecutionPermissions`](./request-permissions.md):

```typescript
const permissionContext = grantedPermissions[0].context
const delegationManager = grantedPermissions[0].delegationManager
```

## Prepare the calldata

Encode the function call you want to execute on behalf of the user. This example transfers 1 USDC to a recipient:

```typescript
import { encodeFunctionData, erc20Abi, parseUnits } from 'viem'

const tokenAddress = '<TOKEN_ADDRESS>'
const recipient = '<RECIPIENT_ADDRESS>'

const callData = encodeFunctionData({
  abi: erc20Abi,
  args: [recipient, parseUnits('1', 6)],
  functionName: 'transfer',
})
```

## Send the user operation with delegation

For more details, see the [ERC-7710 bundler client reference](https://docs.metamask.io/smart-accounts-kit/reference/erc7710/bundler-client.md).

```typescript
const userOpHash = await bundlerClient.sendUserOperationWithDelegation({
  publicClient,
  account: sessionAccount,
  calls: [
    {
      to: tokenAddress,
      data: callData,
      permissionContext,
      delegationManager,
    },
  ],
  maxFeePerGas,
  maxPriorityFeePerGas,
})
```
