# Market Data — product_api recipes

Use the authenticated MCP tool `product_api`. If a path 404s, fetch the live `api-index` resource (`file://1inch-mcp/guides/api-index`) or call `search`, then retry.

Source of truth in the monorepo: `apps/mcp-service/src/mcp/resources/product-api-recipes.ts`.

## Spot Price

- **Path prefix:** `/price/v1.1/{chainId}/...`
- **Example:** `product_api({ method: "GET", path: "/price/v1.1/1/0xTokenAddress", query: { currency: "USD" } })`
- **Gotcha:** Prices in native token WEI unless `currency` param set (e.g. `currency=USD`)

## Gas Price

- **Path prefix:** `/gas-price/v1.6/{chainId}`
- **Example:** `product_api({ method: "GET", path: "/gas-price/v1.6/1" })`
- **Gotcha:** Compact response, ready for agent use

## Charts

- **Path prefix:** `/charts/v1.0/chart/line/{token0}/{token1}/{period}/{chainId}`
- **Example:** `product_api({ method: "GET", path: "/charts/v1.0/chart/line/0xToken0/0xToken1/24H/1" })`
- **Gotcha:** Period is a path segment (24H, 1W, 1M, 1Y, AllTime) — not a query param
