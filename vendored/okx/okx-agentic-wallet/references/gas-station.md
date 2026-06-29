# Gas Station — Detailed Reference (Solana)

Gas Station enables paying gas fees with stablecoins (USDT / USDC / USDG) when the user lacks native SOL. On Solana the Relayer is the native fee payer (signature index 0); the user is the business authority signer (signature index 1). The stablecoin gas fee is collected via an SPL Token Transfer inside the same transaction — **no account upgrade, no per-chain setup, no 7702**.

**Supported gas tokens**: USDT, USDC, USDG.

**Supported scenarios**: all SPL token transfers and contract interactions (swaps, DeFi supply / borrow / redeem / claim, cross-chain bridge initiation, and any other SPL / program interaction). Native SOL transfers do NOT trigger Gas Station.

**Scope**: Gas Station state (enable flag, default gas token) is scoped to `(account, Solana)`.

---

> Read **Critical Rules** first, then dispatch via the **Outcome → render map** under **Flow**. Scene A/B/D/C/E copy, Universal Success Reply, Edge Cases, Management Commands, User Intent Recognition, Plugin Bail Recovery, and FAQ follow in order.

---

## Critical Rules

<backend-dispatch>
**Backend dispatches; Agent reacts.** The Agent does NOT manually check SOL balance or decide whether to use Gas Station. The Agent's only job is to:

1. Call `wallet send` / `wallet contract-call` as normal.
2. Read the CLI's **`scene`** discriminator (and `gasStationUsed`) and dispatch via the **Outcome → render map** below — do not re-derive the scene from raw backend fields.
3. If a Confirming response is returned, show the matching scene's verbatim product copy and ask the user to pick a token.

**Always surface Gas Station when native SOL is insufficient but a supported stablecoin has enough balance to cover transfer + gas fee** — for both a fresh transfer attempt and a "why did my transfer fail?" follow-up. This is the single most valuable suggestion the Agent can make:

- On `wallet send` success-but-insufficient-native: the backend returns a Confirming via Scene A / Scene C; CLI handles it. Present GS as the primary path, not as one of several equivalent options.
- If Gas Station is currently disabled and the user retries, the backend will return `gasStationFirstTimePrompt=true` again — follow Scene A.
- **Whenever a GS transfer is blocked because the default gas token has insufficient balance and the account holds another stablecoin on the same chain**: propose switching the gas token before any other fallback. Switching via Scene C is zero-cost — prefer it over "reduce transfer amount" or "top up default token".
</backend-dispatch>

<phase-call-prohibitions>
- **NEVER pass `--gas-token-address`, `--relayer-id`, or `--enable-gas-station` on the FIRST call** to `wallet send` / `wallet contract-call`. These are only for the second-phase call after the user has chosen a token from a Confirming response.
- **NEVER fabricate token addresses or relayer IDs** — always use the exact values from the Confirming response's `next` field (which contains the tokenList JSON).
- **NEVER proactively push Gas Station as a feature** when the user is just browsing or asking unrelated questions.
- **NEVER tell the user Gas Station is "free"** — there is a service charge paid in the selected stablecoin. Always display the `serviceCharge` + `serviceChargeSymbol` when present.
- **NEVER expose implementation detail to the user** — see "User Intent Recognition" section below for the authoritative output-vocabulary ban list. User-facing text is only about "enable / disable Gas Station" and "which stablecoin to pay Gas".
- **NEVER allow Gas Station with Jito Bundler** — Jito Bundler transactions are a HARD BLOCK. See "Edge Cases — Jito Bundler".
</phase-call-prohibitions>

<output-discipline>
**Template rendering & translation fidelity** (applies to every Scene / Edge Case / FAQ template in this file — per-Scene blocks reference this rule and do not restate it). All user-facing copy here is product copy: render the template body verbatim, substituting only the bracketed slots. When the user's language is not English, translate at output time while preserving structure and meaning, and:

- Keep every sentence and every fact; never drop a clause (e.g. "now set as the default Gas token", "you can change the default at any time").
- Never substitute a chain-specific noun: render "Solana" as-is — never replace it with "ETH / BNB / the native token" or any other chain's token. This is the Solana flow.
- No leading setup line ("Sure, let me…") and no trailing notes / tips / follow-up questions beyond what the template contains.
</output-discipline>

---

## Flow (integrated into `wallet send` / `wallet contract-call`)

Gas Station is **not** a separate command — the **backend** decides per-request whether to dispatch it inside the `wallet send` / `wallet contract-call` response. When dispatched, the flow uses the standard **Confirming Response** pattern (exit code 2) for first-time activation / token-switch cases (Scene A / C), and the silent auto-path when a default token is already pinned (Scene B / D).

The CLI tags each response with a machine-readable `scene` discriminator; dispatch via the **Outcome → render map** below. On a Confirming, render the matching Scene and ask the user to pick a token.

**Token priority** (for ordering the token list shown to the user, and for backend auto-selection): by **balance descending**; on ties, **USDT > USDC > USDG**.

### Outcome → render map

The CLI returns a machine-readable **`scene`** discriminator — on `confirming` responses and on the `gs_pending_tx` / `gs_insufficient_all` success states. **Map `scene` directly to the fixed copy below; do NOT re-derive the scene from raw backend fields, and do NOT author copy yourself.** On a Confirming, the response `next` field carries the exact re-run command for after the user consents.

| CLI `scene` | Render (fixed copy below) | Then |
|---|---|---|
| `gs_first_time` | **Scene A** | Get consent + token pick → follow `next` (re-run `wallet send --enable-gas-station --gas-token-address <pick> --relayer-id <pick>`). On success → Scene A post-success two-step. |
| `gs_reenable` | **Scene A** (re-enable variant — user previously disabled) | Same as `gs_first_time`; backend overwrites the previous default with the picked token. |
| `gs_token_switch` | **Scene C** | Get choice 1 / 2 / 3 → follow `next`. On success → Scene C post-success echo. |
| `gs_insufficient_all` | **Scene E** | Bail. Do NOT re-run. |
| `gs_pending_tx` | **Edge Case 4** (`gas-station-edge.md`) | Bail. Do NOT auto-retry. |
| success + `gasStationUsed=true` (no `scene`) | **Universal Gas Station Success Reply** | — |

Edge cases the CLI does NOT tag with a `scene` (Jito hard-block, tx-cap exceeded, async-hash, native-SOL) are Agent-detected — see **Edge Cases**.

---

## Scene A — Not enabled yet, native SOL insufficient, has sufficient stablecoin

User has not enabled Gas Station; backend returns `gasStationFirstTimePrompt=true` + `gasStationTokenList` (with at least one `sufficient=true` entry; if none, route is Scene E instead).

<scene-a-product-copy>
**User-facing template (Scene A).** Render per the top-level `<output-discipline>` rule (verbatim, substitute bracketed slots only). The body below is the source of truth.

```
Your SOL balance is not enough to pay Gas. Two ways to proceed:

1. Top up SOL and pay with the native token.
2. Enable "Gas Station" and pay Gas directly with a stablecoin.

About Gas Station: Gas Station aggregates third-party services, automatically compares rates and picks the cheapest one to cover Gas on your behalf. It accepts USDT, USDC, or USDG — you do not need to hold Solana. Learn more: https://web3.okx.com/learn/wallet-gas-station

- Once enabled, whenever the native token is insufficient, the system will automatically pay Gas with the stablecoin — no manual confirmation needed.
- By default the token with the highest balance is used; you can also pin a specific token as the default for every transaction. Tokens supported on this chain: USDT, USDC, USDG.

Confirm enabling Gas Station and paying this transaction's Gas with stablecoin?
```

**Never** modify the template body. Never drop the academy link. Never drop the two bullets. Never drop the "Tokens supported on this chain" line. Never reduce the prompt to a bare "yes/no?" without the education paragraph. (Translation fidelity — including the "you do not need to hold Solana" wording — is governed by the top-level "Template rendering & translation fidelity" rule in Critical Rules.)
</scene-a-product-copy>

**Consent** — the user picks a stablecoin (or declines). On a pick → follow the response `next` (re-run with that token's `--gas-token-address` + `--relayer-id`; if the user confirmed without naming one, use the highest-balance sufficient token). On decline → do NOT re-run; tell them to top up SOL at `{fromAddr}` and terminate. Ambiguous wording or a token not in the list → re-prompt once, never guess.

**Post-success flow (Scene A — MANDATORY two-step finalization)**

<scene-a-post-success>
After the Phase-2 `wallet send` / `wallet contract-call` succeeds in Scene A (broadcast OK, `orderId` returned), the Agent MUST run the following two steps **in order**, on **every** Scene A trigger — not just the literal first-ever activation. Users may have previously disabled GS; do NOT skip Step 1 on that basis.

**Step 1 — Pin the used token as the chain's default gas token.**

Resolve `{chosen_token_address}` from the broadcast response (`serviceChargeFeeTokenAddress`; if absent, use the `--gas-token-address` the Agent passed in Phase 2). Then call exactly once:

```
onchainos wallet gas-station update-default-token --chain solana --gas-token-address {chosen_token_address}
```

This call is silent — do not surface its output, do not narrate it. Treat any non-zero exit as a soft failure and continue to Step 2.

**Step 2 — Echo the success reply.** Render this template per the top-level "Template rendering & translation fidelity" rule (verbatim, every sentence kept — in particular do not drop "now set as the default Gas token" or "You can change the default Gas token at any time"):

```
Gas Station enabled. This transaction will pay Gas with {chosen_token}, and {chosen_token} is now set as the default Gas token. Whenever the native token is insufficient from now on, {chosen_token} will be used automatically — no further confirmation needed. You can change the default Gas token at any time.
```

`{chosen_token}` = the stablecoin symbol (USDT / USDC / USDG) actually used in this transaction. All occurrences refer to the same token.

Then append the **Universal Gas Station Success Reply** (network fee + orderId + check-order prompt — see "Universal Gas Station Success Reply" section below).
</scene-a-post-success>

---

## Scene B / D — Silent auto-path

Backend returns `gasStationUsed=true` + `autoSelectedToken=true` + `hash` non-empty. CLI **silently** completes Phase 2 (sign + broadcast). Two triggers fall into this path:

- **Scene B**: a `defaultGasTokenAddress` is set and that token is sufficient — backend reuses it.
- **Scene D**: no default is set, but exactly one stablecoin is sufficient — backend auto-selects it (priority: balance desc, tie-break USDT > USDC > USDG). PRD specifies "do not prompt the user" here; complete the transaction silently without asking about default-pinning.

**Agent user-facing reply**: no Gas Station prompt. Just the **Universal Gas Station Success Reply** (network fee + orderId + check-order prompt). For Scene D, add a one-line note that the auto-selected token was used.

---

## Scene C — Already enabled, default token insufficient

Backend returns `gasStationUsed=true` + `hash` empty + `gasStationFirstTimePrompt=false` + `insufficientAll=false`, with `gasStationTokenList` showing the default token as `sufficient=false` and at least one alternative as `sufficient=true`. CLI returns Confirming.

<scene-c-product-copy>
**User-facing template (Scene C).** Render per `<output-discipline>`; substitute slots only.

```
The default Gas token {prev_token} has insufficient balance (need ${serviceChargeUsd}, current balance ${prev_balance_usd}).
The following stablecoins in your account have enough balance to pay this transaction's Gas:

- {alt_token_1} (balance ${alt_balance_1_usd})
- {alt_token_2} (balance ${alt_balance_2_usd})

How would you like to proceed?
1. Change the default Gas token to {alt_token_X} and use it for this transaction (this chain will default to {alt_token_X} going forward).
2. Use {alt_token_X} for this transaction only; keep the default as {prev_token}.
3. Top up {prev_token} and continue using it.
```

Slot fills:
- `{prev_token}` = symbol of the token at `defaultGasTokenAddress`
- `{serviceChargeUsd}` = required gas in USD; `{prev_balance_usd}` = current balance of default token in USD
- `{alt_token_N}` + `{alt_balance_N_usd}` = each `sufficient=true` entry in `gasStationTokenList` other than the default (omit the default; include all sufficient alternatives in token-priority order)
- `{alt_token_X}` placeholders in choices 1/2 = if exactly one alternative is sufficient, hard-code its symbol; if multiple, render as `<your-pick>` and let the user name the token in their reply.

Always include all three choice lines. Always include the "Top up {prev_token}" fallback. Do NOT prepend a setup line ("Sure, let me check…"). Do NOT append any follow-up question — choices 1 / 2 / 3 ARE the prompt.
</scene-c-product-copy>

**User response parsing**

| User intent | Interpretation | CLI action |
|---|---|---|
| Picks choice **1** — wants to use the alt token AND make it the new default | Use alt token for this tx **and** replace the chain default | Re-run the original `wallet send` / `wallet contract-call` with `--gas-token-address <alt_addr> --relayer-id <alt_relayer_id>`. After the broadcast succeeds, **silently** call `onchainos wallet gas-station update-default-token --chain solana --gas-token-address <alt_addr>`. Use the "Scene C — replace default" post-success echo. |
| Picks choice **2** — alt token for this transaction only, keep current default | Use alt token for this tx only, keep current default | Re-run with `--gas-token-address <alt_addr> --relayer-id <alt_relayer_id>` only (no `--enable-gas-station`, **no follow-up `update-default-token`**). Use the "Scene C — keep default unchanged" post-success echo. |
| Picks choice **3** — wants to top up the original default token, or cancels | Decline; will top up default | Do NOT re-run. Tell user to top up at `{fromAddr}` and retry. Terminate. |
| Ambiguous / names a token not in the list / picks an alt token without saying whether to change default | Re-prompt once | Ask explicitly whether to change the default Gas token to the picked alt — yes → choice 1, no → choice 2. Do NOT guess. |

**Post-success echo templates (Scene C)** — render per `<output-discipline>`

<scene-c-post-success>
After the broadcast succeeds, use one of the two templates per `<output-discipline>`:

**Scene C — keep default unchanged**

```
Done — this transaction will pay Gas with {chosen_token}. The default token remains {prev_token}, unchanged.
```

**Scene C — replace default**

```
Done — this transaction will pay Gas with {chosen_token}, and the default Gas token is now {chosen_token}.
```

Follow this echo with the **Universal Gas Station Success Reply** for network fee + orderId.
</scene-c-post-success>

---

## Scene E — All stablecoins insufficient

Backend returns `gasStationUsed=true` + `insufficientAll=true` + all `gasStationTokenList` entries with `sufficient=false` + `fromAddr`. CLI bails (do NOT proceed).

<scene-e-product-copy>
**User-facing template (Scene E).** Render per `<output-discipline>`; substitute the one slot.

```
You don't have enough balance to pay Gas. Please top up first:
  Top-up address: {fromAddr}
  Accepted tokens: SOL, USDT, USDC
```

Slot fills: `{fromAddr}` = user's Solana address from the response.

Do NOT proceed with the original transaction. Do NOT propose Gas Station — none of the stablecoins are sufficient.
</scene-e-product-copy>

---

## Universal Gas Station Success Reply (applies to ALL commands)

Whenever **any** transaction is paid via Gas Station on Solana — regardless of which command triggered it (`wallet send`, `wallet contract-call`, `swap`, `bridge`, any DeFi plugin) — the Agent's user-facing reply MUST include the four elements below. Detecting that Gas Station was used: the response contains `gasStationUsed=true` or a non-empty `serviceCharge` + `serviceChargeSymbol` pair (or the preceding CLI invocation carried `--enable-gas-station` / `--gas-token-address`).

<universal-success-reply>
After any successful Gas Station broadcast, the reply MUST contain all four elements:

1. **Gas Station acknowledgment** — state plainly that this transaction's gas was paid via Gas Station with a stablecoin, not with SOL. Never imply the transaction was "free".
2. **Service charge (stablecoin amount + USD equivalent)** — show both the raw amount + symbol (`{serviceCharge} {serviceChargeSymbol}`) and the USD equivalent. Example: `Network fee: 0.8 USDC (≈ $0.80, paid via Gas Station)`.
3. **orderId** — copy verbatim from the broadcast response. Never omit it, never truncate it.
4. **Natural-language follow-up prompt** — an exact sentence the user can type back in this chat to get the final status. Template: `You can tell me: **check order {orderId}** to check the status.` Translate to the user's language at output time, but keep the literal `check order {orderId}` idiom unchanged so the Agent can recognize the user's reply later.

**`networkFeeLabel` field handling (hard rule, applies to every GS-related render — success reply / order detail / history list / etc.):**
- When the CLI output (broadcast response, `wallet history`, order detail) contains a `networkFeeLabel` string (either `Network fee` or `Network fee and Rent fee`), that string **IS the label** of the network-fee row — render exactly ONE row using it as the row title. Example: `Network fee and Rent fee: 0.157385 USDC (≈ $0.16, paid via Gas Station)`. Translate the label to the user's language per the global locale rule.
- Do NOT render `networkFeeLabel` as a separate row (e.g. a second "fee description" row).
- Do NOT add a default `Gas fee` / `Network fee` title alongside it — `networkFeeLabel` replaces it.
- When `networkFeeLabel` is absent in the CLI output, fall back to the default label `Network fee`.

**When `txHash` is empty** (Relayer returns hash asynchronously — almost always empty on first response): additionally state that the transaction has been submitted and the on-chain hash will be returned asynchronously by the Relayer, ask the user to check again shortly.

**NEVER** in this reply:
- Do NOT show raw CLI commands (`onchainos wallet history ...`, etc.) — the user must not be sent to a terminal.
- Do NOT fabricate a `txHash` when it's empty — only show it once returned.
- Do NOT call Gas Station "free" or hide the service charge.
</universal-success-reply>

### Example reply

The same four-element structure applies regardless of which command triggered the Gas Station broadcast (`wallet send`, `wallet contract-call`, `swap`, `bridge`, any DeFi plugin) — only the leading action line changes (e.g. `Sent 100 USDC to CYXWm...`, `Deposited 0.01 USDT into Kamino.`):

```
Sent 100 USDC to CYXWm...

- Network fee: 0.8 USDC (≈ $0.80, paid via Gas Station)
- orderId: ord_ghi789rst
- txHash: submitted, on-chain hash will be returned asynchronously by the Relayer — check again shortly.

You can tell me: **check order ord_ghi789rst** to check the status.
```

### Checking the order later

When the user replies with any wording meaning "check order {orderId}" or "what's the status of my last transaction" (in any language), the Agent runs `wallet history --chain solana --order-id <orderId>` internally (NOT shown to user) and relays:
- **Completed**: final `txHash`, on-chain status, final gas fee (may differ slightly from estimate).
- **Still pending**: tell the user it's still processing and to ask again shortly.
- **Failed / timed out**: explain "funds are intact" (GS broadcast is atomic — failure means stablecoin was not deducted), propose retry or native-gas fallback.

---

## Edge Cases

> **Load `references/gas-station-edge.md`** when one of these triggers fires; render its templates per `<output-discipline>`. (`gs_pending_tx` / `gs_insufficient_all` also arrive as a CLI `scene` — dispatch via the Outcome → render map.)

| # | Edge case | Trigger |
|---|---|---|
| 1 | Tx cap exceeded (100,000 U) | user asks whether stablecoins can pay gas on a >100k tx |
| 2 | Jito Bundler HARD BLOCK | user wants Jito Bundle + stablecoin gas |
| 3 | txHash not yet returned | user asks for the hash before the Relayer publishes it |
| 4 | Pending GS tx blocking | CLI `scene: gs_pending_tx` |
| 5 | Native SOL transfer | user sends native SOL (GS does not apply) |
| 6 | History display rules | listing / detailing a GS tx in `wallet history` |
| 8 | Tx type not supported | `wallet send` / `contract-call` bails "does not support this transaction type" (e.g. deposit / staking via a plugin) |

---

## Management Commands

For command syntax and parameters (`gas-station enable` / `disable` / `update-default-token`, all `--chain solana`), see `references/cli-reference.md` → "D-GS. Gas Station Management Commands". This section only owns the user-facing reply wording below.

### User-Facing Reply Templates (Management Commands)

Translate to the user's language at output time; the semantic content must not drift.

**Before running `wallet gas-station disable` (confirmation prompt)**

> "Once disabled, transactions on Solana will pay Gas with SOL again. You can re-enable any time. If you only want to switch the Gas-payment token, use 'change default Gas token' instead of disabling. Confirm disabling?"

**After any management command succeeds** (`enable` / `disable` / `update-default-token`)

> Render `data.message` verbatim (the CLI fills the success copy, incl. the token symbol for `update-default-token`). Translate per the global locale rule.

---

## User Intent Recognition

Users may express Gas Station-related needs in various ways and in any language. The Agent should recognize the **semantic intent** and respond using the sanctioned vocabulary (templates in this file). Per the global locale rule in `SKILL.md`, translate to the user's language at output time.

<output-vocabulary>
**Agent output vocabulary (authoritative)**: refer to the feature only as "Gas Station" and to the choice only as "which stablecoin to pay gas".

**Never surface** in user-facing replies:
- Internal field names: `gasStationFirstTimePrompt`, `gasStationUsed`, `autoSelectedToken`, `hasPendingTx`, `insufficientAll`, `signType`, `multiSignerTx`, `unsignedInfo`, `Phase 1` / `Phase 2`, `DB flag`.
- Error codes: any numeric code.
- Debug references: debug flags, log file paths, audit log paths.

Users may **input** any equivalent phrasing in any language — recognize the intent, but respond using only the sanctioned vocabulary.
</output-vocabulary>

| User intent | Action |
|---|---|
| Wants to send but lacks SOL (any wording in any language) | Proceed with `wallet send` — Gas Station activates automatically. |
| Asks whether stablecoins can pay Gas (capability question) | Explain Gas Station briefly (use `gas-station-faq.md` verbatim), then proceed with the transaction if the user provides one. |
| Any Gas Station FAQ — what it is / how it works / fees / supported tokens / which scenarios don't trigger / why a small amount of SOL was received | Answer from `gas-station-faq.md` — verbatim (pick the matching Q). |
| Wants to change the default Gas token | Call `wallet gas-station update-default-token --chain solana --gas-token-address <addr>`. |
| Wants to enable Gas Station | Call `wallet gas-station enable --chain solana`. Use the confirmation and success templates above. |
| Wants to disable Gas Station, or stop paying Gas with stablecoin | Call `wallet gas-station disable --chain solana`. Use the confirmation and success templates above. If the user only wants to change the gas-payment token, suggest `update-default-token` instead. |
| Wants to use Jito Bundle together with stablecoin Gas | Conflicting intent (hard block). Render Edge Case 2 (Jito Bundler) from `gas-station-edge.md`. |
| Asks which transaction types Gas Station supports (capability question) | Answer from `gas-station-faq.md` → "Which transaction types does Gas Station support?" — verbatim (transfers + swaps). |
| Transaction blocked because its type is not supported by Gas Station (`wallet send` / `contract-call` bails "does not support this transaction type") | Render **Edge Case 8** from `gas-station-edge.md`. Bail — do NOT re-run via Gas Station. |
| Asks why Gas Station did not kick in for this transaction (blocked-scenario inquiry) | Check: pending tx? amount over 100,000 U? Jito Bundle? native SOL transfer? unsupported tx type (deposit / staking)? Respond with the matching verbatim template. |
| Asks for the just-broadcast tx hash (not yet returned), or why its hash is slower than other transactions | Render Edge Case 3 (and its follow-up) from `gas-station-edge.md`. |

---

## Plugin Bail Recovery

Third-party plugins like `kamino-plugin`, `raydium-plugin`, etc., invoke `onchainos wallet contract-call` as a subprocess. When the CLI emits a Confirming response (exit code 2, `"confirming": true` in stdout) for Scene A / Scene C, the plugin's subprocess wrapper typically treats non-zero exit as a failure and bails out of its own flow. The **Agent** can catch this, resolve the Gas Station setup, and re-invoke the **same plugin command** — the plugin will re-organize its calldata from scratch and this time CLI will hit the auto path.

### When does this pattern trigger

The Agent detects a plugin bail with a **structured Confirming in stdout**:

```
Error: <plugin step> failed
Caused by: onchainos exited with status 2: stderr=... stdout={"confirming": true, "scene": "...", "message": "...", "next": "..."}
```

Markers:
- Exit code **2** (non-zero, subprocess marked as failure)
- stdout contains a JSON with `"confirming": true`

If these match → a recoverable Gas Station Confirming, not a real failure.

### Recovery

Read the `scene` field from the stdout JSON and dispatch via the **Outcome → render map** above (render that scene's copy, get consent where required, run any management command it calls for — e.g. `update-default-token` on a Scene C replace-default pick), then re-invoke the **same plugin command verbatim**. The plugin re-builds its calldata and this time the CLI hits the auto path. `gs_insufficient_all` / `gs_pending_tx` → do NOT retry.

<plugin-recovery-rules>
- Always parse the Confirming JSON structure (exit code 2 + `"confirming": true` in stdout) before deciding it's recoverable. Real failures return different structures.
- Always ask user consent for Scene A and Scene C token-selection — CLI refuses to decide these silently on purpose.
- Do NOT retry Scene E (insufficientAll) or Edge Case 4 (hasPendingTx) — these require external action.
- Re-invoke the same plugin command verbatim after recovery. Do not reconstruct or replicate the plugin's internal calldata by hand — the bail is pre-broadcast, so re-running is idempotent.
</plugin-recovery-rules>

---

## FAQ

> **Load `references/gas-station-faq.md`** when the user asks a Gas Station FAQ — what it is / how it works / fees / supported networks-tokens / which scenarios don't trigger. Answers are verbatim user-facing templates; render per `<output-discipline>`.
