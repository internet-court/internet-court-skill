---
name: Create a redelegation for Advanced Permissions
description: Redelegate ERC-7715 permission contexts to another account using wallet actions
---

# Create a redelegation for Advanced Permissions

You can redelegate an ERC-7715 permission context to another account using the `redelegatePermissionContext` wallet action. This creates a new delegation in the chain and returns an updated `permissionContext` that the new delegate can redeem.

## Extend the wallet client

Create a wallet client for the current delegate and extend it with `erc7710WalletActions` to enable redelegation:

```typescript
import { createWalletClient, http } from 'viem'
import { erc7710WalletActions } from '@metamask/smart-accounts-kit/actions'

const delegateWalletClient = createWalletClient({
  account: delegateAccount,
  chain,
  transport: http(),
}).extend(erc7710WalletActions())
```

## Redelegate the permission context to a specific account

Pass the original permission context along with an optional narrowed scope and additional caveats. This example redelegates 50 USDC (a subset of the original grant) with a time constraint:

```typescript
const { delegation, permissionContext: newPermissionContext } =
  await delegateWalletClient.redelegatePermissionContext({
    environment,
    permissionContext: grantedPermissions[0].context,
    to: secondDelegateAddress,
    scope: {
      type: ScopeType.Erc20TransferAmount,
      tokenAddress: '<TOKEN_ADDRESS>',
      maxAmount: parseUnits('50', 6),
    },
    caveats: [
      { type: 'timestamp', afterThreshold: now, beforeThreshold: expiry },
    ],
  })
```

The returned `newPermissionContext` is a hex-encoded delegation chain that the second delegate can use to redeem.

## Create an open redelegation

Use `redelegatePermissionContextOpen` to create a redelegation without specifying a delegate. Any account can redeem it.

```typescript
const { delegation, permissionContext: newPermissionContext } =
  await delegateWalletClient.redelegatePermissionContextOpen({
    environment,
    permissionContext: grantedPermissions[0].context,
    scope: {
      type: ScopeType.Erc20TransferAmount,
      tokenAddress: '<TOKEN_ADDRESS>',
      maxAmount: parseUnits('50', 6),
    },
  })
```

## Redeem the redelegated permission

The second delegate redeems using the new `permissionContext`:
- [Redeem Advanced Permissions with a smart account session](./redeem-permissions-smart-account.md)
- [Redeem Advanced Permissions with an EOA session](./redeem-permissions-eoa.md)

For full parameter details, see the [ERC-7710 wallet client reference](https://docs.metamask.io/smart-accounts-kit/reference/erc7710/wallet-client.md).

## Rules

- Caveats are cumulative — each redelegation inherits all restrictions from its parents.
- You can only redelegate with equal or lesser authority.
- Use open redelegation carefully — any account can redeem it. Add a `redeemer` caveat to restrict who can redeem.
