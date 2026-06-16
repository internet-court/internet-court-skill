---
name: Create a multisig account
description: Create a MultiSig smart account with threshold-based signing
---

# Create a multisig account

The MultiSig implementation requires multiple signers to approve transactions. You configure a threshold that determines how many signatures are needed.

## Create the multisig account

Provide an array of signer addresses and a threshold. The number of signers must be greater than or equal to the threshold:

```typescript
import { Implementation, toMetaMaskSmartAccount } from '@metamask/smart-accounts-kit'
import { privateKeyToAccount } from 'viem/accounts'

const signer1 = privateKeyToAccount('<SIGNER_1_PRIVATE_KEY>')
const signer2 = privateKeyToAccount('<SIGNER_2_PRIVATE_KEY>')

const smartAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.MultiSig,
  deployParams: [[signer1.address, signer2.address], 2n],
  deploySalt: '0x',
  signer: [{ account: signer1 }, { account: signer2 }],
})
```

You can also mix signer types (EOA accounts and wallet clients):

```typescript
const smartAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.MultiSig,
  deployParams: [[account1.address, account2.address], 2n],
  deploySalt: '0x',
  signer: [{ account: account1 }, { walletClient: walletClient2 }],
})
```

## Aggregate signatures

When collecting signatures from multiple signers separately, use `aggregateSignature` to combine them:

```typescript
import { aggregateSignature } from '@metamask/smart-accounts-kit'

const aggregatedSignature = aggregateSignature({
  signatures: [
    { signer: signer1.address, signature: signature1, type: 'ECDSA' },
    { signer: signer2.address, signature: signature2, type: 'ECDSA' },
  ],
})
```

## Deploy the account

You must deploy the smart account before creating delegations:

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

const userOpHash = await bundlerClient.sendUserOperation({
  account: smartAccount,
  calls: [{ to: smartAccount.address, value: 0n, data: '0x' }],
})
```

For more details, see the [smart account reference](https://docs.metamask.io/smart-accounts-kit/reference/smart-account.md).
