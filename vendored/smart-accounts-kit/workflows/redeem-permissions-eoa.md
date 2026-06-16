---
name: Redeem Advanced Permissions with an EOA session
description: Redeem ERC-7715 Advanced Permissions when the session account is an EOA
---

# Redeem Advanced Permissions with an EOA session

Use this workflow when the session account is an EOA. If the session account is a smart account, use [Redeem permissions — smart account](./redeem-permissions-smart-account.md) instead.

## Extend the wallet client

Create a wallet client for the session EOA and extend it with `erc7710WalletActions` to enable `sendTransactionWithDelegation`:

```typescript
import { createWalletClient, http } from 'viem'
import { erc7710WalletActions } from '@metamask/smart-accounts-kit/actions'

const sessionWalletClient = createWalletClient({
  account: sessionAccount,
  chain,
  transport: http(),
}).extend(erc7710WalletActions())
```

## Extract the permission context

Extract the `context` and `delegationManager` from the stored `grantedPermissions` response:

```typescript
const permissionContext = grantedPermissions[0].context
const delegationManager = grantedPermissions[0].delegationManager
```

## Prepare the calldata

Encode the function call you want to execute on behalf of the user. This example transfers 1 USDC to a recipient:

```typescript
import { encodeFunctionData, erc20Abi, parseUnits } from 'viem'

const callData = encodeFunctionData({
  abi: erc20Abi,
  args: [recipient, parseUnits('1', 6)],
  functionName: 'transfer',
})
```

## Send the transaction with delegation

For more details, see the [ERC-7710 wallet client reference](https://docs.metamask.io/smart-accounts-kit/reference/erc7710/wallet-client.md).

```typescript
const txHash = await sessionWalletClient.sendTransactionWithDelegation({
  to: tokenAddress,
  data: callData,
  permissionContext,
  delegationManager,
})
```
