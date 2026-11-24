# 1inch MCP tools -- reference

Production endpoint: `https://api.1inch.com/mcp/protocol`.

Tools expose **safety hints** to clients: read-only tools use `readOnlyHint`; tools that can change on-chain or remote state use `destructiveHint`.

## Public tools

### `search`

Search documentation, API references, and SDK guides.

| Parameter      | Type    | Required | Notes                      |
| -------------- | ------- | -------- | -------------------------- |
| `query`        | string  | Yes      | Search string              |
| `limit`        | number  | No       | 1-100, page size           |
| `page`         | number  | No       | 1-based pagination         |
| `include_body` | boolean | No       | Include full document body |

### `list_examples`

No parameters. Returns available SDK example identifiers.

### `get_example`

| Parameter | Type   | Required | Notes                                 |
| --------- | ------ | -------- | ------------------------------------- |
| `name`    | string | Yes      | Example id from `list_examples`       |
| `file`    | string | No       | Specific file path inside the example |

## Authenticated tools

Require API key or OAuth session. See [AUTH.md](AUTH.md). Call **`authenticate` first** if you are not already a real user (initialize 200 is still anonymous).

### `authenticate`

No parameters. Call this to start or confirm 1inch Business login. HTTP 401 means you are still anonymous. After OAuth, call again until `{ authenticated: true, organizationId, ... }`. Then use the paid tools below.

### `swap`

Token swaps (classic, Fusion, cross-chain). Supports quote-only mode (`quoteOnly: true`), execution (returns txs or typed data to sign), and submission (`signedOrder` / `orderHash` for Fusion/cross-chain).

Key parameters: `src`, `dst`, `amount`, `chain`, `from`, optional `quoteOnly`, `preferredType`, `dstChain`, `slippage`, `signedOrder`, `orderHash`.

Prefer the product docs for the full parameter matrix and flows.

### `orderbook`

Limit orders via Orderbook API v4.1. **action** is required: `build` | `create` | `list` | `cancel`.

Typical flow: `build` -> user signs typed data -> `create` with signature.

### `product_api`

Proxy to 1inch product REST APIs.

| Parameter | Type                | Required | Notes                                 |
| --------- | ------------------- | -------- | ------------------------------------- |
| `method`  | `"GET"` or `"POST"` | No       | Default `GET`                         |
| `path`    | string              | Yes      | API path (e.g. portfolio, price, gas) |
| `query`   | object              | No       | Query string map                      |
| `body`    | object              | No       | JSON body for POST                    |

Because the tool can perform writes via POST, it is marked **destructive** at the MCP layer even when `method` is GET.

For exact call recipes (spot price, gas, portfolio, Web3 RPC, etc.), load the domain skills `1inch-market-data`, `1inch-wallet-data`, or `1inch-infrastructure`.

### `debug`

**Optional** — the server only registers this tool when request-log lookup is enabled for the deployment. It does not appear in `tools/list` otherwise.

Org-scoped production debugging: look up application request logs. Requires the same **authenticated** access as other protected tools (Bearer and/or OAuth per gateway); organization scope comes from the gateway context.

**Modes:** (1) pass `requestId` (e.g. `x-request-id`) with optional `startTime` / `endTime` (defaults: 24h lookback to `endTime` or now). (2) omit `requestId` and pass `startTime` and `endTime` (RFC3339), with optional `logLevel` (`info` | `warn` | `error`) and `limit` (1–100, default 50).

## Optional public tools

### `walletconnect`

**Optional** — registered when WalletConnect is configured. Non-custodial pairing (`connect` / `status` / `sign` / `send_transaction` / `disconnect`). See skill `1inch-walletconnect`.

### `aqua`

**Optional** — registered when Unleash flag `mcp-service.tool.aqua` is on. Aqua strategy analytics (and optional write builders). Prefer this over raw `product_api` for Aqua. See skill `1inch-aqua`.

## Machine-readable API index

For discovering `product_api` paths: `https://business.1inch.com/portal/llms.txt`, or MCP resource `file://1inch-mcp/guides/api-index` (gateway path notes grouped by Trading & Liquidity, Wallet & Data, Market Data, Infrastructure).
