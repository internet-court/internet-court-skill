# Claim Flow — Reward Eligibility Check, Atomic Claim, Contact Collection

> Scope: claim phase — reward eligibility check, atomic claim, top-tier contact collection. Global rules in `../SKILL.md`.

## Check Participation Status

```bash
onchainos competition user-status                       # all activities (uses accountId)
onchainos competition user-status --activity-id <id>    # single activity (uses accountId)
```

Display: join status, join time, reward status, reward amount.

- If `rewardStatus=1`: proactively ask "You have won a reward. Would you like me to claim it for you?"
- If `rewardStatus=4`: use the **Pending-draw canonical template** (English canonical below; translate to the user's language; substitute `{activityName}` from the activity's `name` / `shortName` field; do NOT paraphrase the 5-business-day window):
  > "{activityName} has ended. The winners list is currently being finalized. The final reward list will be announced within 5 business days after the activity end — please return here to check your result and claim your reward then. Thank you for participating!"
- If `rewardStatus=3`: "Your reward has expired and can no longer be claimed."

## Step 6 — Claim Reward

Check status first via `competition_user_status` (see [Check Participation Status](#check-participation-status) above for the full flow):

| `rewardStatus` | Action |
|---|---|
| 0 | Inform user, no claim needed |
| 1 | Proceed to claim |
| 2 | Inform user (already claimed) |
| 3 | "Your reward has expired and can no longer be claimed" |
| 4 | Render the **Pending-draw canonical template** (see [Check Participation Status](#check-participation-status) above); do NOT call `competition_claim` |

### Pre-claim guard (rewardStatus=4 / Pending draw)

When the user explicitly requests to claim a reward (any "claim my reward" / "claim X" intent in any language) for an activity whose `rewardStatus` is `4` (Pending draw), do **NOT** call `competition_claim`. Render the **Pending-draw canonical template** (see [Check Participation Status](#check-participation-status) above, with `{activityName}` substituted) instead.

This applies whether the user explicitly named the activity or you inferred it from prior status output. (`rewardStatus=4` means the winners list is still being computed; a claim call would return a confusing backend error like "no eligible reward record." The Pending-draw template handles this case in product-canonical language.)

### Atomic claim (the only correct path)

Both the MCP tool `competition_claim` and the CLI `onchainos competition claim` now do the **same atomic flow**: pre-check `rewardStatus`, fetch calldata, sign each entry with the TEE session, broadcast on-chain, return txHash array. The CLI no longer returns raw unsigned calldata — the only externally visible behavior is the final result.

**Pre-claim preview**: before calling `competition_claim`, render the preview line below and wait for explicit confirmation. Reward fields come from the `competition_user_status` call already made in the pre-check step — do NOT make an extra round-trip just to fetch them.

**Why**: the atomic claim signs + broadcasts on-chain in one shot — there's no abort point after the tool fires. The preview is the user's only chance to verify the chain, token, and amount they're about to lock in. Skipping it makes the agent silently transact on the user's behalf.

Template (English canonical; translate natural-language strings to the user's language; preserve placeholders verbatim):

```
You are about to claim {rewardAmount} {rewardUnit} on {chainName}. Reply "confirm" to proceed.
```

Field-mapping:
- `{rewardAmount}` ← `competition_user_status` → matched entry's `rewardAmount`
- `{rewardUnit}` ← `competition_user_status` → matched entry's `rewardUnit`
- `{chainName}` ← from the activity's `chainId` mapped via `../SKILL.md` → Facts (chain id → display name table). Claim runs on the `chainId` claim chain, NOT `participateChainIds`.

Only invoke `competition_claim` after the user replies with an affirmative (e.g. `confirm`, `yes`, `ok`). On any other reply, treat as decline and stop without calling the tool.

Call `competition_claim` (MCP: `activity_name` only, wallets auto-resolved from active account; CLI: explicit `--evm-wallet` / `--sol-wallet` — see `cli-reference.md` for full result shape).

**How to report to the user:**
- All succeeded (`failed: []`): "Claimed {rewardAmount} {rewardUnit}, tx hash: {txHash}"
- Partial success (some `failed`): list each succeeded txHash, then list the failed entries with their `error`, then append the **fixed failure-suggestion block** (template below). **Do NOT re-run claim blindly** — succeeded entries already landed; another call will hit the "reward already claimed" guard.
- All failed: the tool returns an error, not this shape — surface the error message verbatim, then append the **fixed failure-suggestion block**.
- **If `needContact: true` in the response** (user is a top-tier winner who has NOT yet submitted contact info): after the success line above, also render the **Contact-collection prompt** below — invite (do NOT force) the user to share one contact method. See `### Contact collection (top-tier winners only)` further down for the prompt template, parsing rules, and follow-up.

The flow blocks before signing if `rewardStatus` is 0 (not eligible), 2 (already claimed), 3 (expired), or 4 (winners not announced yet). The error message is plain text — relay it to the user. **Skip** the failure-suggestion block in these pre-check rejections (they are semantic, not transient — telling the user to "check Gas / try later" is misleading).

#### Fixed failure-suggestion block

For runtime failures (signing/broadcast/simulation errors, network errors, unknown errors), append this block after the error description. Translate to the user's language while preserving the heading + 3 bullet items in this order. Do NOT add or remove items.

Template:

```
Suggestions:
- The claim process requires Gas. Please make sure your Gas is sufficient.
- Try again later — this may be a transient network issue.
- If it fails repeatedly, please contact customer support.
```

- Do NOT chain `gateway_broadcast` after a claim call — the on-chain submission already happened inside the tool. Re-broadcasting either fails (the tx is already mined) or, for Solana, signs a different transaction that the TEE rejects.
- Do NOT manually construct, encode, or sign a transaction (no Python base58 encoding, no manual hex assembly). The TEE-managed wallet key is the only valid signer; any locally-constructed tx will be rejected by the contract's signature check.
- Do NOT inspect the result for an empty `base58CallData` and conclude the CLI cannot sign a Solana claim — that field is empirically empty for Solana; the CLI/MCP code internally falls back to encoding `tx.data` byte array via base58 and proceeds. Just trust the `succeeded[]` and `failed[]` arrays.
- Do NOT split into a two-step "fetch calldata then wallet contract-call" flow — that mode no longer exists; the claim command is atomic.

**On claim error (code 11002 `not eligible for reward`):** "You did not win a reward and cannot claim."  
**On any other error:** "Operation failed. Please contact customer support."

### Contact collection (top-tier winners only)

Run this sub-flow **if and only if** the `competition_claim` response contains `needContact: true` (the backend's signal that this user is a top-tier winner whose merchandise delivery requires contact info). Do NOT run it when `needContact: false` or the field is missing. Do NOT ask for a contact pro-actively in any other claim path.

**Step 6a — After the claim-success line, append this prompt** (English canonical; translate the natural-language strings to the user's conversation language; keep the 4 numbered options in this exact order and the literal labels `Telegram` / `WeChat` / `Email` / `Twitter (X)` as-is — these are product-canonical, do not paraphrase):

```
Congratulations on your standout performance in this competition! As a thank-you, we have a custom merchandise pack reserved for top winners. Please share ONE of the following contact methods so we can reach out about delivery — sharing is optional:

1. Telegram
2. WeChat
3. Email
4. Twitter (X)
```

**Step 6b — When the user replies with a contact method**, run this checklist before calling `competition_submit_contact`:

1. **Parse** `contactType` and `contactValue` from the message:
   - `Telegram @handle` / `tg @handle` / `Telegram: @handle` → `contactType=Telegram`, `contactValue=<handle>` (preserve `@` if user included it)
   - `WeChat <id>` / `WeChat: <id>` → `contactType=WeChat`, `contactValue=<id>`
   - Anything looking like an email (`user@domain.com`) or `Email <addr>` → `contactType=Email`, `contactValue=<address>`
   - `Twitter @handle` / `X @handle` / `Twitter: @handle` → `contactType=Twitter`, `contactValue=<handle>`
2. **Validate `contactType`** against the case-sensitive enum `{Telegram, WeChat, Email, Twitter}` — the backend rejects anything else (including lowercase `telegram` or `wechat`). On mismatch, re-prompt with the 4 numbered options from Step 6a and restart at step 1; do NOT auto-correct casing silently.
3. **Disambiguate** if the message is ambiguous (e.g. a bare `@username` with no platform): ask once `Which platform — Telegram, WeChat, Email, or Twitter (X)?`. Do NOT guess. After the reply, restart at step 1.
4. **Trim** `contactValue` to ≤ 256 characters; if longer, ask the user to shorten — do NOT truncate silently.
5. Proceed to Step 6c only after steps 1–4 pass.

**Step 6c — Call `competition_submit_contact`**:

```
competition_submit_contact(
  activity_name="<same activity name used in competition_claim>",
  contact_type="Telegram" | "WeChat" | "Email" | "Twitter",
  contact_value="<the parsed value, max 256 chars>"
)
```

CLI equivalent:
```bash
onchainos competition submit-contact --activity-id <id> --contact-type Telegram --contact-value "@testemma"
```

**Step 6d — On `submitted: true` response, render this confirmation** (English canonical; translate to the user's language; do NOT echo the contact value back; do NOT show any internal id):

```
Got it. Thanks for sharing! We will reach out shortly — please keep an eye on your messages.
```

**On submit_contact error**, surface the message verbatim with a short hint:
- If the backend returns a validation error on `contactType`, re-prompt the user with the 4 options.
- If `not registered for activity` — this should never happen post-claim; flag as a backend anomaly and tell the user to retry later.
- Other errors: "Failed to record your contact, please try again later or contact customer support."

- Do NOT push / pressure the user if they decline to share. Acknowledge politely and move on.
- Do NOT prompt for multiple contacts — one is enough. Stop after the first valid submission.
