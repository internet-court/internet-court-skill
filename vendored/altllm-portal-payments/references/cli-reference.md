# AltLLM Portal Payments — CLI Reference

## Commands

### Create hosted payment link

```bash
node dist/cli.js topup-crypto \
  --base-url https://platform-api.altllm.ai \
  --amount 25
```

### Create discounted payment link with explicit pay currency

```bash
node dist/cli.js topup-crypto \
  --base-url https://platform-api.altllm.ai \
  --amount 100 \
  --pay-currency sol \
  --discount-code SOLANA
```

### Create direct payment link and auto-pay

```bash
ALTLLM_WALLET_PRIVATE_KEY=<private-key> \
node dist/cli.js topup-crypto \
  --base-url https://platform-api.altllm.ai \
  --amount 25 \
  --pay-currency usdcbase \
  --private-key-env ALTLLM_WALLET_PRIVATE_KEY \
  --auto-pay \
  --wait
```

### Payment status

```bash
node dist/cli.js payment-status \
  --base-url https://platform-api.altllm.ai \
  --payment-link-id <id> \
  --wait
```

### Pay existing payment link

```bash
ALTLLM_WALLET_PRIVATE_KEY=<private-key> \
node dist/cli.js pay-payment-link \
  --base-url https://platform-api.altllm.ai \
  --payment-link-id <id> \
  --private-key-env ALTLLM_WALLET_PRIVATE_KEY \
  --wait
```

Wallet private-key input options for payment commands:

- `ALTLLM_WALLET_PRIVATE_KEY=<private-key>` with the default `--private-key-env ALTLLM_WALLET_PRIVATE_KEY`
- `--private-key-env <ENV_NAME>`
- `--private-key-file <path>`
- `--private-key <hex>` with `--allow-unsafe-private-key-argv`

Direct `--private-key` usage requires `--allow-unsafe-private-key-argv` because command-line arguments can leak through shell history and process listings.

## Notes

- `payment-status` and `pay-payment-link` currently only search the newest `100` Portal payment links.
- Older payment links are not reachable from these CLI flows until the backend supports lookup by ID or older-page pagination.
- Automatic payment requires `pay_address`, `pay_amount`, and `pay_currency` to be present in the API response.
- Automatic payment only supports the EVM-compatible pay currencies implemented by `src/lib/wallet.ts`: `eth`, `usdterc20`, `usdcerc20`, `usdcbase`, and `usdtbase`.
- `--discount-code` creates discounted credit top-up invoices only; it is separate from subscription workflows and from `redeem-promo`.
- Payment outputs include any discount fields returned by Portal, including `discountCode`, `originalAmount`, `discountPercent`, `discountAmount`, `finalAmount`, and `allowedPayCurrencies`.
- Discount-code top-ups call Portal preview before payment-link creation. If Portal returns one allowed token, the CLI uses it automatically; if multiple tokens are allowed, pass one with `--pay-currency`.
- If Portal returns `allowedPayCurrencies`, the CLI rejects mismatched `--pay-currency` values before payment-link creation.
