# Onchain OS DEX Strategy — Backend Schema Reference

Wire-level detail behind the strategy CLI. The SKILL.md flow does **not** require this — the CLI maps flags and auto-injects auth/wallet context. Load this only when you need the BE request shape or the current capability boundary.

## `getOpenOrder` request body fields

`onchainos strategy list` (page-query mode, i.e. `--order-id` omitted) POSTs `getOpenOrder`. The agent never builds this body; it only sets the mapped flags. Reference only:

| field | type | required | meaning |
|---|---|---|---|
| `accountId` | String | Y | Account ID, used for JWT auth. CLI auto-injects from the current session; the agent does not pass this |
| `walletAddressList` | List\<String\> | Y | Wallet address list. CLI auto-injects from the current wallet context (EVM + SOL) |
| `chainIdList` | List\<String\> | N | Chain ID filter; omit to query all chains. Mapped from `--chain-id` |
| `orderStatusList` | List\<Integer\> | N | Status filter. CLI defaults to the 5 non-terminal codes when `--status` is omitted |
| `orderTypeList` | List\<Integer\> | N | Order-type filter; not currently used |
| `idList` | List\<String\> | N | Exact-match filter by order ID; no dedicated flag — use `--order-id` (detail mode) instead |
| `tokenAddress` | String | N | Filter by a single token address. Mapped from `--token`. For multi-token queries, call `list` once per token (CLI rejects CSV input with a friendly error) |
| `limit` | Integer | N | Page size; BE default 100, max 100. Agent passes `--limit 10` for default list rendering |
| `cursor` | String | N | Pagination cursor (Base64). Omit on first page; pass the previous response's `nextCursor`. Mapped from `--cursor` |

## Current limitations

| Item | Status |
|---|---|
| Symbol → address resolution for `--from-token` / `--to-token` | Not in scope; pass token addresses directly |
| Custom preset (advanced fee tiers, dexId filter) | Default preset only. MEV protection is supported via `--mev-protection <on/off/default>` (see SKILL §1 flag table). |
| Events stream / cursor consumption | `eventCursor` is surfaced verbatim; no consumer yet |
| `cancel --all` source-channel filter | Pass-through to BE default; CLI does not pre-filter |
| Multi-account batch | Out of scope; CLI uses the active account only |
| `get_account_status` | Intentionally not implemented. SA activation / expiry is handled transparently inside the 60018 (UPGRADE_REQUIRED) flow — just call the intended subcommand and let the CLI handle activation on demand |
