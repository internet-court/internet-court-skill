---
name: Create a redelegation
description: Create delegation chains where a delegate re-grants permissions to another account
---

# Create a redelegation

Redelegation lets a delegate re-grant permissions they've received to another account, forming a delegation chain. Caveats are cumulative — each link can only add restrictions, never remove them.

## Create the root delegation

Create the first delegation in the chain. This example grants the delegate permission to transfer up to 100 USDC:

```typescript
import { createDelegation, ScopeType } from '@metamask/smart-accounts-kit'
import { parseUnits } from 'viem'

const rootDelegation = createDelegation({
  to: delegateAddress,
  from: delegatorAddress,
  environment,
  scope: {
    type: ScopeType.Erc20TransferAmount,
    tokenAddress: '<TOKEN_ADDRESS>',
    maxAmount: parseUnits('100', 6),
  },
})

const signature = await delegatorSmartAccount.signDelegation({ delegation: rootDelegation })
const signedRootDelegation = { ...rootDelegation, signature }
```

## Create the redelegation

Pass the parent delegation to create the chain. The redelegation must have equal or lesser authority.

```typescript
const redelegation = createDelegation({
  to: secondDelegateAddress,
  from: delegateAddress,
  environment,
  scope: {
    type: ScopeType.Erc20TransferAmount,
    tokenAddress: '<TOKEN_ADDRESS>',
    maxAmount: parseUnits('50', 6),
  },
  parentDelegation: signedRootDelegation,
  caveats: [
    { type: 'timestamp', afterThreshold: now, beforeThreshold: expiry },
  ],
})

const redelegationSignature = await delegateSmartAccount.signDelegation({ delegation: redelegation })
const signedRedelegation = { ...redelegation, signature: redelegationSignature }
```

You can also redelegate from an encoded delegation chain:

```typescript
const redelegation = createDelegation({
  to: secondDelegateAddress,
  from: delegateAddress,
  environment,
  scope: { type: ScopeType.Erc20TransferAmount, tokenAddress: '<TOKEN_ADDRESS>', maxAmount: parseUnits('50', 6) },
  parentPermissionContext: encodedDelegationChain,
})
```

## Redeem the chain

When redeeming a delegation chain, pass the full array of delegations ordered from leaf to root. The DelegationManager validates the entire chain before executing:

```typescript
import { DelegationManager } from '@metamask/smart-accounts-kit/contracts'
import { createExecution, ExecutionMode } from '@metamask/smart-accounts-kit'

const redeemCalldata = DelegationManager.encode.redeemDelegations({
  delegations: [[signedRedelegation, signedRootDelegation]],
  modes: [ExecutionMode.SingleDefault],
  executions: [[execution]],
})
```

## Rules

- Caveats are cumulative — each link in the chain inherits all restrictions from its parents.
- A delegate can only redelegate with equal or lesser authority.
- All delegator accounts in the chain must be deployed.
