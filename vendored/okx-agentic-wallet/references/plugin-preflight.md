# Third-Party Plugin Pre-flight (Solana)

> Load before dispatching a third-party Solana DeFi plugin command that performs an on-chain write.

Third-party Solana DeFi plugins (e.g. `kamino-plugin`, `raydium-plugin`) call `onchainos wallet contract-call --force` internally. Pre-flight Gas Station status on Solana before invoking the plugin's write command.

Gas Station is Solana-only: the Relayer is the native fee payer, and gas is debited via an SPL stablecoin transfer inside the same multi-signer transaction.

## Pre-flight checklist

Before a plugin command that performs an on-chain write (`--confirm` / `execute` / `--broadcast`):

1. Resolve `<from>` from the plugin invocation.
2. Run:
   ```bash
   onchainos wallet gas-station status --chain solana [--from <solana_address>]
   ```
3. Branch on `data.recommendation`:

| Recommendation | Action |
|---|---|
| `READY` | Proceed to plugin invocation. |
| `ENABLE_GAS_STATION` | Render `references/gas-station.md` Scene A using `data.tokenList`. On consent, run `onchainos wallet gas-station enable --chain solana`. To pin the picked token, also run `onchainos wallet gas-station update-default-token --chain solana --gas-token-address <picked>`. Then proceed to the plugin command. |
| `INSUFFICIENT_ALL` | Render `references/gas-station.md` Scene E. |
| `HAS_PENDING_TX` | Tell the user to wait for the pending GS tx to clear. |

## Skip pre-flight when

- The plugin invocation is dry-run / simulation.
- The plugin command is read-only (e.g. `kamino-plugin positions`, `health-factor`, `reserves`, `quickstart`).
- `status` already returned `READY` for this `(solana, from)` tuple in the current conversation.

## Reactive recovery (plugin already failed)

When a plugin returns a vague error, follow `references/gas-station.md` → "Plugin Bail Recovery" (the authoritative procedure). If the plugin swallowed stdout so no Confirming JSON is visible, fall back to running `onchainos wallet gas-station status --chain solana [--from <addr>]` and branch per the Pre-flight checklist above. The exit-code quick-reference:

## Exit codes (seen through a plugin)

| Exit | Meaning | Agent action |
|---|---|---|
| `0` | Success | Continue. |
| `1` | Real error | Surface to user. |
| `2` | Gas Station Confirming — stdout carries `"confirming": true` + `"scene"` (Scene A / Scene C). Recoverable. | Parse `scene`, dispatch via "Plugin Bail Recovery", re-invoke the same plugin command verbatim. |
