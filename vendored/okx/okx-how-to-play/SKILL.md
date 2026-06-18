---
name: okx-how-to-play
description: "Onchain OS entry router for open-ended onboarding questions. Renders a welcome banner with a Quick-start menu and routes the user into the right skill or workflow (Polymarket, DeFi APY, smart-money signals, new-token screening, daily on-chain brief). Triggers: 'what is onchainos', 'what is onchain os', 'what does this do', 'what can it do', 'what can I do here', 'how do I use this', 'how do I play', 'how to use onchainos', 'how to play onchainos', 'how does this work', 'how do I start', 'getting started', 'how do I get started', 'tutorial', 'onboarding', 'first time', 'I just installed', 'now what', 'what do I do now', 'where do I start', 'who are you', 'what are you', 'introduce yourself', 'introduction', 'introduce onchainos', 'tell me about onchainos', 'I'm new'."
license: MIT
metadata:
  author: okx
  version: "3.3.13"
  homepage: "https://web3.okx.com"
---

# Onchain OS — How to Play (Entry Router)

The first-time / "I don't know what to do" entry point. Routes the user from a blank prompt into a concrete DApp workflow in ≤ 3 turns.

## Instruction Priority

Tagged blocks indicate rule severity (higher wins on conflict):

1. **`<NEVER>`** — Absolute prohibition.
2. **`<MUST>`** — Mandatory step. Skipping breaks the flow.
3. **`<SHOULD>`** — Best practice.

## Pre-flight Checks

<MUST>
> Read `../okx-agentic-wallet/_shared/preflight.md`. If that file does not exist, read `_shared/preflight.md` instead.
</MUST>

## Trigger Criteria

<MUST>
Only trigger this skill when the user message is **open-ended / guidance-seeking**. Positive examples:

- "how do I use this / what can I do / what is this / getting started"
- "I just installed it, now what?"
- "tutorial / onboarding / first time / where do I start"

Negative examples (use the matching skill instead, **not** this one):

- "check my balance" → `okx-agentic-wallet` / `okx-wallet-portfolio`
- "swap 0.1 ETH for USDC" → `okx-dex-swap`
- "what's the price of BTC" → `okx-dex-market`
- "login" alone → `okx-agentic-wallet` (but `login` as a reply *to the welcome banner* is handled inside this skill — see **Login Method Choice**)
- "search for PEPE token" → `okx-dex-token`
</MUST>

## Authoring Pattern — Free Zone vs Fixed Zone

Most user-facing copy in this flow is split into two parts:

- **Free zone** — the agent answers the user's actual question or acknowledgement first, in 1–5 sentences, contextually woven. No fixed copy. The user shouldn't feel like they hit a script.
- **Fixed zone** — the canonical English template block (welcome banner, login options, API Key heads-up). At runtime:
  - Render all natural-language prose in the user's language.
  - **Quoted reply words inside prose (e.g. `"login"`) MUST translate with their sentence.** Leaving an English quoted word inside otherwise-translated Chinese / Japanese / etc. prose is a translation bug — the quotes do NOT make the word a literal trigger.
  - Keep literal: emojis, `{placeholders}`, `1–N`, code identifiers / commands / URLs, markdown structure.

This applies to: **Welcome Banner**, **Login Method Choice**, and **API Key Login** Step 1 heads-up.

<MUST>
**Bridging is mandatory.** End the free zone with a transitional half-sentence (e.g. "let me drop the menu" / "here's where to start ↓") — never with a hard period followed by an unrelated fixed-zone line. Self-check before emitting: read the free-zone tail + first fixed-zone line as a single unit; if they feel like two separate posts pasted together, rewrite the free-zone tail.
</MUST>

## Status Check

<MUST>
Run `onchainos wallet status` **before** showing any login or welcome text. Use the `loggedIn` field to branch.
</MUST>

```
onchainos wallet status
```

- `loggedIn: false` → render the **logged-out** Welcome Banner.
- `loggedIn: true`  → render the **logged-in** Welcome Banner.

---

# Welcome Banner

<MUST>
Render the banner from `references/welcome.md` — it covers placeholders (`{evm_address}` / `{solana_address}` / `{balance}` from `wallet balance`; geoblock variant from `wallet geoblock`), the template, and pick routing (Step 4). Variant A = 5 picks (Polymarket allowed); Variant B = 4 picks (Polymarket geoblocked). Never fabricate addresses or balance.
</MUST>

---

# Login Method Choice

Reached when the user asks to log in (either by replying `login` to the logged-out banner, or by picking a workflow option from the welcome menu while logged out).

**Free zone (1–5 sentences, agent's own words):** answer whatever the user actually asked / acknowledged. If they came from a workflow pick, briefly explain that login unlocks that workflow. Then segue naturally into the fixed-zone choice below.

**Fixed zone — render the template below in the user's language**:

```
Welcome to Agentic Wallet — the Onchain OS wallet built for agents. Pick a login method:

1. 📧 Email (recommended — 30 seconds)
2. 🔑 API Key (already an OKX developer? Fastest path)

Reply 1 or 2 ↓
```

If the user replies `1` or "email" → **Email Login**.
If the user replies `2` or "API Key" → **API Key Login**.

## Email Login

Handled by `okx-agentic-wallet` skill's Authentication section. Steps:

1. Ask for email → `onchainos wallet login <email> --locale <locale>`
2. Ask for OTP code → `onchainos wallet verify <code>`
3. On success → **Post-login routing** below.

## API Key Login

Two steps total: (1) one-time heads-up so the user knows what env vars to set and where to get them, (2) run `onchainos wallet login` once they confirm.

### Step 1 — Heads-up (one-shot, fixed zone)

**Free zone (1–5 sentences):** if the user has any other question, answer it first. Then segue naturally into the heads-up.

**Fixed zone — render the template below in the user's language**:

```
You'll need to set three API Key environment variables before logging in:

1. `OKX_API_KEY` — API Key
2. `OKX_SECRET_KEY` — Secret Key
3. `OKX_PASSPHRASE` — Passphrase

You can find these at https://web3.okx.com/onchainos/dev-portal.

**Attention ⚠️:** Do not paste credentials into the chat — follow the dev-portal instructions and set them locally.
```

Then **stop and wait** for the user to confirm they're ready (e.g. "done / ok / ready").

### Step 2 — Login

Once the user confirms, run:

```
onchainos wallet login
```

On success → **Post-login routing** below. On login failure, surface the error and ask the user to verify their env vars (do NOT re-show the heads-up — they already saw it).

<NEVER>
- Do NOT accept API Key / Secret / Passphrase inline in chat. If the user pastes credentials in chat: do NOT echo, do NOT use the values, ask them to delete the message + rotate the keys + set the env vars locally instead.
- Do NOT walk the user through generating keys, opening URLs, creating `.env` files, editing `.gitignore`, or any other multi-step setup. The heads-up is one-shot — they handle their own local setup.
- Do NOT ask the user to paste the browser URL or any callback back to the CLI. The dev-portal is read-only.
</NEVER>

## Post-login routing

After login completes successfully:

- If the user came from picking a **workflow pick** while logged out: automatically load the corresponding workflow file (`~/.onchainos/workflows/<file>.md`) and follow it. Do NOT re-render the welcome banner.
- If the user came from replying `login` (or equivalent) to the logged-out banner: render the **logged-in** Welcome Banner so they see their addresses + balance.

---

# Free-form fallback

If the user types something other than a numbered pick or `login`, answer in the free zone, then route to the matching skill / workflow:

| Intent | Route to |
|---|---|
| meme sniping / pump.fun / new launches | `okx-dex-trenches` |
| follow smart money / KOL / whale | `okx-dex-signal` (or load `smart-money-signals.md`) |
| bridge / cross-chain / move tokens between chains | `okx-dex-bridge` |
| yield / earn / stake / DeFi | `okx-defi-invest` |
| is this token safe / approvals | `okx-security` |
| swap / buy / sell | `okx-dex-swap` |
| my holdings / portfolio | `okx-wallet-portfolio` |
| trading competition / join contest / competition rank | `okx-growth-competition` |
| login (free-form, not as a banner reply) | this skill's **Login Method Choice** |
| named DApp + action verb (Aave / Hyperliquid / etc.) | `okx-dapp-discovery` |

<SHOULD>
If the user picks multiple options at once, execute them in order and bookmark unused picks ("we'll come back to 4 after this").
</SHOULD>

---

## Acceptance Criteria

1. **Banner variant matches auth state** — `loggedIn: false` renders the logged-out variant (no addresses, with "login" hint); `loggedIn: true` renders the logged-in variant (addresses + balance, no hint).
2. **Skill picks load without login gate** — 🔥 / 💰 load even when logged out; each loaded skill handles its own auth.
3. **Workflow picks gate on login** — when logged out, 🐋 / 🆕 / ☕ route through Login Method Choice first, then auto-resume the workflow. User should not have to re-state their pick.
4. **Turn budget** — ≤ 3 turns end-to-end for a new user; ≤ 2 turns for a returning user picking a workflow + login.

## Notes / Non-obvious

- **Polymarket plugin is not pre-installed.** Pick 🔥 routes through `okx-dapp-discovery`, which handles plugin install + load. Don't try to load `web3-polymarket` directly.
- **Workflow files are runtime resources** — at install time they live at `~/.onchainos/workflows/`; in this repo's source they're under `workflows/`.
