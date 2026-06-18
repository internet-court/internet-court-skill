# Gas Station — Edge Cases (Solana)

> Load on demand: read this when one of the triggers below fires. Render any user-facing template per the `<output-discipline>` rule in `gas-station.md`.

<edge-cases-rule>
Handle these edge cases explicitly — do NOT fall through to generic error handling. Render any template below per `<output-discipline>`.
</edge-cases-rule>

### Edge Case 1 — Relayer single-tx cap exceeded (100,000 U)

**Trigger**: backend detects single-tx value > 100,000 USD equivalent. Backend silently falls back to normal flow (`gasStationUsed=false`); CLI will NOT emit a GS Confirming. Agent must NOT proactively mention Gas Station. **Only** when the user directly asks whether stablecoins can pay gas for this transaction — respond with the verbatim template below.

<edge-tx-cap-copy>
**User-facing template** (render per `<output-discipline>`):

```
This transaction exceeds the Gas Station per-transaction cap (100,000 U), so Gas cannot be paid with a stablecoin. Top up the native token and retry the full transfer, or split it into smaller transactions.
```

Do NOT expose internal terms ("Relayer cap", "TTL", etc.).
</edge-tx-cap-copy>

### Edge Case 2 — Jito Bundler is a HARD BLOCK

**Trigger**: user wants to use Jito Bundle for this transaction (e.g., `--jito-unsigned-tx` is supplied, or user states intent to use Jito Bundler). **Gas Station does NOT support Jito Bundler transactions on Solana**. This is a hard block — even if SOL is insufficient and stablecoin is available, the Agent must offer the two alternatives below; do NOT silently route to Gas Station.

<edge-jito-copy>
**User-facing template** (render per `<output-discipline>`):

```
Sorry, Gas Station does not support Jito Bundler transactions.

You can continue either way:

- Use Jito Bundle: switch the network fee to the native token (SOL); the Bundle transaction can be sent normally.
- Use stablecoin Gas: switch to a normal transaction (no Jito Bundle).
```

Apply this template whenever the user explicitly asks for Jito Bundle + stablecoin gas, OR whenever the Agent detects both intents (e.g., MEV-protected swap on Solana with `--jito-unsigned-tx` and Gas Station Confirming was about to fire). Never claim Gas Station can be combined with Jito Bundler.
</edge-jito-copy>

### Edge Case 3 — User asks for txHash before Relayer returns it

**Trigger**: the user asks for the tx hash or recent tx detail, but the most recent Gas Station broadcast's `txHash` is still empty (the Relayer hasn't published the on-chain hash yet). The `orderId` is known; the hash is not.

<edge-async-hash-copy>
**User-facing template (first response)** (render per `<output-discipline>`):

```
The transaction is being submitted on-chain. Please check again shortly.
```

**Follow-up template if the user asks why other transactions return a hash immediately**:

```
This one is paid via Gas Station, so the hash comes back slightly later than for normal transactions.
```

Do NOT fabricate a `txHash`. Do NOT show `onchainos wallet history ...` or any raw CLI command. Do NOT explain the Relayer/async mechanism beyond the one sentence above.
</edge-async-hash-copy>

### Edge Case 4 — Pending Gas Station tx is blocking

**Trigger**: `hasPendingTx=true` in the latest response (CLI `scene: "gs_pending_tx"`). A previous Gas Station tx is still processing.

User-facing message:

```
A previous Gas Station transaction is still processing — you can't start a new one yet. Wait for the previous one to finish and retry, or top up SOL and use the native token instead.
(To check the previous one, tell me: **check order {prev_orderId}**)
```

Do NOT auto-retry. Do NOT mention "Relayer" / internal mechanisms.

### Edge Case 5 — Order status query (user types "check order xxx")

**Trigger**: user replies with any wording meaning "check order {orderId}" or "is that last transaction done?" — in any language.

Agent runs `wallet history --chain solana --order-id {orderId}` internally (NOT shown to user) and renders one of:

**Outcome A — completed (on-chain success, txHash returned)**:

```
✅ Order {orderId} completed.

- txHash: {txHash}
- Status: success
- Chain: Solana
- {networkFeeLabel}: {network_fee_line}
```

`{networkFeeLabel}` is **already provided by the CLI** in the order detail response — render it verbatim. The CLI computes the label as either `Network fee` or `Network fee and Rent fee` based on whether the Solana Relayer also covered the recipient's SPL token-account rent (~0.002 SOL, folded into {network_fee_line}). Translate the label to the user's language per the global locale rule; never hard-code translations.

Do NOT add a separate line for the rent — it's signalled by the label string only. Do NOT render the raw `feeContainCreateAccount` field (it is not in the CLI output any more; the label supersedes it).

`{network_fee_line}` rendering rule (take the first one that fits):

1. **If `serviceChargeSymbol` is present** (the CLI emits it from the backend's `feeName`; `serviceChargeFeeTokenAddress` may be absent in history responses, do NOT treat it as required):
   `{serviceCharge_readable} {serviceChargeSymbol} (≈ ${serviceChargeUsd}, paid via Gas Station)`
   Example: `0.004565 USDC (≈ $0.0046, paid via Gas Station)`.
   `{serviceCharge_readable}` = `serviceCharge` (raw integer string) divided by `10 ^ serviceChargeDecimal` (also emitted by CLI when present). Do NOT print the raw integer; do NOT skip the symbol; do NOT print field names like `serviceChargeUsd` literally inside the parenthetical.
2. **If only `serviceChargeUsd` is present, no symbol** (older history responses):
   `≈ ${serviceChargeUsd} (paid via Gas Station)`
   Example: `≈ $0.001717 (paid via Gas Station)`.
3. **If even `serviceChargeUsd` is empty / 0**:
   `paid via Gas Station (amount not returned)`

Do not dig through broadcast logs to backfill the symbol — those logs are Agent-internal and not visible from the user's perspective. Filling in the symbol is the CLI's responsibility (emit `serviceChargeSymbol` from `feeName`).

**Outcome B — still processing**:

```
Order {orderId} is still being processed by the Relayer. Please check again shortly — tell me **check order {orderId}** and I'll fetch the latest status.
```

**Outcome C — failed / timed out (typically 10-minute Relayer TTL)**:

```
⚠️ Order {orderId} did not complete.

The transaction was broadcast via Gas Station, but the Relayer did not finalize it on-chain within 10 minutes; it has been marked as failed.

Your funds are untouched — the stablecoin Gas fee was NOT deducted, and the {amount} {tokenSymbol} you tried to send is still in your account.

You can retry now, or top up SOL and pay Gas with the native token instead.
```

Never fabricate `txHash`. Never show `wallet history` as a command to the user.

### Edge Case 6 — Native SOL transfer (Gas Station does not apply)

**Trigger**: user sends native SOL. Backend returns `gasStationUsed=false` regardless of balance. Gas Station only supports SPL token transfers and contract interactions on Solana.

If user asks why, respond: "Gas Station only applies to SPL token transfers and contract interactions. Native SOL transfers do not go through Gas Station."

### Edge Case 7 — Transaction history display rules

When listing or detailing a Gas Station transaction in `wallet history`:

- **Show user intent only** — display the user's intended transfer (e.g., "100 USDC → CYXWm..."). Do NOT display the Relayer's fee-payer address.
- **Network fee** — display the actual token used by Gas Station (e.g., `0.8 USDC`), not SOL.
- **From address** — display the user's address, not the Relayer's.

---

## Failure & Backend-Bug Handling

> **Diagnosis content, not user-facing templates.** Backend errors and bugs surfaced during the two-phase `wallet send` / `wallet contract-call` flow, plus management-command API errors. The flow, scene dispatch, and product copy live in `gas-station.md`; the edge-case templates above cover the expected branches; this section covers what neither does.
>
> **Scene dispatch reminder** — read the CLI `scene` discriminator and dispatch via the gas-station.md "Outcome → render map". Do NOT re-derive the scene from raw backend booleans (`gasStationUsed` / `hasPendingTx` / `insufficientAll` / `hash`).

### Phase 2 failures (after the user picked a token / CLI filled params)

| Failure | How to detect | Agent response |
|---|---|---|
| Backend rejects token selection | Non-2xx response, or `gasStationUsed=false` with error | Tell user the selection failed; ask to retry. Causes: balance changed between calls, `relayerId` expired, token no longer supported. Re-run Phase 1 to refresh `gasStationTokenList`. |
| Invalid `gasTokenAddress` | Backend returns error | Do NOT fabricate. Re-run Phase 1 and use values from the Confirming response's `next` field. |
| Simulation failure (`executeResult=false`) | CLI bails with `transaction simulation failed: <msg>` | Show `<msg>` to user. Do NOT broadcast. Causes: insufficient token balance for `amount`, recipient invalid, program revert. |
| Balance changed between Phase 1 and Phase 2 | Phase 2 returns `insufficientAll` or simulation fails | Re-run Phase 1 to refresh `gasStationTokenList`. |
| `hash` empty on Phase 2 | Backend bug | Surface backend error. Do NOT attempt to sign. |
| `signType` ≠ `multiSignerTx` on a Gas Station response | Backend bug | Fatal — CLI cannot construct the multi-signer transaction. Surface error. |

### Broadcast & history bugs (should-not-happen)

Broadcast is asynchronous (`orderId` returned, `txHash` eventual). For the normal async-hash / Relayer-timeout / order-status / history-display copy, use Edge Case 3 / 5 / 7 above and the Universal Gas Station Success Reply in `gas-station.md`. Treat the following as **backend bugs** if observed:

| Symptom | Agent response |
|---|---|
| Network fee shown in SOL instead of the stablecoin actually used | Report as backend bug. Do NOT manually convert. |
| `from` / history shows the Relayer address instead of the user's | Report as backend bug. |

### Management command failures

| Command | Failure mode | Agent response |
|---|---|---|
| `wallet gas-station update-default-token` | API error | Show the error message; do NOT retry automatically. Common causes: invalid token address, chain not supported, not logged in. |
| `wallet gas-station enable` / `disable` | API error | Show the error message; do NOT retry automatically. (Agent-internal: `disable` is DB-only and re-enabling later is instant — never paraphrase this to the user; see `gas-station.md` User-Facing Reply Templates.) |
