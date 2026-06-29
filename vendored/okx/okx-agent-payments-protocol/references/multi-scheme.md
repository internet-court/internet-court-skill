# Multi-scheme recommendation (SKILL.md Step A3.5)

Loaded from `SKILL.md` **Step A3.5** when the combined candidate pool contains **2 or more** of `{exact, aggr_deferred, charge}`. Single-candidate flows skip this file and go straight to Step A4. This file owns the full recommend-and-confirm flow and hands the **selected candidate** back to Step A4 / Step A6.

> **🔇 Silence rule for A3.5 internals.** Substeps A3.5.1–A3.5.4 (candidate enumeration, wallet-status check, balance fetch, address/chain-mapping normalization, balance filtering, tie-breaker application) are **internal** — produce **no user-facing narration** during them. The only A3.5 output the user sees is (a) the login prompt in A3.5.2 *if* the wallet isn't logged in, and (b) the recommendation card / alternatives list in A3.5.5. Do **not** announce "I'm checking your balance", "Let me verify the chain mapping", "After filtering, X candidates remain", "Per Rule 2 carve-out…", or any other progress chatter between Step A3 finishing and the recommendation card appearing. Just go silent and emit the card.
>
> **🚫 Exactly one user gate per payment, mandatory.** Per payment, the user sees exactly one confirmation surface: A3.5's recommendation card (when 2+ candidates and the user accepts with `yes`), OR A4's per-payment confirmation card (when there's only 1 candidate, OR when the user picked an alternative from A3.5's expanded list). Do not skip the applicable gate on your own initiative — no "past preference", "streamlining", or "they confirmed once before" shortcuts; those preferences do not exist. Equally, do not duplicate gates: after a `yes` on A3.5.5, do NOT also render A4 with the same info.

## A3.5.1: Build the candidate pool

- Each entry in `accepts[]` → one candidate. Scheme = `accepts[i].scheme` (`exact` or `aggr_deferred`).
- A `WWW-Authenticate: Payment` 402 with `intent="charge"` → one candidate. Scheme = `charge`.
- `WWW-Authenticate: Payment` with `intent="session"` is **never** part of this pool — it's handled by the session-vs-one-shot branch in Step A2.

Each candidate carries `{scheme, chainId, tokenAddress, tokenSymbol, amount (atomic), amountHuman, isMainnet}`. Determine `isMainnet` from the chain registry (`onchainos wallet chains` lists chain metadata).

## A3.5.2: Get wallet balance

- If a recent wallet-balance snapshot already exists in conversation context (from an earlier `onchainos wallet balance` call this session), **reuse it** — do not re-query.
- Otherwise, check login first via `onchainos wallet status`:
  - **Not logged in** → ask the user to log in (the recommendation depends on knowing their balance). Don't fall back silently.
  - **Logged in** → query balance:

    ```bash
    onchainos wallet balance
    ```

## A3.5.3: Filter by has-balance

Keep only candidates where the wallet has a non-zero balance for the matching `(chainId, tokenAddress)`.

**Edge case — zero candidates pass the filter**: list **all original candidates** to the user (no recommendation badge, no tie-breakers applied). User picks one; carry it to Step A4.

## A3.5.4: Tie-breakers (apply in order; stop when one wins)

If more than one candidate remains after A3.5.3:

1. **Smallest required payment amount — same-symbol only.** Group remaining candidates by `tokenSymbol`. If they all share a single symbol, the one with the smallest `amountHuman` wins. If the remaining set spans multiple symbols, skip this rule.
2. **Mainnet over testnet.** Drop testnet candidates if any mainnet candidate remains. Different mainnets are equal — no preference between e.g. Ethereum, Base, X Layer.
3. **Scheme priority:** `aggr_deferred` > `exact` > `charge`.

The survivor is the **recommended candidate**. The rest are **alternatives**.

## A3.5.5: Display the recommendation

**Carve-out scoping** — the recommendation card itself does **NOT** contain a `Scheme:` line, and the "N other methods" summary line does **NOT** preview their schemes / amounts / tokens. Scheme literals appear **only** inside the expanded alternatives list, and only when the user explicitly asks for it. Render the card with `N = number_of_alternatives`:

> We recommend paying via the **OKX Agent Payments Protocol**:
>
> - **Network**: `<chain name>` (`eip155:<chainId>`)
> - **Token**: `<symbol>` (`<token address>`)
> - **Amount**: `<human> (<atomic>)`
> - **Pay to**: `<recipient>`
>
> `<N == 0 ? "No other methods available." : "There are <N> other supported method(s) you could use instead.">` Use the recommended method? (yes / show others)

**⚠️ Do NOT inline alternatives in the summary line.** Forbidden: ❌ "There are 2 other methods (exact 0.001 USD₮0, charge 0.0005 USD₮0)". Required: ✅ "There are 2 other supported methods you could use instead." Detail only appears after the user picks "show others".

- **yes** (or `N == 0`) → the recommended candidate becomes the **selected candidate**; continue at Step A4.
- **show others** → only now expand the alternatives list, each row as `<index>. scheme=<exact | aggr_deferred | charge>, network=<…>, token=<…>, amount=<…>`. User picks one by index → that becomes the selected candidate; continue at Step A4.

## A3.5.6: Carry the selection forward

- **`accepts`-based selection** (`exact` or `aggr_deferred` from `accepts[]`) → remember the **index of the selected accept within `decoded.accepts`**. In Step A6 you pass it as `--selected-index <index>` so the CLI signs exactly that entry and cannot deviate from the user's choice.
- **`charge` selection** (from WWW-Authenticate) → in Step A6, take the WWW-Authenticate / `references/charge.md` path; ignore the accepts-based candidates entirely.

Step A4 (back in `SKILL.md`) now describes the **selected candidate**. Step A5's wallet-status check is already satisfied if A3.5.2 ran the login flow — skip the re-check; just continue to A6.
