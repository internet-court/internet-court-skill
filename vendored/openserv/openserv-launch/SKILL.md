---
name: openserv-launch
description: Launch tokens on Base blockchain via the OpenServ Launch API. Creates ERC-20 tokens with Aerodrome concentrated liquidity pools. Use when launching tokens, deploying memecoins, or building agents that create tokens with locked LP. Read reference.md for the full API reference. Read openserv-agent-sdk and openserv-client for building and running agents. You can launch tokens for your OpenServ agents.
---

# OpenServ Launch API

Launch tokens instantly on Base blockchain with one-sided concentrated liquidity pools on Aerodrome Slipstream.

**Reference files:**

- `reference.md` - Full API reference for all endpoints
- `troubleshooting.md` - Common issues and solutions
- `examples/` - Complete code examples

**Base URL:** `https://instant-launch.openserv.ai`

---

## What This API Does

- **Deploys ERC-20 tokens** - 1 billion supply, standard token contract
- **Creates Aerodrome CL pools** - One-sided liquidity with 2,000,000x price range
- **Locks LP for 1 year** - Automatic rug-pull protection
- **Splits fees 50/50** - Creator wallet receives 50% of all trading fees

---

## Quick Start

### Dependencies

```bash
npm install axios
```

### Launch a Token

```typescript
import axios from 'axios'

const response = await axios.post('https://instant-launch.openserv.ai/api/launch', {
  name: 'My Token',
  symbol: 'MTK',
  wallet: '0x1234567890abcdef1234567890abcdef12345678',
  description: 'A cool memecoin',
  imageUrl: 'https://example.com/logo.png',
  website: 'https://mytoken.com',
  twitter: '@mytoken'
})

console.log(response.data)
// {
//   success: true,
//   token: { address: '0x...', name: 'My Token', symbol: 'MTK', supply: '1000000000' },
//   pool: { address: '0x...', tickSpacing: 500, fee: '2%' },
//   locker: { address: '0x...', lpTokenId: '12345', lockedUntil: '2027-02-03T...' },
//   txHashes: { tokenDeploy: '0x...', lpMint: '0x...', lock: '0x...', buy: '0x...' },
//   links: { explorer: '...', aerodrome: '...', dexscreener: '...' }
// }
```

---

## Endpoints Overview

| Endpoint              | Method | Description                      |
| --------------------- | ------ | -------------------------------- |
| `/api/launch`         | POST   | Create a new token with LP pool  |
| `/api/tokens`         | GET    | List launched tokens             |
| `/api/tokens/:address`| GET    | Get token details by address     |

---

## Launch Request Fields

| Field       | Type   | Required | Description                                      |
| ----------- | ------ | -------- | ------------------------------------------------ |
| `name`      | string | Yes      | Token name (1-64 characters)                     |
| `symbol`    | string | Yes      | Token symbol (1-10 chars, uppercase, alphanumeric) |
| `wallet`    | string | Yes      | Creator wallet address (receives 50% of fees)   |
| `description` | string | No     | Token description (max 500 characters)          |
| `imageUrl`  | string | No       | Direct link to image file (jpg, png, gif, webp, svg) |
| `website`   | string | No       | Website URL (must start with http/https)        |
| `twitter`   | string | No       | Twitter handle (with or without @)              |

---

## Launch Response

```typescript
interface LaunchResponse {
  success: true
  internalId: string           // Database record ID
  creator: string              // Creator wallet address
  token: {
    address: string            // Deployed token contract
    name: string
    symbol: string
    supply: string             // Always "1000000000"
  }
  pool: {
    address: string            // Aerodrome CL pool
    tickSpacing: number        // 500
    fee: string                // "2%"
  }
  locker: {
    address: string            // LP locker contract
    lpTokenId: string          // NFT position ID
    lockedUntil: string        // ISO date (1 year from launch)
  }
  txHashes: {
    tokenDeploy: string        // Token deployment tx
    stakingTransfer: string    // 5% staking allocation tx
    lpMint: string             // LP position mint tx
    lock: string               // LP lock tx
    buy: string                // Initial buy tx
  }
  links: {
    explorer: string           // Basescan token page
    aerodrome: string          // Aerodrome swap page
    dexscreener: string        // DEXScreener chart
    defillama: string          // DefiLlama swap
  }
}
```

---

## Token Defaults

| Setting            | Value              |
| ------------------ | ------------------ |
| Token Supply       | 1 billion          |
| Initial Market Cap | $15,000            |
| Price Range        | 2,000,000x (~$30B) |
| Pool Fee           | 2%                 |
| Tick Spacing       | 500                |
| Fee Split          | 50/50 (creator/platform) |
| Lock Duration      | 1 year             |
| Staking Allocation | 5%                 |
| Initial Buy        | 0.0005 ETH         |

---

## Example: Agent with Token Launch Capability

```typescript
import { Agent, run } from '@openserv-labs/sdk'
import { provision, triggers } from '@openserv-labs/client'
import { z } from 'zod'
import axios from 'axios'

const agent = new Agent({
  systemPrompt: 'You help users launch tokens on Base blockchain.'
})

agent.addCapability({
  name: 'launch_token',
  description: 'Launch a new ERC-20 token with LP pool on Aerodrome',
  schema: z.object({
    name: z.string().describe('Token name (1-64 chars)'),
    symbol: z.string().describe('Token symbol (1-10 chars, uppercase)'),
    wallet: z.string().describe('Creator wallet address'),
    description: z.string().optional().describe('Token description'),
    imageUrl: z.string().optional().describe('Logo image URL'),
    website: z.string().optional().describe('Website URL'),
    twitter: z.string().optional().describe('Twitter handle')
  }),
  async run({ args }) {
    const response = await axios.post('https://instant-launch.openserv.ai/api/launch', args)
    const { token, pool, links } = response.data
    return `Token launched! Address: ${token.address}, Pool: ${pool.address}, Trade: ${links.aerodrome}`
  }
})

async function main() {
  await provision({
    agent: {
      instance: agent,
      name: 'token-launcher',
      description: 'Launch tokens on Base with Aerodrome LP'
    },
    workflow: {
      name: 'Token Launcher',
      goal: 'Launch ERC-20 tokens on Base blockchain with Aerodrome concentrated liquidity pools',
      trigger: triggers.webhook({ waitForCompletion: true, timeout: 600 })
    }
  })
  await run(agent)
}

main().catch(console.error)
```

---

## Rate Limits

- **1 token per wallet per 24 hours** (spam prevention)
- Creator wallet must have on-chain activity (not empty)

---

## Network

All tokens are deployed on **Base Mainnet** (chainId: 8453).

---

## Updating This Skill

This skill may be outdated. The OpenServ team ships updates regularly—new features, API changes, and bug fixes won't be reflected here until you update. **If something isn't working as expected, or you want to make sure you have the latest information, update the skill before proceeding.**

```bash
# Check if updates are available
npx skills check

# Update all installed skills to latest versions
npx skills update
```

Or reinstall the OpenServ skills directly:

```bash
npx skills add openserv-labs/skills
```

---

## Related Skills

- **openserv-agent-sdk** - Build agents with token launch capabilities
- **openserv-client** - Provision and deploy agents on the platform
- **openserv-multi-agent-workflows** - Multi-agent collaboration patterns
- **openserv-ideaboard-api** - Find ideas and ship token-related services
