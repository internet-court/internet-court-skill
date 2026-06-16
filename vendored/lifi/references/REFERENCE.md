# LI.FI API Reference

Complete endpoint documentation, request/response schemas, and error codes for the LI.FI APIs:

- **Core API** (swaps, bridges, Composer): `https://li.quest/v1`
- **Earn Data API** (yield discovery): `https://earn.li.fi/v1`
- **Intents API** (solver marketplace): `https://order.li.fi`

Machine-readable sources: OpenAPI spec `https://docs.li.fi/openapi.yaml`, Earn OpenAPI `https://docs.li.fi/earn-openapi.yaml`, docs index `https://docs.li.fi/llms.txt`. Any docs.li.fi page is fetchable as raw markdown by appending `.md` to its URL.

## Table of Contents

- [Base Configuration](#base-configuration)
- [Quote Endpoints](#quote-endpoints)
- [Advanced Routes Endpoints](#advanced-routes-endpoints)
- [Status Endpoint](#status-endpoint)
- [Chains, Tokens, Tools, Connections](#chains-endpoint)
- [Gas Endpoints](#gas-endpoints)
- [Calldata Parse Endpoint](#calldata-parse-endpoint)
- [Analytics Endpoints](#analytics-endpoints)
- [Integrator Fee Endpoints](#integrator-fee-endpoints)
- [Routing Presets](#routing-presets)
- [Composer](#composer)
- [Earn Data API](#earn-data-api)
- [LI.FI Intents API](#lifi-intents-api)
- [Response Schemas](#response-schemas)
- [Error Reference](#error-reference)
- [Chain IDs](#chain-ids)
- [Common Token Addresses](#common-token-addresses)

## Base Configuration

### Base URL

```
https://li.quest/v1        (production)
https://staging.li.quest   (staging)
```

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `x-lifi-api-key` | No | API key for higher rate limits (Partner Portal: https://portal.li.fi/) |
| `Content-Type` | For POST | `application/json` |

Test a key with `GET /v1/keys/test`.

### Rate Limits

Without API key:

| Endpoint | Limit |
|----------|-------|
| `/quote`, `/advanced/routes` | 75 requests / 2 hours |
| `/advanced/stepTransaction` | 50 requests / 2 hours |
| Other public endpoints | 100 requests / minute |

With API key: default **100 RPM** across all endpoints. Quote-family endpoints are enforced on a 2-hour rolling window (RPM × 120, e.g. 100 RPM → 12,000 / 2h). Higher limits via the Partner Portal.

Response headers: `ratelimit-limit` (total for the window), `ratelimit-remaining`, `ratelimit-reset` (seconds until reset; 7200 = 2h). Exceeding returns 429 with error code `1005`.

## Quote Endpoints

### GET /quote

Returns a single-step quote with transaction data.

**URL:** `https://li.quest/v1/quote` — **Method:** `GET`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromChain` | string | Yes | Source chain ID or key |
| `toChain` | string | Yes | Destination chain ID or key (same as fromChain for same-chain swap) |
| `fromToken` | string | Yes | Source token address **or symbol** |
| `toToken` | string | Yes | Destination token address or symbol. A supported vault/staking token address triggers [Composer](#composer) |
| `fromAmount` | string | Yes | Amount in smallest unit (wei) |
| `fromAddress` | string | Yes | Sender wallet address |
| `toAddress` | string | No | Recipient address (defaults to fromAddress) |
| `slippage` | number | No | 0–1 decimal; 0.005 = 0.5% (default) |
| `integrator` | string | No | Integrator identifier (alphanumeric + `-_.`, max 23 chars; defaults to `lifi-api`) |
| `fee` | number | No | Integrator fee (0.02 = 2%, must be < 1) |
| `referrer` | string | No | Referrer tracking |
| `order` | string | No | `CHEAPEST` (effective default) or `FASTEST` |
| `preset` | string | No | Routing preset, e.g. `stablecoin`. Pattern `^[a-zA-Z0-9-_]+$`, 1–50 chars. See [Presets](#routing-presets) |
| `allowBridges` | string[] | No | Bridge keys (or `all`, `none`, `default`, `[]`) |
| `denyBridges` / `preferBridges` | string[] | No | Bridge keys |
| `allowExchanges` / `denyExchanges` / `preferExchanges` | string[] | No | Exchange keys |
| `allowDestinationCall` | boolean | No | Allow contract calls on destination (default: true) |
| `fromAmountForGas` | string | No | Portion of the amount converted to destination gas |
| `maxPriceImpact` | number | No | Hide routes above this impact (default: 0.10 = 10%) |
| `skipSimulation` | boolean | No | Skip TX simulation for faster response (gas limit less accurate) |
| `svmPriorityFeeLevel` | string | No | Solana priority fee: `NORMAL` \| `FAST` \| `ULTRA` |
| `swapStepTimingStrategies` | string[] | No | Format `minWaitTime-{minWaitTimeMs}-{startingExpectedResults}-{reduceEveryMs}`, e.g. `minWaitTime-600-4-300` |
| `routeTimingStrategies` | string[] | No | Same format |

**Responses:** 200 Step (with `transactionRequest`); 400 InvalidQuoteRequest; 404 QuoteNotFound.

### Example Request

```bash
curl "https://li.quest/v1/quote?\
fromChain=1&toChain=137&\
fromToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&\
toToken=0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359&\
fromAmount=1000000000&\
fromAddress=0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0&\
slippage=0.005&integrator=your-app"
```

### Response Schema

```json
{
  "id": "string",
  "type": "lifi",
  "tool": "string",
  "toolDetails": { "key": "string", "name": "string", "logoURI": "string" },
  "action": {
    "fromChainId": "number",
    "toChainId": "number",
    "fromToken": "Token",
    "toToken": "Token",
    "fromAmount": "string",
    "slippage": "number",
    "fromAddress": "string",
    "toAddress": "string"
  },
  "estimate": {
    "fromAmount": "string",
    "toAmount": "string",
    "toAmountMin": "string",
    "approvalAddress": "string",
    "executionDuration": "number",
    "feeCosts": "FeeCost[]",
    "gasCosts": "GasCost[]"
  },
  "transactionRequest": {
    "to": "string",
    "from": "string",
    "data": "string",
    "value": "string (hex)",
    "gasLimit": "string (hex)",
    "gasPrice": "string (hex)",
    "chainId": "number"
  },
  "includedSteps": "Step[]"
}
```

Note: `transactionRequest.value`, `gasLimit`, `gasPrice` are **hex strings**; `chainId` is a plain number. Quotes expire after ~60 seconds.

### GET /quote/toAmount

Calculates the required `fromAmount` based on a desired `toAmount`. Same parameters as `/quote` except `toAmount` (required) replaces `fromAmount`. Does not support `preset`, `fromAmountForGas`, or `skipSimulation`.

**URL:** `https://li.quest/v1/quote/toAmount`

### POST /quote/contractCalls

Bridge tokens and perform arbitrary contract calls on the destination chain (manual calldata). For supported DeFi protocols, prefer [Composer](#composer) — it requires no calldata construction.

**URL:** `https://li.quest/v1/quote/contractCalls` — **Method:** `POST`

```json
{
  "fromChain": "number (required) - Sending chain ID or key",
  "fromToken": "string (required) - Token address or symbol",
  "fromAddress": "string (required) - Wallet address",
  "toChain": "number (required) - Receiving chain ID or key",
  "toToken": "string (required) - Token required by contract interaction",
  "toAmount": "string (required) - Amount required for contract interaction",
  "toFallbackAddress": "string (optional) - Fallback address if call fails",
  "contractOutputsToken": "string (optional) - Token output from contract (e.g., staking)",
  "slippage": "number (optional)",
  "integrator": "string (optional)",
  "referrer": "string (optional)",
  "fee": "number (optional, <1)",
  "allowBridges": "string[] (optional)",
  "denyBridges": "string[] (optional)",
  "preferBridges": "string[] (optional)",
  "allowExchanges": "string[] (optional)",
  "denyExchanges": "string[] (optional)",
  "preferExchanges": "string[] (optional)",
  "allowDestinationCall": "boolean (optional, default: true)",
  "contractCalls": [
    {
      "fromAmount": "string (required) - Expected amount for this call",
      "fromTokenAddress": "string (required) - Input token address",
      "toTokenAddress": "string (optional) - Output token address if any",
      "toContractAddress": "string (required) - Contract to interact with",
      "toContractCallData": "string (required) - Encoded call data",
      "toContractGasLimit": "string (required) - Gas limit for the call",
      "toApprovalAddress": "string (optional) - If different from contract",
      "toFallbackAddress": "string (optional) - Fallback if call fails"
    }
  ]
}
```

## Advanced Routes Endpoints

### POST /advanced/routes

Returns multiple route options for comparison. Routes do not include transaction data — use `/advanced/stepTransaction` per step.

**URL:** `https://li.quest/v1/advanced/routes` — **Method:** `POST`

Note the different naming vs `/quote`: `fromChainId`/`toChainId` (numbers), `fromTokenAddress`/`toTokenAddress` (addresses only, no symbols).

```json
{
  "fromChainId": "number (required)",
  "toChainId": "number (required)",
  "fromTokenAddress": "string (required)",
  "toTokenAddress": "string (required)",
  "fromAmount": "string (required)",
  "fromAddress": "string (optional)",
  "toAddress": "string (optional)",
  "fromAmountForGas": "string (optional)",
  "options": {
    "slippage": "number",
    "order": "CHEAPEST | FASTEST",
    "integrator": "string",
    "fee": "number (<1)",
    "referrer": "string",
    "preset": "string (e.g. 'stablecoin')",
    "maxPriceImpact": "number (default: 0.1)",
    "allowSwitchChain": "boolean (default: false)",
    "allowDestinationCall": "boolean (default: true)",
    "bridges": { "allow": "string[]", "deny": "string[]", "prefer": "string[]" },
    "exchanges": { "allow": "string[]", "deny": "string[]", "prefer": "string[]" },
    "timing": {
      "swapStepTimingStrategies": [{
        "strategy": "minWaitTime",
        "minWaitTimeMs": "number (0-15000)",
        "startingExpectedResults": "number (0-100)",
        "reduceEveryMs": "number (0-15000)"
      }],
      "routeTimingStrategies": [{ "...": "same shape" }]
    }
  }
}
```

### Response Schema

```json
{
  "routes": [
    {
      "id": "string",
      "fromChainId": "number",
      "toChainId": "number",
      "fromToken": "Token",
      "toToken": "Token",
      "fromAmount": "string",
      "fromAmountUSD": "string",
      "toAmount": "string",
      "toAmountMin": "string",
      "toAmountUSD": "string",
      "gasCostUSD": "string",
      "steps": "Step[]",
      "tags": "string[]",
      "containsSwitchChain": "boolean (optional)"
    }
  ],
  "unavailableRoutes": {
    "filteredOut": [{ "overallPath": "string", "reason": "string" }],
    "failed": [{ "overallPath": "string", "subpaths": "object" }]
  }
}
```

### POST /advanced/stepTransaction

Populate a step (from `/advanced/routes`) with transaction data.

**URL:** `https://li.quest/v1/advanced/stepTransaction` — **Method:** `POST`

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `skipSimulation` | boolean | No | Skip TX simulation |
| `svmPriorityFeeLevel` | string | No | `NORMAL` \| `FAST` \| `ULTRA` (Solana) |
| `mayanNonEvmPermitSignature` | boolean | No | Mayan non-EVM → Hyperliquid flows |

**Request body:** the full `Step` object from a route. **Response:** the Step with `transactionRequest` populated.

### Deprecated

`POST /advanced/possibilities` is **deprecated** — use `/chains`, `/tokens`, `/tools`, `/connections` instead.

## Status Endpoint

### GET /status

Track a transaction. Returns 200 even if the tx is not found yet.

**URL:** `https://li.quest/v1/status` — **Method:** `GET`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `txHash` | string | Yes | Sending tx hash, receiving tx hash, or LI.FI step/transaction id |
| `fromChain` | string | No | Source chain ID or key (**recommended — speeds up response**) |
| `toChain` | string | No | Destination chain ID or key |
| `bridge` | string | No | Bridge tool key (the quote's `tool`); omit for swaps |

For same-chain swaps, set `fromChain` = `toChain`.

### Response Schema

```json
{
  "transactionId": "string",
  "sending": {
    "txHash": "string", "txLink": "string", "amount": "string",
    "token": "Token", "chainId": "number", "gasPrice": "string",
    "gasUsed": "string", "gasToken": "Token", "gasAmount": "string",
    "gasAmountUSD": "string", "amountUSD": "string", "value": "string",
    "timestamp": "number"
  },
  "receiving": { "...same shape as sending": "" },
  "lifiExplorerLink": "string",
  "fromAddress": "string",
  "toAddress": "string",
  "tool": "string",
  "status": "NOT_FOUND | INVALID | PENDING | DONE | FAILED",
  "substatus": "string",
  "substatusMessage": "string",
  "metadata": { "integrator": "string" }
}
```

### Status Values

| Status | Description | Agent action |
|--------|-------------|--------------|
| `NOT_FOUND` | Not yet mined/indexed | Keep polling |
| `INVALID` | Hash not tied to the requested tool | Check params |
| `PENDING` | Bridging in progress | Keep polling |
| `DONE` | Completed — check `substatus` | — |
| `FAILED` | Bridging failed permanently | Check `substatus`, inform user |

Recommended polling backoff: 10s (attempts 1–6) → 30s (7–12) → 60s (13–24) → 120s (25+).

### Substatus Values (PENDING)

| Substatus | Description |
|-----------|-------------|
| `WAIT_SOURCE_CONFIRMATIONS` | Waiting for source chain confirmations |
| `WAIT_DESTINATION_TRANSACTION` | Waiting for destination transaction |
| `BRIDGE_NOT_AVAILABLE` | Bridge API is unavailable |
| `CHAIN_NOT_AVAILABLE` | Source/destination chain RPC unavailable |
| `REFUND_IN_PROGRESS` | Refund in progress (if supported) |
| `UNKNOWN_ERROR` | Status is indeterminate |

### Substatus Values (DONE)

| Substatus | Description | Handling |
|-----------|-------------|----------|
| `COMPLETED` | Transfer successful, exact token received | None |
| `PARTIAL` | Different token received — full value preserved (common with across, hop, stargate). User typically holds the bridge token on the destination chain | Offer same-chain recovery swap (`fromChain=toChain=receiving.chainId`, `fromToken=receiving.token`, `toToken=intended token`). Skip if gas > ~10% of value |
| `REFUNDED` | Tokens returned to sender (source chain) | May retry with fresh quote |

### Substatus Values (FAILED)

| Substatus | Description |
|-----------|-------------|
| `NOT_PROCESSABLE_REFUND_NEEDED` | Cannot complete, manual refund needed |
| `OUT_OF_GAS` | Transaction ran out of gas |
| `SLIPPAGE_EXCEEDED` | Received amount too low |
| `INSUFFICIENT_ALLOWANCE` | Not enough allowance |
| `INSUFFICIENT_BALANCE` | Not enough balance |
| `EXPIRED` | Transaction expired |
| `UNKNOWN_ERROR` | Unknown or invalid state |
| `REFUNDED` | Tokens were refunded |

## Chains Endpoint

### GET /chains

**URL:** `https://li.quest/v1/chains`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chainTypes` | string | No | Comma-separated: `EVM`, `SVM`, `UTXO`, `MVM`, `TVM`. **If omitted, returns EVM chains only** |

```bash
curl "https://li.quest/v1/chains?chainTypes=EVM,SVM,UTXO,MVM,TVM"
```

### Response Schema

```json
{
  "chains": [
    {
      "id": "number",
      "key": "string",
      "name": "string",
      "chainType": "EVM | SVM | UTXO | MVM | TVM",
      "coin": "string",
      "mainnet": "boolean",
      "logoURI": "string",
      "tokenlistUrl": "string",
      "multicallAddress": "string",
      "metamask": {
        "chainId": "string",
        "chainName": "string",
        "nativeCurrency": { "name": "string", "symbol": "string", "decimals": "number" },
        "rpcUrls": "string[]",
        "blockExplorerUrls": "string[]"
      },
      "nativeToken": "Token"
    }
  ]
}
```

## Tokens Endpoint

### GET /tokens

**URL:** `https://li.quest/v1/tokens`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chains` | string | No | Comma-separated chain IDs or keys (e.g., `POL,DAI`) |
| `tags` | string | No | Comma-separated token tags, e.g. `stablecoin` |
| `chainTypes` | string | No | Filter: `EVM,SVM,UTXO,MVM,TVM` |
| `minPriceUSD` | number | No | Min token price filter (default: 0.0001) |

```bash
curl "https://li.quest/v1/tokens?chains=1,8453&tags=stablecoin"
```

**Response:** `{ "tokens": { "<chainId>": [ Token, ... ] } }`

### GET /token

**URL:** `https://li.quest/v1/token`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chain` | string | Yes | Chain ID or key (e.g., `POL` or `137`) |
| `token` | string | Yes | Token address or symbol (e.g., `DAI`) |

Errors: 400 invalid chain; 404 token not found.

## Tools Endpoint

### GET /tools

Get available bridges and exchanges; the source of valid keys for `allowBridges`/`denyBridges`/`allowExchanges`/`denyExchanges`.

**URL:** `https://li.quest/v1/tools` — optional `chains` filter.

```json
{
  "bridges": [
    { "key": "string", "name": "string", "logoURI": "string",
      "supportedChains": [{ "fromChainId": "number", "toChainId": "number" }] }
  ],
  "exchanges": [
    { "key": "string", "name": "string", "logoURI": "string",
      "supportedChains": ["number[]"] }
  ]
}
```

Tool keys are **dynamic** — always fetch from `/tools`. Special values for filters: `all`, `none`, `default`, `[]`. Example bridge keys: `relay`, `stargateV2`, `across`, `mayan`, `glacis`, `eco`, `gasZipBridge`, `celercircle`. Example exchange keys: `1inch`, `lifidexaggregator`, `paraswap`, `0x`, `openocean`.

## Connections Endpoint

### GET /connections

**URL:** `https://li.quest/v1/connections`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromChain` / `toChain` | string | No* | Chain ID or key |
| `fromToken` / `toToken` | string | No | Token address or symbol |
| `chainTypes` | string | No | `EVM,SVM,...` |
| `allowBridges` / `denyBridges` / `preferBridges` | string[] | No | Bridge keys |
| `allowExchanges` / `denyExchanges` / `preferExchanges` | string[] | No | Exchange keys |
| `allowSwitchChain` | boolean | No | Default true |
| `allowDestinationCall` | boolean | No | Default true |

*At least one filter parameter is required.

**Response:** `{ "connections": [{ "fromChainId", "toChainId", "fromTokens": Token[], "toTokens": Token[] }] }`

## Gas Endpoints

### GET /gas/prices

Current gas prices for all enabled chains.

```json
{ "1": { "standard": "number", "fast": "number", "fastest": "number", "lastUpdated": "number" } }
```

### GET /gas/prices/{chainId}

Gas price for a specific chain.

### GET /gas/suggestion/{chain}

Suggested destination gas amount. Optional `fromChain` + `fromToken` for source-token conversion.

```json
{
  "available": true,
  "recommended": { "token": "Token", "amount": "string", "amountUsd": "string" },
  "limit": { "token": "Token", "amount": "string", "amountUsd": "string" },
  "fromToken": "Token (if fromChain/fromToken specified)",
  "fromAmount": "string (if fromChain/fromToken specified)"
}
```

### GET /gas/status — LIFuel Transaction Status

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `txHash` | string | Yes | LIFuel transaction hash |

**Response:** `{ "status": "NOT_FOUND | PENDING | DONE", "sending": TxInfo, "receiving": TxInfo }` where TxInfo = `{ txHash, txLink, amount, token, chainId, block }`.

### GET /gas/refetch — DEPRECATED

Force relay retry (`txHash`, `chainId`). Marked deprecated — avoid.

## Calldata Parse Endpoint

### GET /calldata/parse (beta)

Decode LI.FI transaction calldata into named function calls (recursively decodes nested `_swapData[]`).

**URL:** `https://li.quest/v1/calldata/parse` — **Method:** `GET` (not POST)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `callData` | string | Yes | The calldata to parse |
| `chainId` | string | No | Chain the tx is built for |

**Response:** array of `{ "functionName": "string", "functionParameters": { ... } }`.

## Analytics Endpoints

### GET /v1/analytics/transfers — Filtered transfers list

All parameters optional:

| Parameter | Type | Description |
|-----------|------|-------------|
| `integrator` | string | Filter by integrator ID |
| `wallet` | string | Sending OR receiving wallet |
| `status` | string | `ALL` \| `DONE` \| `PENDING` \| `FAILED` (default `DONE`) |
| `fromTimestamp` / `toTimestamp` | number | Unix seconds (defaults: 30 days ago / now) |
| `fromChain` / `toChain` | string | Chain filters |
| `fromToken` | string | Requires `fromChain` |
| `toToken` | string | Requires `toChain` |

**Response:** `{ "transfers": [ StatusResponse, ... ] }` — **capped at 1000 transfers, no pagination.** Use v2 for more.

### GET /v2/analytics/transfers — Paginated transfers list

Same filters as v1, plus `integrator` accepts string or string[], and cursor pagination:

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Default 10 |
| `next` / `previous` | string | Cursors from prior response |

**Response:** `{ "hasNext", "hasPrevious", "next", "previous", "data": [ StatusResponse, ... ] }`

### GET /v1/analytics/transfers/summary — Token amount received (cross-chain)

Aggregates amounts received per destination address, **cross-chain transfers only**.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromTimestamp` | string | Yes | Unix seconds, inclusive |
| `toTimestamp` | string | Yes | Inclusive — **max range 30 days** |
| `toChain` | string | Yes | Destination chain |
| `toToken` | string | Yes | Address or symbol |
| `fromChain` | string | No | Source chain filter |
| `integrator` | string | No | Integrator filter |
| `limit` / `next` / `previous` | — | No | Pagination |

**Response:** PaginatedResult with `data: [{ "id": { "toAddress", "sendingChainId" }, "totalReceivedAmount" }]`.

### Deprecated

`GET /v1/analytics/wallets/{wallet_address}` is **deprecated**.

## Integrator Fee Endpoints

Integrator fees are set via the `fee` + `integrator` params on quote endpoints, collected in the FeeCollector contract, and withdrawn here.

### GET /integrators/{integratorId} — Collected fees

**Response:**

```json
{
  "integratorId": "string",
  "feeBalances": [
    {
      "chainId": "number",
      "tokenBalances": [
        { "token": "Token", "amount": "string", "amountUsd": "string" }
      ]
    }
  ]
}
```

404 if integrator not found.

### GET /integrators/{integratorId}/withdraw/{chainId} — Fee withdrawal TX

Optional query `tokenAddresses` (string[]) — withdraw only those tokens.

**Response:** `{ "transactionRequest": { "data": "string", "to": "string" } }` — `to` is the FeeCollector contract on that chain. Sign and send from the integrator's wallet. 400 if none of the requested tokens has a balance.

## Routing Presets

Presets are preconfigured routing defaults, merged with request options. **Explicit request values always override preset defaults** — but list overrides (e.g. `denyBridges`) **replace** the preset's lists entirely, they do not merge.

- `GET /quote`: `preset` query param. `POST /advanced/routes`: `options.preset`.
- Generic names resolve to specific ones: `stablecoin` → `stablecoin-cheapest`.
- Invalid preset name → HTTP 400.

### Stablecoin preset (`preset=stablecoin`)

| Default | Value |
|---------|-------|
| `order` | `CHEAPEST` |
| `slippage` | `0.001` (0.1%) |
| Price impact cap | 2% |
| Bridges | Stablecoin-friendly shortlist: Glacis, Mayan Swift, Mayan MCTP, Celer (mint-and-burn); Eco, Relay, Across, Gaszip (intent/solver) |
| Exchanges | All enabled |

Find qualifying tokens: `GET /v1/tokens?tags=stablecoin&chains=...`. The `commerce` preset is announced as coming soon.

## Composer

Composer bundles protocol interactions (deposit, stake, lend, withdraw) plus swaps and bridges into a single atomic flow. Architecture: an **Onchain VM** (execution engine contract called via the LI.FI Diamond) + a TypeScript eDSL compiled to VM bytecode + **dynamic calldata injection** (outputs of one step injected as inputs to the next, fully onchain in the same tx).

### How to invoke

**No dedicated endpoint and no Composer-specific parameters.** On standard `GET /quote` or `POST /advanced/routes`, set `toToken` to a supported protocol's vault/staking/deposit token address. The routing engine detects it, builds + simulates the calldata, and returns a normal `transactionRequest`.

```bash
curl "https://li.quest/v1/quote?\
fromChain=8453&toChain=8453&\
fromToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&\
toToken=0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A&\
fromAddress=0xYou&toAddress=0xYou&fromAmount=1000000"
```

- **Same-chain:** top-level `tool` is the zap tool — `composer`, or another integrated zap provider the engine may pick (e.g. `fly`, observed live). `includedSteps` typically contain a `feeCollection` step then the zap step (both `type: "protocol"`). Don't hard-code detection on `tool === "composer"`.
- **Cross-chain:** top-level `tool` is the bridge (e.g. `stargateV2`) with Composer as the final included step. Use higher slippage (e.g. `0.01`).
- **Withdrawals:** position token (vault share / aToken / LST) as `fromToken`, desired token as `toToken`. Only protocols with the Withdraw action.
- **Deposit on behalf:** set `toAddress` to the recipient (protocol support varies, e.g. Aave `onBehalfOf`).
- `transactionRequest.to` and `estimate.approvalAddress` point to the **LI.FI Diamond**: `0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE` (same address on all EVM chains).
- Every quote is **simulated on a fork** before being returned; simulation failures (vault paused/full/restricted, no swap liquidity) come back as API errors instead of revert-prone transactions.

### Supported protocols (~29; live list at `GET https://earn.li.fi/v1/protocols`)

Deposit + Withdraw: Aave V3, Ample, AutoFinance, Avant, Avon, Cap, EtherFi, Euler, Felix Vanilla, Fluid, HyperLend, HypurrFi, IPOR, Kelp, Morpho V1 & V2, Neutrl, Neverland, Pendle, Spark, Upshift, Yearn, Yo.

**Deposit-only** (withdraw via the protocol's own UI): Concrete, Ember, Ethena, Kinetiq, Maple, Royco, USDai.

Example `toToken` addresses:

| Target | Chain | Address |
|--------|-------|---------|
| Morpho Spark USDC vault | Base (8453) | `0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A` |
| Aave V3 aEthUSDC | Ethereum (1) | `0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c` |
| Ethena sUSDe | Ethereum (1) | `0x9D39A5DE30e57443BfF2A8307A4256c8797A3497` |
| Maple syrupUSDC | Ethereum (1) | `0x80ac24aA929eaF5013f6436cdA2a7ba190f5Cc0b` |
| Lido wstETH | Ethereum (1) | `0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0` |

Supported chains (23, EVM only): Ethereum, Optimism, BNB Chain, Gnosis, Unichain, Polygon, Sonic, World Chain, Mantle, HyperEVM, MegaETH, Base, Monad, Lisk, Soneium, Linea, Arbitrum, Celo, Avalanche, Berachain, Plume, Katana, Scroll.

### Limitations

- EVM chains only (incl. EVM↔EVM cross-chain). No Solana/non-EVM.
- Tokenized positions only — the target must mint a position token.
- You cannot explicitly request or suppress Composer at the request level — activation is purely a function of `toToken`.
- Cross-chain is two-phase, eventually consistent: bridge can succeed while destination deposit fails → user holds the bridged token on the destination (handle `DONE`+`PARTIAL`); source tokens are never at risk.
- Simulation can't prevent every revert (front-running, vault filling between simulation and execution) — on revert, fetch a fresh quote and retry.
- Composer minimum amounts run higher than plain swaps (`AMOUNT_TOO_LOW` triggers earlier, due to multiple steps).
- Morpho vault tokens are named after the curator, not Morpho (e.g. `sparkUSDC`).

## Earn Data API

Read-only yield data layer. **Base URL: `https://earn.li.fi`** (all paths `/v1/...`). OpenAPI: `https://docs.li.fi/earn-openapi.yaml`. Auth: `x-lifi-api-key` header is **required** — requests without it return `401 {"message":"Missing x-lifi-api-key header"}` (unlike the core li.quest API, where the key is optional). Rate limit: **50 req/min per key**; 429 on excess.

Execution is delegated to Composer: vault `address` → `toToken` on `li.quest/v1/quote` (deposit), or `fromToken` (withdraw, if `isRedeemable`).

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/v1/vaults` | List vaults (filter, sort, paginate) |
| GET | `/v1/vaults/{chainId}/{address}` | Single vault detail |
| GET | `/v1/chains` | Chains with ≥1 active Earn vault (**Earn-scoped, not platform-wide**) |
| GET | `/v1/protocols` | Protocols with ≥1 active vault |
| GET | `/v1/portfolio/{userAddress}/positions` | User's DeFi positions |

> Note: the base path changed in April 2026 from `/v1/earn/...` to `/v1/...`.

### GET /v1/vaults

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `chainId` | integer | — | Filter by chain ID |
| `asset` | string | — | Underlying token symbol OR address (e.g. `USDC`) |
| `protocol` | string | — | Protocol name (e.g. `morpho-v1`, `aave-v3`) |
| `minTvlUsd` | number | — | Minimum TVL in USD |
| `isTransactional` | string | — | `"true"`/`"false"` — deposits available via Composer |
| `isRedeemable` | string | — | `"true"`/`"false"` — withdrawals available |
| `isComposerSupported` | string | — | `"true"`/`"false"` — full end-to-end cross-chain deposit support |
| `sortBy` | string | — | `apy` (highest total APY first) or `tvl` |
| `cursor` | string | — | Cursor from prior response `nextCursor` |
| `limit` | integer | 50 | 1–100 |

Boolean filters are **string literals** in the querystring, not native booleans.

**Response:** `{ "data": Vault[], "nextCursor": "string (absent on last page)", "total": number }`

### Vault schema (NormalizedVault)

```json
{
  "address": "0x...",
  "network": "base",
  "chainId": 8453,
  "slug": "morpho-base-usdc-0x7bfa",
  "name": "Spark USDC Vault",
  "description": "string (optional — absent for ~70% of vaults)",
  "protocol": { "name": "Morpho", "logoUri": "https://...", "url": "https://morpho.org" },
  "underlyingTokens": [{ "address": "0x...", "symbol": "USDC", "decimals": 6, "weight": 1.0 }],
  "lpTokens": [],
  "rewardTokens": [],
  "tags": ["stablecoin", "lending"],
  "analytics": {
    "apy": { "base": 0.0534, "reward": null, "total": 0.0534 },
    "apy1d": 0.052, "apy7d": 0.0531, "apy30d": 0.0528,
    "tvl": { "usd": "12345678.90", "native": "12345678900000" },
    "updatedAt": "2026-06-06T00:00:00Z"
  },
  "caps": { "totalCap": "string", "maxCap": "string" },
  "timeLock": 0,
  "kyc": false,
  "syncedAt": "2026-06-06T00:00:00Z",
  "isTransactional": true,
  "isRedeemable": true,
  "depositPacks": [{ "name": "string", "stepsType": "instant | complex" }],
  "redeemPacks": [{ "name": "string", "stepsType": "instant | complex" }]
}
```

Notes:
- APY values are decimals (0.0534 = 5.34%); compare `apy.total` vs `apy30d` to detect temporary spikes.
- TVL/balances are strings (precision).
- `lpTokens` is typically empty — **use the top-level `address` as the Composer `toToken`**, not lpTokens.
- `timeLock` (seconds, >0 = delayed withdrawals), `caps` (deposit ceilings), `kyc` — surface these to users.
- `stepsType`: `instant` = single tx, `complex` = multi-step.
- Nullable fields: `description`, `apy.base`, `apy.reward`, `apy1d`, `apy7d`, `caps` — handle defensively.
- Freshness: metadata/APY/TVL every 15 min; `isTransactional`/`isRedeemable` every 2 min.

### GET /v1/vaults/{chainId}/{address}

Path params: `chainId` (integer), `address` (`^0x[0-9a-fA-F]{40}$`). 404 `{"statusCode":404,"message":"Vault not found"}`.

### GET /v1/chains and GET /v1/protocols

No params.

```json
[{ "name": "Base", "chainId": 8453, "networkCaip": "eip155:8453" }]
[{ "name": "Morpho", "logoUri": "https://...", "url": "https://morpho.org" }]
```

### GET /v1/portfolio/{userAddress}/positions

Path param: `userAddress` (`^0x[a-fA-F0-9]{40}$`).

```json
{
  "positions": [
    {
      "chainId": 1,
      "address": "0x... (nullable)",
      "protocolName": "aave-v3 (nullable)",
      "asset": { "address": "0x...", "name": "USD Coin", "symbol": "USDC", "decimals": 6 },
      "balanceUsd": "1523.45 (nullable)",
      "balanceNative": "1523450000"
    }
  ]
}
```

### Earn error model

`400` ValidationError: `{ statusCode, message, errors: [{ code, message, path[] }] }` (or simple `{ statusCode, message }`); `404` NotFoundError; `429` rate limited; `500` internal.

## LI.FI Intents API

Intent/solver marketplace — a **separate system** from the classic li.quest API, and the foundation of the Open Intents Framework (OIF). Solvers publish standing quotes; the order server matches user intents to solver inventory; solvers pre-fund delivery on the destination chain before settlement.

| Environment | Base URL |
|-------------|----------|
| Production | `https://order.li.fi` (interactive spec at `/docs`) |
| Development (testnets) | `https://order-dev.li.fi` |

**Auth:** integrator endpoints are fully open — no API key, no registration. (Solver endpoints require an `api-key` header.)

Note: classic `li.quest/v1/quote` already aggregates intent-based bridges; integrate `order.li.fi` directly only when you want the order-server model itself (solver selection, resource locks, gasless submission).

### Endpoints (integrator-facing)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/quote/request` | Request a quote (exact-input or exact-output) |
| POST | `/orders/submit` | Submit order off-chain (Compact / gasless flows) |
| GET | `/orders/status` | Status by `onChainOrderId` or `catalystOrderId` |
| GET | `/orders` | List orders (`user`, `status`, `limit` ≤ 50, `offset`) |
| GET | `/chains/supported` | Supported chains (`{id, chainId, name, chainType}`) |
| GET | `/routes` | Supported routes (chain/asset pairs, solver-driven, dynamic) |

### Address format — EIP-7930 interoperable addresses

`user`, `asset`, `receiver` use EIP-7930 (chain embedded in the address), not bare 0x addresses. Example, USDC on Base (8453):

```
0x0001 0000 02 2105 14 833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 ver   EVM  len chain len  address
```

Amounts are strings in token smallest units.

### POST /quote/request

```json
{
  "user": "0x0001000002210514d8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "intent": {
    "intentType": "oif-swap",
    "inputs": [{ "user": "<interop addr>", "asset": "<interop addr>", "amount": "10000000" }],
    "outputs": [{ "receiver": "<interop addr>", "asset": "<interop addr>", "amount": null }],
    "swapType": "exact-input"
  },
  "supportedTypes": ["oif-escrow-v0"]
}
```

- `swapType`: `exact-input` (output amount null) or `exact-output` (input amount null).
- `supportedTypes`: `oif-escrow-v0` (escrow) and/or `oif-resource-lock-v0` (Compact).
- Optional `intent.metadata.exclusiveFor`: restrict to specific solvers.

**Response:** `quotes[]` sorted best-first, each with `quoteId`, `validUntil` (unix — re-fetch if stale), `preview.inputs/outputs` (resolved amounts), `metadata.exclusiveFor`, `partialFill`, `failureHandling` (e.g. `refund-automatic`). Save `quoteId` for submission.

### Order lifecycle

**Escrow flow (recommended default):**
1. `POST /quote/request`
2. ERC-20 `approve(InputSettlerEscrow, amount)` (or Permit2)
3. Build `StandardOrder`, ABI-encode, call `escrow.open(bytes order)` on-chain — locks tokens, emits `Open(bytes32 indexed orderId, ...)`. **No `/orders/submit` needed** — solvers detect the event.
4. Poll `GET /orders/status?onChainOrderId=...`

**Compact flow (gasless after one-time deposit):**
1. Deposit once into The Compact
2. `POST /quote/request` (include `oif-resource-lock-v0`)
3. Sign a `BatchCompact` via **EIP-712**
4. `POST /orders/submit` with `orderType: "CatalystCompactOrder"`, `inputSettler`, `quoteId`, `order` (+ sponsor signature)
5. Poll `GET /orders/status?catalystOrderId=...`

**StandardOrder struct:**

```
tuple(address user, uint256 nonce, uint256 originChainId, uint32 expires,
      uint32 fillDeadline, address inputOracle, uint256[2][] inputs,
      tuple(bytes32 oracle, bytes32 settler, uint256 chainId, bytes32 token,
            uint256 amount, bytes32 recipient, bytes call, bytes context)[] outputs)
```

- `inputs`: `[tokenId(uint256), amount]` pairs (escrow: address-as-uint256; Compact: ERC-6909 id)
- `fillDeadline` (solver fill cutoff) must be < `expires` (final deadline; refundable after)
- `call`: calldata executed on `recipient` after delivery (`0x` if none); recipient must be a contract implementing `outputFilled(...)`, not an EOA
- `context`: auction params (`0x` for limit order)

**Order statuses** (`meta.orderStatus`): `Submitted` → `Open` → `Signed` → `Delivered` → `Settled` (terminal). Status response `meta` also includes timestamps (`signedAt`, `deliveredAt`, `settledAt`, `expiredAt`), tx hashes (initiated/delivered/verified/settled), and `solverAddress`.

**On-chain events:** `Open`, `OutputFilled`, `Finalised`, `Refunded` (orderId = topic1).

### Contract addresses (same on all supported chains)

| Contract | Address |
|----------|---------|
| InputSettlerEscrow | `0x000025c3226C00B2Cdc200005a1600509f4e00C0` |
| InputSettlerCompact | `0x0000000000cd5f7fDEc90a03a31F79E5Fbc6A9Cf` |
| The Compact | `0x00000000000000171ede64904551eeDF3C6C9788` |
| Polymer Oracle (mainnet) | `0x0000003E06000007A224AeE90052fA6bb46d43C9` |
| Output Settler | `0x0000000000eC36B683C2E6AC89e9A75989C22a2e` |

### Coverage & caveats

- Live chains (check `GET /chains/supported`): Ethereum, Base, Optimism, Arbitrum, Polygon, BSC, Soneium, Katana, MegaETH, Pharos (EVM); Solana (SVM); Tron (TVM). Testnets on `order-dev.li.fi`.
- Cross-chain route availability is solver-driven and dynamic — check `/routes`.
- Multi-output orders: put the most valuable output first; only the first output should carry calldata.
- `user` must be able to receive tokens (it's the refund recipient) or funds are permanently lost.

## Response Schemas

### Token

```json
{
  "address": "string",
  "chainId": "number",
  "symbol": "string",
  "decimals": "number",
  "name": "string",
  "priceUSD": "string",
  "logoURI": "string",
  "coinKey": "string",
  "tags": "string[] (e.g. ['stablecoin'])"
}
```

### Step

The `type` field indicates what the step does:
- `swap`: DEX swap on a single chain
- `cross`: bridge between chains
- `lifi`: LI.FI combined multi-action logic
- `protocol`: protocol-level action (fee collection, Composer deposit/withdraw)

```json
{
  "id": "string",
  "type": "swap | cross | lifi | protocol",
  "tool": "string",
  "toolDetails": { "key": "string", "name": "string", "logoURI": "string" },
  "action": {
    "fromChainId": "number", "toChainId": "number",
    "fromToken": "Token", "toToken": "Token",
    "fromAmount": "string", "slippage": "number",
    "fromAddress": "string", "toAddress": "string"
  },
  "estimate": {
    "fromAmount": "string", "toAmount": "string", "toAmountMin": "string",
    "approvalAddress": "string", "executionDuration": "number",
    "feeCosts": "FeeCost[]", "gasCosts": "GasCost[]"
  }
}
```

### FeeCost

```json
{
  "name": "string", "description": "string", "percentage": "string",
  "token": "Token", "amount": "string", "amountUSD": "string", "included": "boolean"
}
```

### GasCost

```json
{
  "type": "SEND | APPROVE", "estimate": "string", "limit": "string",
  "amount": "string", "amountUSD": "string", "price": "string", "token": "Token"
}
```

### Formats

- Native token address: `0x0000000000000000000000000000000000000000`
- EVM address: `^0x[a-fA-F0-9]{40}$`; tx hash: `^0x[a-fA-F0-9]{64}$`
- Amounts: non-negative integer strings in smallest unit (`human × 10^decimals`; USDC/USDT = 6, ETH/DAI/WETH = 18, WBTC = 8)
- Slippage: decimal 0.001–0.5
- `transactionRequest.value/gasLimit/gasPrice`: hex strings; `chainId`: integer

## Error Reference

### Error Response Format

```json
{
  "message": "string",
  "code": "number",
  "errors": [{ "errorType": "string", "code": "string", "action": "object", "tool": "string", "message": "string" }]
}
```

### API Error Codes

| Code | Name | Notes |
|------|------|-------|
| 1000 | DefaultError | |
| 1001 | FailedToBuildTransactionError | Composer: vault token invalid or protocol temporarily unavailable |
| 1002 | NoQuoteError | No route; toToken unsupported or insufficient liquidity |
| 1003 | NotFoundError | |
| 1004 | NotProcessableError | Check params |
| 1005 | RateLimitError | 429 — back off |
| 1006 | ServerError | Retry 1–2× |
| 1007 | SlippageError | Raise `slippage` (suggest `min(current×2, 0.03)`) or lower amount |
| 1008 | ThirdPartyError | |
| 1009 | TimeoutError | Retry |
| 1010 | UnauthorizedError | |
| 1011 | ValidationError | Fix params |
| 1012 | RpcFailure | |
| 1013 | MalformedSchema | |

### Tool Error Codes (inside `errors[]`, `errorType: "NO_QUOTE"`)

| Code | Action |
|------|--------|
| `NO_POSSIBLE_ROUTE` | Change tokens/chains/amount; try USDC/USDT/ETH as intermediary |
| `INSUFFICIENT_LIQUIDITY` | Smaller amount, different bridge, or wait |
| `TOOL_TIMEOUT` | Retry immediately |
| `AMOUNT_TOO_LOW` | Increase amount (Composer minimums run higher) |
| `AMOUNT_TOO_HIGH` | Decrease or split |
| `FEES_HIGHER_THAN_AMOUNT` | Increase amount |
| `DIFFERENT_RECIPIENT_NOT_SUPPORTED` | Set toAddress = fromAddress |
| `CANNOT_GUARANTEE_MIN_AMOUNT` | Adjust slippage/route |
| `RPC_ERROR` / `UNKNOWN_ERROR` / `TOOL_SPECIFIC_ERROR` | Retry or different tool |

### HTTP / Retry Matrix

| HTTP | Retry? | Action |
|------|--------|--------|
| 400 | No | Fix parameters (missing/invalid token, chain, amount=0, bad address) |
| 404 | Maybe | Different pair, smaller amount, different chains |
| 429 | Yes | Exponential backoff `min(2^attempt × 1000, 30000)` ms |
| 500 | Yes (1–2×) | Wait ~2s |
| 502/503 | Yes | Wait 5–10s |

### Transaction (execution) errors

| Error | Retry? | Action |
|-------|--------|--------|
| `execution reverted` | Maybe | Quote stale → fetch fresh quote (max ~2 attempts) |
| `insufficient funds` | No | User needs more token + native gas |
| `user rejected` | No | Ask user again |
| `nonce too low` | Wait | Pending tx exists |
| `gas too low` / `replacement fee too low` | — | Increase gas limit / gas price |

### Approval workflow notes

- Spender = `quote.estimate.approvalAddress` — never hardcode (varies per route/step).
- Wait for approval confirmation before the main tx; approve on `fromChain`.
- **USDT:** reset allowance to 0 before setting a new non-zero value.
- Strategies: exact amount (recommended for agents), unlimited (`uint256.max`), or buffer (`amount × 2`). Approval gas ≈ 50–100k.
- Permit2 / EIP-2612 / EIP-7702 / EIP-5792 signature flows are handled by the SDK; the REST path documents the classic allowance/approve flow.

## Chain IDs

Chain types: `EVM`, `SVM`, `UTXO`, `MVM`, `TVM` (75+ chains total — fetch live via `/chains?chainTypes=EVM,SVM,UTXO,MVM,TVM`).

### Major EVM Chains

| Chain | ID | Key | Native Token |
|-------|-----|-----|--------------|
| Ethereum | 1 | `eth` | ETH |
| Optimism | 10 | `opt` | ETH |
| BSC | 56 | `bsc` | BNB |
| Gnosis | 100 | `dai` | xDAI |
| Unichain | 130 | `uni` | ETH |
| Polygon | 137 | `pol` | POL |
| Sonic | 146 | `son` | S |
| World Chain | 480 | `wcc` | ETH |
| HyperEVM | 999 | `hyp` | HYPE |
| zkSync Era | 324 | `era` | ETH |
| Base | 8453 | `bas` | ETH |
| Arbitrum | 42161 | `arb` | ETH |
| Celo | 42220 | `cel` | CELO |
| Avalanche | 43114 | `ava` | AVAX |
| Linea | 59144 | `lna` | ETH |
| Berachain | 80094 | `ber` | BERA |
| Scroll | 534352 | `scr` | ETH |
| Katana | 747474 | `kat` | ETH |

### Non-EVM Chains

| Chain | Type | ID | Key |
|-------|------|-----|-----|
| Solana | SVM | 1151111081099710 | `sol` |
| Bitcoin | UTXO | 20000000000001 | `btc` |
| Sui | MVM | 9270000000000000 | `sui` |
| Tron | TVM | 728126428 | `trn` |

## Common Token Addresses

### Native Token

Use for ETH, BNB, POL, AVAX, etc.:
```
0x0000000000000000000000000000000000000000
```

### USDC

| Chain | Address |
|-------|---------|
| Ethereum (1) | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| Optimism (10) | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |
| BSC (56) | `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d` |
| Polygon (137) | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` |
| Base (8453) | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Arbitrum (42161) | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| Avalanche (43114) | `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E` |

### USDT

| Chain | Address |
|-------|---------|
| Ethereum (1) | `0xdAC17F958D2ee523a2206206994597C13D831ec7` |
| Optimism (10) | `0x94b008aA00579c1307B0EF2c499aD98a8ce58e58` |
| BSC (56) | `0x55d398326f99059fF775485246999027B3197955` |
| Polygon (137) | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` |
| Arbitrum (42161) | `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9` |
| Avalanche (43114) | `0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7` |

### WETH

| Chain | Address |
|-------|---------|
| Ethereum (1) | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |
| Optimism (10) | `0x4200000000000000000000000000000000000006` |
| Polygon (137) | `0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619` |
| Base (8453) | `0x4200000000000000000000000000000000000006` |
| Arbitrum (42161) | `0x82aF49447D8a07e3bd95BD0d56f35241523fBab1` |

### DAI

| Chain | Address |
|-------|---------|
| Ethereum (1) | `0x6B175474E89094C44Da98b954EedeAC495271d0F` |
| Optimism (10) | `0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1` |
| Polygon (137) | `0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063` |
| Arbitrum (42161) | `0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1` |

## Agent Surfaces

- **MCP Server:** `https://mcp.li.quest/mcp` (HTTP type; read-only — returns unsigned `transactionRequest`). Tools: `get-chains`, `get-token`, `get-quote`, `get-allowance`, `get-status`. Auth via `Authorization: Bearer <key>` or `X-LiFi-Api-Key`. GitHub: `lifinance/lifi-mcp`. (A separate Intents MCP server also exists.)
- **CLI:** `@lifi/cli` — compact, token-efficient output; `npx @lifi/cli chains`, `--json` flag. GitHub: `lifinance/lifi-cli`.
- **Agent docs:** `https://docs.li.fi/agents/overview` (five-call recipe, decision tables, workflows, error playbooks, JSON schemas).
