---
name: Smart accounts
description: API reference for creating ERC-4337 smart accounts — Hybrid, MultiSig, or Stateless7702 implementations
---

# Smart accounts

## When to use

- You want to create an ERC-4337 smart account.
- You want to configure signers (EOA private key, passkey/WebAuthn, wallet client, multisig).
- You want to deploy a smart account via a bundler.
- You want to choose between Hybrid, MultiSig, or Stateless7702 implementations.

## API reference

### `toMetaMaskSmartAccount` parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `client` | `Client` | Yes | Viem client for retrieving smart account data |
| `implementation` | `Implementation` | Yes | `Hybrid`, `MultiSig`, or `Stateless7702` |
| `signer` | `SignerConfigByImplementation` | No | Viem Account, Wallet Client, or WebAuthn Account (Hybrid only). Omitting disables signing operations. |
| `deployParams` | `DeployParams` | If no `address` | Parameters for deployment (not needed for Stateless7702) |
| `deploySalt` | `Hex` | If no `address` | Salt for deployment (not needed for Stateless7702) |
| `address` | `Address` | If no `deployParams` | Existing smart account or 7702 EOA address |
| `environment` | `SmartAccountsEnvironment` | No | Environment for smart contract resolution |
| `nonceKeyManager` | `NonceManager` | No | Custom nonce key manager for parallel user operation execution |

For more details, see the [smart account reference](https://docs.metamask.io/smart-accounts-kit/reference/smart-account.md).

### Which implementation to use

| Name | Enum | Usage |
|------|------|-------|
| Hybrid | `Implementation.Hybrid` | A flexible account with EOA, wallet client, and passkey (WebAuthn) signers. The most flexible option for standard dApp users. |
| MultiSig | `Implementation.MultiSig` | Requires multiple signers to meet a threshold before transactions execute. Best for treasury, DAO, or shared custody use cases. |
| Stateless7702 | `Implementation.Stateless7702` | Upgrades an existing EOA to a smart account using EIP-7702 while keeping the same address. Best for users with existing embedded EOAs. |

If the user hasn't specified which implementation they need, present the options.

## Important rules

- You must deploy the account before creating delegations — use `sendUserOperation` to deploy.
- `signer` is optional — if you omit it, signing operations throw.
- For Hybrid `deployParams`, pass empty arrays `[]` if you don't need passkeys.
- The number of MultiSig signers must be ≥ the threshold.
- Stateless7702 requires an EIP-7702 upgrade first and only works with Viem local accounts.
- The paymaster is optional — without it, the smart account must have funds to pay gas.

## Workflows

- [Create hybrid account](../workflows/create-hybrid-account.md) — EOA, wallet client, or passkey signers
- [Create multisig account](../workflows/create-multisig-account.md) — threshold-based signing with multiple signers
- [Create 7702 account](../workflows/create-7702-account.md) — upgrade an existing EOA using EIP-7702
- [Create delegation](../workflows/create-delegation.md) — uses `toMetaMaskSmartAccount` to set up the delegator
- [Create redelegation](../workflows/create-redelegation.md) — delegation chains across accounts
- [Redeem delegation — smart account](../workflows/redeem-delegation-smart-account.md) — redeem when the delegate is a smart account
- [Redeem delegation — EOA](../workflows/redeem-delegation-eoa.md) — redeem when the delegate is an EOA

## Docs

- [Smart account quickstart](https://docs.metamask.io/smart-accounts-kit/development/get-started/smart-account-quickstart.md)
