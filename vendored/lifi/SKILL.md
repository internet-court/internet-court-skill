---
name: lifi
description: |
  LI.FI REST API for cross-chain and same-chain token swaps, bridging, DeFi deposits (Composer), yield discovery (Earn), and intent-based execution (Intents).

  USE THIS SKILL WHEN USER WANTS TO:
  - Swap tokens between different blockchains (e.g., "swap USDC on Ethereum to ETH on Arbitrum")
  - Bridge tokens to another chain (e.g., "move my ETH from mainnet to Optimism")
  - Swap tokens on the same chain with best rates (e.g., "swap ETH to USDC on Polygon")
  - Find the best route or quote for a token swap across chains
  - Deposit into DeFi vaults/lending/staking in one click, including cross-chain (Composer: Aave, Morpho, Pendle, EtherFi, Yearn, etc.)
  - Discover yield opportunities, vault APY/TVL data, or track DeFi positions (Earn)
  - Execute gasless or intent-based transfers via a solver network (LI.FI Intents)
  - Move stablecoins cheaply with optimized defaults (stablecoin preset)
  - Build multi-chain payment flows (accept any token, settle in specific token)
  - Check supported chains, tokens, bridges, or gas prices
  - Track status of a cross-chain transaction, recover from failed/partial transfers
  - Query transfer history/analytics or withdraw collected integrator fees
  - Build backends, bots, or AI agents (any language) that need cross-chain functionality
---

# LI.FI API Integration

LI.FI aggregates bridges, DEXs, intent solvers, and DeFi protocols behind one API. This skill covers the full product surface:

| Product | Base URL | What it does |
|---------|----------|--------------|
| **Core API** (swaps & bridges) | `https://li.quest/v1` | Quotes, routes, execution data, status tracking across 75+ chains |
| **Composer** (DeFi execution) | `https://li.quest/v1` (same `/quote` endpoint) | One-click swap/bridge + deposit/withdraw into vaults, lending, staking |
| **Earn** (yield data) | `https://earn.li.fi/v1` | Vault discovery, APY/TVL analytics, portfolio positions |
| **Intents** (solver marketplace) | `https://order.li.fi` | Intent-based orders filled by a competitive solver network |

For AI agents, LI.FI also offers an MCP server (`https://mcp.li.quest/mcp`) and a CLI (`@lifi/cli`). LI.FI recommends agents and backends use the REST API directly rather than the SDK.

## Authentication & Rate Limits

API key is **optional** — it only raises rate limits. Header: `x-lifi-api-key` (get one at the [LI.FI Partner Portal](https://portal.li.fi/)).

```bash
curl "https://li.quest/v1/chains" -H "x-lifi-api-key: YOUR_API_KEY"
```

| Tier | `/quote`, `/advanced/routes` | `/advanced/stepTransaction` | Other endpoints |
|------|------------------------------|------------------------------|-----------------|
| Without API key | 75 req / 2 hours | 50 req / 2 hours | 100 req / minute |
| With API key (default) | 100 RPM (2-hour rolling window: 12,000 / 2h) | same | 100 RPM |

Responses include `ratelimit-limit`, `ratelimit-remaining`, `ratelimit-reset` (seconds) headers. 429 responses carry error code `1005`. Never expose your API key in client-side code.

## Quick Start — The Five-Call Recipe

The canonical flow for any swap/bridge:

```
1. GET /chains   → discover chains (id, key, chainType, nativeToken)
2. GET /tokens   → find tokens & decimals (?chains=1,42161)
3. GET /quote    → get quote with ready-to-sign transactionRequest
4. [Execute]     → if ERC-20: check allowance vs estimate.approvalAddress, approve if needed;
                   then sign & send transactionRequest
5. GET /status   → poll until DONE or FAILED
```

```bash
# 3. Quote (fromToken/toToken accept addresses OR symbols)
curl "https://li.quest/v1/quote?\
fromChain=42161&toChain=10&\
fromToken=0xaf88d065e77c8cC2239327C5EDb3A432268e5831&\
toToken=0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1&\
fromAmount=10000000&fromAddress=0xYourAddress&slippage=0.005"

# 5. Status (pass fromChain to speed it up; bridge = quote's `tool`)
curl "https://li.quest/v1/status?txHash=0xYourTxHash&fromChain=42161&toChain=10&bridge=across"
```

From the quote response, extract: `transactionRequest` (sign & send), `estimate.approvalAddress` (ERC-20 spender), `estimate.toAmount`/`toAmountMin`, `estimate.executionDuration` (basis for polling), and `tool` (pass as `bridge` to `/status`). Quotes go stale in ~60 seconds — re-fetch before signing if older (and always after a separate approval tx).

## Core Endpoints

### GET /quote

Single best route with transaction data ready for execution.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fromChain` / `toChain` | string | Yes | Chain ID or key (same value = same-chain swap) |
| `fromToken` / `toToken` | string | Yes | Token address or symbol |
| `fromAmount` | string | Yes | Amount in smallest unit |
| `fromAddress` | string | Yes | Sender wallet address |
| `toAddress` | string | No | Recipient (defaults to fromAddress) |
| `slippage` | number | No | 0.005 = 0.5% (default) |
| `order` | string | No | `FASTEST` or `CHEAPEST` |
| `integrator` | string | No | Your app ID (analytics + fee collection) |
| `fee` | number | No | Integrator fee (0.02 = 2%) |
| `preset` | string | No | Routing preset, e.g. `stablecoin` (see below) |
| `allowBridges` / `denyBridges` / `preferBridges` | string[] | No | Tool keys from `/tools`, or `all`/`none`/`default` |
| `allowExchanges` / `denyExchanges` / `preferExchanges` | string[] | No | Same |
| `allowDestinationCall` | boolean | No | Default true |
| `maxPriceImpact` | number | No | Default 0.10 (10%) |
| `fromAmountForGas` | string | No | Amount converted to gas on destination |
| `skipSimulation` | boolean | No | Faster response, less accurate gas limit |
| `svmPriorityFeeLevel` | string | No | Solana priority fee: `NORMAL`/`FAST`/`ULTRA` |
| `swapStepTimingStrategies` / `routeTimingStrategies` | string[] | No | e.g. `minWaitTime-600-4-300` |

Variants:
- **GET /quote/toAmount** — pass `toAmount` instead of `fromAmount`; API computes the required input.
- **POST /quote/contractCalls** — bridge + arbitrary destination-chain contract calls (manual calldata). For supported DeFi protocols, prefer Composer instead.

### POST /advanced/routes + POST /advanced/stepTransaction

Multiple route options for comparison. Note the different naming: body uses `fromChainId`, `fromTokenAddress` (addresses only), with filters and `preset` inside `options{}`. Routes contain `steps` without transaction data — POST each step to `/advanced/stepTransaction` to populate `transactionRequest`.

Use `/quote` for simple transfers (1 call); use `/advanced/routes` when the user needs choices or price comparison (2+ calls).

### GET /status

`txHash` (required — sending hash, receiving hash, or step id), plus optional `fromChain` (recommended, speeds up response), `toChain`, `bridge`.

**Statuses:** `NOT_FOUND` → `PENDING` → `DONE` | `FAILED`. On `DONE`, check `substatus`: `COMPLETED`, `PARTIAL` (different token received — full value preserved), or `REFUNDED`. See [Status Recovery](#status-tracking--recovery) below.

### Discovery & utility

- **GET /chains** — `?chainTypes=EVM,SVM,UTXO,MVM,TVM`. **If omitted, returns EVM only.** Non-EVM: Solana (SVM), Bitcoin (UTXO), Sui (MVM), Tron (TVM).
- **GET /tokens** — `?chains=1,137&tags=stablecoin&minPriceUSD=0.01`
- **GET /token** — `?chain=POL&token=DAI`
- **GET /tools** — valid bridge/exchange keys for the `allow*`/`deny*` filters
- **GET /connections** — available token-pair connections (at least one filter required)
- **GET /gas/prices`, `/gas/prices/{chainId}`, `/gas/suggestion/{chain}`** — gas data; **GET /gas/status** — LIFuel tx status
- **GET /calldata/parse** (beta) — `?callData=0x...&chainId=1` decodes LI.FI calldata into named function calls
- **Analytics:** `GET /v1/analytics/transfers` (filtered, max 1000), `GET /v2/analytics/transfers` (cursor-paginated), `GET /v1/analytics/transfers/summary` (cross-chain amounts received, 30-day max range)
- **Integrator fees:** `GET /integrators/{integratorId}` (collected fee balances), `GET /integrators/{integratorId}/withdraw/{chainId}` (withdrawal `transactionRequest`)

Deprecated — do not use: `/advanced/possibilities`, `/gas/refetch`, `/analytics/wallets/{address}`.

## Routing Presets

`preset=stablecoin` (on `/quote`, or `options.preset` on `/advanced/routes`) applies optimized defaults for stablecoin transfers: `order=CHEAPEST`, `slippage=0.001`, price impact capped at 2%, and a shortlist of stablecoin-friendly bridges (Glacis, Mayan, Celer, Eco, Relay, Across, Gaszip). Explicit request params always override preset defaults — but list overrides like `denyBridges` **replace** the preset's lists entirely. Find qualifying tokens with `GET /tokens?tags=stablecoin`. (`commerce` preset coming soon.)

## Composer — One-Click DeFi Deposits & Withdrawals

Composer bundles swap + bridge + protocol interaction (deposit, stake, lend, withdraw) into a single atomic transaction. **There is no dedicated endpoint** — set `toToken` to a supported protocol's vault/staking/deposit token address on the standard `GET /quote`, and Composer activates automatically:

```bash
# 100 USDC on Arbitrum → Morpho Spark USDC vault on Base, one signature
curl "https://li.quest/v1/quote?\
fromChain=42161&toChain=8453&\
fromToken=0xaf88d065e77c8cC2239327C5EDb3A432268e5831&\
toToken=0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A&\
fromAmount=100000000&fromAddress=0xYou&toAddress=0xYou"
```

- **Detection:** same-chain deposit quotes show the zap tool as top-level `tool` (e.g. `composer`, but the engine may route via other integrated zap tools such as `fly`); cross-chain quotes show the bridge as `tool` with the zap step in `includedSteps`. Don't hard-code on `tool === "composer"` — any quote with a vault address as `toToken` is a deposit route.
- **Withdrawals:** reverse it — vault token as `fromToken`, desired token as `toToken`.
- **Every quote is simulated** on a fork before being returned; failures surface as API errors instead of reverting txs.
- **Coverage:** ~29 protocols (Aave V3, Morpho, Pendle, Spark, Euler, Fluid, Yearn, EtherFi, Kelp, Ethena, Maple, …) across 23 EVM chains. Some are **deposit-only** (Ethena, Kinetiq, Maple, Royco, USDai, Concrete, Ember) — withdraw via the protocol's own UI.
- **Limitations:** EVM only; tokenized positions only (the target must mint a token); cross-chain flows are eventually consistent, not atomic — a destination deposit can fail after a successful bridge, leaving the user with the bridged token (poll `/status`, handle `PARTIAL`).
- Use higher slippage (e.g. `0.01`) for cross-chain composer routes.

See [references/REFERENCE.md](references/REFERENCE.md#composer) for the full protocol list and error codes.

## Earn — Yield Discovery & Portfolio Data

Earn is a read-only data API at **`https://earn.li.fi`** (separate host!) normalizing vaults from 20+ protocols. **Unlike the core API, it requires the `x-lifi-api-key` header** (401 without). Execution is delegated to Composer: take a vault's `address` and use it as `toToken` on `li.quest/v1/quote`.

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/vaults` | List vaults — filter by `chainId`, `asset` (symbol or address), `protocol`, `minTvlUsd`, `isTransactional`, `isRedeemable`, `isComposerSupported`; sort with `sortBy=apy\|tvl`; cursor pagination (`limit` ≤ 100, follow `nextCursor`) |
| `GET /v1/vaults/{chainId}/{address}` | Single vault detail |
| `GET /v1/chains` / `GET /v1/protocols` | Filter dropdown data (Earn-scoped, not platform-wide) |
| `GET /v1/portfolio/{userAddress}/positions` | User's DeFi positions with USD balances |

```bash
# Top USDC vaults on Base by APY, depositable via Composer
curl "https://earn.li.fi/v1/vaults?chainId=8453&asset=USDC&sortBy=apy&isComposerSupported=true&limit=10" \
  -H "x-lifi-api-key: YOUR_API_KEY"
```

Gotchas: boolean filters are string literals (`"true"`/`"false"`); APY values are decimals (0.0534 = 5.34%); TVL/balances are strings; `lpTokens` is usually empty — use the vault's top-level `address` for execution; gate deposit/withdraw UI on `isTransactional`/`isRedeemable`; check `timeLock`, `caps`, `kyc` fields. Rate limit: 50 req/min per key. Vault data refreshes every 15 min (transactional flags every 2 min).

**Discover → deposit recipe:** `GET earn.li.fi/v1/vaults` → pick vault → `GET li.quest/v1/quote` with vault address as `toToken` → approve + send → poll `/status`.

## LI.FI Intents — Solver Marketplace

A separate intent-based system at **`https://order.li.fi`** (dev: `order-dev.li.fi`). Users express desired outcomes; solvers pre-fund delivery on the destination chain against standing quotes. Foundation of the Open Intents Framework. **Integrator endpoints need no API key.**

| Endpoint | Purpose |
|----------|---------|
| `POST /quote/request` | Quote an intent (`swapType`: `exact-input`/`exact-output`); returns `quotes[]` best-first with `quoteId` |
| `POST /orders/submit` | Off-chain order submission (Compact/gasless flows) |
| `GET /orders/status` | By `onChainOrderId` or `catalystOrderId` |
| `GET /orders` | List/filter orders |
| `GET /chains/supported` / `GET /routes` | Live coverage (EVM + Solana + Tron) |

Two funding models:
- **Escrow** (recommended default): approve → on-chain `open(order)` on InputSettlerEscrow — no `/orders/submit` call needed, solvers detect the `Open` event.
- **Compact** (gasless): deposit once into The Compact, then sign EIP-712 `BatchCompact` orders off-chain and submit via `/orders/submit`.

Order lifecycle: `Submitted/Open → Signed → Delivered → Settled` (terminal). Refundable after `expires` if unfilled. Addresses use **EIP-7930 interoperable format** (chain ID embedded), not bare 0x addresses. Amounts in smallest units. See [REFERENCE.md](references/REFERENCE.md#lifi-intents-api) for StandardOrder structs, contract addresses, and signing details.

**Note:** the classic `li.quest/v1/quote` already aggregates intent-based bridges (Across, Relay, etc.) — only integrate `order.li.fi` directly when you want the order-server model itself (solver selection, resource locks, gasless submission).

## Token Approvals

- Native token (`0x0000…0000`) → no approval needed.
- Spender is always `quote.estimate.approvalAddress` — **never hardcode it** (it varies by route).
- Check `allowance(fromAddress, approvalAddress)`; if `< fromAmount`, send `approve` and **wait for confirmation** before the main tx, then re-fetch the quote (gas estimates go stale).
- **USDT quirk:** if current allowance > 0, you must `approve(spender, 0)` first, then approve the new amount.
- Prefer exact-amount approvals for agents; approval gas ≈ 50–100k.

## Status Tracking & Recovery

Poll `GET /status` with backoff: 10s (first ~6 attempts) → 30s → 60s → 120s. Use `estimate.executionDuration` from the quote to set expectations. Same-chain swaps are atomic and usually instant.

| Result | Action |
|--------|--------|
| `NOT_FOUND` / `PENDING` | Keep polling (NOT_FOUND just means not indexed yet) |
| `DONE` + `COMPLETED` | Success |
| `DONE` + `PARTIAL` | User received a different token (full value preserved, typically the bridge token on the destination). Optionally recover: quote a **same-chain swap** from `receiving.token` to the intended token; skip if gas > ~10% of value |
| `DONE` + `REFUNDED` | Tokens returned on the source chain |
| `FAILED` | Permanent — check `substatus` (`SLIPPAGE_EXCEEDED`, `OUT_OF_GAS`, `NOT_PROCESSABLE_REFUND_NEEDED`, …), inform user |

On timeout, never assume failure — save `txHash` and share `lifiExplorerLink` (`https://explorer.li.fi/tx/<txHash>`). Funds are non-custodial and end with the user; prevent PARTIAL by raising slippage for volatile tokens or targeting the bridge's native token directly.

## Error Handling

| HTTP | Retry? | Action |
|------|--------|--------|
| 400 | No | Fix parameters |
| 404 / `NO_POSSIBLE_ROUTE` | Maybe | Different pair/amount/chains; try USDC/USDT/ETH as intermediary |
| 429 (code 1005) | Yes | Exponential backoff `min(2^attempt × 1s, 30s)` |
| 500/503 | Yes (1–2×) | Wait 2–10s, retry |

Common API error codes: `1002` NoQuote, `1007` Slippage (raise `slippage` to `min(current×2, 0.03)` or lower amount), `1011` Validation. Tool-level codes inside `errors[]`: `NO_POSSIBLE_ROUTE`, `AMOUNT_TOO_LOW` (Composer minimums run higher), `INSUFFICIENT_LIQUIDITY`, `TOOL_TIMEOUT` (retry immediately), `FEES_HIGHER_THAN_AMOUNT`. On `execution reverted` at send time: the quote was stale — fetch a fresh one (max ~2 retries). Full table in [REFERENCE.md](references/REFERENCE.md#error-reference).

## Integration Examples

### Python

```python
import requests

BASE_URL = "https://li.quest/v1"
HEADERS = {"x-lifi-api-key": "YOUR_API_KEY"}  # optional

def get_quote(from_chain, to_chain, from_token, to_token, amount, address, **kwargs):
    params = {
        "fromChain": from_chain, "toChain": to_chain,
        "fromToken": from_token, "toToken": to_token,
        "fromAmount": amount, "fromAddress": address,
        "slippage": 0.005, "integrator": "your-app", **kwargs,
    }
    r = requests.get(f"{BASE_URL}/quote", params=params, headers=HEADERS)
    r.raise_for_status()
    return r.json()

def get_status(tx_hash, from_chain=None, to_chain=None, bridge=None):
    params = {"txHash": tx_hash, "fromChain": from_chain,
              "toChain": to_chain, "bridge": bridge}
    return requests.get(f"{BASE_URL}/status", params=params, headers=HEADERS).json()

# Cross-chain swap quote
quote = get_quote(42161, 10,
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",   # USDC.e Arbitrum
    "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",   # DAI Optimism
    "10000000", "0xYourAddress")

# Composer deposit: same call, vault address as toToken
deposit = get_quote(8453, 8453,
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",   # USDC Base
    "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A",   # Morpho vault
    "100000000", "0xYourAddress")

# transactionRequest values are hex strings — parse before use
tx = quote["transactionRequest"]
gas_limit = int(tx["gasLimit"], 16)
```

### Node.js

```javascript
const BASE_URL = 'https://li.quest/v1';

async function getQuote(params) {
  const res = await fetch(`${BASE_URL}/quote?${new URLSearchParams(params)}`);
  if (!res.ok) throw new Error(`Quote failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function pollStatus(txHash, fromChain, toChain, bridge) {
  const params = new URLSearchParams({ txHash, fromChain, toChain, bridge });
  for (let attempt = 0; attempt < 60; attempt++) {
    const data = await (await fetch(`${BASE_URL}/status?${params}`)).json();
    if (data.status === 'DONE' || data.status === 'FAILED') return data;
    const delay = attempt < 6 ? 10_000 : attempt < 12 ? 30_000 : 60_000;
    await new Promise((r) => setTimeout(r, delay));
  }
  throw new Error('Status polling timed out — check explorer.li.fi');
}

// Earn: discover top vaults, then deposit via Composer
const { data: vaults } = await (await fetch(
  'https://earn.li.fi/v1/vaults?chainId=8453&asset=USDC&sortBy=apy&isComposerSupported=true&limit=5'
)).json();
const quote = await getQuote({
  fromChain: 8453, toChain: 8453,
  fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  toToken: vaults[0].address, // vault address triggers Composer
  fromAmount: '100000000',
  fromAddress: '0xYourAddress', toAddress: '0xYourAddress',
});
```

## Best Practices

1. **Always pass `integrator`** — required for analytics, fee collection, and fee withdrawal.
2. **Re-fetch stale quotes** — quotes expire in ~60s; always re-quote after an approval tx.
3. **Cache `/chains`, `/tokens`, `/tools`** — they change infrequently and polling burns rate limit.
4. **Pass `fromChain` to `/status`** — significantly faster responses.
5. **Use `preset=stablecoin`** for stable-to-stable transfers instead of hand-tuning slippage/bridges.
6. **Request `chainTypes` explicitly on `/chains`** if you need non-EVM (default is EVM-only).
7. **Amounts are strings** in smallest units (`human × 10^decimals`); `transactionRequest.value/gasLimit/gasPrice` are hex strings.
8. **Handle `PARTIAL` completions** — offer a same-chain recovery swap when worthwhile.
9. **For agents:** consider the MCP server (`https://mcp.li.quest/mcp`) or `@lifi/cli` for token-efficient access; machine-readable docs at `https://docs.li.fi/llms.txt` and `https://docs.li.fi/openapi.yaml` (any docs page is fetchable as markdown by appending `.md`).

See [references/REFERENCE.md](references/REFERENCE.md) for complete endpoint documentation, response schemas, the Earn and Intents API references, error codes, chain IDs, and token addresses.
