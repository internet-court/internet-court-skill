# `upto` scheme (and `exact` + Permit2 sub-mode)

> Loaded from `../SKILL.md` after the dispatcher has detected an
> `accepts`-based 402 (`PAYMENT-REQUIRED` header v2 or `x402Version` body
> v1), decoded the payload, walked the user through confirmation, and run
> the signing CLI. **Use this reference when the response from
> `onchainos payment pay` carries a `permit2Authorization` field** —
> meaning the CLI selected one of the two Permit2-based paths:
>
> - `scheme: "upto"` (cap-style metered billing, Witness binds a facilitator)
> - `scheme: "exact"` + `extra.assetTransferMethod: "permit2"` (universal
>   ERC-20 path via the canonical Permit2 contract; Witness has no
>   facilitator field)
>
> Both paths emit the same wire shape on the buyer side
> (`permit2Authorization` instead of `authorization`). Distinguish them
> only by the inner `accepted.scheme` and the witness contents.

The local-key fallback (`onchainos payment pay-local`) does NOT support
either Permit2 path — only `exact` + EIP-3009.

## Buyer prerequisite — one-time PERMIT2 approve

Before the buyer's first Permit2 payment with a given ERC-20 token, the
buyer's wallet must have approved the canonical Permit2 contract to spend
that token (one-time, off-band):

```
PERMIT2_ADDRESS = 0x000000000022D473030F116dDEE9F6B43aC78BA3
IERC20(token).approve(PERMIT2_ADDRESS, MaxUint256)
```

Same address on every EVM chain. If the buyer hasn't done this yet,
`onchainos payment pay` will fail with a clear message:

```
Permit2 allowance insufficient on token 0x... for chain 196.
Current allowance is 0, but this payment needs <amount>.
The buyer must first call IERC20.approve(0x000000000022D473030F116dDEE9F6B43aC78BA3, MAX) ...
```

Tell the user to run the approve tx once (the OKX side ships a helper
binary `mpplab/permit2-approve-calldata` that generates the calldata),
then retry. After approve, all future Permit2 payments are off-chain
signatures only.

### Allowance insufficient

When CLI reports `Permit2 allowance insufficient`, agent MUST present
choices verbatim; do NOT default to MAX.

User prompt:

> Permit2 allowance 不足，需要先授权一次：
> - **MAX**（uint256::MAX，一次到位；Permit2 官方合约审计过，业界默认）
> - **数字**（atomic units，本次至少 `<required>`；缓冲多笔可 ≈1000000 = $1；
>   填 0 = 撤销已有授权）

Agent validation:
- 数字 < required → reject
- 数字 > 1e15 → 提示是否手滑想给 MAX
- 0 → 二次确认是撤销

`feedback_x402_no_confirm` 不覆盖 approve 类持续授权，此处仍需询问。

## Sign output (TEE — `onchainos payment pay`)

| Field | Type | Description |
|---|---|---|
| `signature` | String | **For `upto`:** base64 Ed25519 session-key signature over the Permit2 EIP-712 digest (facilitator backend then handles the secp256k1 conversion via TEE `eip712Hash`). **For `exact + Permit2`:** hex-encoded secp256k1 65-byte signature (`r ‖ s ‖ v`, `0x` prefix). |
| `sessionCert` | String | **`upto` only.** Base64-encoded session cert. The facilitator backend pulls the Ed25519 public key out of this to verify `signature`. Must be embedded into `accepted.extra.sessionCert` before replay (see "Assemble payment header"). Absent for `exact + Permit2`. |
| `permit2Authorization` | Object | Full Permit2 authorization the buyer signed (see fields below) |
| `permit2Authorization.from` | String | Payer wallet address |
| `permit2Authorization.permitted.token` | String | ERC-20 token contract |
| `permit2Authorization.permitted.amount` | String | uint256 atomic units. **For upto this is the cap (max the facilitator may settle).** For `exact + Permit2` this is the exact charge (= `accepts[].amount`). |
| `permit2Authorization.spender` | String | x402 proxy address: `0x402085…0001` (exact + Permit2) or `0x4020e7…0002` (upto). The buyer signed against this address — facilitator must `settle()` it. |
| `permit2Authorization.nonce` | String | Random uint256 (decimal string). Permit2 consumes it atomically — one-shot, no replays. |
| `permit2Authorization.deadline` | String | Permit deadline (Unix seconds, decimal string). |
| `permit2Authorization.witness.to` | String | Recipient address (= `payTo`). |
| `permit2Authorization.witness.facilitator` | String **(upto only)** | The facilitator address the buyer authorized. On-chain proxy enforces `msg.sender == witness.facilitator`. **Absent in the exact+Permit2 variant.** |
| `permit2Authorization.witness.validAfter` | String | Lower-bound timestamp (Unix seconds). |

### Telling exact+Permit2 apart from upto, from the output alone

- If `permit2Authorization.witness.facilitator` is **present** → upto
- If absent → `exact` + Permit2

You generally don't need to switch behavior based on this — both paths
just assemble the same wire shape and let the facilitator handle the
on-chain semantics. The `accepted.scheme` in the original 402 is the
authoritative routing key.

## Assemble payment header

The `accepted` field for v2 is a **single object** — the entry from the
original `accepts[]` whose `scheme` matches what was signed. Do NOT pass
the whole array.

### v2 (`x402Version >= 2`) — header `PAYMENT-SIGNATURE`

```
// upto:       a.scheme === "upto"
// permit2:    a.scheme === "exact" && a.extra?.assetTransferMethod === "permit2"
accepted = decoded.accepts.find(a => /* match by scheme + transfer method */)

// ★ upto only — facilitator backend requires sessionCert in accepted.extra
//   to verify the Ed25519 signature. Skip this step for exact + Permit2.
if (a.scheme === "upto") {
  accepted.extra = { ...(accepted.extra ?? {}), sessionCert: sessionCert }
}

paymentPayload = {
  x402Version: decoded.x402Version,
  resource:    decoded.resource,
  accepted:    accepted,                                  // single object, NOT the array
  payload:     { signature, permit2Authorization }        // ← permit2Authorization, NOT authorization
}
headerValue = btoa(JSON.stringify(paymentPayload))
```

### v1 (`x402Version < 2` or absent) — header `X-PAYMENT`

```
// ★ upto only — bundle sessionCert into payload (no `accepted` envelope in v1).
const payload = a.scheme === "upto"
  ? { signature, permit2Authorization, sessionCert }
  : { signature, permit2Authorization }

paymentPayload = {
  x402Version: 1,
  scheme:      "upto" | "exact",                          // pick the one you signed
  network:     option.network,
  payload,
}
headerValue = btoa(JSON.stringify(paymentPayload))
```

## Replay

Attach the assembled header to the original request and resend:

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
**`upto` 的 `amount` 是实际结算金额（≤ cap），按这个对用户报扣款，不是签的 cap。**

Return the body to the user.

## CLI Reference

Same shape as `exact`:

```bash
onchainos payment pay \
  --accepts '<accepts array JSON>' \
  [--from <address>]
```

The CLI auto-selects based on `accepts[].scheme` + `accepts[].extra.assetTransferMethod`:

| `accepts[].scheme` | `accepts[].extra.assetTransferMethod` | CLI picks |
|---|---|---|
| `"exact"` | absent / `"eip3009"` | exact + EIP-3009 (→ load `exact.md`) |
| `"exact"` | `"permit2"` | exact + Permit2 (→ load this reference) |
| `"upto"` | (forced to `"permit2"` by the seller SDK) | upto + Permit2 (→ load this reference) |
| `"aggr_deferred"` | n/a | aggr_deferred (→ load `aggr_deferred.md`) |

`onchainos payment pay-local` does NOT support either Permit2 path. If
the user picked the local-key fallback, the dispatcher will only sign
`exact + EIP-3009` — return them to `exact.md` flow.

## What's different vs `exact + EIP-3009`

| Dimension | `exact + EIP-3009` | `exact + Permit2` | `upto` |
|---|---|---|---|
| Buyer prerequisites | None | One-time approve PERMIT2 | One-time approve PERMIT2 |
| Wire field name | `authorization` | `permit2Authorization` | `permit2Authorization` |
| `signature` encoding | base64 EIP-3009 / base64 Ed25519 (deferred) | hex secp256k1 (`0x...`) | **base64 Ed25519** (session key over EIP-712 digest) |
| `sessionCert` required | aggr_deferred only | No | **Yes — in `accepted.extra.sessionCert`** |
| Signed `amount` semantics | = exact charge | = exact charge | = cap, actual ≤ cap |
| Witness field | n/a | `(to, validAfter)` | `(to, facilitator, validAfter)` |
| Facilitator binding | None | None | `msg.sender == witness.facilitator` (on-chain) |
| Required in `accepts.extra` | `name` (sometimes `version`) | `assetTransferMethod: "permit2"` | `assetTransferMethod: "permit2"` + `facilitatorAddress` |
| Local-key fallback | Supported | NOT supported | NOT supported |

## Edge cases

- **`Permit2 allowance insufficient`** — the buyer hasn't approved
  Permit2 for this token yet. Stop, tell the user to run the one-time
  approve (see "Buyer prerequisite" above), then retry.
- **`upto scheme requires extra.facilitatorAddress`** — the seller's 402
  response is missing the required `facilitatorAddress` in
  `accepts[].extra`. This is a seller-side misconfiguration; don't retry
  blindly — tell the user the resource is misconfigured and stop.
- **Settled amount differs from signed amount (upto only)** — this is
  the upto contract. The `PAYMENT-RESPONSE` header's `amount` is
  authoritative; what the buyer signed is the cap. When displaying to
  the user, report the actual settled amount, not the cap.
- **Zero-settle (upto only)** — the facilitator may settle for `0`
  (e.g. handler decided this request didn't actually consume metered
  resource). The reply will be HTTP 200 with `amount: "0"` and an empty
  `transaction`. The buyer was NOT charged.
- **Expired authorization** — same as exact: get a fresh 402, re-sign.
- **Wrong proxy in signature** — if the buyer signed against the wrong
  proxy (e.g. exact proxy but server expects upto, or vice versa),
  facilitator rejects with an `invalid_permit2_spender`-class
  `invalidReason`. This is a CLI / SDK bug, not a user error; surface
  the message and stop.

## Security notes

- The signature is bound to `(token, amount/cap, spender, nonce, deadline, witness)` — it cannot be altered to drain a different token, send to a different recipient, or be replayed past `deadline`.
- For **upto specifically**, the signature is *also* bound to
  `witness.facilitator` — a leaked signature can only be used by the
  exact facilitator the buyer named, not relayed by anyone else.
- The TEE secp256k1 private key never leaves the secure enclave; only
  the 65-byte signature crosses out.
- This reference only signs — it does NOT broadcast or move funds
  directly. Settlement happens when the facilitator calls
  `proxy.settle(...)` on chain (within `deadline`).
