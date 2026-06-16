---
name: Create a delegation
description: Create and sign a delegation with scopes and caveats
---

# Create a delegation

## Create the smart account (delegator)

Create a MetaMask smart account that will act as the delegator. This example uses a Hybrid implementation with an EOA signer:

```typescript
import { Implementation, toMetaMaskSmartAccount } from '@metamask/smart-accounts-kit'
import { privateKeyToAccount } from 'viem/accounts'

const account = privateKeyToAccount('<DELEGATOR_PRIVATE_KEY>')

const delegatorSmartAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.Hybrid,
  deployParams: [account.address, [], [], []],
  deploySalt: '0x',
  signer: { account },
})
```

## Set up the bundler client

Configure the bundler client with a paymaster to sponsor gas fees:

```typescript
import { createBundlerClient, createPaymasterClient } from 'viem/account-abstraction'
import { http } from 'viem'

const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http('https://api.pimlico.io/v2/<CHAIN_ID>/rpc?apikey=<PIMLICO_API_KEY>'),
  paymaster: createPaymasterClient({
    transport: http('https://api.pimlico.io/v2/<CHAIN_ID>/rpc?apikey=<PIMLICO_API_KEY>'),
  }),
  chain,
})
```

## Deploy the smart account

You must deploy the delegator before creating delegations. Send a no-op user operation to trigger deployment:

```typescript
const userOpHash = await bundlerClient.sendUserOperation({
  account: delegatorSmartAccount,
  calls: [{ to: delegatorSmartAccount.address, value: 0n, data: '0x' }],
})
```

## Create the delegation

Define the delegation with a scope and caveats. This example grants the delegate permission to transfer up to 10 USDC, limited to 5 calls within a time window. For all available scope types and caveat types, see the [delegations reference](../references/delegations.md).

```typescript
import { createDelegation, ScopeType } from '@metamask/smart-accounts-kit'
import { parseUnits } from 'viem'

const delegation = createDelegation({
  to: delegateAddress,
  from: delegatorSmartAccount.address,
  environment: delegatorSmartAccount.environment,
  scope: {
    type: ScopeType.Erc20TransferAmount,
    tokenAddress: '<TOKEN_ADDRESS>',
    maxAmount: parseUnits('10', 6),
  },
  caveats: [
    { type: 'timestamp', afterThreshold: now, beforeThreshold: expiry },
    { type: 'limitedCalls', limit: 5 },
  ],
})
```

## Sign the delegation

The delegator signs the delegation to authorize it. The signature is then attached to the delegation object:

```typescript
const signature = await delegatorSmartAccount.signDelegation({ delegation })
const signedDelegation = { ...delegation, signature }
```

You can also sign standalone (without a smart account instance):

```typescript
import { signDelegation } from '@metamask/smart-accounts-kit'
import { sepolia } from 'viem/chains'

const signature = await signDelegation({
  privateKey,
  delegation,
  chainId: sepolia.id,
  delegationManager: environment.DelegationManager,
})
```

## Store the signed delegation

Store your signed delegation for later retrieval and redemption by the delegate. You can store it on IPFS, local storage, a database, or any other storage solution.

The delegate can be either an EOA or a smart account. The redemption workflow differs depending on the delegate type:
- [Redeem delegation — smart account](./redeem-delegation-smart-account.md)
- [Redeem delegation — EOA](./redeem-delegation-eoa.md)
