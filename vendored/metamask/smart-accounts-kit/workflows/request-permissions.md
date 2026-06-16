---
name: Request Advanced Permissions
description: Request ERC-7715 Advanced Permissions from MetaMask extension
---

# Request Advanced Permissions

## Set up the wallet client

Create a wallet client connected to MetaMask and extend it with `erc7715ProviderActions` to enable `requestExecutionPermissions`:

```typescript
import { createWalletClient, custom } from 'viem'
import { erc7715ProviderActions } from '@metamask/smart-accounts-kit/actions'

const walletClient = createWalletClient({
  transport: custom(window.ethereum),
}).extend(erc7715ProviderActions())
```

## Set up the public client

Create a public client to read chain state. This is needed when creating a smart account session:

```typescript
import { createPublicClient, http } from 'viem'
import { sepolia as chain } from 'viem/chains'

const publicClient = createPublicClient({
  chain,
  transport: http(),
})
```

## Create a session account

The session account is the entity that redeems the granted permissions. It can be either an EOA or a smart account. The redemption workflow differs depending on the session account type:
- [Redeem permissions — smart account](./redeem-permissions-smart-account.md)
- [Redeem permissions — EOA](./redeem-permissions-eoa.md)

As a smart account:

```typescript
import { toMetaMaskSmartAccount, Implementation } from '@metamask/smart-accounts-kit'
import { privateKeyToAccount } from 'viem/accounts'

const account = privateKeyToAccount(privateKey)

const sessionAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.Hybrid,
  deployParams: [account.address, [], [], []],
  deploySalt: '0x',
  signer: { account },
})
```

As an EOA:

```typescript
import { privateKeyToAccount } from 'viem/accounts'

const sessionAccount = privateKeyToAccount('<SESSION_PRIVATE_KEY>')
```

## Request permissions

Call `requestExecutionPermissions` to prompt MetaMask to display a human-readable permission request to the user. This example requests permission to transfer up to 10 USDC per day for one week:

```typescript
import { parseUnits } from 'viem'

const currentTime = Math.floor(Date.now() / 1000)

const grantedPermissions = await walletClient.requestExecutionPermissions([
  {
    chainId: chain.id,
    expiry: currentTime + 604800,
    to: sessionAccount.address,
    permission: {
      type: 'erc20-token-periodic',
      data: {
        tokenAddress: '<TOKEN_ADDRESS>',
        periodAmount: parseUnits('10', 6),
        periodDuration: 86400,
        justification: 'Permission to transfer 10 USDC every day',
      },
      isAdjustmentAllowed: true,
    },
  },
])
```

## Store the permission response

Store the `grantedPermissions` response for later redemption. You can store it on IPFS, local storage, a database, or any other storage solution.
