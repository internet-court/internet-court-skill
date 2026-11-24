# Infrastructure — product_api recipes

Use the authenticated MCP tool `product_api`. If a path 404s, fetch the live `api-index` resource (`file://1inch-mcp/guides/api-index`) or call `search`, then retry.

Source of truth in the monorepo: `apps/mcp-service/src/mcp/resources/product-api-recipes.ts`.

## Web3 RPC

- **Path prefix:** `/web3/{chainId}`
- **Example:** `product_api({ method: "POST", path: "/web3/1", body: { jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 } })`
- **Gotcha:** JSON-RPC over HTTP; chainId is the path segment

## Transaction Gateway

- **Path prefix:** `/tx-gateway/...`
- **Example:** `product_api({ method: "POST", path: "/tx-gateway/v1.1/1/broadcast", body: { rawTransaction: "0x..." } })`
- **Gotcha:** Prefer `search` for exact tx-gateway paths; check live api-index / llms.txt

## Domains

- **Path prefix:** `/domains/...`
- **Example:** `product_api({ method: "GET", path: "/domains/v2.0/lookup", query: { name: "vitalik.eth" } })`
- **Gotcha:** Prefer `search` for exact Domains paths; check live api-index / llms.txt
