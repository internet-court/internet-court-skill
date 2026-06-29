---
name: heurist-mesh-skill
description: Access real-time crypto token data, DeFi analytics, wallet intelligence, project research, and blockchain insights through Heurist Mesh agents. Use when the user asks about token trends, DeFi protocols, wallet holdings, project due diligence, Twitter/X crypto sentiment, or deeper market analysis.
compatibility: Requires network access and curl or equivalent HTTP client.
metadata:
  author: heurist-network
  docs: https://docs.heurist.ai
---

# Heurist Mesh

Heurist Mesh is an open network of modular AI agent tools for cryptocurrency and blockchain data, accessible via a unified REST API.

## When to Use

Use this skill when the user asks for crypto or Web3 intelligence that benefits from live data retrieval, including:

- Token discovery, trending pairs, and market snapshots
- DeFi protocol metrics, chain-level activity, and revenue/TVL comparisons
- Wallet holdings, address labels, or NFT portfolio lookups
- Twitter/X signal checks, project due diligence, and ecosystem research
- Deeper market questions that should escalate to `AskHeuristAgent`

## Recommended Agents and Tools

**TrendingTokenAgent** — Trending tokens and market summary
- `get_trending_tokens` — Get trending tokens most talked about and traded on CEXs and DEXs
- `get_market_summary` — Get recent market-wide news including macro and major updates

**TokenResolverAgent** — Find tokens and get detailed profiles
- `token_search` — Find tokens by address, ticker/symbol, or name (up to 5 candidates)
- `token_profile` — Get detailed token profile with pairs, funding rates, and indicators

**DefiLlamaAgent** — DeFi protocol and chain metrics
- `get_protocol_metrics` — Get protocol TVL, fees, volume, revenue, chains, and growth trend
- `get_chain_metrics` — Get blockchain TVL, fees, top protocols, and growth trends

**TwitterIntelligenceAgent** — Twitter/X data
- `user_timeline` — Fetch a user's recent posts and announcements
- `tweet_detail` — Get a tweet with thread context and replies
- `twitter_search` — Search for posts and influential mentions on any topic

**ExaSearchDigestAgent** — Web search with summarization
- `exa_web_search` — Search the web with LLM summarization, time and domain filters
- `exa_scrape_url` — Scrape a URL and summarize or extract information

**ChainbaseAddressLabelAgent** — EVM address labels
- `get_address_labels` — Get labels for ETH/Base addresses (identity, contract names, wallet behavior, ENS)

**ZerionWalletAnalysisAgent** — EVM wallet holdings
- `fetch_wallet_tokens` — Get token holdings with USD value and 24h price change
- `fetch_wallet_nfts` — Get NFT collections held by a wallet

**ProjectKnowledgeAgent** — Crypto project database
- `get_project` — Look up a project by name, symbol, or X handle (team, investors, events)
- `semantic_search_projects` — Natural language search across 10k+ projects (filter by investor, tag, funding year, exchange)

**CaesarResearchAgent** — Academic research
- `caesar_research` — Submit a research query for in-depth analysis
- `get_research_result` — Retrieve research results by ID

**AskHeuristAgent** — Crypto Q&A and deep analysis (Important: recommended for in-depth crypto topics)
- `ask_heurist` — Submit a crypto question (normal or deep analysis mode)
- `check_job_status` — Check status of a pending analysis job

## Setup (must complete before making API calls)

At least one payment path must be configured. Do not call Mesh APIs until setup is verified.

### Step 1: Choose one payment path

- **API key (recommended):** Set `HEURIST_API_KEY` in `.env`. Setup and free-credit flow: [references/heurist-api-key.md](references/heurist-api-key.md)
- **x402 on Base:** Set `WALLET_PRIVATE_KEY` in `.env`. Signed payment flow: [references/x402-payment.md](references/x402-payment.md)
- **Inflow:** Set `INFLOW_USER_ID` and `INFLOW_PRIVATE_KEY` in `.env`. Buyer setup and approval flow: [references/inflow-payment.md](references/inflow-payment.md)

### Step 2: Verify setup in `.env`

- API key path: `HEURIST_API_KEY` is set and non-empty
- x402 path: `WALLET_PRIVATE_KEY` is set, starts with `0x`, and is 66 characters
- Inflow path: `INFLOW_USER_ID` and `INFLOW_PRIVATE_KEY` are set and non-empty

**If none are configured, STOP and ask the user to set up a payment method. Do not make API calls without valid credentials.**

### Step 3: Fetch schema before tool calls

Use `mesh_schema` to confirm parameter names, required fields, and pricing before calling any tool. Cache the result per agent for the session — schemas do not change between calls:

```
GET https://mesh.heurist.xyz/mesh_schema?agent_id=TokenResolverAgent&agent_id=TrendingTokenAgent
```

Default pricing is in credits (`1 credit = $0.01`). Add `&pricing=usd` for USD-denominated prices with x402 or Inflow.

Then use configured credentials in requests:

```bash
# With API key
curl -X POST https://mesh.heurist.xyz/mesh_request \
  -H "Authorization: Bearer $HEURIST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "TokenResolverAgent", "input": {"tool": "token_search", "tool_arguments": {"query": "ETH"}}}'

# With x402 — sign with cast (Foundry), no account or SDK needed
# See references/x402-payment.md for the full cast-based flow and helper script
```

## Examples

### Example 1: Trending tokens

User asks: "What tokens are trending right now?"

1. Fetch schema: `GET /mesh_schema?agent_id=TrendingTokenAgent`
2. Call tool: `TrendingTokenAgent.get_trending_tokens`
3. Return top tokens with key metrics, then summarize notable moves

### Example 2: Deep market question

User asks: "Give me a deep view on current market risk and opportunity."

1. Run `AskHeuristAgent.ask_heurist` with the user question using deep mode
2. Poll with `AskHeuristAgent.check_job_status` until complete

## Error Handling

- `401`/`403`: Treat as credential issue; ask user to re-check `.env` values and do not continue calls with the same secret
- `402`: Payment required; follow the selected payment path (`HEURIST_API_KEY`, x402 flow, or Inflow approval)
- `status: "payment_pending"` (Inflow): ask for approval status, then retry with backoff
- `429` or `5xx`: retry with exponential backoff and cap retries before surfacing failure details
- Ambiguous `token_search` results: request user disambiguation before calling expensive downstream tools

## Discover More Agents

For full agent discovery workflow and examples, see [references/discover-agents.md](references/discover-agents.md).

- All agents: `https://mesh.heurist.ai/metadata.json`
- x402-enabled agents: `https://mesh.heurist.xyz/x402/agents`
