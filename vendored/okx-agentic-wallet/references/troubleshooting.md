# Wallet Troubleshooting

> Load this file when a wallet operation fails or an edge case is encountered.

## Edge Cases

### Send
- **Insufficient balance**: Check balance first. Warn if too low (include gas estimate for EVM).
- **Wrong chain for token**: `--contract-token` must exist on the specified chain.

### History
- **No transactions**: Display "No transactions found" — not an error.
- **Detail mode without chain**: CLI requires `--chain` with `--tx-hash`. Ask user which chain.
- **Detail mode `--address`**: optional — the backend matches by `--tx-hash` / `--order-id` / `--uop-hash`. Pass the current account's address only as a hint.
- **Empty cursor**: No more pages.

### Contract Call
- **Missing input-data and unsigned-tx**: CLI requires exactly one. Command will fail if neither is provided.
- **Invalid calldata**: Malformed hex causes API error. Help re-encode.
- **Simulation failure**: Show `executeErrorMsg`, do NOT broadcast.
- **Insufficient gas**: Suggest `--gas-limit` for higher limit.

### Common (all sections)
- **Region restriction (error code 50125 or 80001)**: Do NOT show raw error code. Display: "Service is not available in your region. Please switch to a supported region and try again."
- **Not logged in** (`not logged in` error): Session expired or wallet store missing. Tell user to run `wallet login` + `wallet verify`.
- **Confirming response (exit code 2, error code 81362)**: Not an error — backend requires user confirmation. Display the `message` and follow instructions in `next`. Re-run with `--force` (or with Gas Station params) per the scenario.

---

## Gas Station — Solana (`wallet send` / `wallet contract-call` with insufficient SOL)

`references/gas-station.md` owns the end-to-end flow, the **Outcome → render map** (scene dispatch), and all verbatim product copy; `references/gas-station-edge.md` owns the edge-case templates. This section covers only what those two files don't: **backend errors and bugs surfaced during the two-phase flow**.

> **Scene dispatch** — read the CLI `scene` discriminator and dispatch via the gas-station.md "Outcome → render map". Do NOT re-derive the scene from raw backend booleans (`gasStationUsed` / `hasPendingTx` / `insufficientAll` / `hash`).
>
> **Non-trigger scenarios** (native SOL transfer / Jito Bundle / single-tx > 100,000 U / a pending GS tx / chain ≠ Solana) — backend returns `gasStationUsed=false` and the normal native-gas flow runs. Do NOT proactively mention Gas Station. If the user asks why stablecoin gas didn't apply, render the matching template from `gas-station-edge.md` (Edge Case 1 / 2 / 6) or the "which scenarios do NOT trigger" answer in `gas-station-faq.md`.

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

Broadcast is asynchronous (`orderId` returned, `txHash` eventual). For the normal async-hash / Relayer-timeout / order-status / history-display copy, use `gas-station-edge.md` (Edge Case 3 / 5 / 7) and the Universal Gas Station Success Reply in `gas-station.md`. Treat the following as **backend bugs** if observed:

| Symptom | Agent response |
|---|---|
| Network fee shown in SOL instead of the stablecoin actually used | Report as backend bug. Do NOT manually convert. |
| `from` / history shows the Relayer address instead of the user's | Report as backend bug. |

### Management command failures

| Command | Failure mode | Agent response |
|---|---|---|
| `wallet gas-station update-default-token` | API error | Show the error message; do NOT retry automatically. Common causes: invalid token address, chain not supported, not logged in. |
| `wallet gas-station enable` / `disable` | API error | Show the error message; do NOT retry automatically. (Agent-internal: `disable` is DB-only and re-enabling later is instant — never paraphrase this to the user; see `gas-station.md` User-Facing Reply Templates.) |

### Agent output vocabulary

See `gas-station.md` — "User Intent Recognition" MUST block for the authoritative vocabulary rules and ban list. Do not duplicate here.
