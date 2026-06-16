# Details — View Competition Rules & Prize Pool

> Scope: full competition detail view — rules / prize pool / 4 reward sections (PNL% / PnL / Participation / Skill Quality). `{supportedChains}` algo: see `participation.md` → Shared field mapping. Global rules in `../SKILL.md`.

## Step 2 — View Details

```bash
onchainos competition detail --activity-id <id>
```

**Display competition / reward info using the fixed English template below.** The structure (sections, ordering, numbered list, placeholder positions, the `{supportedChains}` placeholder on the chain line) is fixed. Copy the template character-for-character; only fill in placeholders. Do not paraphrase, abbreviate, or substitute synonyms.

When the user's language is not English, translate the natural-language strings to the user's language while preserving the structure, the placeholders, and every required content invariant listed below. Do not reorder, omit, or merge sections.

### Fixed display template

```
Basic Information
Supported chains: {supportedChains}
Duration: {startTime} ~ {endTime}
Total Prize Pool: {totalPrizePool}

Prize Categories:
Realized PNL% Prize Pool ({roiPoolAmount})
Ranked from highest to lowest by realized PNL%.
{roiRankTable}

Realized PnL Prize Pool ({pnlPoolAmount})
Ranked from highest to lowest by realized PNL amount.
{pnlRankTable}

Participation Prize ({participationPoolAmount})
Registered users who accumulate $100 or more in total trading volume via Agentic Wallet and maintain a total wallet balance of $100 or above throughout the competition period, will share the {participationPoolAmount} participation prize pool equally. Random asset snapshots will be taken during the competition period to verify eligibility.

Skill Quality Prize ({skillPoolAmount})
The Skill Quality Prize is an independently judged award. During the competition period, participants may submit their Agent Skills through the event landing page. Eligible submissions include, but are not limited to, on-chain autonomous yield strategies, trading analysis, and trading signal monitoring. All submitted Agent Skills will be evaluated through a dual-review process combining AI pre-screening and manual judging. The top {skillTopN} Skill creators by score will each receive a reward of {skillPerCreatorReward}.
```

### Field-mapping rules

- Chain line ← `{supportedChains}` — see `participation.md` → Shared field mapping.
- `{startTime}` / `{endTime}` ← `startTimeFormatted` / `endTimeFormatted` (CLI-formatted, already ends in `(UTC+8)` — render verbatim).
- `{totalPrizePool}` ← sum of all `prizePoolDistribution[].totalReward` plus `rewardUnit` (e.g. `50,000 USDC`).
- `{roiPoolAmount}` ← totalReward of the realized-PnL% tab.
- `{pnlPoolAmount}` ← totalReward of the realized-PnL tab.
- `{participationPoolAmount}` ← totalReward of the participation prize tab.
- `{skillPoolAmount}` ← totalReward of the Skill quality prize tab.
- `{skillTopN}` ← upper bound of the Skill tab's `rules[].interval` (e.g. `"1-10"` → `10`).
- `{skillPerCreatorReward}` ← that rule entry's `reward` + `rewardUnit` (e.g. `500 USDC`).
- `{roiRankTable}` / `{pnlRankTable}` ← markdown table built from the corresponding tab's `rules[]`. Format (English canonical; localize headers to user's language):

  ```
  | Rank | Reward |
  |------|--------|
  | <interval-formatted> | <reward-formatted> |
  | ...                  | ...                |
  | Total | <totalReward> {rewardUnit} |
  ```

  Interval / reward formatting per row:
  - Single rank (`interval = "1"`) → Rank cell `Rank 1`, Reward cell `<reward> <rewardUnit>` (no `each` prefix)
  - Range (`interval = "2-6"`) → Rank cell `Ranks 2-6`, Reward cell `<reward> <rewardUnit> each`
  - Always end with a totals row whose Reward cell is the tab's `totalReward` + `rewardUnit`.

If any of the four pools is absent for a particular activity, omit just that section (keep the others as-is).

### Required content invariants (per section)

**Section 1 — Realized PNL% Prize Pool**
- Title MUST be exactly `Realized PNL% Prize Pool` (or its faithful translation in the user's language). Do NOT substitute with `PnL% Ranking Award`.
- Description MUST mention: ranking by realized PNL%, highest to lowest.
- Rank table MUST have headers `Rank / Reward` and end with a `Total` row.

**Section 2 — Realized PnL Prize Pool**
- Title MUST be exactly `Realized PnL Prize Pool`. Do NOT substitute with `PnL Ranking Award` / `Realized PnL Pool`.
- Description MUST mention: ranking by realized PNL amount, highest to lowest.
- Rank table MUST follow the same format as Section 1.

**Section 3 — Participation Prize** (PRODUCT-MANDATED COPY)
- Title MUST be exactly `Participation Prize`.
- The description body MUST include all of these specific terms:
  - `Agentic Wallet`
  - accumulate `$100` or more in total trading volume
  - maintain a total wallet balance of `$100` or above throughout the competition period
  - share the participation prize pool equally
  - random asset snapshots to verify eligibility

**Section 4 — Skill Quality Prize** (PRODUCT-MANDATED COPY)
- Title MUST be exactly `Skill Quality Prize`.
- The description body MUST include all of these specific terms:
  - independently judged award
  - submission of Agent Skills through the event landing page
  - examples of eligible submissions (on-chain autonomous yield strategies, trading analysis, trading signal monitoring)
  - dual-review process combining AI pre-screening and manual judging
  - `top {skillTopN} Skill creators ... each receive a reward of {skillPerCreatorReward}`

- Do NOT use bullet markers (`-`) inside the four numbered sections — the structure is `1. Title (amount)\n description text` then the rank table; not a bullet list.

After printing the template, ask: `Would you like me to register you for this competition?`
