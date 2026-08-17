# AltLLM x402 Protocol Reference

Current as of 2026-06-15. Re-check `alt-research/altllm` before live implementation.

Primary AltLLM source references:

- AltLLM x402 design: https://github.com/alt-research/altllm/blob/main/docs/x402-payment-integration.md
- Upstream agent skill: https://github.com/alt-research/altllm/blob/main/.agents/skills/altllm-discount-topup/SKILL.md
- Portal service: https://github.com/alt-research/altllm/blob/main/portal/api/services/x402.py
- Billing routes: https://github.com/alt-research/altllm/blob/main/portal/api/routes/billing.py
- Billing models: https://github.com/alt-research/altllm/blob/main/portal/api/models/billing.py
- GitOps config tests: https://github.com/alt-research/altllm/blob/main/tests/test_x402_gitops_staging_config.py
- Binance Onchain Pay x402: https://developers.binance.com/docs/onchainpay-x402/introduction

## AltLLM Boundary

- The current `altllm` CLI in this repository does not expose x402 commands.
- The current AltLLM implementation is a Portal credit top-up payment channel, not current gateway pay-per-request middleware.
- NOWPayments payment links remain under `altllm-portal-payments`; x402 top-ups use separate Portal API endpoints.
- Generated Portal API keys are for the OpenAI-compatible gateway at `https://api.altllm.ai/v1`; they are not x402 payment credentials.
- If a future x402-protected service calls the AltLLM gateway, keep the gateway API key server-side.

## Current Portal Flow

Quote:

```http
POST /api/billing/x402/quote
Authorization: Bearer <Portal token>
Content-Type: application/json
```

```json
{
  "amount": "100",
  "network": "bsc",
  "asset": "usdt",
  "promo_code": "OPTIONAL"
}
```

The quote response includes:

- `payment_id`
- `status`
- `amount`
- `credit_amount`
- `final_amount`
- `currency`
- `network`
- `asset`
- `pay_to`
- `payment_requirement`
- `expires_at`
- optional discount fields: `promo_code`, `discount_percent`, `max_discount_amount`, `fixed_credit_amount`, `fixed_pay_amount`, `discount_amount`, `allowed_pay_currencies`

Settle after the wallet or x402 client returns a signed payment payload:

```http
POST /api/billing/x402/settle
Authorization: Bearer <Portal token>
Content-Type: application/json
```

```json
{
  "payment_id": "<quote payment_id>",
  "payment_payload": {
    "x402Version": 2
  }
}
```

The actual `payment_payload` must come from the user's wallet or a compatible x402/B402 client. Do not fabricate it.

Settle response fields include:

- `payment_id`
- `status`
- `amount`
- `credit_amount`
- `final_amount`
- `balance`
- `transaction_id`
- `settlement_id`
- `tx_hash`
- optional discount fields

Cancel an unsubmitted quoted checkout:

```http
POST /api/billing/x402/{payment_id}/cancel
Authorization: Bearer <Portal token>
```

## Current Network And Provider

- Provider: Binance B402.
- Staging facilitator URL: `https://qacb.sdtaop.com`.
- Production facilitator URL: `https://cb.binanceapi.com`.
- Current staging/prod network: `bsc`, aliased to CAIP-2 `eip155:56`.
- Current staging/prod asset: `usdt`.
- USDT BSC token address: `0x55d398326f99059fF775485246999027B3197955`.
- Asset decimals: `18`.
- Payment scheme: `exact`.
- x402 version: `2`.
- Default chart hardening allows `eip3009`; released staging/prod config also allows `permit2-exact` with an explicit spender allowlist.
- Binance `/papi/v2/b402/supported` is the normal source of `payment_requirement.extra`.

## Payment Requirement Notes

- Portal builds a server-bound `payment_requirement`; agents should preserve it exactly.
- For Binance B402 V2, Portal uses an `amount` field in token minor units rather than `maxAmountRequired`.
- The requirement includes the normalized wire network, asset address, `payTo`, resource metadata, expiration, and provider `extra`.
- Portal validates the returned payment payload against the quoted requirement, recipient, transfer amount, transfer method, and provider `extra`.
- Portal hashes payment payloads and stores settlement identifiers/tx hashes for replay protection.

## Agent Workflow

1. Use an authenticated Portal bearer token, not a generated gateway API key.
2. Create a quote with `amount`, `network: "bsc"`, `asset: "usdt"`, and optional `promo_code`. Use `$5` or more for normal non-promo top-ups unless the server-side promo flow explicitly allows a fixed smaller payable amount.
3. Show the user the original credit amount, final payable amount, discount details, network, asset, pay-to address, and expiration.
4. Get explicit approval before signing unless a prior spend policy covers this exact purchase.
5. Have the wallet or approved x402 client satisfy the returned `payment_requirement`.
6. Submit the signed `payment_payload` to `/api/billing/x402/settle`.
7. Report `balance`, `settlement_id`, `tx_hash`, `payment_id`, and discount fields.

Never pass Portal bearer tokens or signed payload JSON on argv. Use environment variables, protected files, or stdin.

When working inside the main `alt-research/altllm` checkout, prefer the upstream helper for deterministic API calls:

```bash
python .agents/skills/altllm-discount-topup/scripts/x402_discount_topup.py quote \
  --portal-url "$PORTAL_URL" \
  --amount 100 \
  --network bsc \
  --asset usdt \
  --promo-code "$DISCOUNT_CODE"
```

```bash
python .agents/skills/altllm-discount-topup/scripts/x402_discount_topup.py settle \
  --portal-url "$PORTAL_URL" \
  --payment-id "$PAYMENT_ID" \
  --payment-payload-file ./payment-payload.json
```

## Status Lifecycle

- `quoted`: requirement created and still payable.
- `verifying`: settlement is in progress.
- `settled`: credits were granted exactly once.
- `failed`: facilitator verification or settlement failed.
- `expired`: quote expired, was canceled, or discount reservation is no longer active.

## Troubleshooting

- `503 x402 credit top-ups are not enabled`: target Portal environment is not configured for x402.
- `503 Unable to fetch Binance B402 /supported metadata`: Portal egress, Binance credentials, or facilitator availability is blocking quote creation.
- `400 Invalid discount code`: ask for a different code or continue without a promo.
- `400` or `409 PENDING_PAYMENT`: the discount code is attached to an open checkout; settle it, cancel it, or let it expire.
- `402` from settlement: facilitator verify/settle failed. Do not retry blindly with the same signed payload.
- Wallet cannot sign/pay: confirm BNB Chain mainnet, USDT balance, EIP-3009 or Permit2 support, and any Permit2 allowance.
- Wallet warns about a Permit2 spender: stop and surface the warning unless the spender is explicitly allowlisted and the user approves.
- Failed or expired checkout: create a fresh quote before submitting another signed payload.

## Future Paid-Resource x402

Some AltLLM strategy docs discuss x402 pay-per-request APIs, MCP servers, or agent resources. Treat those as future design unless the target code implements them. For future work, keep the AltLLM gateway API key server-side and use x402 only for the buyer payment credential.
