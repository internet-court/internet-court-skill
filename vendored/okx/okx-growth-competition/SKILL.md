---
name: okx-growth-competition
description: "List OKX Agentic Wallet exclusive trading competitions, register users for contests, track participation and leaderboard rankings, and claim won rewards. Use when users want to list available trading competitions or trading cups, view competition rules / prize pool / total prizes, register or sign up or enroll or join a contest, check the leaderboard (who is winning) or their own rank (am I in the prize zone, what is my place), ask did I win or query participation / claim status, claim won rewards or prizes from completed competitions, see which wallet account they registered with, or submit Telegram / WeChat / Email / Twitter contact for prize delivery to top-tier winners."
license: MIT
metadata:
  author: okx
  version: "3.3.13"
  homepage: "https://web3.okx.com"
---

# OKX Growth Competition — Trading Competition

Agentic Wallet exclusive trading competitions. Full lifecycle split across focused references:

- **Participation** (discover / register / trade / registered wallet / export guard) — `references/participation.md`
- **Details** (rules / prize pool / four reward sections) — `references/details.md`
- **Rank** (leaderboard / my own rank with CASE 1/2/3 templates) — `references/rank.md`
- **Claim** (reward status check / atomic claim / contact collection) — `references/claim.md`
- **CLI reference** (commands, parameters, return schemas) — `references/cli-reference.md`

This SKILL.md holds the **global rules** (facts, identity invariants, routing, output rules, time formatting, status codes, error handling) that ALL references depend on. Always read this file first; then jump into the matching reference for the user's intent.

## Facts about every Agentic Wallet competition

Treat the following as **factual ground truth** when the user asks about how a competition works. The two chain-related fields play **distinct, non-overlapping roles** — never conflate them:

- `chainId` — single id. **The claim / reward chain ONLY** (rewards are paid on this chain; its contract address lives here). It is NOT a trading chain unless it also appears in `participateChainIds`.
- `participateChainIds` — array of ids returned by **both `list` and `detail`** endpoints. **The trading chain set.** Trades on any chain in this list count toward the same competition standing.

**Trading-chain set = `participateChainIds`. Claim chain = `chainId`.** These are two separate concepts; the display rules below NEVER union them.

1. **Chain id → display name** mapping. Currently supported competition chains: `1 → Ethereum`, `196 → X Layer`, `501 → Solana`.
2. Never tell a user "your chain doesn't count" without first checking `participateChainIds`.
3. `myRankInfo.userTotal = 0` means the user has not yet hit the qualifying threshold or the backend metric pipeline has not picked up their trades yet — it does **NOT** mean the user's chain is unsupported.
4. `competition_rank` takes a single optional `wallet`. Omit it for self-rank — the tool sends your `accountId` (covers every chain in `participateChainIds` in one call; no chain pick). Pass an explicit address ONLY when querying someone else's rank; the address chain family (EVM `0x...` else Solana) must match the activity's primary chain or the tool rejects the call (no silent wrong-chain queries).

## Identity resolution invariant

The query identity for `competition_rank` and `competition_user_status` is **mutually exclusive**: backend accepts EITHER `accountId` (self) OR `walletAddress` (cross-user) — never both. The answer to "which identity did you use?" is **deterministic from the call shape**.

| Call shape | Identity sent |
|---|---|
| `competition_user_status` (any) | `accountId` — covers every chain in `participateChainIds` in one call |
| `competition_rank` without `wallet` | `accountId` |
| `competition_rank` with `wallet=<addr>` | `walletAddress` — tool validates addr's chain family (EVM `0x...` else Solana) matches activity's `chainId`; mismatch → rejected |
| `competition_claim` (pre-check) | `accountId` |

For multi-activity `competition_user_status` (no `activity_name`), the same `accountId` is reused across all activities — backend joins by accountId.

## Mandatory reading order

**Before producing ANY user-facing message about a competition, you MUST first locate the matching section in the right reference file below and follow its fixed template structure.** Do NOT improvise the format. Do NOT shorten the templates. Do NOT drop sections or merge them. Templates are product-mandated copy (Participation / Skill Quality wording, disclaimer) and must not be paraphrased.

The template **structure is fixed**; the **language follows the user** — see the `## Output Language` rule below. When the user writes Chinese, translate the template strings to natural Chinese. When the user writes English, use English as written. Placeholders (including chain display names from `{supportedChains}`) stay as-is.

Quick router (user intent → reference file + section):

| User intent | Reference file | Section |
|---|---|---|
| "list competitions / show available competitions" | `references/participation.md` | Step 1 — Discover |
| "show details / show rules / show prize pool" | `references/details.md` | Step 2 — View Details |
| "register / join" | `references/participation.md` | Step 3 — Join |
| "trade for me" | `references/participation.md` | Step 4 — Trade (delegates to okx-dex-swap) |
| "leaderboard / full board / who is winning" | `references/rank.md` | Check leaderboard (full board) |
| "my rank / what's my ranking / am I in the prize zone" | `references/rank.md` | Check user's own rank (across ALL leaderboards) |
| "show registered wallet" | `references/participation.md` | Query Registered Wallet |
| "export wallet" | `references/participation.md` | Wallet Export Guard |
| "check my status / did I win" | `references/claim.md` | Check Participation Status |
| "claim reward / claim my prize" | `references/claim.md` | Step 6 — Claim Reward |
| Top-tier winner contact follow-up (`needContact: true` after claim) | `references/claim.md` | Contact collection (top-tier winners only) |

If the user's intent does not clearly map to one of the above, ask which they meant before responding — do **not** invent a freeform format.

## Pre-flight

> Read `../okx-agentic-wallet/_shared/preflight.md`. If missing, read `_shared/preflight.md`.

**Cross-skill routing on common errors**:
- `not logged in` → walk the user through the `okx-agentic-wallet` login flow (email → OTP), then retry the original action.
- Backend status codes (`--status` filter / `status` / `joinStatus` / `rewardStatus`) and error code messages (`11002` / `11003` / `11008` / `1860402` / `address limit reached` / `Sui-chain` / region-blocked / `not eligible`): see `references/cli-reference.md`.

## Command Index

All MCP tools mirror the CLI; MCP variants accept `activity_name` (server-resolves the id) and auto-resolve `accountId` / wallet addresses from the active session. Full flag tables and return shapes: `references/cli-reference.md`.

| # | Command | Auth | Description |
|---|---------|------|-------------|
| 1 | `onchainos competition list [--status 0\|1\|2] [--page-size N] [--page-num N]` | None | List competitions (default `status=0`, active only) |
| 2 | `onchainos competition detail --activity-id <id>` | None | Rules, prize pool, chain, timeline |
| 3 | `onchainos competition rank --activity-id <id> [--wallet <addr>] --sort-type <type> [--limit N]` | None | Leaderboard + user rank. See `references/rank.md` for self/cross-user semantics and `sort-type` discovery. |
| 4 | `onchainos competition user-status [--activity-id <id>]` | Wallet login | Participation & reward status (omit `--activity-id` for all activities) |
| 5 | `onchainos competition join --activity-id <id> --evm-wallet <addr> --sol-wallet <addr> --chain-index <chain_id>` | Wallet login | Register the active account for the competition |
| 6 | `onchainos competition claim --activity-id <id> --evm-wallet <addr> --sol-wallet <addr>` | Wallet login | Atomic claim — signs + broadcasts inside the call. See `references/claim.md`. |
| 7 | `onchainos competition submit-contact --activity-id <id> --contact-type <Telegram\|WeChat\|Email\|Twitter> --contact-value <text>` | Wallet login | Record contact for a top-tier winner; only after a claim with `needContact: true`. See `references/claim.md`. |

`--status` (request filter): `0`=active, `1`=ended, `2`=all
`activityStatus` (response field): **`3`=active, `4`=ended** — different from the request filter

## Output Rules

> **Internal-only IDs vs user-facing display.** Internal numeric IDs (`activityId`, `chainIndex`, `accountId`) are returned in tool responses on purpose — they are needed to chain calls between tools (e.g. after `competition_join`, you may need to call `competition_detail` with the activity id to fill the success template). **Keep them in the data layer; never render them in user-visible messages.**

**Never include any internal id in a message produced for the user — under ANY circumstance, in ANY format.** Identify activities to the user EXCLUSIVELY by `activityName` (or `shortName` if name is unavailable).

**Forbidden user-visible patterns** (do NOT produce output like this):
- `Agentic Trading Contest (#107)`
- `#106 (agenticwallettest1)`
- Any column, row, or inline reference exposing an activity ID (e.g. `competition 107`, an `ID` column, a labeled `Activity ID` row) — same rule, regardless of label, shape, or language.

**Correct user-visible pattern**:
- `Agentic Trading Contest`
- When disambiguating two activities with the same name, append `chainName` (e.g. `Agentic Trading Contest (Solana)`), never the ID.

**Behind the scenes (allowed and expected)**:
- Reading `activityId` from a `competition_user_status` / `competition_join` response and passing it to `competition_detail` to fetch the data needed by a fixed template.
- Any tool-to-tool chaining via numeric ids — as long as the final user-facing message omits them.

When the user asks to act on a specific activity (e.g. "claim Agentic Trading Contest"), the MCP tools `competition_claim` / `competition_join` accept `activity_name` and resolve the id server-side, so you can also use names directly without doing your own lookup.

## Output Language

**Render every fixed template in the user's conversation language.** The template structure (sections, ordering, numbered items, table column count, placeholder positions, the `{supportedChains}` placeholder, and the `[Disclaimer: ...]` block) is fixed and must NOT change. Only the natural-language text inside is translated to the user's language naturally.

**Placeholders are never translated.** `{supportedChains}`, `{chainName}`, `{rewardUnit}`, `{txHash}`, `{accountName}`, etc. are filled with API values verbatim — do not localize them. Chain display names (e.g. `Solana`, `X Layer`, `Base`) come from the canonical id → name mapping and stay as-is in every language.

## Pre-Delivery Checklist

Final check before sending — covers the reference-file MUSTs that are easy to skip after a long response. (Rules already covered in earlier sections — internal IDs, `participateChainIds`, `*Formatted`, language/template fidelity — are not repeated here; verify them by following the rules at their home sections.)

- [ ] On a successful registration response → the `[Disclaimer: Digital asset trading involves risk. ...]` line is present on its own line at the end. (→ `participation.md` → Successful registration)
- [ ] On a claim runtime failure (signing / broadcast / network) → the 3-bullet failure-suggestion block is appended. On a pre-check rejection (rewardStatus 0/2/3/4, code 11002, code 11008) → the suggestion block is **OMITTED**. (→ `claim.md` → Fixed failure-suggestion block)
- [ ] Before invoking `competition_claim` → the pre-claim preview line (`You are about to claim {rewardAmount} {rewardUnit} on {chainName}. Reply "confirm" to proceed.`) was rendered and the user replied with an explicit confirmation. (→ `claim.md` → Pre-claim preview)
