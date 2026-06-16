# Welcome Banner

Two variants by auth state. Both share the same 5-pick (or 4-pick, when Polymarket is geoblocked) Quick-start menu.

- **Logged-out** — no addresses, no balance, includes a "login" hint at the menu trailer.
- **Logged-in** — addresses + balance shown, no QR codes, no login hint.

## Step 1 — Free zone (conditional)

**Skip the free zone entirely when the opener is one the banner already answers.** The banner header is "Hi, welcome to Onchain OS." + 3 value-prop sentences explaining what Onchain OS is and how it works. Repeating that in a free zone above is pure duplication.

Specifically:

| User opener | Free zone? |
|---|---|
| "what is onchainos / how do I play / how to use / what can it do / introduce yourself / tutorial / getting started" | **Skip.** Go straight to the banner. |
| "I just installed it, now what" / "where do I start" / "I'm new" | 1 short sentence acknowledging, then bridge. |
| User asked an unrelated concrete question alongside | 1–3 sentences answering it, then bridge. |

**Bridging (only when a free zone is present)**: end with a transitional half-sentence (e.g. "let me drop the menu" / "here's where to start ↓") — NOT a hard period followed by the banner's first line. Self-check: read free-zone tail + first banner line as one unit; if they feel like two separate posts pasted together, rewrite the tail. If they restate what the banner already says, **delete the free zone entirely**.

## Step 2 — Prepare placeholders (run BEFORE rendering)

### 2.1 Auth state

Already known from `onchainos wallet status` (run earlier). Pick the right banner variant:
- `loggedIn: true` → **logged-in** variant.
- `loggedIn: false` → **logged-out** variant.

### 2.2 Addresses + balance (logged-in variant only)

Pull `evmAddress`, `solAddress`, and the total USD balance from the `onchainos wallet balance` response. Never fabricate.

> **Do NOT call `onchainos wallet qrcode`** — QR codes are not part of the banner anymore. The CLI subcommand still exists for direct use, but the welcome flow no longer renders QR block art.

### 2.3 Polymarket geoblock check (fail-closed)

Polymarket is restricted in some jurisdictions (e.g. United States). Probe geo before deciding whether to include pick 1:

```bash
onchainos wallet geoblock
```

Expected stdout (exit 0):

```json
{"blocked":false}
```

Set `polymarket_available` strictly:

- Exit 0 AND stdout parses to JSON AND `blocked === false` → `polymarket_available = true`.
- **Any other outcome** — non-zero exit, JSON parse error, missing/non-boolean `blocked`, or `blocked === true` — → `polymarket_available = false`.

This is **fail-closed**. Do not warn or surface the geoblock decision — silently switch to the geoblocked menu variant.

## Step 3 — Render the banner

The template below is canonical English. Render in the user's language at runtime per the global translation rule in `SKILL.md → Authoring Pattern`.

Output as plain text (no `>` blockquote prefix, no surrounding fence). Order: header → (logged-in only: address block) → menu → trailer → disclaimer.

The fenced blocks below are templates inside this spec doc — emit only the text inside, not the fences.

### 3.1 Header — same in both variants

```
Hi, welcome to Onchain OS.
I'm your on-chain AI sidekick — just talk to me to trade, check markets, and chase trends.
Wallet, trading, market data, payments — all in one place, ready out of the box —
no more juggling a dozen DApps, re-connecting wallets, or reviewing signatures every time.
```

### 3.2 Address block — logged-in variant only

```
Your Agentic Wallet addresses:

EVM: {evm_address}
Solana: {solana_address}

Balance: ${balance}
```

### 3.3 Menu — Variant A (`polymarket_available = true`, 5 picks)

```
What do you want to try?
🔥 1 · Polymarket — top 3 markets worth watching today, I'll handpick them
💰 2 · Don't let your USDC sit idle — let's find the best APY right now
🐋 3 · What did the whales just buy? Smart-money signal tracking
🆕 4 · Fresh tokens on-chain — scan to see which ones are worth boarding
☕ 5 · One coffee's time to digest today's on-chain market
```

### 3.4 Menu — Variant B (`polymarket_available = false`, 4 picks, no Polymarket)

```
What do you want to try?
💰 1 · Don't let your USDC sit idle — let's find the best APY right now
🐋 2 · What did the whales just buy? Smart-money signal tracking
🆕 3 · Fresh tokens on-chain — scan to see which ones are worth boarding
☕ 4 · One coffee's time to digest today's on-chain market
```

### 3.5 Trailer

**Logged-out**:

```
Which one? Just reply with 1–N 👆
(Or reply "login" to log in your wallet first.)
```

**Logged-in**:

```
Which one? Just reply with 1–N 👇
```

Replace `N` with `5` for Variant A or `4` for Variant B.

### 3.6 Disclaimer — always at the bottom, both variants

```
**Attention ⚠️:** AI analysis is for reference only, trade with caution.
```

## Step 4 — Pick handling

Route by pick **description** (not the raw number — the number shifts in Variant B).

| Description | Type | Target |
|---|---|---|
| 🔥 Polymarket Top 3 | skill | invoke `okx-dapp-discovery` (it routes to / installs `polymarket-plugin`) |
| 💰 USDC APY | skill | invoke `okx-defi-invest` |
| 🐋 Smart money / whale tracking | workflow | `~/.onchainos/workflows/smart-money-signals.md` |
| 🆕 New on-chain tokens | workflow | `~/.onchainos/workflows/new-token-screening.md` |
| ☕ Daily on-chain brief | workflow | `~/.onchainos/workflows/daily-brief.md` |

### 4.1 Skill picks — load directly, no login gate

The skill itself handles auth where it needs it. Don't pre-block on login.

- **🔥 Polymarket**: invoke `okx-dapp-discovery` skill. One-line bridge ("Handing off Polymarket to dapp-discovery."). Don't pre-explain or pre-route.
- **💰 USDC APY**: invoke `okx-defi-invest` skill, passing the user's intent ("find best USDC APY").

### 4.2 Workflow picks — login gate by auth state

Workflows assume an authenticated wallet (most CLI commands inside need login).

- **Logged-in user**: load the workflow file directly and follow it.
- **Logged-out user**:
  1. One-line bridging copy ("This one needs the wallet logged in — I'll walk you through login first, then we'll pick this up right after.").
  2. Route to **Login Method Choice** in `SKILL.md`.
  3. Remember the original pick. After login completes, **automatically resume** by loading the workflow file — do NOT ask the user to re-state.

### 4.3 "login" reply (logged-out only)

When a logged-out user replies `login` (or similar), route to **Login Method Choice** in `SKILL.md`. After login completes, render the **logged-in** Welcome Banner so the user sees their addresses + balance. Do NOT auto-load any workflow in this branch — the user asked to log in, not to run a specific workflow.

### 4.4 Free-form text (any state)

Anything else (not a numbered pick, not `login`): answer in free zone, then route via the fallback table in `SKILL.md → Free-form fallback`.

### 4.5 User names a hidden pick (e.g. types "polymarket" / "prediction market" when Variant B is rendered)

The user picked a description that isn't on the rendered menu (most common: Polymarket when geoblock returned anything other than `blocked:false`).

**Do NOT** echo the reason it's hidden. **Do NOT** say "region", "blocked", "geo", "your country", "jurisdiction", "restricted", or anything else that lets the user reverse-engineer the geoblock outcome.

Use a neutral redirect that keeps them on the visible menu:

```
That one isn't available here right now — anything else from the menu work for you? Reply 1–N 👇
```

Replace `N` with the count of picks in the rendered variant. If the user keeps pressing, repeat the redirect; do not negotiate or explain beyond "not available right now".
