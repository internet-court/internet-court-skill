---
name: 1inch-debug
description: >-
  Look up organization-scoped 1inch API request logs by request-id or time window
  via the MCP `debug` tool. Use when troubleshooting failed or unexpected API
  responses for the authenticated org.
license: MIT
compatibility: Requires 1inch MCP server with debug tool registered and authentication.
---

# Request log lookup (`debug`)

Authenticated MCP tool **`debug`**. Call **`authenticate` first** if you are not already a real user (initialize 200 is still anonymous). Only appears in `tools/list` when the deployment registers it.

## Modes

1. **By request id:** `requestId` (e.g. `x-request-id`), optional `startTime` / `endTime` (default 24h lookback).
2. **By window:** `startTime` + `endTime` (RFC3339), optional `logLevel` (`info`|`warn`|`error`), `limit` (1–100).

Organization scope comes from the gateway auth context — you cannot query other orgs.
