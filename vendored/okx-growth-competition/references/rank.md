# Rank — Leaderboard & My Own Rank

> Scope: rankings — full leaderboard + user's own rank (CASE 1/2/3 templates). Reward status checks: see `claim.md` → Check Participation Status. Global rules in `../SKILL.md`.

## Check leaderboard (full board)

When the user says "view leaderboard" without specifying which one, you MUST:

1. Call `competition_detail` for the activity and enumerate `tabConfigs[].rankFieldConfig[].sortValueMap.descend` — this is the full set of leaderboards the activity exposes.
2. Call `competition_rank` ONCE PER `sort_type` (one HTTP call per leaderboard) so you have data for every leaderboard.
3. Render ALL of them in the response — one section per leaderboard. Do NOT silently default to a single leaderboard (e.g. only `sort_type=1`) when the activity has more than one.

Only ask the user to pick one when there are clearly too many to fit (≥ 3 leaderboards on a single competition). With 1–2 leaderboards, always show all by default.

`tabConfigs[].rankFieldConfig[]` fields:
- `title` — display name (e.g. `PnL%`, `PnL`)
- `key` — internal sort field (e.g. `pnl`, `realizedProfit`)
- `sortValueMap.descend` — the numeric value to pass as `--sort-type`

**Per-leaderboard fetch:**
```bash
onchainos competition rank --activity-id <id> [--wallet <addr>] --sort-type <descend> --limit 20
```

**Display rules:** for each leaderboard render a separate section labeled by its `title`. Each section shows top N entries: rank, `nickName`, score (`userTotal` formatted by `format` field), estimated reward. Render `nickName` verbatim from the response.

Example layout (`nickName`, score, and reward values come from the backend):
> **PnL% leaderboard** — pool 200 DJT
> Rank 1, {nickName}, PnL% +0.17%, estimated reward 100 DJT
> Rank 2, {nickName}, PnL% +0.03%, estimated reward 20 DJT
>
> **PnL leaderboard** — pool 200 DJT
> Rank 1, {nickName}, PnL $0.1885, estimated reward 100 DJT
> Rank 2, {nickName}, PnL $0.0006, estimated reward 20 DJT

After the leaderboards, append a "Your rank" section using the **CASE 1 / 2 / 3 templates** from the next section, since you already have all the data.

## Check user's own rank (across ALL leaderboards)

A user can simultaneously appear on multiple leaderboards (e.g. PnL% AND PnL). When the user asks "what's my rank?", you MUST query every leaderboard the activity exposes, then render one of the three fixed templates below.

**Required flow:**
1. Call `competition_detail` → enumerate `tabConfigs[].rankFieldConfig[].sortValueMap.descend` to get the full set of `sort_type` values for this activity.
2. For EACH `sort_type`, call `competition_rank --sort-type <descend>` and capture `myRankInfo` plus the leaderboard's threshold (lowest `userTotal` in `allRankInfos`).
3. Classify the result:
   - **CASE 1** — user has `currentRank > 0` on every leaderboard
   - **CASE 2** — user has `currentRank > 0` on at least one but not all
   - **CASE 3** — user has no `currentRank > 0` on any leaderboard
4. Output the matching fixed template, **rendered in the user's language** (English canonical below; localize for Chinese / other-language users).

**Output exactly the matching template structure below — never paraphrase the data fields, never collapse the two-leaderboard sections into one. Localize the natural-language strings to the user's language; keep placeholders, numeric values, and units verbatim.**

### CASE 1 — ranked on both PnL and PnL%

Template:

```
Realized PnL ranking:
You are currently ranked #{pnlRank}, estimated reward {pnlReward} {rewardUnit}!

Realized PnL% ranking:
You are currently ranked #{roiRank}, estimated reward {roiReward} {rewardUnit}!

| Leaderboard | My rank | Estimated reward |
|-------------|---------|------------------|
| Realized PnL | #{pnlRank} | {pnlReward} {rewardUnit} |
| Realized PnL% | #{roiRank} | {roiReward} {rewardUnit} |

Your total estimated reward across both rankings: {totalReward} {rewardUnit} (sum of the two)
```

### CASE 2 — ranked on one leaderboard, off the other

There are two symmetric sub-cases. The structure is identical: the ranked leaderboard goes first ("ranked #N, estimated reward X"), then the unranked one ("not on the leaderboard, current value Y, threshold Z"). Each sub-case has its own pinned template — do NOT improvise the unranked-section unit (`%` for PnL%, currency `$` for PnL).

#### CASE 2-A — on PnL, off PnL% (currentRank for sort_type=7 > 0; sort_type=1 == 0)

Template:

```
Realized PnL ranking:
You are currently ranked #{pnlRank}, estimated reward {pnlReward} {rewardUnit}!

Realized PnL% ranking:
Not on the leaderboard yet. Your current realized PnL% is {currentRoi}%. You need at least {minRoi}% (the current leaderboard minimum) to qualify.
```

#### CASE 2-B — on PnL%, off PnL (currentRank for sort_type=1 > 0; sort_type=7 == 0)

Template:

```
Realized PnL% ranking:
You are currently ranked #{roiRank}, estimated reward {roiReward} {rewardUnit}!

Realized PnL ranking:
Not on the leaderboard yet. Your current realized PnL is ${currentPnl}. You need at least ${minPnl} (the current leaderboard minimum) to qualify.
```

**Unit rule**: PnL% uses `%` suffix (no currency symbol); PnL uses `$` prefix (or the appropriate currency unit). Do NOT mix them up — the user's threshold for PnL is a dollar amount, not a percentage.

### CASE 3 — off both leaderboards

Template:

```
Your address is not on any leaderboard. Your current realized PnL is ${currentPnl}, realized PnL% {currentRoi}%.
The current minimum to qualify: realized PnL ${minPnl}, realized PnL% {minRoi}%.
```

### Field-mapping rules

- `{pnlRank}` ← `myRankInfo.currentRank` of the PnL leaderboard (sort_type 7)
- `{pnlReward}` ← `myRankInfo.expectedRewards` of the PnL leaderboard
- `{roiRank}` ← `myRankInfo.currentRank` of the PnL% leaderboard (sort_type 1)
- `{roiReward}` ← `myRankInfo.expectedRewards` of the PnL% leaderboard
- `{rewardUnit}` ← `myRankInfo.rewardUnit` (e.g. `DJT`); per-leaderboard if they ever differ
- `{totalReward}` ← `pnlReward + roiReward` (numeric sum, same unit)
- `{currentRoi}` ← user's PnL% score from `myRankInfo.userTotal` of the PnL% board (or 0 if backend returned null)
- `{currentPnl}` ← user's PnL score from `myRankInfo.userTotal` of the PnL board
- `{minRoi}` ← lowest qualifying PnL% — last entry's `userTotal` in the PnL% board's `allRankInfos[]`
- `{minPnl}` ← lowest qualifying PnL — last entry's `userTotal` in the PnL board's `allRankInfos[]`

`format`: `1`=number, `2`=percentage, `3`=token amount with unit.
