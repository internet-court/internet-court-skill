# `aggr_deferred` scheme

> Loaded from `../SKILL.md` after the dispatcher detected an `accepts`-based 402 (`PAYMENT-REQUIRED` header v2 or `x402Version` body v1), decoded the payload, walked the user through confirmation, and ran `onchainos payment pay`. **Use this reference when the response includes a `sessionCert` field** — meaning the CLI selected `aggr_deferred` (Session Key Ed25519 signing, EOA signing skipped).

The local-key fallback (`onchainos payment pay-local`) does NOT support this scheme — only TEE.

## Sign output

| Field | Type | Description |
|---|---|---|
| `signature` | String | Base64-encoded Ed25519 session-key signature (no EOA / EIP-3009 signing) |
| `authorization` | Object | Standard EIP-3009 `transferWithAuthorization` parameters (same fields as `exact`) |
| `sessionCert` | String | Session certificate proving the session key's authority over the wallet |

## Assemble payment header

The header carries `sessionCert` inside `accepted.extra` (v2) or directly in the payload structure (v1). The merge must **preserve** the original `accepted.extra` fields like `name` and `version` — do not overwrite the whole object.

### v2 (`x402Version >= 2`) — header `PAYMENT-SIGNATURE`

```
accepted        = decoded.accepts.find(a => a.scheme === "aggr_deferred")
accepted.extra  = { ...accepted.extra, sessionCert }     // merge — keep name/version

paymentPayload = {
  x402Version: decoded.x402Version,
  resource:    decoded.resource,
  accepted:    accepted,                                  // single object, NOT the array
  payload:     { signature, authorization }
}
headerValue = btoa(JSON.stringify(paymentPayload))
```

### v1 (`x402Version < 2` or absent) — header `X-PAYMENT`

```
paymentPayload = {
  x402Version: 1,
  scheme:      "aggr_deferred",
  network:     option.network,
  payload:     { signature, authorization }
}
headerValue = btoa(JSON.stringify(paymentPayload))
```

## Replay

```
<original method> <original url>
<header-name>: <headerValue>
```

Expected: `HTTP 200`. The response carries a `PAYMENT-RESPONSE` header
(base64-encoded JSON). Decode with:

```bash
echo '<header value>' | base64 -d | jq .
```

关键字段：`status` / `transaction` / `amount` / `payer`。
**`aggr_deferred` 的 `status` 可能是 `pending`（facilitator 异步结算，链上稍后出现），不是失败。**

Return the body to the user.

## CLI Reference

`aggr_deferred` is selected automatically by `onchainos payment pay` when the 402 `accepts[]` includes it.

```bash
onchainos payment pay \
  --accepts '<accepts array JSON>' \
  [--from <address>]
```

To detect the scheme post-call, check whether the response includes `sessionCert`:

```
sessionCert present  → aggr_deferred (this reference)
sessionCert absent   → exact (see references/exact.md)
```

## Worked example (v2 + aggr_deferred selection)

End-to-end illustration for a v2 server that offers both schemes — the CLI picks `aggr_deferred`, you merge `sessionCert` into the existing `accepted.extra` and replay.

**Step 1 — original request returns 402**:

```
HTTP/1.1 402 Payment Required
PAYMENT-REQUIRED: eyJ4NDAyVmVyc2lvbiI6Miwi...   ← base64 in header
Content-Type: application/json

{}
```

Decoded `PAYMENT-REQUIRED` header:

```json
{
  "x402Version": 2,
  "error": "PAYMENT-SIGNATURE header is required",
  "resource": {
    "url": "https://api.example.com/data",
    "description": "Premium data",
    "mimeType": "application/json"
  },
  "accepts": [
    {
      "scheme": "aggr_deferred",
      "network": "eip155:196",
      "amount": "1000000",
      "payTo": "0xAbC...",
      "asset": "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
      "maxTimeoutSeconds": 300,
      "extra": { "name": "USDG", "version": "1" }
    },
    {
      "scheme": "exact",
      "network": "eip155:196",
      "amount": "1000000",
      "payTo": "0xAbC...",
      "asset": "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8",
      "maxTimeoutSeconds": 300,
      "extra": { "name": "USDG", "version": "1" }
    }
  ]
}
```

**Step 2–3 — sign (CLI selects `aggr_deferred` automatically)**:

```bash
onchainos payment pay \
  --accepts '<JSON.stringify(decoded.accepts)>'
# → { "signature": "base64...", "authorization": { ... }, "sessionCert": "..." }
# sessionCert present → CLI selected aggr_deferred scheme
```

**Step 4 — assemble v2 header (merge `sessionCert` into existing `accepted.extra`)**:

```
accepted        = decoded.accepts.find(a => a.scheme === "aggr_deferred")
accepted.extra  = { ...accepted.extra, sessionCert }   // merge — keep name/version

paymentPayload = {
  x402Version: 2,
  resource:    decoded.resource,
  accepted:    accepted,
  payload:     { signature, authorization }
}
headerValue = btoa(JSON.stringify(paymentPayload))

GET https://api.example.com/data
PAYMENT-SIGNATURE: <headerValue>

→ HTTP 200  { "result": "..." }
```

## Edge cases

- **Replay returns 402 again** — typically a stale signature; retry with a fresh request → fresh signature.

## Security notes

- `sessionCert` proves the session key's authority over the wallet.
- Same as exact: this reference only signs; settlement happens when the recipient redeems the authorization on-chain.
