# `session` intent (channel: open / voucher / topUp / close)

> Loaded from `../SKILL.md` when the dispatcher decoded a `WWW-Authenticate: Payment` 402 challenge with `intent="session"`. Decode + display + wallet-status check have already happened upstream — start here at "Phase S1: Open Channel".
>
> **Also enter this reference for any mid-session operation** (close / topUp / settle / voucher / refund) when the user mentions an existing `channel_id`, even without a fresh 402. Jump directly to the matching phase below.

State machine: **open → N vouchers → close**, with optional **topUp** between vouchers. Each phase has its own CLI command and the seller drives transitions via fresh 402 challenges (or the user explicitly issues a close).

**TEE-only** — local private key signing is NOT supported on this path. If the wallet session is unavailable and the user can't log in, stop.

> **🔑 Action-first, URL-stays-the-same** — When a user asks for ANY
> mid-session operation ("open / 开通道", "buy a translation", "top up /
> 充值", "close / 关闭"), the action lives in the credential
> `payload.action`, NOT in the URL path. The URL is **always the
> original business URL** — the same one the user asked to access.
>
> | User intent (any language) | `payload.action` | CLI command |
> |---|---|---|
> | open / 开通道 / start session | `open` | `payment session open` |
> | buy / call / 调用 / use service | `voucher` | `payment session voucher` |
> | top up / 充值 / add deposit | `topUp` | `payment session topup` |
> | close / 关闭 / end session / settle | `close` | `payment session close` |
>
> All four flows share ONE URL and ONE pattern:
> 1. Re-issue the **original business URL** with no `Authorization` →
>    seller responds `402 + WWW-Authenticate: Payment ... intent="session"`.
> 2. Pick the right CLI command above and pass the WWW-Authenticate as
>    `--challenge`. The CLI sets `payload.action` for you.
> 3. Resend to the **same original business URL** with
>    `Authorization: <authorization_header>`.
>
> **`<authorization_header>` already includes the `Payment ` scheme
> prefix** — paste the CLI's `data.authorization_header` value verbatim
> into the `Authorization` header. **Do NOT** prepend another `Payment `
> yourself; that would produce `Payment Payment <b64>` and the seller
> will reject it.
>
> **Never probe** for `/open`, `/voucher`, `/topup`, `/close`,
> `/<resource>/topup`, etc. — they don't exist. If you can't think of
> a URL, the answer is always "the original business URL the user
> asked about".

## Talk to users in plain language

Match the user's language. Use action-verb phrasing — "issue a voucher / 签发凭证", "top up your balance / 补充余额", "close the channel / 关闭通道", "your prepaid balance / 通道余额" — don't dump bare jargon (`voucher`, `topUp`, `close`, `escrow`, `cumulativeAmount`) on the user. Field names are fine in **state echo** since the user copy-pastes those across sessions.

## Session state to track

Save the moment `payment session open` returns and maintain across phases:

| Field | Source |
|---|---|
| `channel_id` | `payment session open` output |
| `escrow` | open challenge `methodDetails.escrowContract` |
| `chain_id` | open challenge `methodDetails.chainId` |
| `currency` | open challenge `currency` |
| `payer_addr` | open output `wallet` |
| `current_cum` | highest signed cum so far (open `--initial-cum` or last issued voucher's cum) |
| `current_sig` | last voucher signature (`signature` field of open / voucher / close output) |
| `estimated_spent` | sum of `unit_amount` across served business requests since the last fresh sign |
| `unit_amount` | latest voucher challenge `amount` (seller is authoritative) |
| `deposit` | open output `deposit` + topup `--additional-deposit` |

Track in conversation context. Across conversations, ask the user to re-supply `channel_id` / `escrow` / `current_cum` / `current_sig` to continue.

**Mandatory state echo** — after `payment session open`, after each voucher (sign or reuse), after topup, and immediately before close, end your message with one line:

> 📋 Channel `<channel_id>` · chain `<chain_id>` · escrow `<escrow>` · deposit `<human(deposit)>` (`<deposit>`) · cum `<human(current_cum)>` (`<current_cum>`) · spent~`<human(estimated_spent)>` (`<estimated_spent>`) · sig `<current_sig prefix...>`

**All user-facing amounts in BOTH human and atomic form** — `<human> (<atomic>)`, e.g. `0.0004 USDC (400)`. Compute via `amount / 10^decimals` from `currency` (typically 6 for USDC/USD₮, 18 for native — never assume; query `okx-dex-token` if uncertain).

---

## Phase S1: Open Channel

First step of any session. Decide the **deposit** with the user:

> A session payment needs you to lock a prepaid balance up front (held in escrow). How much would you like to prepay?
> Suggested: `<human(suggestedDeposit)> (<suggestedDeposit>)` (or `unit_amount × 100` if no suggestion — enough for ~100 requests).
> Each request draws from this balance. You can add more later, or close the channel anytime to refund whatever's unused.

Wait for the user's amount.

### Optional initial-voucher prepay

Opening a channel signs a baseline voucher with `cumulativeAmount=0` by default. To override:
- `--initial-cum N` — explicit baseline (atomic units).
- `--prepay-first` — use the unit price from `challenge.amount` (silently falls back to 0 if missing/`"0"`).

Pick from user intent: no preference → no flag; "pay first request immediately" → `--prepay-first`; "pre-authorize N" → `--initial-cum N`. Constraint: `initial_cum ≤ deposit` (SDK rejects with `70012`).

### Mode branch

Branch by `methodDetails.feePayer`.

**Transaction mode (`feePayer=true`)**:

```bash
onchainos payment session open \
  --challenge '<full WWW-Authenticate header value>' \
  --deposit '<atomic units>' \
  [--initial-cum '<atomic>' | --prepay-first] \
  [--from '<0xPayer>']
```

CLI TEE-signs EIP-3009 `receiveWithAuthorization` (deposit into escrow) + EIP-712 baseline Voucher (channelId, cum=initial_cum). Output: `data.{authorization_header, channel_id, escrow, chain_id, deposit, wallet}` — save all to session state. Initial `current_cum` = the initial-cum value (default `"0"`).

**Hash mode (`feePayer=false`)** — user must send the on-chain "open channel" tx themselves first (delegate to `okx-onchain-gateway` or manual). Then:

```bash
onchainos payment session open \
  --challenge '<full WWW-Authenticate header value>' \
  --deposit '<atomic units>' \
  --tx-hash '0x<64-char hex>' \
  --salt '0x<64-char hex>' \
  [--initial-cum '<atomic>' | --prepay-first] \
  [--from '<0xPayer>']
```

`--salt` MUST be the same bytes32 the user passed to the on-chain `escrow.open(...)` call. The CLI recomputes `channelId = keccak256(abi.encode(payer, payee, token, salt, authorizedSigner, escrow, chainId))` and the seller compares it to what the on-chain event emitted — supply a fresh random salt and the open is rejected with a channelId mismatch. If the user broadcast through `okx-onchain-gateway`, the salt is the bytes32 they (or you) passed into the gateway's contract-call arguments.

CLI still TEE-signs the initial voucher; only the deposit tx is replaced by the supplied hash.

### Send open to seller

```
<original method> <original url>
Authorization: <authorization_header>
```

Outcomes:
- **HTTP 200** — channel open, response carries the first business result. Echo state. Subsequent requests to the same resource: send without `Authorization` first; seller responds with a voucher 402 → Phase S2.
- **HTTP 402 (fresh `WWW-Authenticate: Payment`)** — channel opened but seller wants the first voucher signed. Go straight to Phase S2.

---

## Phase S2: Business Request (Voucher Loop)

Run for **each** business request during the session.

**Enter triggers** when `channel_id` is active: user says "next request" / "again" / "another one" / "再调一次" / "再发一个" / "继续" / "voucher" / "凭证" / "签一个授权"; or user requests the resource again and gets a fresh 402.

### How vouchers actually work

A voucher is a **cumulative authorization**, not a single-request payment. Once signed, the seller keeps deducting until `spent` reaches the signed `cumulativeAmount`. So one voucher with `cum=50` funds 50× `unit_amount=1` requests **without re-signing** — provided the seller supports reuse (mppx / OKX TS Session / OKX Rust SDK ≥ this version). Legacy OKX Rust SDK treats byte-replay as idempotent retry and skips the deduct; force re-sign every request if you suspect this.

Per-request job: pick **reuse** vs **sign** based on remaining balance.

### S2.1: Send the request

If you don't have a fresh challenge yet, send the business request. Seller responds with HTTP 402 + fresh `WWW-Authenticate: Payment` — this is a **voucher challenge** for the new request. Decode `request` to extract `amount` (the seller-quoted unit price).

### S2.2: Decide reuse vs sign

```
unit_amount = <amount from this voucher challenge>      // seller is authoritative
remaining   = current_cum - estimated_spent             // headroom under existing voucher

if current_sig is set AND remaining >= unit_amount:
    strategy = REUSE         # spend remaining headroom under existing voucher
    cum_for_this_call = current_cum                     # unchanged
else:
    strategy = SIGN          # need a higher cum
    cum_for_this_call = current_cum + unit_amount

# Hard guards (apply regardless of strategy)
if cum_for_this_call > deposit:
    → Phase S2b (TopUp) first, then re-evaluate
if methodDetails.minVoucherDelta is set AND strategy == SIGN:
    ensure (cum_for_this_call - current_cum) >= minVoucherDelta
```

`unit_amount` always comes from the **current** voucher challenge, never a cached value — the seller can adjust pricing between requests and the latest 402 wins.

### S2.3a: Reuse path (no TEE)

```bash
onchainos payment session voucher \
  --challenge '<fresh WWW-Authenticate from this 402>' \
  --channel-id '<saved channel_id>' \
  --cumulative-amount '<current_cum>' \
  --reuse-signature '<saved current_sig>' \
  [--from '<saved payer_addr>']
```

Don't pass `--escrow` / `--chain-id` here — the existing signature already binds them. CLI skips TEE and wraps the existing signature bytes verbatim. `mode = "reuse"`.

### S2.3b: Sign path (TEE)

```bash
onchainos payment session voucher \
  --challenge '<fresh WWW-Authenticate from this 402>' \
  --channel-id '<saved channel_id>' \
  --cumulative-amount '<cum_for_this_call>' \
  --escrow '<saved escrow>' \
  --chain-id '<saved chain_id>' \
  [--from '<saved payer_addr>']
```

CLI signs an EIP-712 Voucher(channelId, cum_for_this_call) via TEE. `mode = "sign"`. Both paths return `data.{authorization_header, channel_id, cumulative_amount, signature, mode}`.

### S2.4: Replay the business request

```
<original method> <original url>
Authorization: <authorization_header>
```

Expected: `HTTP 200`. **Update state**: `current_cum = cum_for_this_call`, `current_sig = <signature>`, `estimated_spent += unit_amount`. (Reuse path: `current_cum` / `current_sig` unchanged; only `estimated_spent` advances.)

### S2.5: Insufficient-balance fallback

When the seller rejects a voucher with `reason: "insufficient balance"`, `detail: "voucher exhausted"`, or OKX Rust SDK private code `70015`, `estimated_spent` drifted. Recover:

1. Surface the seller's reason: `❌ Seller rejected: insufficient balance — your current authorization is fully used. Signing a new one to continue.`
2. Set `estimated_spent = current_cum` (treat existing voucher as exhausted).
3. Re-enter S2.2 — `remaining = 0`, **SIGN** is picked.
4. Sign a new voucher with `cum = current_cum + unit_amount` and retry.

**Do NOT loop reuse-on-insufficient-balance** — always escalate to SIGN.

Other rejections: `amount_exceeds_deposit` → topup (S2b); `delta_too_small` → raise cum; `invalid_signature` → check seller logs. Always surface the seller's reason text first, code in parens second.

### S2.6: Loop

Repeat S2.1–S2.4 for each request. Same voucher funds many calls while `remaining ≥ unit_amount`; re-sign only when balance runs out.

> Voucher rejections come from **seller-SDK local validation**, not a backend round-trip. Common: `70000` (cum not increasing), `70004` (invalid signature), `70012` (amount > deposit), `70013` (delta too small), plus `InsufficientBalance` (mppx/OKX TS typed; OKX Rust SDK private `70015`).

---

## Phase S2b (Optional): TopUp Mid-Session

Triggered when `current_cum + unit_amount > deposit` (seller refuses with `70012` or pre-emptively sends a topUp challenge).

Ask the user:

> Your prepaid balance is running low. How much would you like to add (atomic units)?
> Current balance: `<human(deposit)> (<deposit>)` · Used so far: `<human(current_cum)> (<current_cum>)`

Branch by `methodDetails.feePayer` from the topUp challenge.

**Transaction mode**:

```bash
onchainos payment session topup \
  --challenge '<WWW-Authenticate for topUp>' \
  --channel-id '<saved channel_id>' \
  --additional-deposit '<atomic units>' \
  --escrow '<saved escrow>' \
  --chain-id '<saved chain_id>' \
  --currency '<saved currency>' \
  [--from '<saved payer_addr>']
```

CLI TEE-signs `receiveWithAuthorization`. EIP-3009 nonce is `keccak256(abi.encode(channelId, additionalDeposit, from, topUpSalt))` — must match the on-chain contract.

**Hash mode** (user broadcasts top-up tx first, then):

```bash
onchainos payment session topup \
  --challenge '<WWW-Authenticate for topUp>' \
  --channel-id '<saved channel_id>' \
  --additional-deposit '<atomic units>' \
  --escrow '<saved escrow>' \
  --chain-id '<saved chain_id>' \
  --tx-hash '0x<64-char hex>' \
  [--from '<saved payer_addr>']
```

`--currency` is optional in hash mode (CLI doesn't sign EIP-3009; the on-chain tx already covers it).

**After TopUp**: `deposit = deposit + additional_deposit`. Resume Phase S2.

---

## Phase S3: Close Channel

When the user is done — says "close the channel / 关闭通道 / end the session", or after the final request. **Always close** when done; otherwise the prepaid balance stays escrowed until the seller's timeout (typically 12–24h).

### S3.1: Decide final cumulativeAmount

`final_cum = current_cum` — the highest voucher cum sent in this session. **Don't add `unit_amount`** — close reuses the last voucher's cum (no new service is delivered).

### S3.2: Sign close voucher

```bash
onchainos payment session close \
  --challenge '<WWW-Authenticate for close, or fresh 402 if seller issues one>' \
  --channel-id '<saved channel_id>' \
  --cumulative-amount '<final_cum>' \
  --escrow '<saved escrow>' \
  --chain-id '<saved chain_id>' \
  [--from '<saved payer_addr>']
```

CLI signs an EIP-712 Voucher(channelId, final_cum) via TEE — same signing path as a regular voucher, used at close time. Output: `data.{authorization_header, channel_id, cumulative_amount}`.

### S3.3: Send close to seller

```
<original method> <original url>     # typically a dedicated close endpoint, e.g. /session/manage
Authorization: <authorization_header>
```

Seller settles on-chain (transfers `final_cum` to merchant, refunds the rest to payer) and returns a `Payment-Receipt` header (base64-encoded JSON). Decode with:

```bash
echo '<header value>' | base64 -d | jq .
```

关键字段：`status` / `transaction`（on-chain tx hash，S3.4 报给用户用）/ `chainId`。

**Clear session state** — channel is closed.

### S3.4: Confirm to user

> ✅ Channel closed. Charged `<human(final_cum)> (<final_cum>)` of your `<human(deposit)> (<deposit>)` prepaid balance. Refund of `<human(deposit - final_cum)> (<deposit - final_cum>)` returned to your wallet.
> On-chain tx: `<reference from response>`

---

## Reading seller errors

Same priority order as charge (see `charge.md`). Always extract `body.reason` → `body.detail` → `body.message` → `body.msg` → `body.error` → `body.title` → fallthrough. Format:

> ❌ Seller rejected: `<reason text>` (code `<code if present>`, HTTP `<status>`)

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `not logged in` / `session expired` | Wallet session missing or expired | `onchainos wallet login` or `onchainos wallet login <email>` |
| Voucher rejected: `70012 amount_exceeds_deposit` | cum > channel deposit | Phase S2b TopUp first |
| Voucher rejected: `70000 invalid_params` (cum not strictly increasing) | new_cum ≤ current_cum | Increase strictly; ensure you're tracking current_cum |
| Voucher rejected: `70013 voucher_delta_too_small` | Delta below `minVoucherDelta` | Raise cum by at least the minimum |
| Voucher rejected: `InsufficientBalance` (HTTP 402; OKX Rust SDK `70015`) | seller's spent + new_amount > highest voucher | S2.5 fallback |
| Open fails: `chain not found` | Unsupported chainId or chain entry missing | `onchainos wallet chains` to list supported chains |
| `--tx-hash` rejected: must be `0x` + 64 hex chars | Malformed hash | Copy full 66-char hash (with `0x` prefix) |
| Session 402 keeps repeating after voucher sent | channel_id / escrow / chain_id mismatch | Re-check saved session state; all three must match the open |
| `30001 incorrect params` | Wrong base URL / `http://` redirect | Verify backend URL is `https://...` |
| `70004 invalid signature` | EIP-3009 typename mismatch / wrong domain | Check seller logs; usually means CLI is older than spec |
| `70008 channel finalized` | Channel was already closed on-chain | Session is done; do not retry close |
| `70010 channel not found` | Wrong channel_id, or seller has no record | Verify channel_id against open response |
| Seller returns ETIMEOUT or hangs | SA backend down or slow | Wait + retry; SDK has 30s timeout |

## Security notes

- **TEE-only** — no local-key fallback on the `WWW-Authenticate: Payment` path.
- **Always close sessions** — abandoned deposits stay escrowed until the on-chain timeout fires (12–24h).
- **`cumulativeAmount` monotonically increases per channel** — never decrease or reuse across vouchers in the same session.
- **`channelId` is deterministic** — `keccak256(abi.encode(payer, payee, token, salt, authorizedSigner, escrow, chainId))`; identical params produce duplicates and the contract rejects them.
