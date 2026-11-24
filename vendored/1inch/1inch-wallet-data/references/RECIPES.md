# Wallet & Data — product_api recipes

Use the authenticated MCP tool `product_api`. If a path 404s, fetch the live `api-index` resource (`file://1inch-mcp/guides/api-index`) or call `search`, then retry.

Source of truth in the monorepo: `apps/mcp-service/src/mcp/resources/product-api-recipes.ts`.

## Portfolio

- **Path prefix:** `/portfolio/portfolio/v5.0/...`
- **Example:** `product_api({ method: "GET", path: "/portfolio/portfolio/v5.0/general/current_value", query: { addresses: "0x..." } })`
- **Gotcha:** Gateway strips the first `/portfolio`; backend OpenAPI paths are `/portfolio/v5.0/...`. Full host: https://api.1inch.com

## Balance

- **Path prefix:** `/balance/v1.2/{chainId}/...`
- **Example:** `product_api({ method: "GET", path: "/balance/v1.2/1/balances/0xYourWallet" })`
- **Gotcha:** Response includes zero balances; filter client-side

## Token

- **Path prefix:** `/token/v1.4/{chainId}/...`
- **Example:** `product_api({ method: "GET", path: "/token/v1.4/1/search", query: { query: "USDC" } })`
- **Gotcha:** Full list is huge; prefer `/search?query=...`. Use v1.4 — the older v1.2 chain search is deprecated

## Token Details

- **Path prefix:** `/token-details/v1.0/details/{chain}/{tokenAddress}`
- **Example:** `product_api({ method: "GET", path: "/token-details/v1.0/details/1/0xTokenAddress" })`
- **Gotcha:** Chain comes after `details`. Native ETH pseudo-address (`0xeeee...eeee`) NOT supported; use WETH

## History

- **Path prefix:** `/history/v2.0/history/{address}/events`
- **Example:** `product_api({ method: "GET", path: "/history/v2.0/history/0xYourWallet/events", query: { chainId: "1", limit: "50" } })`
- **Gotcha:** Response shape uses items[].details.txHash — not raw event logs

## Traces

- **Path prefix:** `/traces/v1.0/chain/{chainId}/...`
- **Example:** `product_api({ method: "GET", path: "/traces/v1.0/chain/1/block-trace/18000000/tx-hash/0xTxHash" })`
- **Gotcha:** Trace lookup is block-scoped (`/block-trace/{blockNumber}/tx-hash/{txHash}`) — there is no `/transaction/{hash}` route

## NFT

- **Path prefix:** `/nft/v2/...`
- **Example:** `product_api({ method: "GET", path: "/nft/v2/byaddress", query: { address: "0xYourWallet", chainIds: "1" } })`
- **Gotcha:** Use v2 — v1 paths are gone. Supported chains via `/nft/v2/supportedchains`
