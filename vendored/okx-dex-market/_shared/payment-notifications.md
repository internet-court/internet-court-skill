# Payment Notifications (Market API x402)

Some Market API endpoints may require x402 payment after the free quota is
exhausted. The CLI handles signing automatically once the user is logged in
and surfaces the following events in the response `notifications[]` array.

This document is the canonical source for the 5 event codes, their user-facing
copy, placeholder sources, and the agent handling procedure. It is consumed by
`okx-dex-market`, `okx-dex-token`, `okx-dex-signal`, and `okx-dex-trenches`.

---

## Response Shapes

Every CLI call may include a `notifications[]` field. Two response patterns:

**Non-blocking (informational)**:

```json
{
  "ok": true,
  "data": { /* ... */ },
  "notifications": [{ "code": "...", "data": {} }]
}
```

Print the filled copy once, then display `data` as usual.

**Blocking (first-time charging flip)**:

```json
{
  "confirming": true,
  "notifications": [{
    "code": "MARKET_API_*_OVER_QUOTA",
    "data": {
      "tier": "premium",
      "payment": [
        {
          "amount": "0.0005",
          "asset": "0xUSDG",
          "name": "Global Dollar",
          "symbol": "USDG",
          "network": "X Layer",
          "chainId": 196,
          "payTo": "0xPAYTO",
          "isDefault": false
        },
        {
          "amount": "0.0005",
          "asset": "0xUSDT",
          "name": "Tether USD",
          "symbol": "USDT",
          "network": "X Layer",
          "chainId": 196,
          "payTo": "0xPAYTO",
          "isDefault": true
        }
      ]
    }
  }]
}
```

Each `payment[]` entry is already display-ready: `amount` is a decimal string (not
minimal units), `network` is the chain's human-readable name (falls back to the
raw CAIP-2 string on chain-cache miss), and `chainId` is the numeric EVM chain id
the `onchainos payment default set` CLI expects. `name` carries the full
human-readable asset name (e.g. "Global Dollar"); `symbol` is the short ticker
(e.g. "USDG"). Older servers only returned the ticker in `name` and leave
`symbol` as `""` — render `<symbol> (<name>)` when both are present and
differ, otherwise fall back to `<name>` alone. `isDefault` flags the entry
whose `(asset, network)` matches the user's saved default (at most one per
list); when no default is saved, every entry is `false`.

**Never auto-retry.** The user must always confirm before paying — even when
a default asset is saved, the picker still fires on every first-time tier
charging flip so the user can switch assets or cancel. Once they pick (or
confirm the sole option) and `payment default set` has run, rerun the exact
same command — the CLI will auto-sign the matching accepts entry on the
second call.

---

## Handling Procedure

Before formatting the CLI result:

1. **Check `notifications[]`**. If absent or empty, proceed normally.
2. **For each `notification.code`**:
   - Look up the copy in the code table below.
   - Fill placeholders using the resolution rules.
3. **If `confirming: true` is present on the envelope**:
   - Do NOT auto-retry.
   - Present the filled copy to the user.
   - **If `notifications[].data.payment[]` has ≥ 2 entries**, render them as a
     numbered token list — one line per entry — using the asset label
     (`<symbol> (<name>)` when both are present and differ, else just `<name>`),
     `amount`, and `network`
     (e.g. `1. USDG (Global Dollar)  0.0005  X Layer` with both fields, or
     `1. USDG  0.0005  X Layer` on a legacy server). If an entry has
     `isDefault: true`, append ` (default)` to that line so the user sees
     which asset will be reused if they pick it
     (e.g. `2. USDT (Tether USD)  0.0005  X Layer  (default)`).
     Always append a final line
     `0. Cancel — don't pay, abort this request`. Ask the user to pick one.
     - If the user picks a numbered asset (or replies with an asset name):
       - Run `onchainos payment default set --asset <entry.asset> --chain <entry.chainId> --name <entry.symbol_or_name> --tier <notifications[].data.tier>` to persist the choice and record consent for this tier. For `--name`, prefer `entry.symbol` (the ticker) when non-empty, else fall back to `entry.name` — this keeps the saved default's display label short and recognizable.
       - Then rerun the original command verbatim. The CLI matches the saved
         default against the 402 `accepts` and auto-signs that entry.
     - If the user picks `0` (or otherwise refuses in free text):
       - Do NOT call `payment default set`. Do NOT rerun. Stop and acknowledge.
   - **If `payment[]` has exactly one entry**, skip the token list — just ask
     the user to confirm (`yes` / `proceed` / `确认`) or cancel (`0` / `no`).
     On confirmation, still run `onchainos payment default set --asset <entry.asset> --chain <entry.chainId> --name <entry.symbol_or_name> --tier <notifications[].data.tier>` (same `symbol`-then-`name` fallback as above) — re-saving the existing default is idempotent; the `--tier` flag is what promotes the tier from `charging_unconfirmed` to `charging_confirmed`. Then rerun the original command; the CLI auto-signs the sole option. On cancel, stop and acknowledge — do NOT run `payment default set`, so the next request re-prompts.
   - `--tier` is mandatory whenever you are acting on an OVER_QUOTA
     notification (only the named tier is promoted). The saved default
     asset persists across commands until the user runs
     `onchainos payment default unset` or picks a new asset on a future
     OVER_QUOTA event, so the asset picker only fires once per user
     preference change. The yes/no confirm, however, fires on every tier
     that first enters charging — so Basic and Premium each get one
     active acknowledgement, even if the same default applies to both.
4. **Otherwise**:
   - Print the filled copy once.
   - Then display `data` normally.

Do not track your own "already shown" state. The CLI persists per-code
`*_shown` flags in `~/.onchainos/payment_cache.json`, so one-shot codes fire at
most once per account lifetime.

---

## 1. `MARKET_API_NEW_USER_INTRO`

**Trigger**: New user (UserType=1) first call, Basic=0 Premium=0. One-shot per account lifetime. Non-blocking.

```
Welcome to Market API. Your monthly free quota has been allocated:
- Basic endpoints: {basicFreeQuota}
- Premium endpoints: {premiumFreeQuota}

Once exceeded, per-call pricing applies (Basic {basicUnitPrice}/call, Premium {premiumUnitPrice}/call). After you log in, the CLI will sign automatically when charging kicks in — no manual steps required. We recommend keeping a balance of a supported payment asset on X Layer ahead of time — you'll be asked to pick one when the CLI first charges, so service stays uninterrupted.

Full rules → [Pricing documentation]({docUrl})
```

**Placeholders**: `{basicFreeQuota}`, `{premiumFreeQuota}`, `{basicUnitPrice}`, `{premiumUnitPrice}`, `{docUrl}`

---

## 2. `MARKET_API_OLD_USER_GRACE`

**Trigger**: Old user (UserType=0) first call within the grace period. One-shot per account lifetime. Non-blocking.

```
Market API pricing is now in effect. As an existing user, you have a {graceDays}-day free grace period during which all calls remain free. The grace period ends on {graceExpiresAt}, after which regular billing begins. Once billing is active: Basic endpoints {basicFreeQuota} free / Premium endpoints {premiumFreeQuota} free, with overage priced at Basic {basicUnitPrice}/call and Premium {premiumUnitPrice}/call.

Full rules → [Pricing documentation]({docUrl})
```

**Placeholders**: `{graceDays}`, `{graceExpiresAt}`, `{basicFreeQuota}`, `{premiumFreeQuota}`, `{basicUnitPrice}`, `{premiumUnitPrice}`, `{docUrl}`

---

## 3. `MARKET_API_OLD_USER_POST_GRACE_INTRO`

**Trigger**: Old user's first call after grace ends (now ≥ graceExpiresAt, Basic=0 Premium=0). One-shot per account lifetime. Non-blocking.

```
Your {graceDays}-day free grace period has ended, and Market API has entered the regular billing phase. Your monthly free quota has been reallocated:
- Basic endpoints: {basicFreeQuota}
- Premium endpoints: {premiumFreeQuota}

Once exceeded, per-call pricing applies (Basic {basicUnitPrice}/call, Premium {premiumUnitPrice}/call). After you log in, the CLI will sign automatically when charging kicks in. We recommend keeping a balance of a supported payment asset on X Layer — you'll be asked to pick one when the CLI first charges, so service stays uninterrupted.

Full rules → [Pricing documentation]({docUrl})
```

**Placeholders**: `{graceDays}`, `{basicFreeQuota}`, `{premiumFreeQuota}`, `{basicUnitPrice}`, `{premiumUnitPrice}`, `{docUrl}`

---

## 4. `MARKET_API_NEW_USER_OVER_QUOTA`

**Trigger**: New user — a tier's charging flag flips 0→1. Per-tier; each flip fires once. **Blocking** (`confirming: true`).

```
Your {tier} free quota has been used up, and this request has been paused.

Per-call pricing ({tier} {unitPrice}/call) is now in effect. Please pick which asset you'd like to pay with — the CLI will save it as your default and auto-sign future payments:

{paymentOptions}
0. Cancel — don't pay, abort this request

Reply with the number (or asset name) to continue, or `0` to cancel. We recommend keeping enough of your chosen asset in the matching chain wallet to avoid transaction failures.
```

**Placeholders**: `{tier}`, `{unitPrice}`, `{paymentOptions}`

If the user picks a numbered asset (or confirms yes in the single-entry case), run:

```
onchainos payment default set --asset <ASSET_ADDRESS> --chain <CHAIN_ID> --name <NAME> --tier <TIER>
```

where `<TIER>` is `notifications[].data.tier`. Then rerun the original command.
If the user picks `0` (or otherwise refuses), stop — do NOT call `payment
default set`, do NOT rerun. If `payment[]` has only one entry, skip the
selection and just ask for `yes` / `0` before rerunning.

---

## 5. `MARKET_API_OLD_USER_POST_GRACE_OVER_QUOTA`

**Trigger**: Old user after grace — a tier's charging flag flips 0→1. Per-tier; each flip fires once. **Blocking** (`confirming: true`).

```
Your {tier} free quota for this month has been used up (the first overage after the grace period), and this request has been paused.

Per-call pricing ({tier} {unitPrice}/call) is now in effect. Please pick which asset you'd like to pay with — the CLI will save it as your default and auto-sign future payments:

{paymentOptions}
0. Cancel — don't pay, abort this request

Reply with the number (or asset name) to continue, or `0` to cancel. We recommend keeping enough of your chosen asset in the matching chain wallet to avoid transaction failures.
```

**Placeholders**: `{tier}`, `{unitPrice}`, `{paymentOptions}`

If the user picks a numbered asset (or confirms yes in the single-entry case), run:

```
onchainos payment default set --asset <ASSET_ADDRESS> --chain <CHAIN_ID> --name <NAME> --tier <TIER>
```

where `<TIER>` is `notifications[].data.tier`. Then rerun the original command.
If the user picks `0` (or otherwise refuses), stop — do NOT call `payment
default set`, do NOT rerun. If `payment[]` has only one entry, skip the
selection and just ask for `yes` / `0` before rerunning.

---

## Placeholder Resolution

### Static (skill-side config; update this file when pricing changes)

| Placeholder | Default | Description |
|---|---|---|
| `{basicFreeQuota}` | `1M/month` | Basic endpoint monthly free quota |
| `{premiumFreeQuota}` | `100K/month` | Premium endpoint monthly free quota |
| `{basicUnitPrice}` | `0.0001 $` | Basic overage unit price |
| `{premiumUnitPrice}` | `0.005 $` | Premium overage unit price |
| `{graceDays}` | `30` | Free grace period length (days) for existing users |
| `{docUrl}` | _TODO — PM to provide_ | Pricing documentation URL |

### Dynamic (read from event payload)

| Placeholder | Source | Used by | Notes |
|---|---|---|---|
| `{graceExpiresAt}` | `notifications[].data.graceExpiresAt` | #2 | Server gap — currently `data = {}` for `OLD_USER_GRACE`. Fall back to the string `2026.5.31` until the backend ships this field. |
| `{tier}` | `notifications[].data.tier` | #4, #5 | `basic` / `premium`; capitalize first letter on display (`Basic` / `Premium`) |
| `{unitPrice}` | Derived from `{tier}` | #4, #5 | `basic` → use `{basicUnitPrice}` value / `premium` → use `{premiumUnitPrice}` value |
| `{paymentOptions}` | `notifications[].data.payment[]` | #4, #5 | Render as a numbered list, one entry per line starting at `1`: `<idx>. <label>  <amount>  <network>`, where `<label>` is `<symbol> (<name>)` when both are present and differ, else just `<name>` (e.g. `1. USDG (Global Dollar)  0.0005  X Layer`, or legacy `1. USDG  0.0005  X Layer`). If an entry has `isDefault: true`, append ` (default)` to that line to highlight the user's saved preference (e.g. `2. USDT (Tether USD)  0.0005  X Layer  (default)`). Each entry carries `asset` / `chainId` / `symbol` / `name` — feed those into the `--asset` / `--chain` / `--name` flags of `onchainos payment default set` after the user picks (`--name` should be `symbol` when non-empty, else `name`). The copy itself always appends a trailing `0. Cancel — don't pay, abort this request` line after this placeholder, so do NOT include `0.` inside `{paymentOptions}` — picking `0` means refusal (no `payment default set`, no rerun). |

---

## Deduplication

- **One-shot codes** (`NEW_USER_INTRO`, `OLD_USER_GRACE`, `OLD_USER_POST_GRACE_INTRO`) fire at most once per account lifetime. Running `onchainos wallet logout` clears the cache; next login re-fires them.
- **OVER_QUOTA codes** (`NEW_USER_OVER_QUOTA`, `OLD_USER_POST_GRACE_OVER_QUOTA`) re-fire on each `charging 0→1` flip per tier. If a tier's charging flag drops back to 0 (server-side quota reset), the shown flag resets too.

Trust the CLI's persisted flags — do not track your own seen/unseen state.
