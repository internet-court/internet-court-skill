---
name: smart-accounts-kit
description: Build dApps with MetaMask Smart Accounts Kit — ERC-4337 smart accounts, delegations, and Advanced Permissions (ERC-7715)
---

# MetaMask Smart Accounts Kit

## When to use

- You want to create ERC-4337 smart accounts (Hybrid, MultiSig, or Stateless7702)
- You want to send user operations or batch transactions via bundlers
- You want to configure signers (EOA, passkey/WebAuthn, multisig, wallet client)
- You want to implement gas abstraction with paymasters
- You want to create, sign, or redeem delegations (ERC-7710)
- You want to request Advanced Permissions via MetaMask extension (ERC-7715)
- You want to build automated backend services (DCA bots, keeper services) using delegations
- You want to implement session accounts for AI agents or automated trading
- You want to set up parallel user operations with nonce keys

## Installation

```bash
npm install @metamask/smart-accounts-kit permissionless
```

## Which smart account type to use

| Name | Usage |
|------|-------|
| Hybrid | A flexible account with EOA, wallet client, and passkey (WebAuthn) signers. The most flexible option for standard dApp users. |
| MultiSig | Requires multiple signers to meet a threshold before transactions execute. Best for treasury, DAO, or shared custody use cases. |
| Stateless7702 | Upgrades an existing EOA to a smart account using EIP-7702 while keeping the same address. Best for users with existing embedded EOAs. |

If the user hasn't specified which implementation they need, present the options.

## Delegations vs Advanced Permissions

| Name | Usage |
|------|-------|
| Delegations (ERC-7710) | You create, sign, and manage delegations programmatically. The delegator is a smart account you control. You handle the full lifecycle: creation, signing, storage, and redemption. |
| Advanced Permissions (ERC-7715) | You request permissions from a MetaMask user through a human-readable UI in the extension. MetaMask creates and enforces the delegations internally. The user can review and adjust parameters before approving. |

Advanced Permissions use delegations under the hood — ERC-7715 creates ERC-7710 delegations internally. If the user hasn't specified which to use, present the options.

## API references

| Use case | Reference | Workflows |
|----------|-----------|-----------|
| Create a smart account | [toMetaMaskSmartAccount](./references/smart-accounts.md) | [Create hybrid account](./workflows/create-hybrid-account.md), [Create multisig account](./workflows/create-multisig-account.md), [Create 7702 account](./workflows/create-7702-account.md) |
| Create a delegation | [createDelegation](./references/delegations.md) | [Create delegation](./workflows/create-delegation.md), [Create redelegation](./workflows/create-redelegation.md) |
| Request ERC-7715 permissions | [requestExecutionPermissions](./references/advanced-permissions.md) | [Request permissions](./workflows/request-permissions.md), [Redeem — smart account](./workflows/redeem-permissions-smart-account.md), [Redeem — EOA](./workflows/redeem-permissions-eoa.md) |

## Workflows

| Use case | Workflow |
|----------|----------|
| Create a Hybrid smart account | [Create hybrid account](./workflows/create-hybrid-account.md) |
| Create a MultiSig smart account | [Create multisig account](./workflows/create-multisig-account.md) |
| Create a Stateless7702 smart account | [Create 7702 account](./workflows/create-7702-account.md) |
| Create and sign a delegation | [Create delegation](./workflows/create-delegation.md) |
| Create a delegation chain (redelegation) | [Create redelegation](./workflows/create-redelegation.md) |
| Redeem a delegation when the delegate is a smart account | [Redeem delegation — smart account](./workflows/redeem-delegation-smart-account.md) |
| Redeem a delegation when the delegate is an EOA | [Redeem delegation — EOA](./workflows/redeem-delegation-eoa.md) |
| Request ERC-7715 Advanced Permissions | [Request permissions](./workflows/request-permissions.md) |
| Redelegate an ERC-7715 permission context | [Create redelegation for permissions](./workflows/create-redelegation-permissions.md) |
| Redeem ERC-7715 permissions when the session account is a smart account | [Redeem permissions — smart account](./workflows/redeem-permissions-smart-account.md) |
| Redeem ERC-7715 permissions when the session account is an EOA | [Redeem permissions — EOA](./workflows/redeem-permissions-eoa.md) |

## Important notes

- Always use caveats — never create unrestricted delegations.
- Deploy the delegator first — the account must be deployed before redeeming delegations.
- Function call scope defaults to no native token — use `valueLte` to allow it.
- Caveats are cumulative in delegation chains — restrictions stack.
- ERC-7715 requires MetaMask Flask 13.5.0+ or MetaMask stable 13.23.0+, and the user must have a smart account.
- Always check that the project builds successfully after making changes.
- Smart Accounts Kit version: 1.6.0 | Delegation Framework: 1.3.0

## Resources

- NPM: `@metamask/smart-accounts-kit`
- Contract deployments: [Delegation Framework deployments](https://github.com/MetaMask/delegation-framework/blob/main/documents/Deployments.md)
- Docs: https://docs.metamask.io/smart-accounts-kit
- MetaMask Flask: https://metamask.io/flask
