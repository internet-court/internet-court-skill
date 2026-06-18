---
name: okx-dex-strategy
description: "Limit-order strategy trading on OKX Agentic Wallet. Use this skill when the user wants to place a price-triggered limit order (buy a dip, take profit, stop loss, chase a high), cancel one or more pending orders, list active or historical orders, or resume orders that have been suspended by SA TEE upgrades. Distinct from okx-dex-swap (market orders, immediate execution at the best available aggregated price). Strategy orders are stored on the Agentic Wallet TEE and execute automatically when the user-defined trigger fires. Trigger phrases: limit order, place limit order, buy at price, sell when price reaches, take profit at, stop loss at, chase high, buy dip, cancel order, cancel all orders, my orders, list orders, active orders, suspended orders, resume orders, recover suspended orders, trader mode, agentic limit order."
license: MIT
metadata:
  author: okx
  version: "3.3.13"
  homepage: "https://web3.okx.com"
---

# Onchain OS DEX Strategy

4 subcommands that wrap the Agentic Wallet limit-order surface — `create-limit`, `cancel`, `list`, `resume`. SA activation (Trader Mode upgrade / re-upgrade) is performed transparently by the CLI when the BE returns `UPGRADE_REQUIRED`; the skill does not need to expose that detail.

## Pre-flight Checks

> Read `../okx-agentic-wallet/_shared/preflight.md`. If that file does not exist, fall back to `_shared/preflight.md`. Strategy endpoints require an authenticated Agentic Wallet session — confirm login before running any subcommand.

## Display labels & output language (single source of truth)

This section is the **canonical rule** for user-facing strings. Every other section in this skill defers to it.

**Canonical Display labels** — the only strings the agent may surface to the user. The CLI returns these directly (`statusLabel`) for `status`; for `strategyType` the agent looks them up from the §`strategyType` and §`status` tables below.

| Surface | Canonical EN Display labels |
|---|---|
| `strategyType` (4 values) | `Buy Dip` / `Take Profit` / `Stop Loss` / `Buy Above` |
| `status` (9 values) | `Expired` / `Cancelling` / `Cancelled` / `Failed` / `Trading` / `Completed` / `Creating` / `Active` / `Suspended` |

**Translation rule** — match the user's conversation language. Display labels above are canonical English. When the user converses in another language, the agent translates the label at output time to match the conversation language.

**Never** (these rules apply everywhere in this skill):
- mix two languages in one label (pick one — never render the English label and a translation side by side),
- expose the underlying **enum name** (`BUY_DIP`, `CHASE_HIGH`, `COMPLETED`, …) to the user,
- expose the underlying **CLI flag value** (`buy_dip`, `chase_high`, `completed`, `cancelled`, …) to the user,
- pass through the CLI's raw `statusLabel` verbatim when the user is conversing in a non-English language — translate it.

**Notes:**
- CHASE_HIGH renders as **`Buy Above`** in English (not "Chase High").
- SPEEDING_UP (-4) is not a valid filter or display value.

## Boundary vs `okx-dex-swap`

| User intent | Skill |
|---|---|
| "Swap X for Y now" / "Buy 0.5 ETH with USDC" | `okx-dex-swap` (market order, immediate execution) |
| "Buy ETH if it dips to $2000" / "Sell when ETH hits $5000" / "Take profit at X" / "Stop loss at Y" | this skill (price-triggered limit order) |
| "Cancel my pending order" | this skill |
| "What limit orders do I have?" | this skill |

If the venue is named explicitly (Uniswap, PancakeSwap, Raydium, Curve, ...) → re-route to `okx-dapp-discovery`. This skill is for OKX-aggregated limit orders only.

## Command Index

### 1. `onchainos strategy create-limit`

Place a single price-triggered limit order.

```
onchainos strategy create-limit \
  --chain-id <id|alias> \
  --from-token <address> \
  --to-token <address> \
  --amount <decimal-string> \
  --direction <buy|sell> \
  --trigger-price <usd> \
  [--current-price <usd>] \
  [--slippage <value>] \
  [--mev-protection <on|off|default>] \
  [--expires-in <secs>]
```

| Flag | Required | Notes |
|---|---|---|
| `--chain-id` | Y | Chain id or alias: `1`, `solana`, `bsc`, `arbitrum`, `base`, `xlayer` |
| `--from-token` | Y | Sell-side token contract address |
| `--to-token` | Y | Buy-side token contract address |
| `--amount` | Y | Amount of `from_token` to sell (string, no precision loss) |
| `--direction` | Y | `buy` or `sell` (case-insensitive). Strategy type is derived from `--direction` + `--trigger-price` + the current market price; the agent does **not** pass a strategy type explicitly. |
| `--trigger-price` | Y | USD trigger price. Required for strategy type derivation. |
| `--current-price` | N | Current USD price of the comparison token (to-token for `buy`, from-token for `sell`). When omitted the CLI fetches it via `market price`. Pass it to skip the extra HTTP round-trip when the agent already retrieved the price for the confirmation page. |
| `--slippage` | N | Slippage in **percent**. Default `15`. Pass the percent as a plain number (`slippage 20%` → `--slippage 20`). Note `0.05` = 0.05%, NOT 5% — for 5% pass `--slippage 5`. |
| `--mev-protection` | N | Tri-state `on` / `off` / `default` (default = `default`; `default` = BE picks). |
| `--expires-in` | N | Order TTL in seconds. Default 604800 (7 days) — see §Default order expiry. |

**Output (JSON, always — the CLI has no human-format mode):**
```json
{
  "ok": true,
  "data": {
    "orderId": "<id>",
    "status": <int>,
    "statusLabel": "<label>",
    "estimatedWaitTime": <int|null>,
    "eventCursor": "<string|null>"
  }
}
```

**Solana orders return `estimatedWaitTime=0`** — the order is queryable immediately; for all other chains the agent follows §Async wait pattern (fixed 3-second sleep before re-querying).

#### Default order expiry

BE default = **7 days** (`604800` seconds). All other "7 days" mentions in this skill derive from here.

#### Supported chains

Strategy orders are only supported on these 6 chains. Any other chain MUST be rejected upfront by the agent — do not call `create-limit` and do not even open the Step 1 confirmation.

| chainIndex | Name | `--chain-id` aliases |
|---|---|---|
| 1 | Ethereum | `ethereum`, `eth`, `1` |
| 56 | BSC | `bsc`, `56` |
| 196 | X Layer | `xlayer`, `196` |
| 501 | Solana | `solana`, `sol`, `501` |
| 8453 | Base | `base`, `8453` |
| 42161 | Arbitrum | `arbitrum`, `arb`, `42161` |

**Pre-flight rule (agent)**: when the user mentions a chain, resolve it to its chainIndex and check this list. If the chain is **not** in the table (e.g. Polygon `137`, Optimism `10`, Avalanche `43114`, Linea `59144`, Sui `784`, Tron `195`, ...), respond directly with:

> Strategy orders are only supported on Ethereum / BSC / X Layer / Solana / Base / Arbitrum right now. `<requested chain>` is not supported — pick one of these to continue.

Do NOT proceed to Step 1 confirmation. Do NOT call the CLI. The CLI also defends against this (validates against the same 6-chain whitelist before BE), but the agent catching it earlier saves a round trip and gives a clearer message tied to the user's exact phrasing.

#### `strategyType` enum + derivation

`strategyType` is **fully derived inside the CLI** from `(--direction, --trigger-price, current market price)` — there is no `--type` flag and the agent never passes or computes the integer. This single table covers both uses: deriving the **Display label** for the Step 1 confirmation page, and mapping the `strategyType` integer in `list` responses back to a Display label. The Display label is the only user-facing string (see §Display labels & output language).

| strategyType (int) | Enum name | Direction | trigger vs current | Display label | Semantics |
|---|---|---|---|---|---|
| 2 | BUY_DIP | buy | trigger < current | Buy Dip | Buy when price falls to trigger |
| 5 | CHASE_HIGH | buy | trigger ≥ current | Buy Above | Buy when price rises above trigger |
| 3 | TAKE_PROFIT | sell | trigger > current | Take Profit | Sell when price rises to trigger |
| 4 | STOP_LOSS | sell | trigger ≤ current | Stop Loss | Sell when price falls to trigger |

Equality folds into the aggressive side (CHASE_HIGH / STOP_LOSS), matching the CLI.

**Agent flow:**

1. **Parse direction (buy / sell)** from user intent ("buy" / "ape in" / "snap up" → buy; "sell" / "take profit" / "stop loss" / "exit" → sell). Passed verbatim as `--direction <buy|sell>`.
2. **Fetch current price** — call `onchainos market price --chain <chain> --address <token>`, read `data[0].price`. For BUY direction query the **to-token**'s current price; for SELL direction query the **from-token**'s current price. The agent needs this for (a) Step 0 USD-value pre-flight, (b) the Step 1 confirmation page "Trigger Price vs current", and (c) computing the Display label per the table above.
3. **Pass `--current-price <usd>` to the CLI** so it does not re-fetch. (If the agent omits it, the CLI fetches the same value itself — correct but one extra round-trip.)

#### Two-step confirmation flow (Agent must follow)

`create-limit` is a write operation. **The agent MUST present a confirmation summary to the user first and only call the CLI after the user explicitly confirms.** The CLI itself does not gate (it calls BE directly); this contract is enforced at the skill layer.

**Step 0 — Minimum order value pre-flight (must run before Step 1):**

BE enforces a minimum order value of **$1 USD** (returns error `100010 ORDER_AMOUNT_TOO_SMALL` otherwise). To avoid wasting a round-trip and a confirmation page on an amount that BE will reject, the agent MUST verify the from-side USD value first.

1. **Fetch the from-token price (USD):**
   - If from-token is a well-known stablecoin (USDT / USDC / USDG / USDe / DAI / FDUSD / ...): assume `from_price ≈ 1.0` without an HTTP call.
   - Otherwise: call `onchainos market price --chain <chain> --address <from_token>`, read `data[0].price` as `from_price`.
2. **Compute USD value:** `usd_value = from_amount × from_price`.
3. **If `usd_value < 1.0`:**
   - Compute `min_from_amount = ceil(1.0 ÷ from_price)` rounded up to a reasonable display precision for the token (e.g. whole units when `from_price ≥ 0.1`; 2-4 significant digits otherwise).
   - Surface **exactly this single canonical line** to the user, with **no extra prose** — no USD-value math, no $1 threshold mention, no echo of the user's original amount, no follow-up sentence, no apology:

     `Minimum order amount: <min_from_amount> <from_symbol>`

     Translate the prefix at output time per §Display labels & output language (e.g. for a Chinese user the agent renders the same fact in Chinese). The structure stays single-line: `<localised prefix> <min_from_amount> <from_symbol>`.
   - **STOP. Do NOT render Step 1. Do NOT call the CLI.** Wait for the user to provide a larger `--amount`, then re-run Step 0 from the top.
4. **If `usd_value ≥ 1.0`:** carry `from_price` forward (Step 1's "Value" column reuses it; no need to re-fetch) and proceed to Step 1.

**Example** (user wants to spend 1 OKB on a chain where OKB ≈ $0.10):
- `from_price = 0.10`, `usd_value = 1 × 0.10 = 0.10 < 1.0` → fail
- `min_from_amount = ceil(1.0 / 0.10) = 10`
- Output: `Minimum order amount: 10 OKB`
- Stop. No Step 1, no extra prose.

**Step 1 — Show the order summary for the user to confirm.** Five top-level categories with sub-items; the agent may freely organise prose at runtime, but **no category may be dropped**:

| # | Category | Sub-items | Source |
|---|---|---|---|
| 1 | Chain | — | Human-readable chain name resolved from `--chain-id` (Arbitrum / BSC / Solana / ...) |
| 2 | Order Type | Display label per the §`strategyType` table (`Buy Dip` / `Take Profit` / `Stop Loss` / `Buy Above`) — translate per §Display labels & output language | Derived per "Strategy type derivation" above |
| 3 | From token | Symbol (e.g. `USDC`); Amount (e.g. `10`) | Symbol from token metadata; Amount is raw `--amount` value |
| 4 | To token | Symbol (e.g. `ARB`); Trigger Price (e.g. `$0.10`, USD-denominated); Estimated Amount (predicted to-token amount); Value (estimated USD value) | Symbol/Trigger Price direct; Estimated Amount and Value computed by the agent — see formulas below |
| 5 | Slippage | Either `Default 15%` (user did not mention slippage) or `User-specified X%` (user explicitly said "slippage X%") | See Slippage display rules below |

**Estimated Amount / Value formulas:**

- Buy direction (BUY_DIP / CHASE_HIGH):
  - `Estimated Amount` = `from_amount` ÷ `trigger_price` (in units of to-token)
  - `Value` = `from_amount` × `from_token_USD_price` (if from is a stablecoin, ≈ `from_amount`)
- Sell direction (TAKE_PROFIT / STOP_LOSS):
  - `Estimated Amount` = `from_amount` × `trigger_price` (in units of to-token, usually a stablecoin)
  - `Value` = `from_amount` × `trigger_price` (if to is a stablecoin, equals Estimated Amount)

**Slippage display rules:**

- User did **NOT** mention slippage in the conversation → display `Slippage: Default 15%`, and **omit `--slippage`** on the CLI call (the CLI default is 15).
- User explicitly said "slippage X%" / "use X% slippage" / similar → display `Slippage: User-specified X%`, and pass `--slippage X` on the CLI call.

**Structural example** (display labels come from the §`strategyType` / §`status` tables; see §Display labels & output language for the cross-cutting rule):

```
1. Chain: Arbitrum
2. Order Type: Buy Dip
3. From: USDC 10
4. To:
   - Symbol: ARB
   - Trigger Price: $0.10
   - Estimated Amount: 100 ARB
   - Value: $10
5. Slippage: 15% (default)

If the trigger condition is not met within 7 days, this order auto-expires.

Reply confirm / change / cancel.
```

**Expiry note (mandatory)**: After the 5 categories and before the reply prompt, the agent must surface that the limit order auto-expires 7 days after creation if the trigger never fires. Default phrasing: `If the trigger condition is not met within 7 days, this order auto-expires.`

**Step 2 — Handle the user's reply:**

- User says "confirm" / "yes" / "submit" → call `onchainos strategy create-limit ...`.
- User says "change amount = 5" / "set trigger to 0.08" / similar → update the corresponding field and **re-render Step 1** for another confirmation.
- User says "cancel" / "abort" → do NOT call the CLI; acknowledge that the order was discarded.

> Hard constraints:
> 1. **Never call `strategy create-limit` until the user has explicitly confirmed.**
> 2. `Estimated Amount` / `Value` are agent-side estimates derived from `trigger_price`, **not** BE quotes. The realised fill amount is decided at BE execution time by slippage and aggregator routing; the agent must not present these estimates as "actual fill amounts".
> 3. `--trigger-price` is a USD price. The agent must make this clear to the user to avoid confusion with "exchange rate = X from-token per 1 to-token".
> 4. **Never render Step 1 when Step 0's USD-value check fails.** Output the single-line minimum-amount warning instead and stop — the user must restart with a larger `--amount`.

### 2. `onchainos strategy cancel`

Cancel a single, batch, or all active orders. Pass exactly one of the three flags:

```
onchainos strategy cancel --order-id <id>
onchainos strategy cancel --order-ids id1,id2,...
onchainos strategy cancel --all
```

**Output (JSON):** `{ok:true,data:{updateNum:N,estimatedWaitTime:null|n}}`. `updateNum` is the count BE accepted, **not** the count that reached terminal state — re-query with `list` after the wait.

### 3. `onchainos strategy list`

```
onchainos strategy list \
  [--order-id <id>] \
  [--status active,suspended,...] \
  [--chain-id 1,501] \
  [--token <address>] \
  [--limit <int>] \
  [--cursor <string>] \
  [--strategy-mode 7]
```

Two modes:

- **Single order**: pass `--order-id <id>` → GET `openOrderDetail` (returns full order shape).
- **Page query**: omit `--order-id` → POST `getOpenOrder`. The active wallet's addresses are auto-supplied; pass `--limit` (max 100, default 100) and `--cursor` from the previous response's `nextCursor` for pagination.

**Flag CSV support** — `--status` and `--chain-id` accept comma-separated lists; `--token` accepts a **single** address only. For multi-token queries, call `list` once per token and merge the results.

> Full `getOpenOrder` request-body schema (auto-injected fields, flag mapping): see [references/backend-schema.md](references/backend-schema.md).

#### `status` enum

Full 10-state mapping — agent reads `data.list[].status` integer and looks up the display label here:

| Int value | Enum name | CLI `--status` value | Display label | Terminal? |
|---|---|---|---|---|
| -7 | EXPIRED | `expired` | Expired | Yes |
| -3 | CANCELLING | `cancelling` | Cancelling | No (transient) |
| -2 | CANCELLED | `cancelled` | Cancelled | Yes |
| -1 | FAILED | `failed` | Failed | Yes |
| 0 | TRADING | `processing` or `trading` | Trading | No |
| 1 | COMPLETED | `completed` | Completed | Yes |
| 2 | CREATING | `creating` | Creating | No |
| 3 | ACTIVE | `active` | Active | No |
| 4 | SUSPENDED | `suspended` | Suspended | No |

> SPEEDING_UP (-4) is not a valid filter option. CLI's `statusLabel` already returns the display label (the only user-facing string); translate per §Display labels & output language.

**Non-terminal set** (5): `{-3, 0, 2, 3, 4}` = CANCELLING / TRADING / CREATING / ACTIVE / SUSPENDED
**Terminal set** (4): `{-7, -2, -1, 1}` = EXPIRED / CANCELLED / FAILED / COMPLETED

**Default status filter (when `--status` is omitted)**: the CLI sends the 5 **non-terminal** states `[-3, 0, 2, 3, 4]` (CANCELLING / TRADING / CREATING / ACTIVE / SUSPENDED); terminal orders (Cancelled / Completed / Failed / Expired) are **excluded by default** — "show my orders" almost always means live ones.

To see terminal orders the agent must pass `--status` explicitly:

| User intent | `--status` value to pass |
|---|---|
| "show my completed orders" | `completed` (orderStatusList=[1]) |
| "show my cancelled orders" | `cancelled` (orderStatusList=[-2]) |
| "show failed orders" | `failed` (orderStatusList=[-1]) |
| "show expired orders" | `expired` (orderStatusList=[-7]) |
| "show all orders including terminal" | `active,suspended,creating,trading,cancelling,completed,cancelled,failed,expired` (full 9) |
| "show my live orders" / no qualifier | (omit `--status` — uses non-terminal default) |

`--status` accepts comma-separated values; each entry is either an integer (e.g. `4`) or a string label (`active`, `suspended`, `processing`, `creating`, `cancelling`, `cancelled`, `completed`, `failed`, `expired`).

#### Agent rendering rules (when the user asks for orders without naming a specific status)

User prompts that match this rule include: "show my strategy orders" / "list orders" / "show my limit orders" / "what orders do I have" — i.e. any general "show me my orders" intent without a status qualifier.

Steps the agent **must** follow:

1. Run `onchainos strategy list --limit 10` (no `--status`) — the CLI puts `orderStatusList=[-3, 0, 2, 3, 4]` (non-terminal set) into the request body; BE applies the filter server-side and returns only matching orders. **Always pass `--limit 10`** for general "show my orders" queries; full pagination is opt-in via "next page" follow-up.
2. Render the response `data.list` as a Markdown table with **exactly these 8 columns** (locked):

   | Order id | Order Status | Order Type | Estimated Amount | To Token addr | Value | Trigger price | Expire after |
   |---|---|---|---|---|---|---|---|

   Per-row mapping (order matters, no extra columns):

   | Column | Source | Notes |
   |---|---|---|
   | **Order id** | `data.list[i].orderId` | — |
   | **Order Status** | `data.list[i].statusLabel` (Display label per the §`status` table) | Translate per §Display labels & output language |
   | **Order Type** | Display label per the §`strategyType` table, derived from `data.list[i].strategyType` integer (`2 → Buy Dip` / `3 → Take Profit` / `4 → Stop Loss` / `5 → Buy Above`) | Translate per §Display labels & output language |
   | **Estimated Amount** | `data.list[i].toToken.tokenAmount` + ` ` + `data.list[i].toToken.tokenSymbol` | e.g. `0.2 SOL` |
   | **To Token addr** | `data.list[i].toToken.tokenContractAddress`, **truncated to first-6 + last-4** | EVM: `0x1234...cdef` (`0x` + 4 chars + `...` + 4 chars); Solana base58: first 6 + `...` + last 4 |
   | **Value** | `data.list[i].toToken.tokenUsd`, formatted as `<n> USD` | e.g. `16 USD` (round or 2-decimal, follow BE precision) |
   | **Trigger price** | `data.list[i].triggerInfo.triggerPrice`, prefixed with `$` | e.g. `$80`; if empty (trigger-rate path, not currently used) display `data.list[i].triggerInfo.triggerRate` |
   | **Expire after** | `data.list[i].expireTime` (13-digit ms UTC), **converted to the user's current timezone**, formatted `MM/DD/YYYY HH:MM:SS` | e.g. `05/15/2026 17:50:49` (semantically = createTime + 7 days by default) |

   Sample row (Solana SOL→USDC take_profit):

   ```
   | 17262791359882688 | Active | Take Profit | 0.2 SOL | 9xQeWv...vEjz | 16 USD | $80 | 05/15/2026 17:50:49 |
   ```

   Address shortening rules:
   - EVM (`0x` prefix): first 6 chars (`0x` + 4) + `...` + last 4 chars
   - Solana / other non-prefixed base58: first 6 + `...` + last 4
   - Strings shorter than 10 chars: do not truncate; display verbatim

   Expire timezone conversion:
   - `expireTime` from BE is a UTC millisecond timestamp
   - The agent **must convert to the user's current local timezone** at render time (e.g. JS `Intl.DateTimeFormat`, Rust `chrono::Local`, or equivalent)
   - Fixed format: `MM/DD/YYYY HH:MM:SS`, 24-hour clock

3. After the table, append a **single combined reminder** covering pagination + status filter. Include the pagination line **only when `nextCursor` is non-empty**.

   Canonical EN; the agent translates per §Display labels & output language:

   > Showing live orders by default (10 per page).
   > - Reply "next page" to load more.
   > - To filter by a specific state, ask for orders by their **Display label** — e.g. `Completed`, `Cancelled`, `Failed`, `Expired`. Example: "show my completed orders" → I'll re-query with that filter.

   If `nextCursor` is empty (no more pages), drop the "next page" bullet and keep only the status-filter bullet.

4. If the user replies "next page" / similar, re-run with `--limit 10 --cursor <nextCursor>` carrying the previous response's `nextCursor`. Render with the same table format.

5. If the user names a specific status (any of the 9 Display labels), re-run as `list --limit 10 --status <label>` (single value) and render the same table. Drop the status-filter bullet from the reminder; keep the pagination bullet if `nextCursor` is non-empty.

### 4. `onchainos strategy resume`

```
onchainos strategy resume                          # auto-discover all SUSPENDED + canResume=true on active wallet
onchainos strategy resume --order-ids id1,id2      # explicit
```

When ids are omitted, the CLI runs `list` filtered to `status=4` and keeps only orders whose `canResume` flag is true; the discovered ids are then submitted to `reactivate`. After resume, the agent should advise the user that orders whose trigger condition was already met may execute immediately — re-query with `list` to confirm.

## Error code → Agent action

The CLI surfaces the BE error code in human-readable form. Map each code to a recommended next step:

| Code | Name | What the agent should do |
|---|---|---|
| 100 | REQUEST_PARAM_ERROR | Surface the BE message; ask the user to fix the offending flag |
| 10019 | INSUFFICIENT_NATIVE_GAS_BALANCE | Wallet's native token balance is below the BE-required minimum (the response msg includes `minAmount = <N>`, e.g. `0.001` BNB on BSC). Tell the user their native gas balance is insufficient to pay this chain's gas fees and prompt them to top up — deposit from an exchange, transfer from another account, or swap a stablecoin to native via `onchainos swap execute`. Do NOT auto-retry. |
| 10026 | JWT_TOKEN_VERIFY_FAILED | Suggest `onchainos wallet login` then retry |
| 10106 | CHAIN_NOT_SUPPORT_ERROR | Tell the user the chain is not supported; suggest a supported alternative |
| 60002 | NO_ORDER_FOUND | Cancel/resume target id is wrong or already terminal — suggest `list` |
| 60003 | LIMIT_ORDER_NO_AUTHORITY | Trader Mode may not be activated yet; the next CLI call will trigger SD-A automatically — retry once |
| 60006 | LIMIT_ORDER_OUT_LIMIT_FAIL | Pending order count is at the per-account limit (max 100); ask the user to cancel some pending orders (`cancel --all` or `cancel --order-id`) and retry |
| 60009 | LIMIT_ORDER_ILLIQUIDITY_ERROR | No liquidity for the pair at the trigger; suggest a different pair or wider trigger |
| 60014 | LIMIT_ORDER_EXPIRED_CANNOT_OPERATE | Order already expired |
| 60015 | LIMIT_ORDER_PENDING_CANNOT_OPERATE | Order is mid-lifecycle; wait for terminal state |
| 60017 | LIMIT_ORDER_SUCCESS_CANNOT_OPERATE | Order already completed |
| 60018 | LIMIT_ORDER_TEE_SA_VERSION_UPGRADE_REQUIRED | Transparent — CLI handles via SD-A retry; the agent should NOT see this code in normal flow. If it leaks, just retry the same command |
| 60030 | QUOTA_EXCEEDED | Account-level quota reached |
| 100005 | WALLET_ADDRESS_BLACKLISTED | Wallet address flagged by risk control; ask the user to contact support — do not retry |
| 100007 | TEE_SIGN_FAILURE | Transient TEE issue — retry once |
| 100010 | ORDER_AMOUNT_TOO_SMALL | Order value is below the BE-enforced minimum of $1 USD. Ask the user to increase `--amount` so the order value clears $1, then retry |
| 100008 | TEE_SERVICE_UNAVAILABLE | TEE service is temporarily unavailable; ask the user to retry later |
| 100012 | LIMIT_ORDER_INSUFFICIENT_BALANCE | Insufficient balance; suggest checking with `onchainos wallet balance` |

> **Match by integer code, not msg string.** The msg text is for humans and may change.

## Execution event codes (`executionHistoryList[].code`)

Emitted by the TEE swap-trade engine while it executes an active order. Read the **latest** entry first; older entries are historical context. For each recognised code the CLI injects three fields next to the raw `code`:

| Field | Use |
|---|---|
| `name` | Internal label; do NOT surface to the user |
| `message` | **Surface verbatim** to the user (translate per §Display labels & output language) |
| `terminal` | `true` ⇒ engine will not retry; stop polling and surface. `false` ⇒ engine retries; safe to wait |

Unrecognised codes pass through with `name` / `message` / `terminal` absent — surface the raw BE `msg` if present, else `"event code <N>"`.

### Reading patterns

- **Latest entry wins.** Render the most recent `executionHistoryList[]` item; older entries are historical context only.
- **Repeated same code.** When the same code recurs every ~10s without a `txHash` appearing, the engine is in a soft retry loop. Surface the latest `message`, mention the repeat count ("this is the 5th `No quote due to low liquidity` event"), and ask the user whether to wait, cancel, or adjust parameters.
- **`terminal=true` codes.** Stop polling immediately and surface to the user; engine will not retry.
- **`terminal=false` codes that repeat 3+ times.** Treat as user-actionable: suggest changing slippage / amount / pair / chain, or cancelling.
- **Code `0` with `txHash`.** Trade succeeded; surface `txHash` and explorer link.

### Action hints by hot code

The `message` field is the user-facing string. The agent additionally chooses one of these action hints based on `code`:

| code | what the agent should do |
|---|---|
| 0 | report success; surface `txHash` + explorer link |
| 3013 | suggest topping up the from-token or recreating with smaller amount |
| 3014 | tell user to fund the chain's native fee token (SOL / ETH / BNB / ...) |
| 3015 | suggest widening `--slippage` |
| 3016 | non-transient — suggest different pair, smaller amount, wider trigger, or different chain |
| 3017 | engine retries; if recurring 3+ times, treat like 3016 |
| 3019 | terminal — destination token is blocklisted; order will not execute |
| 3020 | terminal — wallet address is flagged; surface explicitly |
| 3023 | recreate with longer `--expires-in` |

Codes outside this table: read `terminal` from the CLI output. `terminal=true` ⇒ surface and stop. `terminal=false` ⇒ surface and wait one more cycle.

## Async wait pattern

`create-limit`, `cancel`, and `resume` return after the request has been **accepted**, not after the order reached a terminal state. The CLI surfaces `estimatedWaitTime` (seconds, BE-supplied — typically 0 for Solana, ~3 for BSC, ~12 for ETH-class chains).

**Agent recipe (locked):**
1. Run the subcommand.
2. **Sleep 3 seconds.** A single fixed 3-second wait is enough across all supported chains. Do **not** sleep by the response's `estimatedWaitTime`; the BE-supplied number is conservative and inflates the wait unnecessarily.
3. Re-query with `onchainos strategy list --order-id <orderId>` to read the final state.
4. If still pending after the first re-query, surface the partial state to the user; do not loop indefinitely.

> Do **not** run a long polling loop. The CLI is not designed for that; the BE backs the order finalisation off-chain and one targeted re-query is sufficient in normal conditions.

## SA activation transparency

Trader Mode upgrade / re-upgrade is performed transparently by the CLI:

- On `create-limit` or `resume`, if the BE returns code `60018` (`UPGRADE_REQUIRED`), the CLI activates Trader Mode transparently and retries the original op once. On success the user sees `Trader Mode activated.` followed by the normal command output.
- The agent should not ask the user to "activate Trader Mode" first — the CLI does it on demand.
- If activation **fails**, the original command aborts and the activation error is surfaced. Suggest `onchainos wallet status` to inspect the session.

## Output format conventions

All strategy subcommands always emit the standard onchainos JSON envelope `{ok: true, data: { ... }}` on stdout. There is no `--format` flag — strategy CLI is agent-facing, so structured JSON is the only output and the agent renders any user-visible tables (e.g. the §`list` 8-column Markdown table) from that JSON.

## Limitations

Symbol→address resolution is out of scope — pass `--from-token` / `--to-token` as contract addresses directly.

> Full current-limitations list: see [references/backend-schema.md](references/backend-schema.md).
