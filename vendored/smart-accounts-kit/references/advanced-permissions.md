---
name: Advanced Permissions
description: API reference for requesting ERC-7715 Advanced Permissions from MetaMask extension
---

# Advanced Permissions

## When to use

- You want to request fine-grained permissions from MetaMask with a human-readable UI.
- You want periodic or streaming spending allowances without per-transaction approvals.
- You want to build dApps with background or automated transaction execution.

## API reference

### `requestExecutionPermissions` parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `chainId` | `number` | Yes | The chain ID on which the permission is being requested |
| `to` | `Address` | Yes | The account to which the permission will be assigned |
| `permission` | `SupportedPermissionParams` | Yes | The permission type being requested, with `isAdjustmentAllowed` flag |
| `expiry` | `number` | Yes | The timestamp (in seconds) by which the permission must expire |
| `from` | `Address` | No | The wallet address from which permission is requested |

For more details, see the [requestExecutionPermissions reference](https://docs.metamask.io/smart-accounts-kit/reference/advanced-permissions/wallet-client.md).

### Supported permission types

| Type | When to use |
|------|-------------|
| `erc20-token-allowance` | You want a fixed ERC-20 transfer limit that depletes until the total reaches the allowance |
| `erc20-token-periodic` | You want a per-period ERC-20 limit that resets at the start of each new period |
| `erc20-token-stream` | You want a linear streaming ERC-20 limit that accrues over time |
| `native-token-allowance` | You want a fixed native token transfer limit that depletes until the total reaches the allowance |
| `native-token-periodic` | You want a per-period native token limit that resets at the start of each new period |
| `native-token-stream` | You want a linear streaming native token limit that accrues over time |
| `token-approval-revocation` | You want to revoke existing token approvals (ERC-20, ERC-721, Permit2) on behalf of the user |

The token allowance, native token allowance, periodic, and stream permission types accept optional `startTime`, `justification`, and `isAdjustmentAllowed` parameters. The `token-approval-revocation` type only accepts `justification` and `isAdjustmentAllowed`. For full parameter details, see the [permissions reference](https://docs.metamask.io/smart-accounts-kit/reference/advanced-permissions/permissions.md).

### Response structure

```typescript
{
  context: Hex,                // Encoded permission context for redemption
  delegationManager: Address,  // Delegation Manager address
  chainId: number,
  from: Address,               // Granting address
  to: Hex,                     // Receiving address
  permission: PermissionTypes,
  dependencies: { factory: Address, factoryData: Hex }[],
}
```

## Important rules

- You need MetaMask Flask 13.5.0+ or MetaMask stable 13.23.0+.
- The user must have a smart account — ERC-7715 creates ERC-7710 delegations under the hood.
- Place `isAdjustmentAllowed` inside the `permission` object. It's always recommended.
- Handle denial gracefully — provide a manual transaction fallback.
- `erc20-token-revocation` is deprecated — use `token-approval-revocation` instead.

## Workflows

- [Request permissions](../workflows/request-permissions.md) — request ERC-7715 permissions from MetaMask
- [Create redelegation for permissions](../workflows/create-redelegation-permissions.md) — redelegate a permission context to another account
- [Redeem permissions — smart account](../workflows/redeem-permissions-smart-account.md) — redeem when the session account is a smart account
- [Redeem permissions — EOA](../workflows/redeem-permissions-eoa.md) — redeem when the session account is an EOA