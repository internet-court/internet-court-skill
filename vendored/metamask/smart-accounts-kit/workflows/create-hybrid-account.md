---
name: Create a hybrid account
description: Create a Hybrid smart account with EOA, wallet client, or passkey signers
---

# Create a hybrid account

The Hybrid implementation is the most flexible smart account type. It supports EOA, wallet client, and passkey (WebAuthn) signers.

## Create with an EOA signer

Create a Hybrid smart account using a private key. Pass empty arrays for the passkey parameters if you don't need passkey signers:

```typescript
import { Implementation, toMetaMaskSmartAccount } from '@metamask/smart-accounts-kit'
import { privateKeyToAccount } from 'viem/accounts'

const account = privateKeyToAccount('<PRIVATE_KEY>')

const smartAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.Hybrid,
  deployParams: [account.address, [], [], []],
  deploySalt: '0x',
  signer: { account },
})
```

## Create with a wallet client signer

Use a wallet client (for example, from MetaMask or another browser wallet) instead of a raw private key:

```typescript
const [address] = await walletClient.getAddresses()

const smartAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.Hybrid,
  deployParams: [address, [], [], []],
  deploySalt: '0x',
  signer: { walletClient },
})
```

## Create with a passkey (WebAuthn) signer

Use a passkey for biometric authentication. This requires the `ox` library for public key conversion:

```typescript
import { toWebAuthnAccount } from 'viem/account-abstraction'
import { createWebAuthnCredential } from 'viem/account-abstraction'
import { Address, PublicKey } from 'ox'
import { toHex } from 'viem'

const credential = await createWebAuthnCredential({ name: 'MetaMask smart account' })
const webAuthnAccount = toWebAuthnAccount({ credential })
const publicKey = PublicKey.fromHex(credential.publicKey)
const owner = Address.fromPublicKey(publicKey)

const smartAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.Hybrid,
  deployParams: [owner, [toHex(credential.id)], [publicKey.x], [publicKey.y]],
  deploySalt: '0x',
  signer: { webAuthnAccount, keyId: toHex(credential.id) },
})
```

## Deploy the account

You must deploy the smart account before creating delegations. Send a no-op user operation to trigger deployment:

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
