---
name: altllm-portal-billing
description: Use this skill when the user asks to inspect AltLLM Portal balance, redeem a promo code, review billing transactions, or view usage analytics by period, model, or API key using the local altllm CLI. Do NOT use for API key lifecycle management or payment-link execution.
user-invocable: true
---

# AltLLM Portal Billing

Balance, promo, transaction history, and usage analytics for the local `altllm` CLI.

## Shared Setup

> Before the first `altllm` command in a fresh checkout, read and follow:
> - `../_shared/preflight.md`
> - `../_shared/session-and-target.md`

## Command Index

| Command | Purpose |
|---|---|
| `credit` | Current Portal balance, expiry, and allowed models |
| `redeem-promo` | Redeem a promo code |
| `transactions` | Billing transaction history with pagination and type filters |
| `usage-summary` | Current calendar-month summary |
| `usage-timeline` | Daily usage history |
| `usage-by-model` | Usage grouped by model |
| `usage-by-key` | Usage grouped by API key |

## Rules

- These commands use the saved Portal session token.
- History commands mostly return raw Portal API JSON.
- `credit` is the current CLI inspection path for plan/model-access metadata returned by Portal, including Business/Flex fields such as `subscription_tier: "flex"` when present.
- `transactions` supports `--page`, `--limit`, and `--type`.
- `usage-summary` currently reflects the current calendar month only.
- `usage-timeline` and `usage-by-model` support either `--month` or a complete explicit date range.
- `usage-by-key` supports either `--month` or a complete explicit date range.
- `balance` is an alias for `credit`.

## Reference

See [references/cli-reference.md](references/cli-reference.md) for filters, examples, and representative outputs.
