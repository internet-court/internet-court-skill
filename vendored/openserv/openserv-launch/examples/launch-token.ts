/**
 * Launch a token on Base with Aerodrome LP
 *
 * This example demonstrates the complete token launch flow:
 * 1. Prepare token metadata
 * 2. Call the launch API
 * 3. Handle the response
 *
 * Usage:
 *   npx tsx launch-token.ts
 *
 * Prerequisites:
 *   - A valid Ethereum wallet address to receive fees
 */

import 'dotenv/config'
import axios from 'axios'

const API_BASE = 'https://instant-launch.openserv.ai'

interface LaunchRequest {
  name: string
  symbol: string
  wallet: string
  description?: string
  imageUrl?: string
  website?: string
  twitter?: string
}

interface LaunchResponse {
  success: true
  internalId: string
  creator: string
  token: {
    address: string
    name: string
    symbol: string
    supply: string
  }
  pool: {
    address: string
    tickSpacing: number
    fee: string
  }
  locker: {
    address: string
    lpTokenId: string
    lockedUntil: string
  }
  txHashes: {
    tokenDeploy: string
    stakingTransfer: string
    lpMint: string
    lock: string
    buy: string
  }
  links: {
    explorer: string
    aerodrome: string
    dexscreener: string
    defillama: string
  }
}

async function launchToken(request: LaunchRequest): Promise<LaunchResponse> {
  const response = await axios.post<LaunchResponse>(`${API_BASE}/api/launch`, request, {
    headers: { 'Content-Type': 'application/json' }
  })
  return response.data
}

async function main() {
  // Your wallet address that will receive 50% of trading fees
  const creatorWallet = process.env.CREATOR_WALLET

  if (!creatorWallet) {
    console.error('❌ CREATOR_WALLET not set in environment')
    console.log('\nSet your wallet address:')
    console.log('  export CREATOR_WALLET=0x...')
    process.exit(1)
  }

  // Token configuration
  const tokenConfig: LaunchRequest = {
    name: 'Example Token',
    symbol: 'EXAMPLE',
    wallet: creatorWallet,
    description: 'An example token launched via the OpenServ Launch API',
    // Optional fields:
    // imageUrl: 'https://example.com/logo.png',
    // website: 'https://example.com',
    // twitter: '@example'
  }

  console.log('🚀 Launching token...')
  console.log(`   Name: ${tokenConfig.name}`)
  console.log(`   Symbol: ${tokenConfig.symbol}`)
  console.log(`   Creator: ${tokenConfig.wallet}`)

  try {
    const result = await launchToken(tokenConfig)

    console.log('\n✅ Token launched successfully!')
    console.log('\n📋 Token Details:')
    console.log(`   Address: ${result.token.address}`)
    console.log(`   Name: ${result.token.name}`)
    console.log(`   Symbol: ${result.token.symbol}`)
    console.log(`   Supply: ${result.token.supply}`)

    console.log('\n💧 Pool Details:')
    console.log(`   Address: ${result.pool.address}`)
    console.log(`   Fee: ${result.pool.fee}`)

    console.log('\n🔒 Locker Details:')
    console.log(`   Address: ${result.locker.address}`)
    console.log(`   LP Token ID: ${result.locker.lpTokenId}`)
    console.log(`   Locked Until: ${result.locker.lockedUntil}`)

    console.log('\n🔗 Links:')
    console.log(`   Explorer: ${result.links.explorer}`)
    console.log(`   Trade on Aerodrome: ${result.links.aerodrome}`)
    console.log(`   DEXScreener: ${result.links.dexscreener}`)

    console.log('\n📝 Transaction Hashes:')
    console.log(`   Token Deploy: ${result.txHashes.tokenDeploy}`)
    console.log(`   LP Mint: ${result.txHashes.lpMint}`)
    console.log(`   Lock: ${result.txHashes.lock}`)
    console.log(`   Initial Buy: ${result.txHashes.buy}`)

  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('\n❌ Launch failed:', error.response.data?.error || error.message)

      // Common errors and solutions
      const errorMsg = error.response.data?.error || ''
      if (errorMsg.includes('Daily launch limit')) {
        console.log('\n💡 Tip: Wait 24 hours or use a different wallet address')
      } else if (errorMsg.includes('Invalid Ethereum address')) {
        console.log('\n💡 Tip: Make sure CREATOR_WALLET is a valid Ethereum address')
      }
    } else {
      throw error
    }
    process.exit(1)
  }
}

main().catch(console.error)
