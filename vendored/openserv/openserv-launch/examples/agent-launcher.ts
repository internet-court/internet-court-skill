/**
 * OpenServ Agent with Token Launch Capability
 *
 * This example creates an agent that can:
 * 1. Launch new tokens via the OpenServ Launch API
 * 2. List launched tokens
 * 3. Get token details
 *
 * Usage:
 *   npx tsx agent-launcher.ts
 *
 * Prerequisites:
 *   - OPENAI_API_KEY in .env
 */

import 'dotenv/config'
import { Agent, run } from '@openserv-labs/sdk'
import { provision, triggers } from '@openserv-labs/client'
import { z } from 'zod'
import axios from 'axios'

const API_BASE = 'https://instant-launch.openserv.ai'

// Create the agent
const agent = new Agent({
  systemPrompt: `You are a token launch assistant. You help users create new ERC-20 tokens on Base blockchain with automatic liquidity pools on Aerodrome.

When a user wants to launch a token:
1. Ask for the token name and symbol
2. Ask for their wallet address (to receive 50% of trading fees)
3. Optionally ask for description, logo URL, website, and Twitter
4. Use the launch_token capability to create the token
5. Share the results including the token address and trading links

Key features of launched tokens:
- 1 billion token supply
- $15,000 initial market cap
- 2,000,000x price range (ceiling ~$30B)
- 50/50 fee split between creator and platform
- 1-year LP lock for rug-pull protection
- 5% staking allocation`
})

// Add token launch capability
agent.addCapability({
  name: 'launch_token',
  description: 'Launch a new ERC-20 token with LP pool on Aerodrome (Base blockchain)',
  schema: z.object({
    name: z.string().min(1).max(64).describe('Token name (1-64 characters)'),
    symbol: z.string().min(1).max(10).describe('Token symbol (1-10 characters, will be uppercased)'),
    wallet: z.string().describe('Creator wallet address (receives 50% of trading fees)'),
    description: z.string().max(500).optional().describe('Token description (max 500 characters)'),
    imageUrl: z.string().url().optional().describe('Direct link to logo image (jpg, png, gif, webp, svg)'),
    website: z.string().url().optional().describe('Website URL'),
    twitter: z.string().optional().describe('Twitter handle (with or without @)')
  }),
  async run({ args }) {
    try {
      const response = await axios.post(`${API_BASE}/api/launch`, args, {
        headers: { 'Content-Type': 'application/json' }
      })

      const { token, pool, locker, links, txHashes } = response.data

      return `Token launched successfully!

**Token Details:**
- Name: ${token.name}
- Symbol: ${token.symbol}
- Address: ${token.address}
- Supply: ${token.supply}

**Pool:**
- Address: ${pool.address}
- Fee: ${pool.fee}

**Locker:**
- LP Token ID: ${locker.lpTokenId}
- Locked Until: ${locker.lockedUntil}

**Links:**
- Explorer: ${links.explorer}
- Trade on Aerodrome: ${links.aerodrome}
- DEXScreener: ${links.dexscreener}

**Transactions:**
- Token Deploy: ${txHashes.tokenDeploy}
- LP Mint: ${txHashes.lpMint}
- Lock: ${txHashes.lock}`
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return `Launch failed: ${error.response.data?.error || error.message}`
      }
      throw error
    }
  }
})

// Add list tokens capability
agent.addCapability({
  name: 'list_tokens',
  description: 'List tokens launched via the API, optionally filtered by creator',
  schema: z.object({
    limit: z.number().min(1).max(100).optional().default(10).describe('Number of tokens to return'),
    page: z.number().min(1).optional().default(1).describe('Page number'),
    creator: z.string().optional().describe('Filter by creator wallet address')
  }),
  async run({ args }) {
    const params = new URLSearchParams()
    params.set('limit', args.limit.toString())
    params.set('page', args.page.toString())
    if (args.creator) params.set('creator', args.creator)

    const response = await axios.get(`${API_BASE}/api/tokens?${params.toString()}`)
    const { tokens, pagination } = response.data

    if (tokens.length === 0) {
      return 'No tokens found.'
    }

    let result = `Found ${pagination.totalDocs} tokens (page ${pagination.page} of ${pagination.totalPages}):\n\n`

    for (const token of tokens) {
      result += `**${token.symbol}** - ${token.name}\n`
      result += `- Address: ${token.address}\n`
      result += `- Creator: ${token.creator}\n`
      result += `- Launched: ${new Date(token.launchedAt).toLocaleString()}\n`
      result += `- Trade: ${token.links.aerodrome}\n\n`
    }

    return result
  }
})

// Add get token capability
agent.addCapability({
  name: 'get_token',
  description: 'Get detailed information about a specific token by address',
  schema: z.object({
    address: z.string().describe('Token contract address')
  }),
  async run({ args }) {
    try {
      const response = await axios.get(`${API_BASE}/api/tokens/${args.address}`)
      const { token, pool, locker, fees, links, meta } = response.data

      return `**${token.symbol}** - ${token.name}

**Token:**
- Address: ${token.address}
- Supply: ${token.supply}
- Decimals: ${token.decimals}
${token.description ? `- Description: ${token.description}` : ''}
${token.website ? `- Website: ${token.website}` : ''}
${token.twitter ? `- Twitter: ${token.twitter}` : ''}

**Pool:**
- Address: ${pool.address}
- Fee: ${pool.fee}
- Tick Spacing: ${pool.tickSpacing}

**Locker:**
- Address: ${locker.address}
- LP Token ID: ${locker.lpTokenId}
- Locked Until: ${locker.lockedUntil}

**Fees:**
- Creator: ${fees.creatorWallet} (${fees.creatorShare})
- Platform: ${fees.platformShare}

**Meta:**
- Chain ID: ${meta.chainId}
- Initial Market Cap: $${meta.initialMarketCapUsd.toLocaleString()}
- Launched: ${new Date(meta.launchedAt).toLocaleString()}

**Links:**
- Explorer: ${links.explorer}
- Aerodrome: ${links.aerodrome}
- DEXScreener: ${links.dexscreener}`
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return 'Token not found.'
      }
      throw error
    }
  }
})

async function main() {
  // Provision and run the agent
  await provision({
    agent: {
      instance: agent,
      name: 'token-launcher',
      description: 'Launch ERC-20 tokens on Base with Aerodrome LP pools'
    },
    workflow: {
      name: 'Token Launcher',
      goal: 'Deploy new ERC-20 tokens on Base with Aerodrome concentrated liquidity pools and locked LP positions',
      trigger: triggers.webhook({ waitForCompletion: true, timeout: 600 })
    }
  })

  console.log('🚀 Token Launcher agent is running!')
  await run(agent)
}

main().catch(console.error)
