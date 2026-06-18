# AltLLM Portal CLI Skill Map

This file maps local CLI commands to the focused repo-local skills.

## Skills

| Skill | Commands | Notes |
|---|---|---|
| `altllm-portal-auth` | `login-wallet`, `status`, `logout` | Local signing, challenge preparation, external signature verification, saved-session inspection |
| `altllm-portal-api-keys` | `list-api-keys`, `create-api-key`, `get-api-key`, `update-api-key`, `revoke-api-key` | Keys are for the OpenAI-compatible gateway; Flex-only `altllm-flex-*` model IDs are valid allowlist entries when backend access permits |
| `altllm-portal-billing` | `credit`, `redeem-promo`, `transactions`, `usage-summary`, `usage-timeline`, `usage-by-model`, `usage-by-key` | Mostly raw Portal API JSON responses; use `credit` for returned plan/model-access metadata such as `subscription_tier` |
| `altllm-portal-payments` | `topup-crypto`, `payment-status`, `pay-payment-link` | Includes NOWPayments/direct-payment guardrails, supported automatic payment currencies, and credit top-up discount-code metadata |
| `altllm-x402` | none in the current `altllm` CLI | Guidance for Portal x402 credit top-ups implemented in `alt-research/altllm`: `/api/billing/x402/quote`, `/settle`, and `/{payment_id}/cancel` |

## Repository Files

- CLI entry:
  - [src/cli.ts](../../../src/cli.ts)
- Auth flow:
  - [src/commands/login-wallet.ts](../../../src/commands/login-wallet.ts)
  - [src/commands/status.ts](../../../src/commands/status.ts)
  - [src/lib/wallet.ts](../../../src/lib/wallet.ts)
- API key flow:
  - [src/lib/keys.ts](../../../src/lib/keys.ts)
  - [src/commands/list-api-keys.ts](../../../src/commands/list-api-keys.ts)
  - [src/commands/create-api-key.ts](../../../src/commands/create-api-key.ts)
  - [src/commands/get-api-key.ts](../../../src/commands/get-api-key.ts)
  - [src/commands/update-api-key.ts](../../../src/commands/update-api-key.ts)
  - [src/commands/revoke-api-key.ts](../../../src/commands/revoke-api-key.ts)
- Billing and history:
  - [src/commands/credit.ts](../../../src/commands/credit.ts)
  - [src/commands/redeem-promo.ts](../../../src/commands/redeem-promo.ts)
  - [src/lib/history.ts](../../../src/lib/history.ts)
  - [src/commands/transactions.ts](../../../src/commands/transactions.ts)
  - [src/commands/usage-summary.ts](../../../src/commands/usage-summary.ts)
  - [src/commands/usage-timeline.ts](../../../src/commands/usage-timeline.ts)
  - [src/commands/usage-by-model.ts](../../../src/commands/usage-by-model.ts)
  - [src/commands/usage-by-key.ts](../../../src/commands/usage-by-key.ts)
- Payments:
  - [src/commands/topup-crypto.ts](../../../src/commands/topup-crypto.ts)
  - [src/commands/pay-payment-link.ts](../../../src/commands/pay-payment-link.ts)
- x402:
  - [skills/altllm-x402/SKILL.md](../../altllm-x402/SKILL.md)
  - [skills/altllm-x402/references/protocol-reference.md](../../altllm-x402/references/protocol-reference.md)
- Shared session and API wrapper:
  - [src/lib/session.ts](../../../src/lib/session.ts)
  - [src/lib/api.ts](../../../src/lib/api.ts)
