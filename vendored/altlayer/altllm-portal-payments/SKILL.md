---
name: altllm-portal-payments
description: Use this skill when the user asks to create a NOWPayments crypto payment link, poll payment status, or execute a supported direct wallet payment through the AltLLM Portal CLI. Do NOT use for wallet login, API key management, billing history, or x402 credit top-ups.
user-invocable: true
---

# AltLLM Portal Payments

NOWPayments payment-link creation, settlement polling, and direct wallet payment flows for the local `altllm` CLI.

These payment links are separate from AltLLM Portal x402 credit top-ups. Use `altllm-x402` for `/api/billing/x402/quote` and `/settle` flows.

## Shared Setup

> Before the first `altllm` command in a fresh checkout, read and follow:
> - `../_shared/preflight.md`
> - `../_shared/session-and-target.md`

## Command Index

| Command | Purpose |
|---|---|
| `topup-crypto` | Create a hosted or direct crypto payment link |
| `payment-status` | Inspect or poll an existing payment link |
| `pay-payment-link` | Send a direct on-chain payment for an existing link |

## Guardrails

- Unsupported `pay_currency` values must fail fast.
- `pay-payment-link` must not pay terminal links (`completed`, `expired`, `failed`, `deactivated`).
- Do not silently downgrade from direct payment to hosted checkout.
- `topup-crypto --discount-code <code>` is for discounted credit top-up invoices, not subscriptions.
- Discount-code top-ups should be previewed before payment-link creation so a single allowed token can be selected automatically.
- Token-scoped discount codes must respect Portal-returned `allowedPayCurrencies`.
- Payment command JSON should surface discount metadata returned by the Portal API.
- `pay-payment-link --wait` should emit one final JSON document.
- `payment-status` and `pay-payment-link` currently depend on the newest `100` records from `GET /api/billing/payment-links?limit=100`.
- Older payment links are not reachable from these CLI flows until the backend exposes per-link lookup or older-page pagination.
- Supported automatic direct-payment currencies are:
  - `eth`
  - `usdterc20`
  - `usdcerc20`
  - `usdcbase`
  - `usdtbase`

## Reference

See [references/cli-reference.md](references/cli-reference.md) for workflows and representative outputs.
