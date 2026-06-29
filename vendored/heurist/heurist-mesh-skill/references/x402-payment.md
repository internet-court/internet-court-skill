# x402 On-Chain Payment

Pay per tool call with USDC on Base. No account needed — just a private key with USDC balance and `cast` from Foundry.

Install Foundry:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Endpoint

```
POST https://mesh.heurist.xyz/x402/agents/{AgentId}/{toolName}
```

Tool arguments go directly in the request body (no `tool`/`tool_arguments` wrapper).

## Payment Flow

### 1. Probe endpoint

POST the endpoint without any body or header data. You will receive HTTP 402 with payment metadata. Example response:

```json
{
  "x402Version": 1,
  "accepts": [{
    "scheme": "exact",
    "payTo": "0x7d9d1821d15B9e0b8Ab98A058361233E255E405D",
    "maxAmountRequired": "10000",
    "network": "base",
    "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "maxTimeoutSeconds": 120
  }]
}
```

`maxAmountRequired` is in USDC atomic units (6 decimals): `10000` = $0.01.

### 2. Sign EIP-712 with `cast`

```bash
WALLET=$(cast wallet address --private-key "$PRIVATE_KEY")
NONCE=0x$(openssl rand -hex 32)
VALID_BEFORE=$(( $(date +%s) + 120 ))

cat > /tmp/eip712.json << EOF
{
  "types": {
    "EIP712Domain": [
      {"name": "name",              "type": "string"},
      {"name": "version",           "type": "string"},
      {"name": "chainId",           "type": "uint256"},
      {"name": "verifyingContract", "type": "address"}
    ],
    "TransferWithAuthorization": [
      {"name": "from",        "type": "address"},
      {"name": "to",          "type": "address"},
      {"name": "value",       "type": "uint256"},
      {"name": "validAfter",  "type": "uint256"},
      {"name": "validBefore", "type": "uint256"},
      {"name": "nonce",       "type": "bytes32"}
    ]
  },
  "primaryType": "TransferWithAuthorization",
  "domain": {
    "name": "USD Coin",
    "version": "2",
    "chainId": 8453,
    "verifyingContract": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  },
  "message": {
    "from":        "$WALLET",
    "to":          "$PAY_TO",
    "value":       $AMOUNT,
    "validAfter":  0,
    "validBefore": $VALID_BEFORE,
    "nonce":       "$NONCE"
  }
}
EOF

SIG=$(cast wallet sign --data --from-file --private-key "$PRIVATE_KEY" /tmp/eip712.json)
```

### 3. Build `X-Payment` header and retry

```bash
X_PAYMENT=$(printf '{"x402Version":1,"scheme":"exact","network":"base","payload":{"signature":"%s","authorization":{"from":"%s","to":"%s","value":"%s","validAfter":"0","validBefore":"%s","nonce":"%s"}}}' \
  "$SIG" "$WALLET" "$PAY_TO" "$AMOUNT" "$VALID_BEFORE" "$NONCE" | base64 -w 0)

curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-Payment: $X_PAYMENT" \
  -d "$BODY"
```

## List x402 Agents

```bash
curl https://mesh.heurist.xyz/x402/agents
```

## Alternative: TypeScript SDK

```typescript
import { X402Client } from '@coinbase/x402-client';

const client = new X402Client();
const result = await client.call({
  url: 'https://mesh.heurist.xyz/x402/agents/TrendingTokenAgent/get_trending_tokens',
  method: 'POST',
  body: {}
});
```

## Requirements

- Private key with USDC balance on Base
- USDC contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- `cast` from Foundry (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
