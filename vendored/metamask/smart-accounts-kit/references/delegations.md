---
name: Delegations
description: API reference for creating delegations with scopes and caveat enforcers — ERC-7710 delegation framework
---

# Delegations

## When to use

- You want to grant permissions from one account to another (delegator to delegate).
- You want to set spending limits (ERC-20, native token, NFT).
- You want to restrict function calls to specific contracts or methods.
- You want to add time limits, call limits, or other restrictions via caveats.
- You want to create delegation chains (redelegation).

## API reference

### `createDelegation` parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `from` | `Hex` | Yes | The address granting the delegation |
| `to` | `Hex` | Yes | The address receiving the delegation |
| `scope` | `ScopeConfig` | Yes | Defines the initial authority of the delegation |
| `environment` | `SmartAccountsEnvironment` | Yes | Contract addresses for framework interactions |
| `caveats` | `Caveats` | No | Caveats that further refine the authority granted by the scope |
| `parentDelegation` | `Delegation \| Hex` | No | Parent delegation for creating a chain (mutually exclusive with `parentPermissionContext`) |
| `parentPermissionContext` | `PermissionContext` | No | Parent chain as hex or decoded values, leaf first (mutually exclusive with `parentDelegation`) |
| `salt` | `Hex` | No | Salt for generating the delegation hash to prevent collisions |

For more details, see the [delegation reference](https://docs.metamask.io/smart-accounts-kit/reference/delegation.md).

### Scope types

Use the `ScopeType` enum for type-safe scope configuration:

| ScopeType | When to use |
|-----------|-------------|
| `Erc20TransferAmount` | You want to set a fixed cumulative ERC-20 transfer limit |
| `Erc20PeriodTransfer` | You want a per-period ERC-20 limit that resets at the start of each new period |
| `Erc20Streaming` | You want a linear streaming ERC-20 limit that accrues over time |
| `NativeTokenTransferAmount` | You want to set a fixed cumulative native token transfer limit |
| `NativeTokenPeriodTransfer` | You want a per-period native token limit that resets at the start of each new period |
| `NativeTokenStreaming` | You want a linear streaming native token limit that accrues over time |
| `Erc721Transfer` | You want to restrict the delegation to a specific NFT transfer |
| `FunctionCall` | You want to restrict the delegation to specific methods, addresses, or calldata |
| `OwnershipTransfer` | You want to restrict the delegation to ownership transfer calls only |

For full scope parameters, see the [delegation scopes guide](https://docs.metamask.io/smart-accounts-kit/guides/delegation/use-delegation-scopes.md).

### Caveat types

| Type | When to use |
|------|-------------|
| `allowedTargets` | You want to restrict which contract addresses the delegate can call |
| `allowedMethods` | You want to restrict which methods the delegate can call |
| `allowedCalldata` | You want to validate specific calldata at a byte offset |
| `exactCalldata` | You want to require an exact calldata match |
| `exactCalldataBatch` | You want to require an exact calldata match for a batch of executions |
| `exactExecution` | You want to require an exact match on target, value, and calldata |
| `exactExecutionBatch` | You want to require an exact match for a batch of executions |
| `valueLte` | You want to cap the native token value per call |
| `erc20TransferAmount` | You want to set a max cumulative ERC-20 transfer amount |
| `erc20BalanceChange` | You want to validate that an ERC-20 balance changes as expected |
| `erc20PeriodTransfer` | You want a per-period ERC-20 limit that resets each period |
| `erc20Streaming` | You want a linear streaming ERC-20 limit that accrues over time |
| `erc721Transfer` | You want to restrict the delegation to a specific NFT transfer |
| `erc721BalanceChange` | You want to validate that an ERC-721 balance changes as expected |
| `erc1155BalanceChange` | You want to validate that an ERC-1155 balance changes as expected |
| `nativeTokenPeriodTransfer` | You want a per-period native token limit that resets each period |
| `nativeTokenStreaming` | You want a linear streaming native token limit that accrues over time |
| `nativeBalanceChange` | You want to validate that a native token balance changes as expected |
| `nativeTokenPayment` | You want to require the redeemer to pay a fee to redeem |
| `timestamp` | You want to restrict redemption to a specific time window |
| `blockNumber` | You want to restrict redemption to a specific block range |
| `limitedCalls` | You want to limit how many times the delegation can be redeemed |
| `redeemer` | You want to restrict which addresses can redeem the delegation |
| `id` | You want a one-time delegation identified by a unique ID |
| `nonce` | You want to enable bulk revocation of delegations sharing the same nonce |
| `deployed` | You want to auto-deploy a contract before the delegation executes |
| `ownershipTransfer` | You want to restrict the delegation to ownership transfer calls only |
| `multiTokenPeriod` | You want to set per-period limits across multiple tokens at once |
| `specificActionERC20TransferBatch` | You want to combine a specific action with an ERC-20 transfer in a batch |
| `argsEqualityCheck` | You want to validate that function arguments match a specific value |

For full caveat parameters, see the [caveats reference](https://docs.metamask.io/smart-accounts-kit/reference/delegation/caveats.md).

## Important rules

- The delegator must always be a MetaMask smart account created with `toMetaMaskSmartAccount`.
- You must deploy the delegator before redeeming delegations — the DelegationManager reverts with `0xb9f0f171` for counterfactual accounts.
- Always use caveats — without them, delegations have infinite authority.
- Function call scope defaults to no native token — use `valueLte` to allow it.
- Caveats are cumulative in chains — restrictions stack, and a delegate can only redelegate with equal or lesser authority.
- Caveat order matters — place state-changing caveats (payment) before balance checks.
- Use the `ScopeType` enum for type-safe scope configuration.

## Workflows

- [Create delegation](../workflows/create-delegation.md) — create, sign, and store a delegation
- [Create redelegation](../workflows/create-redelegation.md) — delegation chains with attenuated authority
- [Redeem delegation — smart account](../workflows/redeem-delegation-smart-account.md) — redeem when the delegate is a smart account
- [Redeem delegation — EOA](../workflows/redeem-delegation-eoa.md) — redeem when the delegate is an EOA

