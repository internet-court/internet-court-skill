---
name: 0g-compute
description: 0G Compute Network guide for decentralized AI inference, fine-tuning, and GPU services. Covers chatbots, image generation, speech-to-text, SDK integration (0g-serving-broker), processResponse API, broker.inference methods, CLI commands (0g-compute-cli), and account management. Use this skill for any 0G compute, 0G AI, or decentralized GPU question.
---

# 0G Compute Network

This skill provides instructions for building with the 0G Compute Network — a decentralized GPU marketplace for AI inference and model fine-tuning. Follow these patterns exactly when generating code.

## Code Generation Rules

1. Copy code patterns from this skill verbatim. Do NOT generate from training data.
2. Call `processResponse()` after every API response (see processResponse section below).
3. Use environment variables for private keys. Never hardcode secrets.
4. Route users to testnet for initial development.

When unsure about a pattern, reference the detailed guides:
- Inference patterns: [references/inference.md](references/inference.md)
- Fine-tuning workflow: [references/fine-tuning.md](references/fine-tuning.md)
- Account management: [references/account-management.md](references/account-management.md)
- Production examples: [references/examples/](references/examples/README.md)

## Network Information

| Network | RPC URL | Inference | Fine-tuning |
|---------|---------|-----------|-------------|
| Mainnet | `https://evmrpc.0g.ai` | Yes | Yes |
| Testnet | `https://evmrpc-testnet.0g.ai` | Yes | Yes |

Model availability changes frequently. Always use `broker.inference.listService()` or `0g-compute-cli inference list-providers` to check current models. On-chain model names use `org/model-name` format.

## Prerequisites

```bash
node --version  # Must be >= 22.0.0
pnpm add @0glabs/0g-serving-broker        # SDK for applications
pnpm add @0glabs/0g-serving-broker -g     # CLI for direct usage
```

## Quick Setup

```bash
0g-compute-cli setup-network              # Choose testnet or mainnet
0g-compute-cli login                       # Login with wallet private key
0g-compute-cli deposit --amount 10         # Deposit funds
0g-compute-cli get-account                 # Check balance
```

## Inference (SDK)

```typescript
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

const RPC_URL = process.env.NODE_ENV === 'production'
  ? "https://evmrpc.0g.ai"
  : "https://evmrpc-testnet.0g.ai";

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const broker = await createZGComputeNetworkBroker(wallet);

// Discover services
const services = await broker.inference.listService();
services.forEach(s => {
  console.log(`${s.provider} | ${s.model} | ${s.serviceType}`);
});

// Make inference request
const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
const headers = await broker.inference.getRequestHeaders(providerAddress);

const response = await fetch(`${endpoint}/chat/completions`, {
  method: "POST",
  headers: { "Content-Type": "application/json", ...headers },
  body: JSON.stringify({ messages, model })
});

const data = await response.json();

// Extract chatID (see chatID table below)
let chatID = response.headers.get("ZG-Res-Key") || response.headers.get("zg-res-key");
if (!chatID) chatID = data.id;

// CRITICAL: Always call processResponse
await broker.inference.processResponse(
  providerAddress,              // 1st: provider address
  chatID,                       // 2nd: response identifier for verification
  JSON.stringify(data.usage)    // 3rd: usage data for fee calculation
);
```

For streaming, browser SDK, cURL, and Python examples, see [references/inference.md](references/inference.md).

## processResponse (CRITICAL)

Call `broker.inference.processResponse()` after EVERY API response for fee settlement and TEE verification.

```typescript
await broker.inference.processResponse(
  providerAddress,              // 1st: provider address
  chatID,                       // 2nd: response identifier for verification
  JSON.stringify(data.usage)    // 3rd: usage data for fee calculation
);
```

Parameter order: **provider, chatID, usageData**. Do NOT reorder.

### chatID Retrieval by Service Type

Always try `ZG-Res-Key` response header first. Use fallback only when header is absent.

| Service Type | chatID Source | Fallback |
|---|---|---|
| Chatbot | `ZG-Res-Key` header | `data.id` from response body |
| Text-to-Image | `ZG-Res-Key` header | none |
| Speech-to-Text | `ZG-Res-Key` header | none |
| Chatbot Streaming | `ZG-Res-Key` header | `id` from stream chunk |
| Audio Streaming | `ZG-Res-Key` header | none |

## Fine-tuning

Fine-tuning is available on both **mainnet** and **testnet**. It is a 6-step CLI process: list providers, upload dataset, calculate tokens, create task, monitor, download and decrypt.

For the complete workflow, see [references/fine-tuning.md](references/fine-tuning.md).

## Account Management

The 0G Compute Network uses Main Accounts (deposits/withdrawals) and Provider Sub-Accounts (service payments). Sub-account refunds have a 24-hour lock period.

```bash
0g-compute-cli get-account                                    # Check balance
0g-compute-cli deposit --amount 10                             # Deposit to main
0g-compute-cli transfer-fund --provider <ADDR> --amount 5      # Transfer to sub-account
0g-compute-cli retrieve-fund                                   # Retrieve from sub (24h lock)
0g-compute-cli refund --amount 5                               # Withdraw to wallet
```

For detailed account management, see [references/account-management.md](references/account-management.md).

## CLI Quick Reference

```bash
# Inference
0g-compute-cli inference list-providers                        # List all providers
0g-compute-cli inference verify --provider <ADDR>              # Verify TEE attestation
0g-compute-cli inference acknowledge-provider --provider <ADDR> # Required before first use
0g-compute-cli inference get-secret --provider <ADDR>          # Get API key for direct calls
0g-compute-cli inference serve --provider <ADDR> --port 3000   # Local OpenAI-compatible proxy

# Fine-tuning
0g-compute-cli fine-tuning list-providers                      # List fine-tuning providers
0g-compute-cli fine-tuning list-models                         # List available models

# Web UI
0g-compute-cli ui start-web                                    # Launch at localhost:3090
```

## Troubleshooting

| Problem | Solution |
|---|---|
| Insufficient balance | `deposit --amount 5` then `transfer-fund --provider <ADDR> --amount 2` |
| Provider not acknowledged | `inference acknowledge-provider --provider <ADDR>` |
| Provider busy (fine-tuning) | Wait and retry, or choose a different provider |
| Web UI port conflict | `ui start-web --port 3091` |

## Resources

- [Production examples](references/examples/README.md) — streaming chat, image generation, transcription
- [GitHub Starter Kit](https://github.com/0gfoundation/0g-compute-ts-starter-kit)
- [Package Releases](https://github.com/0gfoundation/0g-serving-broker/releases)
- [Discord Support](https://discord.gg/0glabs)

> Note: A unified skill covering all 0G services (Compute, Storage, Chain) exists at [0g-agent-skills](https://github.com/0gfoundation/0g-agent-skills).
