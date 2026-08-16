---
name: cspr-cloud
description: Use when answering questions, writing code, or building examples for CSPR.cloud REST API, CSPR.cloud Streaming API, Casper Network indexed data, pagination, filtering, sorting, includes, API errors, account/contract/token/NFT/rate endpoints, Casper Node proxy access, or WebSocket subscriptions.
---

# CSPR.cloud API

Use this skill for CSPR.cloud API integrations. Keep responses grounded in the public documentation; do not invent endpoints, query parameters, includes, response fields, stream actions, or error codes.

Public docs base: `https://docs.cspr.cloud/`. Use documentation paths below relative to this base. When fetching a documentation page, append `.md` to the path and add `?displayAgentInstructions=false` as a query parameter to receive Markdown instead of HTML; for example, `/rest-api/block` means `https://docs.cspr.cloud/rest-api/block.md?displayAgentInstructions=false`.

## Core URLs

Mainnet:

- REST API: `https://api.cspr.cloud`
- Streaming API: `wss://streaming.cspr.cloud`
- Casper Node RPC API: `https://node.cspr.cloud`
- Casper Node SSE API: `https://node-sse.cspr.cloud`

Testnet:

- REST API: `https://api.testnet.cspr.cloud`
- Streaming API: `wss://streaming.testnet.cspr.cloud`
- Casper Node RPC API: `https://node.testnet.cspr.cloud`
- Casper Node SSE API: `https://node-sse.testnet.cspr.cloud`

Prefer Testnet URLs in examples unless the user asks for Mainnet.

## Authentication

Every CSPR.cloud REST, Streaming, Casper Node RPC, and Casper Node SSE request requires an `Authorization` header containing the user's access token.

To obtain an access token, the user should register or request access through `https://cspr.cloud/`. Do not invent test tokens. Use a placeholder when the real token is not provided.

Prefer reading the token from an environment variable in generated code:

```bash
export CSPR_CLOUD_API_KEY="your-access-token"
```

Use `Authorization: $CSPR_CLOUD_API_KEY` in examples. Do not put access tokens in frontend/browser code or commit them to source control.

For runnable code, read `CSPR_CLOUD_API_KEY` at runtime and fail fast if it is missing. If the user asks you to execute a request and the variable is not set, stop and ask them to set it. Use placeholders only for non-runnable examples.

## REST Behavior

- CSPR.cloud REST API is an HTTP JSON API for indexed Casper Network data.
- Successful REST responses wrap payloads in `data`.
- Paginated REST responses include `data`, `item_count`, and `page_count`.
- Pagination uses `page` and `page_size`; default page is `1`, default `page_size` is `10`, and max `page_size` is `250`.
- When traversing pages, increment `page` until enough data is collected or `page` reaches `page_count`; use `page_size=250` only for large collection traversal.
- Sorting is endpoint-specific and uses `order_by` plus `order_direction` (`ASC` or `DESC`). Check the endpoint before using a sortable field.
- Filtering is endpoint-specific. Filters are query parameters named after documented filter properties; some accept comma-separated values.
- Optional REST properties use the `includes` query parameter. Includes can be scalar fields, related objects, object field selections, or functions such as rate includes.
- Include object field selection with syntax such as `includes=account_info{info{owner{name,branding{logo}}}}`.
- Include parameterized values with function syntax such as `includes=rate(1)`.
- Treat numeric blockchain amounts as strings when the docs show them as strings.
- Treat nullable or optional fields as absent/null-safe in generated code.
- Rate limits and quotas depend on access tier. Handle HTTP `429` with backoff/retry.

## Error Handling

REST errors are returned in an `error` object with `code` and `message`. Known codes include `invalid_input` (400), `unauthorized` (401), `access_denied` (403), `not_found` (404), and `duplicate_entity` (409). Parse `error.code` in generated clients instead of relying only on HTTP status text.

## Streaming Behavior

CSPR.cloud Streaming API is WebSocket-based. Messages are JSON objects with `action`, `data`, `timestamp`, and optional `extra`.

- Consumers should reconnect because connections may close during API deployments.
- Duplicate events can occur. Deduplicate by the relevant entity identifier when the use case requires exactly-once processing.
- Update events are emitted only for direct entity property changes, not optional included fields.
- Persistent sessions are available outside the Free tier by sending a stable `Persistent-Session` header and reconnecting with the same value.

## Public Documentation

Use the public documentation as the source of truth for endpoint-specific details. Read only the pages needed for the current task.

Core references:

- Overview: `/overview`
- Authorization: `/overview/authorization`
- Rate limits and quotas: `/overview/rate-limits-and-quotas`
- REST API reference: `/rest-api/reference`
- Streaming API reference: `/streaming-api/reference`
- Casper Node SDK connection: `/casper-node-api/connecting-with-an-sdk`

Documentation paths follow the GitBook page paths. Examples:

- REST topic: `/rest-api/non-fungible-token`
- REST endpoint: `/rest-api/non-fungible-token/get-account-tokens`
- Streaming topic: `/streaming-api/transfer`
- Highlight example: `/highlights/including-related-entities`

REST API topic entry points:

- Account: `/rest-api/account`
- Account info: `/rest-api/account-info`
- Auction metrics: `/rest-api/auction-metrics`
- Awaiting deploy: `/rest-api/awaiting-deploy`
- Bidder: `/rest-api/bidder`
- Block: `/rest-api/block`
- Centralized account info: `/rest-api/centralized-account-info`
- Contract: `/rest-api/contract`
- Contract entry point: `/rest-api/contract-entry-point`
- Contract package: `/rest-api/contract-package`
- CSPR.name resolution: `/rest-api/cspr-name-resolution`
- CSPR rate: `/rest-api/cspr-rate`
- CSPR supply: `/rest-api/cspr-supply`
- Currency: `/rest-api/currency`
- Delegation: `/rest-api/delegation`
- Delegator reward: `/rest-api/delegator-reward`
- Deploy: `/rest-api/deploy`
- DEX: `/rest-api/dex`
- Fungible token action: `/rest-api/fungible-token-action`
- Fungible token daily DEX rate: `/rest-api/fungible-token-daily-dex-rate`
- Fungible token daily rate: `/rest-api/fungible-token-daily-rate`
- Fungible token DEX rate: `/rest-api/fungible-token-dex-rate`
- Fungible token ownership: `/rest-api/fungible-token-ownership`
- Fungible token rate: `/rest-api/fungible-token-rate`
- NFT: `/rest-api/non-fungible-token`
- NFT action: `/rest-api/non-fungible-token-action`
- NFT ownership: `/rest-api/non-fungible-token-ownership`
- Purse: `/rest-api/purse-uref`
- Swap: `/rest-api/swap`
- Transfer: `/rest-api/transfer`
- Validator: `/rest-api/validator`
- Validator performance: `/rest-api/validator-performance`
- Validator reward: `/rest-api/validator-reward`

Common integration examples:

- Related entities/includes: `/highlights/including-related-entities`
- CSPR rates: `/highlights/including-cspr-rates`
- Account info includes: `/highlights/including-account-info`
- Auction data: `/highlights/accessing-auction-data`
- Fungible token data: `/highlights/accessing-token-data`
- NFT data: `/highlights/accessing-nft-data`
- Contract-level streaming events: `/highlights/receiving-contract-level-events`
- CSPR.name resolution: `/highlights/resolving-cspr-name`

## Endpoint Selection

When a task needs a specific endpoint:

1. For REST tasks, use the REST topic page when the domain is obvious; otherwise start from `/rest-api/reference`.
2. For Streaming API tasks, start from `/streaming-api/reference`.
3. For Casper Node RPC or SSE access, use `/casper-node-api/connecting-with-an-sdk`.
4. Open the specific endpoint page linked from the relevant topic page.
5. Use only parameters, filters, includes, response fields, stream actions, and examples documented there.

## Response Guidance

When producing code or examples:

- Include the `Authorization` header from `CSPR_CLOUD_API_KEY` or an explicit placeholder.
- For runnable examples, read the token from `CSPR_CLOUD_API_KEY` and fail fast if it is missing.
- For illustrative snippets, use a clear placeholder instead of a real token.
- Use server-side code for authenticated calls.
- Prefer small, task-specific examples over broad clients.
- Preserve CSPR.cloud field names exactly.
- Explain rate-limit considerations when paging through large collections or opening persistent streams.