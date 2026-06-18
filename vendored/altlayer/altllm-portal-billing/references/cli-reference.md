# AltLLM Portal Billing — CLI Reference

## Commands

### Balance

```bash
node dist/cli.js credit \
  --base-url https://platform-api.altllm.ai
```

Alias: `node dist/cli.js balance`

`credit` passes through plan/model-access metadata when Portal returns it. Use it to inspect Personal tiers (`free`, `basic`, `pro`, `power`) or Business/Flex (`subscription_tier: "flex"`) status and allowed models. Flex can include normal AltLLM models plus Flex-only IDs such as `altllm-flex-gpt-5.5`, `altllm-flex-opus-4.7`, and `altllm-flex-gemini-3.1`, subject to backend access checks.

### Redeem promo

```bash
node dist/cli.js redeem-promo \
  --base-url https://platform-api.altllm.ai \
  --code PROMO-XXXX
```

### Transactions

```bash
node dist/cli.js transactions \
  --base-url https://platform-api.altllm.ai \
  --limit 20 \
  --type usage
```

Representative stdout:

```json
{
  "transactions": [],
  "total": 0,
  "page": 1,
  "pages": 1,
  "limit": 20
}
```

### Usage summary

```bash
node dist/cli.js usage-summary \
  --base-url https://platform-api.altllm.ai
```

This endpoint currently returns the current calendar-month summary.

### Usage timeline

```bash
node dist/cli.js usage-timeline \
  --base-url https://platform-api.altllm.ai
```

### Usage by model

```bash
node dist/cli.js usage-by-model \
  --base-url https://platform-api.altllm.ai
```

### Usage by key

```bash
node dist/cli.js usage-by-key \
  --base-url https://platform-api.altllm.ai
```

## Notes

- `credit` and `redeem-promo` pass through the API response body unchanged.
- This repo does not implement plan billing logic or bypass Portal/Gateway model-access checks.
- Transaction history and usage analytics are useful for validating gateway metering behavior.
- `usage-timeline`, `usage-by-model`, and `usage-by-key` default to the current UTC month.
- Usage commands accept either `--month` or a complete `--start-date` / `--end-date` range, but not both.
