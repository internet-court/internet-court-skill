# Cross-Chain Troubleshooting

> Load this file when a cross-chain transaction fails, an edge case is encountered, or the user asks a conceptual "how does it work" question (see Common Questions below).

## Common Questions (FAQ)

Conceptual questions that don't involve an error.

| Question | Answer |
|---|---|
| Which bridges / chains are supported? | Decided at runtime — run `cross-chain bridges --from-chain <X> --to-chain <Y>`. No static list. Protocols seen so far: Stargate/LayerZero, Across V3, Relay, Gas.zip, Mayan, ButterSwap. |
| What fees are there? | `crossChainFee` (bridge fee, source token) + source-chain gas; some bridges add `otherNativeFee`. |
| What is a "transit token" / why was I offered one? | No direct route exists, so the backend routes source→transit→target via an intermediate token. See [transit-fallback.md](transit-fallback.md). |
| Why must I provide a receive address sometimes? | Heterogeneous pairs (EVM↔non-EVM) can't infer the destination address from the sender. |
| Is the bridge atomic / can I get a refund? | No atomicity guarantee, and `status` exposes no refund/failure sub-state. For stuck transfers, verify on the destination chain / bridge scan page first (below). |

## Failure Diagnostics

When a cross-chain transaction fails, generate a **diagnostic summary** before reporting to the user:

```
Diagnostic Summary:
  fromTxHash:    <source chain hash or "not yet broadcast">
  approveTxHash: <approve hash or "not needed / not run">
  fromChain:     <chain name (chainIndex)>
  toChain:       <chain name (chainIndex)>
  errorCode:     <API or on-chain error code>
  errorMessage:  <human-readable error>
  tokenPair:     <fromToken symbol> -> <toToken symbol>
  amount:        <amount in UI units>
  bridgeId:      <selected bridge id>
  bridgeName:    <bridge protocol name>
  mevProtection: <on|off>
  walletAddress: <address>
  receiveAddress:<address (if different from wallet)>
  timestamp:     <ISO 8601>
  cliVersion:    <onchainos --version>
```

## Error Code Reference

**Never show raw error codes or CLI output to the user** — translate every failure into a plain-language message; the code stays in the Diagnostic Summary only.

| Code | Meaning → action |
|---|---|
| 50014 | Required parameter `{0}` missing → surface which param is missing. |
| 50125 | Region restriction / no API access → display "Service is not available in your region." |
| 51000 | Param error `{0}` → surface the offending param name. |
| 81362 | Backend risk system flagged the broadcast (potential honeypot) → WARN, ask user to confirm. Only on explicit confirm, retry with `--force`. |
| 82000 | No liquidity / no available route. **Backend `msg` carries the reason** (e.g. "no available route for this token pair on this chain"); may be empty when the adapter is offline on an env → surface the translated `msg`. quote/execute auto-wrap no-route into `fallback` (see [transit-fallback.md](transit-fallback.md)); empty `msg` across all transits → `env_unavailable`. |
| 82104 | Token not supported → trigger transit-token fallback OR tell user the token isn't supported. |
| 82105 | Chain not supported → tell user "This chain pair isn't currently supported by any bridge." |
| 82106 | Bridge id not supported / wrong → re-run `quote` without `--bridge-id` to let server pick. |
| 82200 | Address blacklisted → BLOCK; tell user the address is flagged. Do NOT retry. |
| 82201 | Wallet address format invalid → check the address; convert EVM to lowercase if mixed-case. |
| 82202 | Receive address format invalid (doesn't match destination chain family) → ask for the correct format. |
| 82500 | Calldata build failed (bridge server-side) → retry once; if persistent, escalate. |
| 5000 | System error → retry once; if persistent, surface to user. |

## Edge Cases

> The cases below are deeper failure modes requiring operator-level diagnosis (the in-flow gates — receive-address, risk-flag, balance/gas — are handled during the main flow).

### Chain pair returns no bridges
- Localize the gap with two single-flag queries: `cross-chain bridges --from-chain <X>` (is the source supported at all?), then `cross-chain bridges --to-chain <Y>` (is the destination reachable?). This separates source-unsupported / destination-unreachable / pair-simply-not-connected.
- Suggest a supported chain, or a two-hop via a common chain (Ethereum / Arbitrum).

### Approval failed inside one-shot `execute`
- `execute` builds, broadcasts, and waits for the approval (and the USDT-pattern revoke) on-chain before swapping. A failure here means the approval/revoke tx did not confirm — nothing was bridged.
- Check the source-chain gas balance, then re-run the same `execute` (it re-quotes and re-approves from scratch).
- For USDT-pattern tokens the CLI does the revoke→approve automatically when `needCancelApprove=true`; if the backend hasn't yet emitted the field, the revoke step is skipped.

### Approval wait timed out inside `execute`
- The CLI polls each tx on-chain (per-chain timeout) and bails with a timeout error if it does not confirm in time. The tx may still be pending in the mempool.
- Check manually: `onchainos wallet history --tx-hash <approveTxHash>` (or `--order-id <approveOrderId>` — pre-prod often returns an empty `approveTxHash`).
- For EVM stuck txs: the user can submit a 0-value transaction with the same nonce (use the tx's actual nonce) to cancel.

### Execute reverts at the swap step after approving
- TEE pre-execution may have failed (insufficient allowance not yet reflected by the backend, or price moved).
- Do NOT add `--force` (it bypasses the 81362 risk warning, not a TEE revert) and do NOT re-run `swap` + `gateway simulate` as a secondary diagnostic unless the user explicitly asks.
- Wait 1–3 min for the backend allowance state to settle, then re-run the same `execute` (it re-quotes with fresh pricing internally). By then the allowance is on-chain, so the re-run's quote returns `needApprove=false` and `execute` skips the approve branch and goes straight to swap.
- If repeated failures, check on-chain allowance manually and re-run `quote --check-approve`.

### fromTxHash not visible on public chain
- Possible cause: agentic wallet stuck (transaction not actually broadcast)
- Suggest the user check on the source chain explorer first
- If the broadcast genuinely never happened, escalate to OKX support with `fromTxHash` + bridge name + amount

### `status` returns NOT_FOUND
- **First 30 seconds**: expected. Bridge has not yet indexed the source tx. Wait and retry.
- **30 s – 5 min**: source tx might not be confirmed yet. Check the source chain explorer.
- **> 5 min**: source tx confirmed but bridge has not seen it. Likely bridge-side delay. Suggest checking the bridge's own scan page (Stargate / ACROSS / Relay). Wait up to original `estimateTime × 5`.
- **> 4 hours**: escalate to OKX support with `fromTxHash` + `bridgeName`.

### `status` stuck at PENDING

`status` reflects the backend's fill-event listener, not a direct read of the destination chain — so it lags. Decide which case applies:

- **In flight (normal)**: destination shows no fill yet. Wait up to `estimateTime × 10`; check the bridge's scan page for progress.
- **Already filled, listener lagging (abnormal)**: destination balance already rose by ~`minimumReceived` (check `wallet balance --chain <toChain>` or the explorer). Funds have arrived — tell the user with that evidence and stop waiting; `status` reconciles later. Seen mainly on ACROSS V3.

`status` has no refund/failure sub-state, and its echoed `bridgeId` can be wrong — trust your own `quote`/`execute` record. Long PENDING with no on-chain fill → escalate.

### Network error
Retry once. If still fails, generate diagnostic summary and prompt user.

## Status Polling

**Interactive chat: do NOT auto-loop.** Run `status` once per user request, report the current state, and — if not `SUCCESS` — tell the user when to ask again (use the route's `estimateTime`, e.g. "check back in ~1 min"). Never `sleep` in a blocking loop during a conversation.

If the user explicitly asks for an automated polling script, use exponential backoff (10→20→40→60→60s) and stop after `SUCCESS` or `estimateTime × 5`. Two traps when writing it: (1) every `status` call still needs the full triple `(--tx-hash | --order-id) + --bridge-id + --from-chain` or it returns 50014; (2) in zsh do NOT name the loop variable `status` — it is read-only (`= $?`) and assignment aborts the loop; use `st`.

## Bridge Explorer References

For long-stuck cases, point users to the bridge's own scan page. The list below covers the protocols currently returned by `cross-chain bridges`. If a new protocol appears in `bridges`, look up its scan page on the project's own docs before referring users to it.

- Stargate / LayerZero: https://layerzeroscan.com/
- ACROSS V3: https://across.to/transactions
- Relay: https://relay.link/transactions
- Gas.zip: https://www.gas.zip/scan

(Map `bridgeId` → bridge name → scan URL via `cross-chain bridges` lookup.)
