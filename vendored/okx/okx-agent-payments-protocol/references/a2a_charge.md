# a2a_charge — agent-to-agent payment links (`onchainos payment a2a-pay`)

> Loaded from `../SKILL.md` when the user mentions a paymentId, an `a2a_...` link, "create payment link", or asks to check a2a payment status. Unlike the HTTP 402 paths (`accepts`-based and `WWW-Authenticate: Payment`), a2a is **not triggered by an HTTP 402 response** — it's invoked by name, with a paymentId or a seller's create-link request.

Wraps `onchainos payment a2a-pay` for seller (`create`) and buyer (`pay` / `status`) roles. Buyer-side trust is **delegated upstream** (see Trust model below).

## Pre-flight

`create` and `pay` need a live wallet session — the dispatcher's Step B2 already checked it. If you entered here directly, run `onchainos wallet status` first; not logged in → `onchainos wallet login` (AK) or `onchainos wallet login <email>` (OTP). Never sign without a live session.

---

## Seller — Create a Payment Link

**Inputs**:
- **Required**: `--amount` (decimal, e.g. `"0.01"`), `--symbol` (e.g. `"USDT"`), `--recipient` (0x... EVM address — seller wallet)
- **Optional**: `--description`, `--realm`, `--expires-in` (seconds, default 1800)

**Steps**:

1. Run pre-flight (see above).
2. Shell out:
   ```bash
   onchainos payment a2a-pay create \
     --amount <amount> --symbol <symbol> --recipient <recipient> \
     [--description <text> --realm <domain> --expires-in <seconds>]
   ```
3. Parse the response — only `payment_id` and `deliveries.url` (optional) are present. The CLI no longer returns `amount` / `currency`; echo the seller's input args back for display.
4. Display:

   > Payment link created.
   > • paymentId: `<id>`
   > • Amount: `<amount input> <symbol input>` (decimal as you submitted)
   > • Recipient: `<recipient input>`
   > • Share with buyer: `<deliveries.url>` (if returned by the server) or `paymentId=<id>`

5. Suggest next: poll status anytime with `onchainos payment a2a-pay status --payment-id <id>` once the buyer is expected to have paid.

---

## Buyer — Pay a Payment Link

**Required input**: `paymentId` only. The CLI fetches the seller-issued challenge from the server and signs whatever amount / currency / recipient the challenge declares.

> **Trust model**: the buyer signs the seller's challenge as-is. Verifying that the challenge matches what the buyer agreed to pay is the **upstream caller's responsibility** — the user (or the upstream skill) MUST cross-check the seller's `paymentId` / `deliveries.url` against their out-of-band agreement (chat, task spec, prior negotiation) **before** calling this skill. Once invoked, the skill signs whatever the on-server challenge declares.

### Step 1 — Sign and submit

The skill does not run its own preview / yes-no gate; trust is delegated upstream. Shell out directly:

```bash
onchainos payment a2a-pay pay --payment-id <paymentId>
```

The CLI fetches the on-server challenge, TEE-signs the EIP-3009 authorization, and submits the credential. Two outcomes:

**Accepted** — `ok:true`, exit 0; `data` carries `payment_id` / `status` / `tx_hash` / `signature`. Proceed to Step 2 (auto-poll).

**Rejected** — server returned `data.success:false` (e.g. `errorReason:"insufficient_balance"`). CLI surfaces it as a hard failure: `ok:false`, exit code 1, message embeds the reason verbatim:

```json
{
  "ok": false,
  "error": "payment a2a_xxx rejected (reason=<errorReason>)"
}
```

**Treat as terminal — do NOT retry `pay`.** Every retry produces a fresh EIP-3009 nonce + signature; if the reason is `insufficient_balance` or similar, retrying wastes a signature without changing the outcome. Tell the user what failed, suggest the obvious remedy (top up balance / ask the seller for a new link), and stop.

### Step 2 — Auto-poll status to terminal

Status classification:

- **Non-terminal** (poll): `pending`, `settling`
- **Terminal** (stop): `completed`, `failed`, `expired`, `cancelled`

If `status` is already terminal → render the result and stop.

If non-terminal → poll every **3 seconds**, up to a **60-second** total budget:

```bash
onchainos payment a2a-pay status --payment-id <paymentId>
```

- As soon as a terminal status is observed → render full result (status + tx_hash + block_number) and stop.
- If 60 seconds elapse and the status is still non-terminal → return the current `status` plus the paymentId, and tell the user: "Status is still `<status>` after 60s; you can run `status` again later."

**Terminal display strings**:

| status | Display |
|---|---|
| `completed` | "✅ Payment confirmed on-chain. tx_hash: `<tx_hash>` block: `<block_number>`" |
| `failed` | "❌ Payment failed. (include the server-provided reason if any)" |
| `expired` | "⌛ Payment link expired before settlement. Ask the seller for a new one." |
| `cancelled` | "🚫 Seller cancelled this payment." |

---

## Status — Query Payment State

**Input**: `paymentId`.

```bash
onchainos payment a2a-pay status --payment-id <paymentId>
```

Map the returned `status` to a human-readable line:

| status | Meaning | Display |
|---|---|---|
| `pending` | Awaiting buyer signature | "⏳ Awaiting buyer signature." |
| `settling` | Credential received, settling on-chain | "🔄 Settling on-chain (credential submitted, awaiting confirmation)." |
| `completed` | Confirmed on-chain | "✅ Confirmed on-chain. tx_hash: `<tx_hash>` block: `<block_number>` fee: `<fee_decimal> <fee_symbol>`" |
| `failed` | Payment failed | "❌ Failed. (include the server-provided reason if any)" |
| `expired` | Expired before settlement | "⌛ Expired before settlement." |
| `cancelled` | Seller cancelled | "🚫 Cancelled by seller." |

**Rendering the fee**: the CLI returns `fee_amount` as a top-level string in minimal units (and `fee_bps` as the basis-points used). To compute `<fee_decimal>`, look up the token decimals (see Amount Display Rules below). For `<fee_symbol>`, reuse the `--symbol` the seller passed to `create` for the same `paymentId` — the upstream caller (or the seller flow that issued the link) is the source of truth; the `status` response itself does not echo it back. If neither is available, display `fee_amount` minimal units as-is.

**Suggest next**:
- `pending` / `settling` → "Check again in a few moments" or wait briefly and re-run `status`.
- `completed` → recommend `okx-agentic-wallet` to verify post-payment balance delta.
- `failed` → recommend checking buyer balance via `okx-agentic-wallet`, and if `tx_hash` is present, inspect it via `okx-security tx-scan`.

---

## Amount Display Rules

Convert `amount` / `fee_amount` per **`../_shared/amount-display.md`**.

**a2a exception (unlisted symbol):** a2a delegates trust upstream, so do **NOT** query `okx-dex-token` and do **NOT** block — use the unknown-decimals fallback (`<atomic> <symbol>` + "double-check") directly.

---

## Edge cases

| Scenario | Handling |
|---|---|
| `onchainos wallet status` reports not logged in | Prompt user to run `onchainos wallet login`. Never attempt to sign without a live session. |
| User provides no `paymentId` | STOP and ask the user for the seller-issued paymentId. |
| CLI reports `payment ... not payable` / expired challenge / unsupported intent | Relay the error verbatim and surface as a **terminal failure** — do NOT retry signing. |
| CLI reports `payment ... rejected (reason=<errorReason>)` (post-signing credential refusal — `insufficient_balance`, etc.) | Relay verbatim and surface as a **terminal failure**. Map common `errorReason` values to user remedies: `insufficient_balance` → top up wallet via `okx-agentic-wallet`; otherwise relay the reason and ask seller for a new link. **Do NOT retry `pay`** — burns a fresh nonce + signature without changing the outcome. |
| `paymentId` not found / 404 from server | Relay the error and ask the user to confirm the paymentId with the seller or upstream caller. |
| `pay` succeeded but status still `pending` / `settling` after 60s poll budget | Return the current status verbatim + paymentId; tell the user `Status is still <status> after 60s; you can run status again later`. |
| Server returns 5xx | Surface status code and any `errorMessage` verbatim. **Do not auto-retry `pay`** — every retry produces a fresh EIP-3009 nonce + signature; let the upstream decide. `status` is read-only and safe to retry manually. |
| `--symbol` is not in the hardcoded decimals table | Apply the unknown-decimals fallback (see Amount Display Rules). Do not block. |
| `--expires-in` was set too short and the link is now past its window | `status` returns `expired`; ask the seller to create a new link. |

---

## CLI Reference

### `onchainos payment a2a-pay create`

```bash
onchainos payment a2a-pay create \
  --amount <decimal> --symbol <symbol> --recipient <address> \
  [--description <text>] [--realm <domain>] [--expires-in <seconds>]
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--amount` | Yes | - | Decimal token amount (e.g. `"50"` or `"0.01"`) |
| `--symbol` | Yes | - | ERC-20 token symbol (e.g. `"USDT"`) |
| `--recipient` | Yes | - | Seller wallet address (= EIP-3009 `to`) |
| `--description` | No | - | Human-readable description shown to the buyer |
| `--realm` | No | - | Seller / provider domain (e.g. `provider.example.com`) |
| `--expires-in` | No | 1800 | Payment-link expiration window in seconds |

**Return fields**: `payment_id`, `deliveries` (object containing `url` when issued by the server).

### `onchainos payment a2a-pay pay`

```bash
onchainos payment a2a-pay pay --payment-id <id>
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--payment-id` | Yes | - | Seller-issued paymentId |

**Return fields**: `payment_id`, `status`, `tx_hash` (optional), `valid_after`, `valid_before`, `signature`.

### `onchainos payment a2a-pay status`

```bash
onchainos payment a2a-pay status --payment-id <id>
```

| Param | Required | Default | Description |
|---|---|---|---|
| `--payment-id` | Yes | - | The paymentId to query |

**Return fields**: `payment_id`, `status`, `tx_hash` (optional), `block_number` (optional), `block_timestamp` (optional), `fee_amount` (optional, minimal units), `fee_bps` (optional).

## Quickstart

```bash
onchainos payment a2a-pay create --amount 0.01 --symbol USDT --recipient 0xSeller   # → { "payment_id": "a2a_xxx", "deliveries": {...} }
onchainos payment a2a-pay pay    --payment-id a2a_xxx                                # buyer signs on-server challenge as-is
onchainos payment a2a-pay status --payment-id a2a_xxx                                # auto-polled ~60s after pay if non-terminal
```
