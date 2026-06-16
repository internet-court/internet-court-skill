# Participation Flow — Discover, Register, Trade, Track Standing

> Scope: participation phase — discover / register / trade / registered-wallet / export guard. Global rules in `../SKILL.md`.

## Shared field mapping

### `{supportedChains}`

Computed from `participateChainIds` only (trading-chain set, see `../SKILL.md` Facts).

1. Take the ids in `participateChainIds` (in backend-returned order).
2. Map each id via `1 → Ethereum`, `196 → X Layer`, `501 → Solana`.
3. Join with `, `.

Example: `[196, 501]` → `X Layer, Solana`.

## Step 1 — Discover Competitions

### Choosing the status filter

Default `status=2` (all). Use `status=0` only when user explicitly wants active (e.g. "which can I join now"), `status=1` only for ended ("winners list").

**Display the result as markdown tables — one row per competition. Do not use a numbered prose list, do not collapse fields into a single sentence.**

When the result contains BOTH active (`activityStatus=3`) and ended (`activityStatus=4`) entries, **split into two separate tables under bold subheadings (`**Active**` / `**Ended**`, translated to the user's language), in that order**. When only one status is present, render a single table without a subheading.

### Fixed table template

| Name | Chain | Time | Total Prize Pool | Details |
|------|-------|------|------------------|---------|
| {name} | {supportedChains} | {timeRange} | {rewards} | [View](https://web3.okx.com/boost/trading-competition/{shortName}) |

### Field-mapping rules

- Group rows by `availableCompetitions[].status`: `3` → Active table, `4` → Ended table.
- Name column ← `name`
- **Chain column** ← `{supportedChains}` — see [Shared field mapping](#shared-field-mapping) above.
- Time column ← `{timeRange}` from `timeRangeFormatted`.
- Total Prize Pool column ← `rewards` field (already a formatted string like `50,000 USDC`)
- Details column ← `https://web3.okx.com/boost/trading-competition/<shortName>` as a markdown link

After the table(s), ask the user (in their language):
- If only Active has entries: `Which competition would you like to view in detail, or would you like to register directly?`
- If only Ended has entries: `Would you like to check your ranking or claim status for any of these?`
- If both: combine — `Which active competition would you like to register or view, or which ended competition would you like to check your ranking / claim?`

### Empty-result handling (English canonical; translate to user's language)

- All filters returned 0 entries → `No trading competitions available right now.`
- `status=0` filter returned 0 entries → `No active trading competitions at the moment.`
- `status=1` filter returned 0 entries → `No ended trading competitions yet.`

## Step 3 — Join (requires wallet login)

Call `competition_join` (MCP: wallet args auto-resolved from active account; CLI: explicit address params — see `cli-reference.md`). Get `chain_index` from `competition_detail` → `chainIndex` field.

If not logged in, route via `../SKILL.md` → Pre-flight (Cross-skill routing), then retry registration.

### Required pre-flight: distinguish duplicate-registration scenarios

**Before calling `competition_join`, you MUST first call `competition_user_status` for the activity to read the current account's `joinStatus`.** This separates the two duplicate-registration cases (Scenario A / B below) — without the pre-flight both collapse into a generic backend error.

| Scenario | `user_status.joinStatus` (current account) | Action | Template |
|----------|-------------------------------------------|--------|----------|
| **A — current account already joined** | `1` | Do NOT call `competition_join` | Scenario A template (below) |
| **B — current account NOT joined** | `0` | Call `competition_join` | If success → success template; if `code=11016` → Scenario B template |

#### Scenario A — current wallet already registered

Template:

```
Your current wallet account [accountName] is already registered for [activityName]. No need to register again. Would you like me to walk you through the rules in detail, or start trading directly?
```

Field-mapping:
- `[accountName]` ← `accountName` of the currently selected account (read from `wallet_store` / `wallet status`, e.g. `Account 1`)
- `[activityName]` ← `activityName` from the prior `competition_user_status` / `competition_list` response

#### Scenario B — same login, different account already registered

Triggered when `competition_join` returns `code=11016 Participation limit reached`.

Template:

```
Registration failed. Your wallet account [registeredAccountName] is already registered. You cannot register again. Please switch to your registered account to trade.
```

Field-mapping:
- `[registeredAccountName]` ← name of the OTHER account in the same login that holds the registration. To find it, iterate every account from `wallet_store` other than the current one and call `competition_user_status` for the activity, picking the one whose `joinStatus=1`.

**Fallback template** — only when the iteration above finds no `joinStatus=1` account (rare race condition). Output verbatim instead of the main Scenario B template; do not author your own phrasing.

```
Registration failed. Another one of your wallet accounts is already registered for this competition. Please run `onchainos wallet status` to see which account is registered, then switch to it.
```

### Successful registration

On every successful `competition_join` call (`joined: true`), output the fixed template below. **All four lead-sentence elements must appear**: (1) which chains it runs on (`{supportedChains}`), (2) total prize pool, (3) dual-axis PnL% / realized PnL ranking, (4) Participation + Skill Quality Prizes. **The bracketed disclaimer must appear on its own line at the end.** `{supportedChains}` is **`participateChainIds` only** per Field-mapping. `{totalPrizePool}` is from `competition_detail` (call it first if not cached). Translate natural-language strings to the user's language; preserve structure and placeholders.

Template:

```
Registered successfully! This competition runs on {supportedChains}, with a total prize pool of {totalPrizePool}. The trading contest ranks players by both PnL% and realized PnL, with additional Participation and Skill Quality Prizes. Would you like me to walk you through the detailed rules, or help you initiate a trade on {supportedChains}?

[Disclaimer: Digital asset trading involves risk. Prices can be highly volatile. Please understand the risks fully and do your own research before trading.]
```

**Field-mapping rules**

- `{supportedChains}` ← computed from `data.participateChainIds` per [Shared field mapping](#shared-field-mapping). Lead sentence and closing question share the same string; do not list chains separately.
- `{totalPrizePool}` ← total reward pool (sum of all `prizePoolDistribution[].totalReward` + `rewardUnit`, e.g. `500 DJT`).

### Other errors

**On error containing `region` / `not available in your region`:**
> Registration failed: service is not available in your region. Please switch to a supported region and try again.

**On any other error:**
> Operation failed. Please contact customer support.

## Step 4 — Trade (delegate to okx-dex-swap)

When user asks to trade per competition rules:

**Case A — User does NOT provide a CA (only token name/symbol):**
1. Resolve the CA via the `token_search` MCP tool (CLI: `onchainos token search`).
2. Confirm with user before proceeding:
   > Just to confirm, the CA for token "{tokenSymbol}" is "{contractAddress}". Is that correct?
3. Wait for user to confirm. Only proceed after explicit "yes".
4. Then follow **Case B** below.

**Case B — User provides a CA directly:**
1. **Execute swap** via the `swap_swap` MCP tool (CLI: `onchainos swap swap`); see the `okx-dex-swap` skill for parameters.
2. Report: "Done — your trade has been submitted." + tx hash.

**Competition constraints per trade:**
- Single-trade min $1 (orders below $1 are not counted)
- Token pairs must match competition rules from `detail` response

## Query Registered Wallet

When user asks "show my registered address" or similar:

1. Call `competition_user_status` (MCP) — `accountId` is loaded from the active wallet session; no wallet args needed. CLI equivalent: `onchainos competition user-status` (omit `--activity-id` to query all activities).
2. Find entries where `joinStatus=1`
3. For each matched entry, present: competition name (`activityName`) + chain (`chainName`) + `joinedAddress` rendered verbatim. Use chain to determine which address was used (EVM or SOL).

If multiple entries match, list all of them.

Example layout (single):
> Your Account 1 is registered for **XXX Trading Competition**. Registered address: Solana address {joinedAddress}.

Example layout (multiple):
> Your Account 1 is registered for the following trading competitions:
> - **XXX Trading Competition** (Solana): {joinedAddress}
> - **YYY Trading Competition** (XLayer): {joinedAddress}

If no entry has `joinStatus=1`:
> You are not currently registered for any trading competition.

## Wallet Export Guard

When the user requests to export the Agentic Wallet:

1. Call `competition_user_status` (MCP) — uses `accountId` from active session. CLI equivalent: `onchainos competition user-status`.
2. If any `joinStatus=1`:
   > Your wallet is registered for an Agentic Wallet trading competition. Exporting the wallet will forfeit your eligibility for this competition. Please confirm whether you want to proceed with the export.
3. Only proceed with export if the user explicitly confirms.
