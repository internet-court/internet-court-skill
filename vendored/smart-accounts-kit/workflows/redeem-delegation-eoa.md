---
name: Redeem delegation with an EOA delegate
description: Redeem delegations when the delegate is an EOA
---

# Redeem delegation with an EOA delegate

Use this workflow when the delegate is an EOA. If the delegate is a smart account, use [Redeem delegation — smart account](./redeem-delegation-smart-account.md) instead.

## Prepare and encode the execution

Encode the function call you want to execute on behalf of the delegator. This example transfers 1 USDC to a recipient:

```typescript
import { createExecution, ExecutionMode } from '@metamask/smart-accounts-kit'
import { DelegationManager } from '@metamask/smart-accounts-kit/contracts'
import { encodeFunctionData, erc20Abi, parseUnits } from 'viem'

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

## Send the transaction

Send the redeem calldata directly to the DelegationManager contract. The EOA delegate doesn't need a bundler:

```typescript
import { getSmartAccountsEnvironment } from '@metamask/smart-accounts-kit'

const txHash = await delegateWalletClient.sendTransaction({
  to: getSmartAccountsEnvironment(chain.id).DelegationManager,
  data: redeemCalldata,
  chain,
})
```
