---
name: Create a Stateless7702 account
description: Upgrade an existing EOA to a smart account using EIP-7702
---

# Create a Stateless7702 account

The Stateless7702 implementation upgrades an existing EOA to support smart account functionality using EIP-7702. The EOA keeps its address and gains delegation capabilities.

## Prerequisites

- This implementation only works with Viem local accounts, not JSON-RPC accounts like MetaMask.
- The EOA must be upgraded using EIP-7702 before creating the smart account. You can do this yourself using the authorization flow below, or it may already be done if the user upgraded through MetaMask.

## Upgrade the EOA using EIP-7702 (optional)

If the EOA hasn't been upgraded yet, you can send an EIP-7702 authorization transaction. This sets the EOA's code to delegate to the `EIP7702StatelessDeleGatorImpl` contract:

```typescript
import { getSmartAccountsEnvironment } from '@metamask/smart-accounts-kit'
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const account = privateKeyToAccount('<PRIVATE_KEY>')
const environment = getSmartAccountsEnvironment(chain.id)

const walletClient = createWalletClient({
  account,
  chain,
  transport: http(),
})

const authorization = await walletClient.signAuthorization({
  contractAddress: environment.implementations.EIP7702StatelessDeleGatorImpl,
})

await walletClient.sendTransaction({
  to: account.address,
  authorizationList: [authorization],
})
```

## Verify the EIP-7702 upgrade

Check whether the EOA has been upgraded before creating the smart account. You can use the `isValid7702Implementation` helper:

```typescript
import { isValid7702Implementation } from '@metamask/smart-accounts-kit/actions'

const isUpgraded = await isValid7702Implementation({
  client: publicClient,
  accountAddress: account.address,
  environment,
})
```

Or inspect the code manually:

```typescript
const code = await publicClient.getCode({ address: account.address })

if (code) {
  const delegatorAddress = `0x${code.substring(8)}`
  const statelessDelegatorAddress = environment.implementations.EIP7702StatelessDeleGatorImpl

  const isUpgraded =
    delegatorAddress.toLowerCase() === statelessDelegatorAddress.toLowerCase()
}
```

## Create the account

Once the EOA is upgraded, pass its address to `toMetaMaskSmartAccount`. No `deployParams` or `deploySalt` are needed:

```typescript
import { Implementation, toMetaMaskSmartAccount } from '@metamask/smart-accounts-kit'

const smartAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.Stateless7702,
  address: account.address,
  signer: { account },
})
```

You can also use a wallet client signer:

```typescript
const smartAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.Stateless7702,
  address: walletClient.account.address,
  signer: { walletClient },
})
```

For more details, see the [smart account reference](https://docs.metamask.io/smart-accounts-kit/reference/smart-account.md).
