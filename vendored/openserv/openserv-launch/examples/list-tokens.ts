/**
 * List tokens launched via the OpenServ Launch API
 *
 * This example shows how to:
 * 1. List all tokens with pagination
 * 2. Filter by creator wallet
 * 3. Get details for a specific token
 *
 * Usage:
 *   npx tsx list-tokens.ts
 *   npx tsx list-tokens.ts --creator 0x1234...
 *   npx tsx list-tokens.ts --address 0xabcd...
 */

import axios from 'axios'

const API_BASE = 'https://instant-launch.openserv.ai'

interface TokenListItem {
  address: string
  name: string
  symbol: string
  description: string
  imageUrl?: string
  creator: string
  pool: string
  locker: string
  initialMarketCapUsd: number
  launchedAt: string
  links: {
    explorer: string
    aerodrome: string
    dexscreener: string
  }
}

interface Pagination {
  limit: number
  page: number
  totalDocs: number
  totalPages: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

interface TokensResponse {
  success: true
  tokens: TokenListItem[]
  pagination: Pagination
}

async function listTokens(options: {
  limit?: number
  page?: number
  creator?: string
} = {}): Promise<TokensResponse> {
  const params = new URLSearchParams()
  if (options.limit) params.set('limit', options.limit.toString())
  if (options.page) params.set('page', options.page.toString())
  if (options.creator) params.set('creator', options.creator)

  const url = `${API_BASE}/api/tokens${params.toString() ? '?' + params.toString() : ''}`
  const response = await axios.get<TokensResponse>(url)
  return response.data
}

async function getToken(address: string) {
  const response = await axios.get(`${API_BASE}/api/tokens/${address}`)
  return response.data
}

async function main() {
  const args = process.argv.slice(2)

  // Check for specific token address
  const addressIndex = args.indexOf('--address')
  if (addressIndex !== -1 && args[addressIndex + 1]) {
    const address = args[addressIndex + 1]
    console.log(`📋 Fetching token: ${address}\n`)

    try {
      const result = await getToken(address)
      console.log(JSON.stringify(result, null, 2))
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.error('❌ Token not found')
      } else {
        throw error
      }
    }
    return
  }

  // List tokens
  const creatorIndex = args.indexOf('--creator')
  const creator = creatorIndex !== -1 ? args[creatorIndex + 1] : undefined

  console.log('📋 Listing tokens...\n')

  const result = await listTokens({
    limit: 10,
    page: 1,
    creator
  })

  if (result.tokens.length === 0) {
    console.log('No tokens found.')
    return
  }

  for (const token of result.tokens) {
    console.log(`• ${token.symbol} - ${token.name}`)
    console.log(`  Address: ${token.address}`)
    console.log(`  Creator: ${token.creator}`)
    console.log(`  Launched: ${new Date(token.launchedAt).toLocaleString()}`)
    console.log(`  Trade: ${token.links.aerodrome}`)
    console.log('')
  }

  console.log(`📊 Pagination:`)
  console.log(`   Page ${result.pagination.page} of ${result.pagination.totalPages}`)
  console.log(`   Total tokens: ${result.pagination.totalDocs}`)

  if (result.pagination.hasNextPage) {
    console.log(`   Next page: ${result.pagination.nextPage}`)
  }
}

main().catch(console.error)
