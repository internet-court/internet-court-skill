# OpenServ Launch API Reference

Complete API reference for all endpoints.

**Base URL:** `https://instant-launch.openserv.ai`

For examples, see `examples/` folder.

---

## POST /api/launch

Create a new token with one-sided LP pool on Aerodrome Slipstream.

**When to use:** Launch a new ERC-20 token with automatic liquidity pool creation and LP locking.

### Request Body

| Field       | Type   | Required | Description                                        |
| ----------- | ------ | -------- | -------------------------------------------------- |
| `name`      | string | Yes      | Token name (1-64 characters)                       |
| `symbol`    | string | Yes      | Token symbol (1-10 chars, uppercase, alphanumeric) |
| `wallet`    | string | Yes      | Creator wallet address (receives 50% of fees)      |
| `description` | string | No     | Token description (max 500 characters)             |
| `imageUrl`  | string | No       | Direct image URL (jpg, jpeg, png, gif, webp, svg, avif, bmp, ico) |
| `website`   | string | No       | Website URL (must start with http:// or https://)  |
| `twitter`   | string | No       | Twitter handle (with or without @, max 15 chars)   |

### Example Request

```bash
curl -X POST "https://instant-launch.openserv.ai/api/launch" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Token",
    "symbol": "MTK",
    "wallet": "0x1234567890abcdef1234567890abcdef12345678",
    "description": "A revolutionary memecoin",
    "imageUrl": "https://example.com/logo.png",
    "website": "https://mytoken.com",
    "twitter": "@mytoken"
  }'
```

### Example Response (201 Created)

```json
{
  "success": true,
  "internalId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "creator": "0x1234567890abcdef1234567890abcdef12345678",
  "token": {
    "address": "0xabcdef1234567890abcdef1234567890abcdef12",
    "name": "My Token",
    "symbol": "MTK",
    "supply": "1000000000"
  },
  "pool": {
    "address": "0x9876543210fedcba9876543210fedcba98765432",
    "tickSpacing": 500,
    "fee": "2%"
  },
  "locker": {
    "address": "0xfedcba9876543210fedcba9876543210fedcba98",
    "lpTokenId": "12345",
    "lockedUntil": "2027-02-05T10:30:00.000Z"
  },
  "txHashes": {
    "tokenDeploy": "0x1111111111111111111111111111111111111111111111111111111111111111",
    "stakingTransfer": "0x2222222222222222222222222222222222222222222222222222222222222222",
    "lpMint": "0x3333333333333333333333333333333333333333333333333333333333333333",
    "lock": "0x4444444444444444444444444444444444444444444444444444444444444444",
    "buy": "0x5555555555555555555555555555555555555555555555555555555555555555"
  },
  "links": {
    "explorer": "https://basescan.org/token/0xabcdef1234567890abcdef1234567890abcdef12",
    "aerodrome": "https://aerodrome.finance/swap?from=eth&to=0xabcdef1234567890abcdef1234567890abcdef12",
    "dexscreener": "https://dexscreener.com/base/0x9876543210fedcba9876543210fedcba98765432",
    "defillama": "https://swap.defillama.com/?chain=base&from=0x0000000000000000000000000000000000000000&tab=swap&to=0xabcdef1234567890abcdef1234567890abcdef12"
  }
}
```

### Error Responses

| Status | Description                                           |
| ------ | ----------------------------------------------------- |
| 400    | Validation error (invalid name, symbol, wallet, etc.) |
| 400    | Daily launch limit reached (1 per wallet per 24h)     |
| 400    | Creator wallet has no on-chain activity               |
| 500    | Transaction failed (insufficient gas, RPC error)      |

---

## GET /api/tokens

List launched tokens with pagination.

**When to use:** Browse all tokens launched via the API, optionally filtered by creator.

### Query Parameters

| Parameter | Type   | Default | Description                         |
| --------- | ------ | ------- | ----------------------------------- |
| `limit`   | number | 50      | Items per page (1-100)              |
| `page`    | number | 1       | Page number (1-based)               |
| `creator` | string | -       | Filter by creator wallet address    |

### Example Request

```bash
# List first page of tokens
curl "https://instant-launch.openserv.ai/api/tokens"

# Filter by creator
curl "https://instant-launch.openserv.ai/api/tokens?creator=0x1234..."

# Paginate results
curl "https://instant-launch.openserv.ai/api/tokens?limit=10&page=2"
```

### Example Response

```json
{
  "success": true,
  "tokens": [
    {
      "address": "0xabcdef1234567890abcdef1234567890abcdef12",
      "name": "My Token",
      "symbol": "MTK",
      "description": "A revolutionary memecoin",
      "imageUrl": "https://example.com/logo.png",
      "creator": "0x1234567890abcdef1234567890abcdef12345678",
      "pool": "0x9876543210fedcba9876543210fedcba98765432",
      "locker": "0xfedcba9876543210fedcba9876543210fedcba98",
      "initialMarketCapUsd": 15000,
      "launchedAt": "2026-02-05T10:30:00.000Z",
      "links": {
        "explorer": "https://basescan.org/token/0x...",
        "aerodrome": "https://aerodrome.finance/swap?from=eth&to=0x...",
        "dexscreener": "https://dexscreener.com/base/0x..."
      }
    }
  ],
  "pagination": {
    "limit": 50,
    "page": 1,
    "totalDocs": 100,
    "totalPages": 2,
    "hasPrevPage": false,
    "hasNextPage": true,
    "prevPage": null,
    "nextPage": 2
  }
}
```

---

## GET /api/tokens/:address

Get detailed information about a specific token by its contract address.

**When to use:** Fetch complete token details including pool configuration, locker info, and transaction hashes.

### Path Parameters

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `address` | string | Yes      | Token contract address (0x...) |

### Example Request

```bash
curl "https://instant-launch.openserv.ai/api/tokens/0xabcdef1234567890abcdef1234567890abcdef12"
```

### Example Response

```json
{
  "success": true,
  "token": {
    "address": "0xabcdef1234567890abcdef1234567890abcdef12",
    "name": "My Token",
    "symbol": "MTK",
    "description": "A revolutionary memecoin",
    "imageUrl": "https://example.com/logo.png",
    "website": "https://mytoken.com",
    "twitter": "@mytoken",
    "supply": "1000000000",
    "decimals": 18
  },
  "pool": {
    "address": "0x9876543210fedcba9876543210fedcba98765432",
    "tickSpacing": 500,
    "tickLower": -887200,
    "tickUpper": 0,
    "fee": "2%"
  },
  "locker": {
    "address": "0xfedcba9876543210fedcba9876543210fedcba98",
    "lpTokenId": "12345",
    "lockedUntil": "2027-02-05T10:30:00.000Z"
  },
  "fees": {
    "creatorWallet": "0x1234567890abcdef1234567890abcdef12345678",
    "platformWallet": "0x...",
    "creatorShare": "50%",
    "platformShare": "50%"
  },
  "transactions": {
    "tokenDeploy": "0x1111...",
    "lpMint": "0x3333...",
    "lock": "0x4444..."
  },
  "meta": {
    "chainId": 8453,
    "initialMarketCapUsd": 15000,
    "launchedAt": "2026-02-05T10:30:00.000Z",
    "createdAt": "2026-02-05T10:30:00.000Z"
  },
  "links": {
    "explorer": "https://basescan.org/token/0x...",
    "aerodrome": "https://aerodrome.finance/swap?from=eth&to=0x...",
    "dexscreener": "https://dexscreener.com/base/0x..."
  }
}
```

### Error Responses

| Status | Description       |
| ------ | ----------------- |
| 400    | Invalid address   |
| 404    | Token not found   |

---

## Error Format

All errors follow this format:

```json
{
  "success": false,
  "error": "Detailed error message"
}
```

Common validation errors include:

- `Token name is required`
- `Token name must be 64 characters or less`
- `Token symbol is required`
- `Token symbol must be 10 characters or less`
- `Token symbol must contain only letters and numbers`
- `Invalid Ethereum address format`
- `Description must be 500 characters or less`
- `Image URL must be a direct link to an image file`
- `Website must be a valid URL`
- `Invalid Twitter handle format`
- `Daily launch limit reached (1 per day)`

---

## Contract Addresses (Base Mainnet)

| Contract                    | Address                                      |
| --------------------------- | -------------------------------------------- |
| CLFactory                   | `0xaDe65c38CD4849aDBA595a4323a8C7DdfE89716a` |
| NonfungiblePositionManager  | `0xa990c6a764b73bf43cee5bb40339c3322fb9d55f` |
| CLPoolLauncher              | `0xb9A1094D614c70B94C2CD7b4efc3A6adC6e6F4d3` |
| CLLockerFactory             | `0x8BF02b8da7a6091Ac1326d6db2ed25214D812219` |
| Universal Router            | `0x6Df1c91424F79E40E33B1A48F0687B666bE71075` |
| WETH                        | `0x4200000000000000000000000000000000000006` |

---

## TypeScript Types

```typescript
// Request body for POST /api/launch
interface LaunchRequest {
  name: string            // 1-64 chars
  symbol: string          // 1-10 chars, uppercase, alphanumeric
  wallet: string          // Valid Ethereum address
  description?: string    // Max 500 chars
  imageUrl?: string       // Direct image URL
  website?: string        // http/https URL
  twitter?: string        // Twitter handle
}

// Response from POST /api/launch
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

// Token in list response
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

// Pagination info
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
```
