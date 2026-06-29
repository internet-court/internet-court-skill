# `charge` intent (one-shot)

> Loaded from `../SKILL.md` when the dispatcher decoded a `WWW-Authenticate: Payment` 402 challenge with `intent="charge"`. Decode + display + wallet-status check have already happened upstream — start here at "Decide mode".

One-shot payment. CLI TEE-signs an EIP-3009 authorization (or wraps a client-broadcast tx hash) and returns a ready `authorization_header`. Optional `methodDetails.splits[]` (max 10 entries) splits the amount across multiple recipients in a single signed authorization.

**TEE-only** — local private key signing is NOT supported on this path. If the wallet session is unavailable and the user can't log in, stop and surface the limitation.

## Decide mode

`methodDetails.feePayer` from the decoded challenge:

- **`true` → transaction mode** (default, server pays gas) → [Sign via TEE](#transaction-mode-sign-via-tee)
- **`false` → hash mode** (user broadcasts the on-chain tx first) → [Hash mode](#hash-mode-broadcast-then-wrap)

## Transaction mode (sign via TEE)

```bash
onchainos payment charge \
  --challenge '<full WWW-Authenticate header value>' \
  [--from '<0xPayer>']
```

The CLI auto-detects `methodDetails.splits[]` — no extra flag needed. Output:

```json
{ "ok": true, "data": { "authorization_header": "...", "wallet": "0x...", "mode": "transaction", "..." } }
```

Save `data.authorization_header` and proceed to [Replay](#replay).

## Hash mode (broadcast then wrap)

When `feePayer=false`, the user must broadcast `transferWithAuthorization` themselves before the CLI can wrap the credential. Ask:

> The seller isn't paying gas, so you need to send the payment transaction on-chain yourself first, then give me the tx hash. How would you like to send it?
> 1. **Help me send it** — switch to `okx-onchain-gateway` (recommended)
> 2. **I'll send it manually** — paste the tx hash when ready

Option 1: hand off to `okx-onchain-gateway`, return here with the resulting `0x...` hash. Option 2: wait for the user to paste a 66-char `0x...` hash.

Then:

```bash
onchainos payment charge \
  --challenge '<full WWW-Authenticate header value>' \
  --tx-hash '0x<64-char hex>' \
  [--from '<0xPayer>']
```

Output is the same shape as transaction mode, but `mode: "hash"`. Save `authorization_header`.

## Replay

Send `Authorization: <authorization_header>` to the original URL — the value already includes the `Payment ` prefix, do **NOT** add another (`Payment Payment …` is rejected). Expect `HTTP 200` + a `Payment-Receipt` header; decode it locally (`echo '<value>' | base64 -d | jq .`). 关键字段：`status` / `transaction`（on-chain tx hash）/ `chainId`。Charge complete. If a fresh `HTTP 402` returns (stale challenge), re-run the original request to fetch a new `WWW-Authenticate`, then sign again from the top.

## CLI Reference

`onchainos payment charge` — sign or wrap a one-shot charge.

| Param | Required | Default | Description |
|---|---|---|---|
| `--challenge` | Yes | - | Full `WWW-Authenticate: Payment ...` header value from the 402 response |
| `--tx-hash` | Hash mode only | - | 66-char `0x...` tx hash of the user-broadcast `transferWithAuthorization` |
| `--from` | No | selected account | Payer address |
| `--base-url` | No | production | Override backend URL (must be `https://`; `http://` triggers a 301 POST→GET redirect that drops the body and surfaces as `30001 incorrect params`) |

## Reading seller errors

Use **`../SKILL.md` → "Reading seller errors"** (priority order + `❌ Seller rejected: <reason> (code <code>, HTTP <status>)` format).

## Edge cases

| Symptom | Cause | Fix |
|---|---|---|
| `30001 incorrect params` | Wrong base URL or `http://` redirect | Verify `MPP_SA_URL` is `https://...` |
| `--tx-hash` rejected: must be `0x` + 64 hex | Malformed hash | Copy full 66-char hash |
| `chain not found` | Unsupported chainId | `onchainos wallet chains` |
| Challenge expired (`expires` in the past) | Stale challenge | Re-send original request to fetch fresh 402 |
| `feePayer=false` but user has no wallet to broadcast | Hash mode prerequisite missing | Either log in to OKX wallet via `okx-agentic-wallet` or use `okx-onchain-gateway` to broadcast |
