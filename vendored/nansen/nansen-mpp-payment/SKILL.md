---
name: nansen-mpp-payment
description: Pay-per-call access to the Nansen API via MPP (Tempo). Use when a user wants anonymous Nansen access without an API key and without managing their own Base/Solana wallet — they install the tempo CLI separately and call the API through `tempo request`.
metadata:
  openclaw:
    requires:
      bins:
        - tempo
    install:
      - kind: external
        name: tempo
        docs: https://docs.tempo.xyz
allowed-tools: Bash(tempo:*), Bash(nansen:*)
---

# MPP / Tempo

The Nansen API supports three paid-access rails: API key, x402 (handled by `nansen-cli`), and MPP via Tempo (handled by the **separate** [tempo CLI](https://docs.tempo.xyz)). This skill covers the third.

`nansen-cli` does **not** sign MPP credentials. Use this skill when the user wants to call the Nansen API through `tempo request` because they already use tempo, want micropayments without managing wallet keys themselves, or don't want to fund a Base/Solana USDC wallet.

For API-key auth, see `nansen-wallet-manager`. For x402 micropayment with a local wallet, see `nansen-trading` / `nansen-wallet-manager`.

## When to use this skill

- User says "MPP", "tempo", "Authorization: Payment", or "Payment-Receipt".
- User has no Nansen API key and doesn't want to set up a Base/Solana wallet.
- User is already paying for other APIs through tempo and wants Nansen on the same rail.

## One-time setup

```bash
# 1. Install the tempo CLI
curl -fsSL https://tempo.xyz/install | bash
# 2. Log in (creates / unlocks the tempo wallet)
tempo wallet login
# 3. Fund it with USDC on the chain tempo selects for your environment
tempo wallet fund
# 4. Confirm the wallet is ready
tempo wallet whoami
```

## Calling the Nansen API

`tempo request` handles the full MPP challenge/response: it sends the request, signs the `Authorization: Payment` credential when the API responds 402 + `WWW-Authenticate: Payment ...`, retries, and exposes the `Payment-Receipt` header on success.

```bash
# Smart Money netflow
tempo request POST https://api.nansen.ai/api/v1/smart-money/netflow \
  --json '{"chains":["solana"],"pagination":{"page":1,"page_size":10}}'

# TGM holders
tempo request POST https://api.nansen.ai/api/v1/tgm/holders \
  --json '{"token_address":"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v","chain":"solana"}'
```

Endpoint paths and request shapes are the same as the rest of the Nansen API — run `nansen schema <command>` (no API key required) to look up the body shape, then call the matching `/api/v1/...` path through `tempo request`.

## Discovering paid endpoints

```bash
curl https://api.nansen.ai/.well-known/x402
```

Returns `paymentProtocols: ["x402", "mpp"]` (when MPP is enabled server-side) and the list of paid resources.

## How MPP differs from x402

| | **x402** (nansen-cli native) | **MPP via tempo** (this skill) |
|---|---|---|
| Header sent on retry | `Payment-Signature: <base64>` | `Authorization: Payment <credential>` |
| 402 challenge header | `Payment-Required: <base64>` | `WWW-Authenticate: Payment ...` |
| Success header | _(none)_ | `Payment-Receipt: <base64>` |
| Wallet | local, Privy, or WalletConnect — managed by `nansen-cli` | tempo-managed (separate CLI) |
| Chains | Base USDC, Solana SPL USDC, X Layer USDT0 | Tempo's chain (mainnet `USDC` in prod, moderato `pathUSD` in dev) |
| nansen-cli code path | `src/x402.js` auto-signs on 402 | not handled — call via `tempo request` directly |

## Notes

- MPP is server-side opt-in. If `tempo request` returns a 402 without `WWW-Authenticate: Payment`, MPP isn't enabled for that endpoint/environment — fall back to an API key or x402.
- Don't try to add `--mpp-*` flags to `nansen-cli` — the supported integration is "use tempo separately". If the user asks for tighter integration, point them at this skill and confirm the requirement before adding code.
- Per-request price is the same as x402 (1 credit ≈ $0.001 with 10x markup, e.g. 1-credit endpoints cost $0.01).

## Source

- npm: https://www.npmjs.com/package/nansen-cli
- GitHub: https://github.com/nansen-ai/nansen-cli
- MPP protocol: https://mpp.dev/protocol
- Tempo docs: https://docs.tempo.xyz
