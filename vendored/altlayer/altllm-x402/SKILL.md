---
name: altllm-x402
description: Use this skill when the user asks to create, settle, debug, or document AltLLM Portal x402 credit top-ups, including Binance B402, BSC/USDT quotes, optional top-up discount codes, wallet signing, settlement, cancellation, and facilitator errors. Also use for future AltLLM x402 paid-resource design. Do NOT use for NOWPayments hosted/direct payment links; use altllm-portal-payments for those.
user-invocable: true
---

# AltLLM x402

x402 integration guidance for AltLLM Portal credit top-ups and related agent payment flows.

The current `altllm` CLI in this repository does not expose x402 commands. The source implementation lives in `alt-research/altllm` as Portal API endpoints and a repo-local `altllm-discount-topup` helper skill.

## When To Use

Use this skill for:

- quoting or settling an AltLLM Portal x402 credit top-up
- using an x402 top-up discount code such as a fixed-value starter offer
- helping a user approve, sign, or cancel an x402 checkout
- debugging Binance B402 facilitator, `/supported`, `/verify`, or `/settle` errors
- documenting the current AltLLM x402 implementation boundary
- designing future AltLLM x402 paid-resource or pay-per-request flows

## First Steps

1. Read [references/protocol-reference.md](references/protocol-reference.md) for the current repo-local x402 notes.
2. Confirm whether the task is current Portal top-up, future paid-resource design, or protocol debugging.
3. For live implementation work, verify `alt-research/altllm` first because Portal x402 behavior and enabled assets are controlled there.
4. Keep Portal bearer tokens, generated gateway API keys, and wallet payment credentials separate.

## Guardrails

- Do not describe NOWPayments hosted checkout or direct-payment links as x402.
- Current AltLLM Portal x402 is a one-time credit top-up flow, not an `altllm` CLI command and not current gateway pay-per-request middleware.
- Current staging/prod defaults target Binance B402 on BNB Chain mainnet: `network: "bsc"` with CAIP-2 alias `eip155:56`, normally `asset: "usdt"`.
- Quote through `POST /api/billing/x402/quote`; settle through `POST /api/billing/x402/settle`; cancel quoted checkouts through `POST /api/billing/x402/{payment_id}/cancel`.
- Use normal non-promo top-up amounts of `$5` or more unless the server-side promo flow explicitly allows a fixed smaller payable amount.
- Use the Portal quote response as the source of truth for payable amount, token amount, `payment_requirement`, expiration, discount fields, and `payment_id`.
- Do not submit settlement without explicit user approval unless a prior spend policy covers this exact amount, network, asset, and discount code.
- Never invent or edit signed x402 payment payloads. Have a wallet or approved x402 client satisfy the returned `payment_requirement`.
- Do not retry blindly with the same signed payload after facilitator verification or settlement fails.
- Keep wallet private keys, Portal tokens, and signed payload JSON in env vars, protected files, or stdin. Do not print or pass them on argv.

## Reference

See [references/protocol-reference.md](references/protocol-reference.md) for AltLLM Portal endpoints, fields, runtime config, and troubleshooting.
