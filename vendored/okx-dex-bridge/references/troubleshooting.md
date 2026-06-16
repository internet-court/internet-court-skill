# Cross-Chain Troubleshooting

> Load this file when a cross-chain transaction fails or an edge case is encountered.

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

| Code | HTTP | Meaning | Action |
|---|---|---|---|
| 0 | 200 | Success | Continue |
| 50014 | 200 | Required parameter `{0}` missing | Surface which param is missing |
| 50125 | 200 | Region restriction / no API access to this endpoint | Display generic "Service unavailable in your region" — do NOT show raw code |
| 51000 | 200 | Param error `{0}` | Surface the offending param name to the user |
| 81362 | 200 | Backend risk system flagged the broadcast | WARN, ask user to confirm. If they explicitly confirm, retry with `--force` |
| 82000 | 200 | No liquidity / no available route. **Backend `msg` carries the human-readable reason** (e.g. "no available route for this token pair on this chain"). When the adapter is offline on an env, `msg` may be empty (CLI surfaces it as "unknown error"). | Surface the translated `msg` to the user; do NOT mention "82000". If `msg` is empty / "unknown error", trigger transit-token fallback (see SKILL.md "Fallback: No Direct Route"). When every transit also returns 82000 with empty `msg`, treat as "service unavailable on this environment" — do NOT loop further |
| 82104 | 200 | Token not supported | Trigger transit-token fallback OR tell user the token isn't supported |
| 82105 | 200 | Chain not supported | Tell user "This chain pair isn't currently supported by any bridge" — do NOT name protocols |
| 82106 | 200 | Bridge id not supported / wrong | Re-run `quote` without `--bridge-id` to let server pick |
| 82200 | 200 | Address blacklisted | BLOCK — tell user the address is flagged. Do NOT retry. |
| 82201 | 200 | Wallet address format invalid | Check user's wallet address; convert EVM to lowercase if mixed-case |
| 82202 | 200 | Receive address format invalid | Address doesn't match destination chain family. Ask user for correct format. |
| 82500 | 200 | Calldata build failed | Bridge server-side failure — retry once; if persistent, escalate |
| 5000 | 200 | System error, please retry | Retry once; if persistent, surface to user |

## Edge Cases

> The `Risk Controls` table in SKILL.md is the source of truth for price impact, receive-address, balance, gas, and blacklist action levels. The `Error Handling` section of SKILL.md covers heterogeneous chain pairs, region restriction (50125), and the 81362 risk warning. The cases below are deeper failure modes that require operator-level diagnosis.

### Approval transaction failed
- Check gas balance on source chain
- Suggest retrying with `execute --confirm-approve`
- For USDT-pattern tokens: confirm `needCancelApprove=true` was respected (CLI handles this automatically; if backend hasn't yet emitted the field, the revoke step is skipped)

### Approval confirmation timeout (30 polls = 60s)
- Transaction may still be pending in mempool
- Suggest: `onchainos wallet history --tx-hash <approveTxHash>` to manually check
- For EVM stuck txs: user can submit a 0-value transaction with the same nonce (nonce 0 won't usually work — use the tx's actual nonce) to cancel

### Execute fails after approval confirmed
- TEE pre-execution may have failed (insufficient allowance not yet reflected, or price moved)
- Retry: `execute --skip-approve` (will re-quote with fresh pricing internally)
- If repeated failures, check on-chain allowance manually and re-run `quote --check-approve`

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

The `cross-chain status` endpoint is not a direct read of the destination chain. The backend has an internal listener that subscribes to each bridge's callback / fill event (ACROSS fill, Stargate `messageReceived`, Gas Zip deliver, …) and only flips its stored state from `PENDING` to `SUCCESS` after that event is parsed. The chain itself is the source of truth; `status` is a downstream projection of it.

When `status` reports `PENDING`, decide which of the two cases applies before waiting further:

**Case 1 — bridging genuinely in flight (normal)**
- Source TX confirmed; destination chain has **no** new balance / fill event yet.
- This is the expected window between source-tx-confirmed and destination-tx-delivered.
- Wait up to original `estimateTime × 10` before escalating.
- Check the bridge's own scan page (LayerZero scan, ACROSS scan, Relay scan, Gas Zip scan) for delivery progress.

**Case 2 — destination already filled on-chain, only the listener lagging (abnormal)**
- Source TX confirmed AND destination chain already shows the fill — verifiable via `wallet balance --chain <toChain>` (balance increased by ~`minimumReceived`) or the destination explorer (incoming transfer from the bridge router).
- This means the user's funds are already there. The `PENDING` is a backend-listener gap, not a missing fill.
- **Do NOT make the user keep waiting.** Tell them the funds are already on the destination chain (cite the balance / explorer evidence), and that `status` will eventually reconcile but is not gating fund availability.
- This pattern has been observed primarily on ACROSS V3 (the listener for that adapter is slower / occasionally not wired up); Gas Zip and Stargate generally reconcile within ETA.

Other notes:
- The status API does not return refund / failure sub-states. If long PENDING with no progress AND no destination fill is visible on-chain, support escalation is the path.
- The `bridgeId` field in the `status` response has been observed to disagree with the `--bridge-id` you passed (server-side mapping inconsistency). Trust the bridge name from your own `quote` / `execute` record, not the one echoed by `status`.

### Cross-chain failure with no `status` resolution
- Status only emits SUCCESS / PENDING / NOT_FOUND. There's no explicit failure state.
- Long-stuck NOT_FOUND or PENDING is the only failure signal we can surface.
- Always provide source chain explorer link as fallback so users can verify the source tx state independently.

### Multiple bridges available — which to pick
`routerList[]` is a multi-bridge list. When it has more than one entry:
- **Server-default sort (no `--bridge-id`, no `--sort`)**: top entry is the optimal route by `sort=0` (cheapest with reasonable speed). Recommend this as default.
- **User wants fastest**: re-run `quote` with `--sort=1` (when CLI exposes it) or pin a faster bridge from the table via `--bridge-id`.
- **User wants max output**: `--sort=2` or pin a low-fee bridge.
- **Want to enumerate all bridges explicitly**: loop `quote --bridge-id <id>` over each `bridgeId` returned by `bridges` — useful for debugging.

### Network error
Retry once. If still fails, generate diagnostic summary and prompt user.

## Approval polling pattern

After `cross-chain execute --confirm-approve` returns `action=approved`, poll the approval tx in the main conversation. Reference loop:

```bash
for i in $(seq 1 30); do
  out=$(ONCHAINOS_HOME=... onchainos --base-url ... wallet history \
          --order-id <approveOrderId> --chain <fromChainIndex> 2>/dev/null)
  st=$(echo "$out" | python3 -c "import sys,json; d=json.load(sys.stdin); print((d.get('data') or [{}])[0].get('txStatus',''))")
  th=$(echo "$out" | python3 -c "import sys,json; d=json.load(sys.stdin); print((d.get('data') or [{}])[0].get('txHash',''))")
  echo "Check #$i: status=${st:-pending} txHash=$th"
  case "$st" in
    SUCCESS) break;;
    FAIL|FAILED) break;;
  esac
  sleep 2
done
```

Pitfalls ("looks-stuck" loop):
- **Identifier**: pre-prod `--confirm-approve` often returns `approveTxHash: ""` and only `approveOrderId`. Poll `--order-id` first, fall back to `--tx-hash`. `wallet history --order-id` returns `data` as an **array** — status is at `data[0].txStatus`; `data.txStatus` is always empty and the loop never breaks.
- **Do NOT** capture all 30 responses into one variable and `echo` at the end — the Claude Code tool layer buffers output until the command exits, so the loop appears stuck.
- **Do NOT** put `sleep 2` at the top of the loop body — it wastes 2 s before the first check.
- **zsh trap**: never name the variable `status` — it is read-only in zsh (equivalent to `$?`) and assignment aborts the loop with `(eval):1: read-only variable: status`, even though the JSON is fine. Use `st` (or `tx_status` / `cc_status`); never lowercase `status=`.

Stop on `txStatus=SUCCESS` / `FAIL`, or after 30 attempts (60 s timeout).

## Status Polling Patterns

```bash
# Exponential backoff (recommended)
# Note: --bridge-id and --from-chain are REQUIRED (server returns 50014 without them).
# Use the bridgeId / fromChainIndex returned by `cross-chain execute` (selectedRoute) or pin from the user's quote choice.
#
# zsh trap: do NOT name the variable `status` — `status` is read-only in zsh
# (equivalent to $?) and assignment will abort the loop with
# `(eval):1: read-only variable: status`. Use `st` (or any other name).
DELAYS=(10 20 40 60 60 60 60 60 60 60)
for delay in "${DELAYS[@]}"; do
  sleep "$delay"
  resp=$(onchainos cross-chain status --tx-hash <fromTxHash> --bridge-id <bridgeId> --from-chain <chainIndex>)
  st=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['status'])")
  case "$st" in
    SUCCESS) echo "Cross-chain complete"; break;;
    PENDING) echo "Still bridging...";;
    NOT_FOUND) echo "Bridge has not yet indexed the tx";;
  esac
done
```

Total polling window ≈ original `estimateTime × 5`. After that window, escalate to support.

## Bridge Explorer References

For long-stuck cases, point users to the bridge's own scan page. The list below covers the protocols currently returned by `cross-chain bridges`. If a new protocol appears in `bridges`, look up its scan page on the project's own docs before referring users to it.

- Stargate / LayerZero: https://layerzeroscan.com/
- ACROSS V3: https://across.to/transactions
- Relay: https://relay.link/transactions
- Gas.zip: https://www.gas.zip/scan

(Map `bridgeId` → bridge name → scan URL via `cross-chain bridges` lookup.)
