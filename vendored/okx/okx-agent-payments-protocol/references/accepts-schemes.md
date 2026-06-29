# `accepts`-based schemes — `exact` / `aggr_deferred` / `upto` (+ Permit2)

> Loaded from `../SKILL.md` **only on a failure or legacy path**. On the success path `onchainos payment pay` returns a ready `authorization_header` — you replay it directly (SKILL.md Step A6) and do **not** load this file. Load it when: `pay` returns `Permit2 allowance insufficient` (one-time approve), a legacy x402 v1 raw proof, or you need to interpret a scheme-specific settlement result.

All three schemes share one signing surface: `onchainos payment pay --payload '<base64 PAYMENT-REQUIRED>' [--selected-index <n>]` decodes the payload, signs the chosen `accepts` entry via TEE, **assembles the header itself** (embedding `sessionCert` into `accepted.extra` for `aggr_deferred` only — without clobbering `name` / `version`), and returns `{authorization_header, header_name, scheme, wallet}`. You never assemble or merge anything. The local-key fallback `pay-local` signs **`exact + EIP-3009`, `exact + Permit2`, and `upto`** locally — only `aggr_deferred` is unsupported (it needs a TEE-resident session key).

## Interpreting the settlement result (after Replay)

Replay = resend the original request with `<header_name>: <authorization_header>` (here `PAYMENT-SIGNATURE`), expect `HTTP 200`, then decode the `PAYMENT-RESPONSE` header locally (`echo '<value>' | base64 -d | jq .`). Read by scheme:

| `scheme` | How to read the result |
|---|---|
| `exact` | Settles immediately. `status` / `transaction` / `amount` / `payer` are final. |
| `aggr_deferred` | `status` may be `pending` — facilitator settles asynchronously, the chain tx appears later. Report as "settling", **not** a failure. |
| `upto` | `amount` is the **actual settled amount (≤ the signed cap)** — report this, not the cap. May be `0` (zero-settle: the request consumed no metered resource; the buyer was **not** charged). |

## `upto` / `exact`+Permit2 — one-time Permit2 approve

`upto`, and `exact` whose chosen entry has `extra.assetTransferMethod = "permit2"`, are Permit2-based (the wire carries `permit2Authorization`). Before the buyer's **first** Permit2 payment with a given ERC-20, the wallet must approve the canonical Permit2 contract (one-time, off-band):

```
PERMIT2_ADDRESS = 0x000000000022D473030F116dDEE9F6B43aC78BA3   // same on every EVM chain
IERC20(token).approve(PERMIT2_ADDRESS, <amount>)
```

If not yet approved, `payment pay` fails with `Permit2 allowance insufficient on token 0x... for chain ...`. OKX ships a helper binary `mpplab/permit2-approve-calldata` that generates the approve calldata. **Present the choices verbatim — do NOT default to MAX:**

> Permit2 allowance 不足，需要先授权一次：
> - **MAX**（uint256::MAX，一次到位；Permit2 官方合约审计过，业界默认）
> - **数字**（atomic units，本次至少 `<required>`；缓冲多笔可 ≈1000000 = $1；填 0 = 撤销已有授权）

Validation: 数字 < required → reject;数字 > 1e15 → 提示是否手滑想给 MAX;0 → 二次确认是撤销。`feedback_x402_no_confirm` 不覆盖 approve 类持续授权，此处仍需询问。After approve, all future Permit2 payments for that token are off-chain signatures only — retry `onchainos payment pay --payload '<raw>'`.

## Local-key fallback (`pay-local` — `exact + EIP-3009` / `exact + Permit2` / `upto`)

```bash
onchainos payment pay-local --payload '<base64 ...>'
```

Reads `EVM_PRIVATE_KEY` (env var or `~/.onchainos/.env`), derives the payer, generates the nonce, computes the time window from `maxTimeoutSeconds`, and signs locally — no TEE, no JWT. Auto-selects the scheme by the same rules as `payment pay` (`accepts[].scheme` + `accepts[].extra.assetTransferMethod`) and returns the same `{authorization_header, ...}` shape (v2). Output is a standard secp256k1 EIP-712 / EIP-3009 signature — identical wire shape to the TEE path, with **no `sessionCert`** for `upto`. Supports `exact + EIP-3009`, `exact + Permit2`, and `upto`; **rejects `aggr_deferred`** (TEE-resident session key required). Prerequisites: the payer holds enough of the `asset` token on the target chain; for `exact + EIP-3009` the token supports `transferWithAuthorization` and `accepts[].extra.name` (EIP-712 domain name) is present (`version` optional, defaults `"2"`); for `Permit2` / `upto` the one-time Permit2 approve is done (see above), and `upto` additionally requires `accepts[].extra.facilitatorAddress`. ⚠️ Signs with your local key (NOT TEE-protected) — `chmod 600 ~/.onchainos/.env`; the recommended path is always TEE `payment pay`.

## Legacy: x402 v1 (`X-PAYMENT`)

For a v1 payload (body `x402Version: 1`, no `resource` object), `payment pay` returns the **raw proof** `{signature, authorization}` instead of `authorization_header`. Assemble the `X-PAYMENT` header yourself, then replay:

```
paymentPayload = { x402Version: 1, scheme: "<exact|aggr_deferred|upto>", network: <accepts entry network>, payload: { signature, authorization } }
X-PAYMENT: btoa(JSON.stringify(paymentPayload))
```

## CLI Reference

```bash
onchainos payment pay --payload '<base64 of the decoded 402 payload / raw PAYMENT-REQUIRED>' [--selected-index <n>]
onchainos payment pay-local --payload '<base64 ...>'      # exact+EIP-3009 / exact+Permit2 / upto (not aggr_deferred)
```

| Param | Required | Description |
|---|---|---|
| `--payload` | Yes | base64 (or base64url) of `{x402Version, resource, accepts}` — the raw `PAYMENT-REQUIRED` header value. CLI decodes, signs, and returns the assembled header (v2). |
| `--selected-index` | No | 0-based index into `accepts[]` pinning the scheme the user chose in a multi-scheme prompt. Omit → CLI auto-selects (`exact` > `aggr_deferred` > first). |

Signs from the currently selected wallet account.

## Edge cases

- **`Permit2 allowance insufficient`** — see one-time approve above, then retry.
- **`upto scheme requires extra.facilitatorAddress`** — the seller's 402 is missing `facilitatorAddress` in `accepts[].extra`; seller-side misconfig — don't retry, tell the user and stop.
- **Replay returns 402 again** — typically a stale signature; re-fetch a fresh 402 → re-sign. Never reuse a stale signature.
- **Wrong proxy in signature (upto)** — facilitator rejects with an `invalid_permit2_spender`-class `invalidReason`; this is a CLI / SDK bug, not user error — surface the message and stop.
- **Network error on replay** — retry once, then prompt the user.
- **TEE signing failure / session expired** — re-login or fall back to `pay-local` (`exact + EIP-3009` / `exact + Permit2` / `upto`, not `aggr_deferred`); ask the user, don't silently cancel.
- **`insufficient_allowance`** (facilitator error code) — same as `Permit2 allowance insufficient`: surface the one-time Permit2 approve prompt and retry.
- **`invalid_eoa_signature`** (facilitator error code) — the `signature` field is not `0x`-prefixed or is not 65 bytes; this is a CLI / SDK bug, not user error — surface the message and stop.
- **`upto_signature_route_conflict`** (facilitator error code) — the request carried both a `sessionCert` and an EOA secp256k1 signature route, an invalid combination; CLI / SDK bug — surface and stop.
- **Unsupported / non-EVM network** — EVM only (CAIP-2 `eip155:<chainId>`); a non-EVM `network` → stop and tell the user the resource is unsupported.
- **No wallet for chain** — the logged-in account needs an address on the target chain; if missing, add it via `okx-agentic-wallet`.

## Security

- TEE path: the secp256k1 key never leaves the enclave; the signature is bound to its fields (`exact`: `(from, to, value, nonce)`; `upto`: also `witness.facilitator`, so a leaked signature is only usable by the named facilitator) — it can't be retargeted or replayed past `deadline`. `sessionCert` (`aggr_deferred`) proves the session key's authority; the CLI embeds it for you.
- Local-key fallback signs entirely on the host — treat `EVM_PRIVATE_KEY` as a credential (`chmod 600`).
- This reference only **signs** — settlement happens on-chain when the recipient / facilitator redeems the authorization.
