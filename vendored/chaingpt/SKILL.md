---
name: chaingpt
description: "Build with the ChainGPT Web3 AI developer platform. Full API/SDK reference and project scaffolding for: Web3 AI Chatbot & LLM, AI NFT Generator, Smart Contract Generator, Smart Contract Auditor, AI Crypto News, AgenticOS Twitter agents, and Solidity LLM. Use when building blockchain apps, Web3 chatbots, NFT tools, smart contract tools, crypto news feeds, AI agents, or integrating any ChainGPT API. Triggers: chaingpt, web3 ai, nft generator, smart contract audit, crypto news api, agenticos, solidity llm, cgpt, blockchain ai, token analytics."
---

# ChainGPT Developer Skill

You are an expert at building with the ChainGPT Web3 AI platform. When a developer asks you to integrate any ChainGPT product, you know the exact endpoints, SDK methods, parameters, pricing, and best practices.

## Platform Overview

ChainGPT provides AI infrastructure for Web3 via APIs, SDKs, and whitelabel SaaS. All API products share:

- **Base URL:** `https://api.chaingpt.org`
- **Auth:** `Authorization: Bearer <API_KEY>` header
- **Rate Limit:** 200 requests/minute per key
- **Credits:** 1 CGPTc = $0.01 USD (never expire). Purchase at https://app.chaingpt.org/addcredits
- **API Dashboard:** https://app.chaingpt.org/apidashboard
- **SDKs:** JavaScript/TypeScript (Node.js) + Python for all products

### Getting an API Key

1. Visit https://app.chaingpt.org — connect a crypto wallet to sign up
2. Navigate to API Keys → "Create New Secret Key"
3. Store the key securely (env var or secret manager — shown only once)
4. Ensure sufficient credits (crypto, $CGPT token, or credit card)
5. 15% bonus when paying with $CGPT or via monthly auto-top-up

## Products at a Glance

| Product | NPM Package | Model ID / Endpoint | Cost per Request |
|---------|-------------|-------------------|-----------------|
| Web3 AI Chatbot & LLM | `@chaingpt/generalchat` | `general_assistant` via `POST /chat/stream` | 0.5 credits (+0.5 w/ history) |
| AI NFT Generator | `@chaingpt/nft` | `POST /nft/generate-image` + 5 more | 1-14.25 credits (model/upscale) |
| Smart Contract Generator | `@chaingpt/smartcontractgenerator` | `smart_contract_generator` via `POST /chat/stream` | 1 credit (+1 w/ history) |
| Smart Contract Auditor | `@chaingpt/smartcontractauditor` | `smart_contract_auditor` via `POST /chat/stream` | 1 credit (+1 w/ history) |
| AI Crypto News | `@chaingpt/ainews` | `GET /news` | 1 credit per 10 records |
| AgenticOS | Open-source (GitHub) | Self-hosted | 1 credit per generated tweet |
| Solidity LLM | Open-source (HuggingFace) | Local inference | Free (self-hosted) |

Python: `pip install chaingpt` (unified package for all products)

## Quick Starts

### 1. Web3 AI Chatbot & LLM

The LLM is fine-tuned for crypto/blockchain with live on-chain data, Nansen Smart Money, token analytics, and 33+ chain support.

**JavaScript:**
```javascript
import { GeneralChat } from '@chaingpt/generalchat';
const chat = new GeneralChat({ apiKey: process.env.CHAINGPT_API_KEY });

// Buffered response
const res = await chat.createChatBlob({
  question: 'What is the current ETH price and market sentiment?',
  chatHistory: 'off'
});
console.log(res.data.bot);

// Streaming response
const stream = await chat.createChatStream({
  question: 'Analyze the top DeFi protocols by TVL',
  chatHistory: 'on',
  sdkUniqueId: 'session-123'
});
stream.on('data', chunk => process.stdout.write(chunk.toString()));
```

**Python:**
```python
from chaingpt.client import ChainGPTClient
from chaingpt.models import LLMChatRequestModel
from chaingpt.types import ChatHistoryMode

async with ChainGPTClient(api_key=API_KEY) as client:
    res = await client.llm.chat(LLMChatRequestModel(
        question="Explain yield farming strategies",
        chatHistory=ChatHistoryMode.OFF
    ))
    print(res.data.bot)
```

**REST (single endpoint for all chat-based products):**
```bash
curl -X POST "https://api.chaingpt.org/chat/stream" \
  -H "Authorization: Bearer $CHAINGPT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"general_assistant","question":"How do Ethereum smart contracts work?","chatHistory":"off"}'
```

> For full parameter reference (context injection, custom tones, blockchain enums, chat history retrieval), read `reference/llm-chatbot.md`.

### 2. AI NFT Generator

Generate images from text prompts, mint as NFTs across 22+ chains. Four models: VeloGen (fast), NebulaForge XL (detailed), VisionaryForge (general), Dale3 (DALL-E 3).

**JavaScript:**
```javascript
import { Nft } from '@chaingpt/nft';
const nft = new Nft({ apiKey: process.env.CHAINGPT_API_KEY });

// Generate image
const img = await nft.generateImage({
  prompt: 'A cyberpunk dragon guarding a blockchain vault',
  model: 'nebula_forge_xl', height: 1024, width: 1024, steps: 25, enhance: '1x'
});

// Generate + mint NFT
const gen = await nft.generateNft({
  prompt: 'Cosmic whale swimming through DeFi protocols',
  model: 'velogen', height: 512, width: 512, steps: 3,
  walletAddress: '0xYOUR_WALLET', chainId: 56, amount: 1
});
const mint = await nft.mintNft({
  collectionId: gen.data.collectionId,
  name: 'Cosmic Whale #1', description: 'AI-generated NFT', symbol: 'WHALE', ids: [1]
});
```

> For all endpoints (generate-image, generate-multiple-images, queue, progress, mint, enhancePrompt, get-chains, abi), models, styles, chain IDs, and pricing, read `reference/nft-generator.md`.

### 3. Smart Contract Generator

Natural language to production Solidity. Powered by ChainGPT's Solidity LLM.

**JavaScript:**
```javascript
import { SmartContractGenerator } from '@chaingpt/smartcontractgenerator';
const gen = new SmartContractGenerator({ apiKey: process.env.CHAINGPT_API_KEY });

const res = await gen.createSmartContractBlob({
  question: 'Create an ERC-20 token called "MyToken" with symbol "MTK", 1 billion supply, 2% burn on transfer, and owner-only minting',
  chatHistory: 'off'
});
console.log(res.data.bot); // Full Solidity contract
```

> Full reference: `reference/smart-contract-generator.md`

### 4. Smart Contract Auditor

AI-powered vulnerability detection, scoring (0-100%), and remediation recommendations.

**JavaScript:**
```javascript
import { SmartContractAuditor } from '@chaingpt/smartcontractauditor';
const auditor = new SmartContractAuditor({ apiKey: process.env.CHAINGPT_API_KEY });

const res = await auditor.auditSmartContractBlob({
  question: `Audit this contract:\n\n${contractSourceCode}`,
  chatHistory: 'off'
});
console.log(res.data.bot); // Detailed audit report
```

> Full reference: `reference/smart-contract-auditor.md`

### 5. AI Crypto News

Real-time AI-curated news via Nova AI engine. 24 categories, 50+ blockchain filters, 30 token filters. Also available as free RSS feeds.

**JavaScript:**
```javascript
import { AINews } from '@chaingpt/ainews';
const news = new AINews({ apiKey: process.env.CHAINGPT_API_KEY });

const res = await news.getNews({
  categoryId: [5],        // DeFi
  subCategoryId: [15],    // Ethereum
  limit: 10, offset: 0, sortBy: 'createdAt'
});
res.data.forEach(a => console.log(`${a.title} — ${a.url}`));
```

**Free RSS (no auth):** `https://app.chaingpt.org/rssfeeds.xml` (all), `-bitcoin.xml`, `-bnb.xml`, `-ethereum.xml`

> Full reference with all category/subcategory/token IDs: `reference/crypto-news.md`

### 6. AgenticOS (Open-Source Twitter AI Agent)

TypeScript/Bun framework for autonomous X/Twitter agents posting Web3 content.

```bash
git clone https://github.com/ChainGPT-org/AgenticOS.git && cd AgenticOS
bun install && bun start
```

> Full setup, env vars, webhook config, deployment: `reference/agenticos.md`

### 7. Solidity LLM (Open-Source)

2B-parameter model on HuggingFace (`Chain-GPT/Solidity-LLM`), MIT license. 83% compilation success rate.

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("Chain-GPT/Solidity-LLM").to("cuda")
tokenizer = AutoTokenizer.from_pretrained("Chain-GPT/Solidity-LLM")
```

> Full reference: `reference/solidity-llm.md`

## Project Scaffolding Templates

When a developer asks to scaffold a project, read the appropriate template file and generate the complete working starter code:

| Request | Template File |
|---------|--------------|
| "Build a Web3 AI chatbot" / "scaffold a chatbot app" | `templates/chatbot-app.md` |
| "Build an NFT minting service" / "NFT generation tool" | `templates/nft-minting-service.md` |
| "Set up contract auditing in CI/CD" / "audit pipeline" | `templates/contract-auditor-ci.md` |
| "Build a crypto news dashboard" / "news feed widget" | `templates/news-dashboard.md` |
| "Launch an AI Twitter agent" / "create a crypto bot" | `templates/twitter-agent.md` |
| "Combine multiple products" / "multi-product architecture" | `templates/composition-patterns.md` |

## Detailed Reference Files

When you need specifics beyond this quickstart, read the corresponding reference file:

| Topic | File |
|-------|------|
| LLM Chatbot — full API, context injection, tones, enums | `reference/llm-chatbot.md` |
| NFT Generator — all endpoints, models, styles, chains | `reference/nft-generator.md` |
| Smart Contract Generator — params, SDK, history | `reference/smart-contract-generator.md` |
| Smart Contract Auditor — audit params, SDK, report format | `reference/smart-contract-auditor.md` |
| Crypto News — categories, tokens, RSS feeds | `reference/crypto-news.md` |
| AgenticOS — setup, webhooks, deployment | `reference/agenticos.md` |
| Solidity LLM — model specs, training, benchmarks | `reference/solidity-llm.md` |
| SaaS & Whitelabel — launchpad, staking, vesting products | `reference/saas-whitelabel.md` |
| Pricing — complete credit costs across all products | `reference/pricing.md` |
| Error Codes — HTTP errors, SDK exceptions, troubleshooting | `reference/error-codes.md` |
| Product Selection — decision matrix, cost estimates by scale | `reference/product-selection.md` |
| Wallet Integration — MetaMask, WalletConnect, minting flows | `reference/wallet-integration.md` |
| Advanced Patterns — streaming, rate limiting, caching, circuit breaker | `reference/advanced-patterns.md` |
| Deployment — Vercel, Railway, Docker, AWS Lambda, CI/CD | `reference/deployment.md` |
| Cost Optimization — caching, batching, history toggle strategies | `reference/cost-optimization.md` |
| TypeScript Types — complete request/response interfaces | `reference/typescript-types.md` |

## Working Code Examples

Complete runnable examples are in the `examples/` directory:

- `examples/js/chatbot-stream.js` — Streaming chatbot with context injection
- `examples/js/nft-generate-mint.js` — Generate image + mint NFT on BSC
- `examples/js/audit-contract.js` — Audit a Solidity contract file
- `examples/js/fetch-news.js` — Fetch filtered crypto news
- `examples/python/chatbot_stream.py` — Async streaming chatbot
- `examples/python/nft_generate_mint.py` — Generate + mint NFT
- `examples/python/audit_contract.py` — Audit contract from file
- `examples/python/fetch_news.py` — Fetch and display news

## Credit Cost Estimator

**Before generating code that makes API calls, always estimate and report the credit cost to the developer.** Use this reference:

| Operation | Credits | USD |
|-----------|---------|-----|
| LLM Chat (single request) | 0.5 | $0.005 |
| LLM Chat + history | 1.0 | $0.01 |
| NFT Generate (VeloGen/Nebula/Visionary) | 1.0 | $0.01 |
| NFT Generate + 1x upscale | 2.0 | $0.02 |
| NFT Generate + 2x upscale | 3.0 | $0.03 |
| NFT Generate (Dale3 1024x1024) | 4.75 | $0.0475 |
| NFT Generate (Dale3 other resolutions) | ~9.5 | ~$0.095 |
| NFT Generate (Dale3 + enhanced) | ~14.25 | ~$0.1425 |
| NFT Generate (NebulaForge/VisionaryForge steps 26-50) | +0.25 surcharge | +$0.0025 |
| NFT Character Preserve | +5.0 | +$0.05 |
| NFT Prompt Enhancement | 0.5 | $0.005 |
| NFT Mint / Chains / ABI | 0 | Free |
| Contract Generator | 1.0 | $0.01 |
| Contract Generator + history | 2.0 | $0.02 |
| Contract Auditor | 1.0 | $0.01 |
| Contract Auditor + history | 2.0 | $0.02 |
| News (per 10 records) | 1.0 | $0.01 |
| AgenticOS (per tweet) | 1.0 | $0.01 |

**Example estimate:** "Generating 100 NFTs with NebulaForge XL + 1x upscale = 200 credits ($2.00). With prompt enhancement for each: 250 credits ($2.50)."

When the developer asks to build something, provide the per-request cost AND an estimate for their likely usage pattern (e.g., "At 1,000 chat requests/day, that's ~500 credits/day = $5/day").

## Smart Contract Patterns

When generating Solidity contracts, check the `patterns/` directory first. 45+ audited patterns available:
- `patterns/tokens.md` — 10 ERC-20 variants (basic, burnable, taxable, reflection, governance, etc.)
- `patterns/nfts.md` — 10 NFT patterns (ERC-721, 721A, lazy mint, soulbound, dynamic, ERC-1155, etc.)
- `patterns/defi.md` — 10 DeFi patterns (staking, vesting, bonding curve, AMM, flash loans, etc.)
- `patterns/governance.md` — 5 DAO patterns (Governor, multi-sig, treasury, delegation)
- `patterns/security.md` — 10 security patterns (access control, upgradeable, timelock, escrow, etc.)

Compose from these patterns rather than generating from scratch — they're audited and gas-optimized.

## Migration Guides

If a developer is migrating from another platform, read the relevant guide:
- `migration/from-openai.md` — OpenAI → ChainGPT (concept mapping, code migration, pricing comparison)
- `migration/from-alchemy.md` — Alchemy AI → ChainGPT (complementary + replacement strategies)
- `migration/from-custom.md` — Custom AI solutions → ChainGPT (cost comparison, hybrid approach)

## Additional Skills

These are Claude Code skill commands — invoke them in any Claude conversation, not in a terminal.

| Command | What It Does |
|---------|-------------|
| `/chaingpt-playground` | Interactively test any ChainGPT API endpoint live |
| `/chaingpt-debug` | Diagnose and fix ChainGPT API errors |
| `/chaingpt-hackathon` | Scaffold a complete hackathon project in 60 seconds |
| `/chaingpt-update` | Check for and apply skill updates |

## MCP Server

If the ChainGPT MCP server is installed, Claude can call ChainGPT APIs directly (not just generate code). 12 tools available — see `mcp-server/README.md`.

## Mock Server for Testing

A full mock server is available at `mock-server/` for development and CI/CD without spending credits. Mimics all endpoints with realistic responses. See `mock-server/README.md`.

## Key Conventions

When generating code that uses ChainGPT APIs, always:

1. **Store API keys in environment variables** — never hardcode. Use `process.env.CHAINGPT_API_KEY` (JS) or `os.environ["CHAINGPT_API_KEY"]` (Python).
2. **Handle credit exhaustion** — check for HTTP 402/403 and prompt the user to top up at https://app.chaingpt.org/addcredits.
3. **Use streaming for chat-based products** when building user-facing UIs — better UX than waiting for full response.
4. **Include error handling** — wrap SDK calls in try/catch with product-specific error classes (e.g., `Errors.GeneralChatError`, `Errors.NftError`).
5. **Use sdkUniqueId for multi-user apps** — isolates chat history per user/session.
6. **Prefer the SDK over raw REST** — handles auth, streaming, and error typing automatically.
7. **Estimate credit costs before batch operations** — always tell the developer what the operation will cost before running it.
8. **Use patterns for contracts** — check `patterns/` before generating Solidity from scratch.
9. **Use the mock server for testing** — point to `http://localhost:3001` during development to avoid spending credits.

## Links

- **API Dashboard:** https://app.chaingpt.org/apidashboard
- **Pricing:** https://app.chaingpt.org/pricing
- **Purchase Credits:** https://app.chaingpt.org/addcredits
- **Grant Program ($1M):** https://www.chaingpt.org/web3-ai-grant
- **Developer Docs:** https://docs.chaingpt.org/dev-docs-b2b-saas-api-and-sdk
- **Solidity LLM (HuggingFace):** https://huggingface.co/Chain-GPT/Solidity-LLM
- **AgenticOS (GitHub):** https://github.com/ChainGPT-org/AgenticOS
- **SaaS Demo Booking:** https://calendly.com/saaswl/demo
