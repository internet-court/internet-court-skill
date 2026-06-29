---
name: Privy
description: Use when building wallet infrastructure, authenticating users, managing embedded wallets, creating policies and controls, handling transactions, or integrating wallet functionality into web2 and web3 applications. Agents should reach for this skill when implementing user onboarding, wallet creation, transaction signing, access controls, or wallet-based authentication.
metadata:
    mintlify-proj: privy
    version: "1.0"
---

# Privy Skill

## Product summary

Privy is a wallet infrastructure and authentication platform that enables developers to embed wallets and user authentication into applications. It provides three interconnected layers: **authentication** (email, social, passkeys, wallets), **wallets** (embedded wallets for users or application-owned wallets), and **controls** (owners, signers, policies). Use Privy's REST API and client-side SDKs (React, React Native, Swift, Android, Flutter, Unity, Node.js, Go, Java, Ruby, Rust) to create wallets, authenticate users, sign transactions, and enforce policies. Primary documentation: https://docs.privy.io

**Key files and commands:**
- REST API: `POST https://api.privy.io/v1/wallets` (create wallet), `/v1/wallets/{id}/rpc` (send transaction)
- Client SDKs: `@privy-io/react-auth`, `@privy-io/expo`, `@privy-io/node`
- Dashboard: https://dashboard.privy.io (configure app, manage API keys, set up webhooks)
- Authentication: Email, SMS, OAuth, passkeys, wallet-based, Farcaster, Telegram
- Chains: Ethereum, Solana, Tron, Sui, Bitcoin, Cosmos, Stellar, and 40+ others

## When to use

Reach for this skill when:
- **Building user authentication**: Implementing login flows with email, social, passkeys, or wallet-based auth
- **Creating wallets**: Provisioning embedded wallets for users or application-owned wallets for servers
- **Signing transactions**: Sending transactions, signing messages, or executing smart contract interactions on EVM or Solana
- **Enforcing access controls**: Setting up owners, signers, policies, or multi-sig approvals
- **Managing user identity**: Creating users, linking accounts, storing custom metadata, or handling webhooks
- **Configuring policies**: Restricting transaction amounts, recipient addresses, contract interactions, or time windows
- **Handling wallet actions**: Executing transfers, swaps, or earn operations
- **Setting up gas sponsorship**: Covering transaction fees or managing gas budgets
- **Integrating external wallets**: Connecting MetaMask, Phantom, or other third-party wallets

## Quick reference

### Core API endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/wallets` | POST | Create a wallet |
| `/v1/wallets/{id}` | GET | Fetch wallet details |
| `/v1/wallets/{id}/rpc` | POST | Send RPC request (sign/send transaction) |
| `/v1/users` | POST | Create a user |
| `/v1/users/{id}` | GET | Fetch user details |
| `/v1/policies` | POST | Create a policy |
| `/v1/key-quorums` | POST | Create a key quorum (multi-sig) |

### Authentication headers (REST API)

```bash
# Basic auth with app ID and secret
-u "app-id:app-secret"

# Required headers
-H "privy-app-id: app-id"
-H "Content-Type: application/json"

# For wallets with owner_id, add authorization signature
-H "privy-authorization-signature: <signature>"
```

### Client SDK imports

| SDK | Import |
|-----|--------|
| React | `@privy-io/react-auth` |
| React Native | `@privy-io/expo` |
| Node.js | `@privy-io/node` |
| Go | `github.com/privy-io/go-sdk` |
| Java | `io.privy.api` |
| Ruby | `privy` gem |

### Common wallet operations

| Operation | Method | Use case |
|-----------|--------|----------|
| Create wallet | `POST /v1/wallets` or `useCreateWallet()` | Provision new wallet for user |
| Send transaction | `eth_sendTransaction` or `useSendTransaction()` | Sign and broadcast transaction |
| Sign message | `personal_sign` or `useSignMessage()` | Sign arbitrary data |
| Get balance | `GET /v1/wallets/{id}/balance` | Fetch wallet balance |
| Export key | `exportPrivateKey` | Allow user to self-custody |
| Get transactions | `GET /v1/wallets/{id}/transactions` | Fetch transaction history |

## Decision guidance

### When to use embedded wallets vs external wallets

| Scenario | Embedded | External |
|----------|----------|----------|
| New users, no crypto experience | ✓ | |
| Users have existing wallets (MetaMask, Phantom) | | ✓ |
| Need full control over wallet lifecycle | ✓ | |
| Want to leverage user's existing assets | | ✓ |
| Building consumer app | ✓ | |
| Building power-user trading app | | ✓ |

### When to use Privy auth vs JWT-based auth

| Scenario | Privy Auth | JWT-based |
|----------|-----------|-----------|
| No existing auth system | ✓ | |
| Already have Auth0, Firebase, Cognito | | ✓ |
| Need multiple login methods (email, social, wallet) | ✓ | |
| Want Privy to manage all auth | ✓ | |
| Integrating with existing auth provider | | ✓ |

### When to use policies vs manual approvals

| Scenario | Policies | Manual Approvals |
|----------|----------|------------------|
| Automated, rule-based constraints | ✓ | |
| Need human review for sensitive actions | | ✓ |
| Enforcing transaction limits | ✓ | |
| Requiring team sign-off | | ✓ |
| Protecting against accidental transfers | ✓ | |
| Treasury or multi-sig workflows | | ✓ |

### Wallet ownership models

| Model | Owner | Use case |
|-------|-------|----------|
| User-owned | User only | Self-custodial consumer wallets |
| User + server | User + authorization key | Automated trading, limit orders |
| Application-owned | Authorization key | Treasury, agents, bots |
| Custodial | Licensed custodian | Regulated financial products |

## Workflow

### 1. Set up your Privy app
- Go to https://dashboard.privy.io and create an app
- Copy your **App ID** and **App Secret** (keep secret safe)
- Configure login methods (email, social, wallets, etc.)
- Set up webhook endpoint if needed (Configuration > Webhooks)
- Note your app's CAIP2 chain IDs for supported networks

### 2. Authenticate users (choose one approach)

**Option A: Use Privy authentication (React example)**
```tsx
import {PrivyProvider, usePrivy, useLoginWithEmail} from '@privy-io/react-auth';

export default function App() {
  return (
    <PrivyProvider appId="your-app-id">
      <LoginComponent />
    </PrivyProvider>
  );
}

function LoginComponent() {
  const {authenticated, login} = usePrivy();
  const {sendCode, loginWithCode} = useLoginWithEmail();
  
  if (!authenticated) return <button onClick={login}>Login</button>;
  return <div>Logged in!</div>;
}
```

**Option B: Use your own auth with JWT**
- Create a JWT with user ID in the payload
- Pass JWT to Privy SDK during initialization
- Privy validates and creates/links user

### 3. Create a wallet for the user

**Client-side (React)**
```tsx
import {useCreateWallet} from '@privy-io/react-auth';

const {createWallet} = useCreateWallet();
const wallet = await createWallet({createAdditional: false});
```

**Server-side (Node.js)**
```ts
const privy = new PrivyClient({appId, appSecret});
const wallet = await privy.wallets().create({
  chain_type: 'ethereum',
  owner: {user_id: 'did:privy:xxxxx'}
});
```

**REST API**
```bash
curl -X POST https://api.privy.io/v1/wallets \
  -u "app-id:app-secret" \
  -H "privy-app-id: app-id" \
  -H "Content-Type: application/json" \
  -d '{
    "chain_type": "ethereum",
    "owner": {"user_id": "did:privy:xxxxx"}
  }'
```

### 4. Create policies (optional, for access control)

**Define a policy via REST API**
```bash
curl -X POST https://api.privy.io/v1/policies \
  -u "app-id:app-secret" \
  -H "privy-app-id: app-id" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Transfer limit",
    "chain_type": "ethereum",
    "rules": [{
      "method": "eth_sendTransaction",
      "action": "ALLOW",
      "conditions": [{
        "field_source": "ethereum_transaction",
        "field": "value",
        "operator": "lte",
        "value": "1000000000000000000"
      }]
    }]
  }'
```

**Attach policy to wallet**
```bash
curl -X POST https://api.privy.io/v1/wallets \
  -u "app-id:app-secret" \
  -H "privy-app-id: app-id" \
  -H "Content-Type: application/json" \
  -d '{
    "chain_type": "ethereum",
    "owner": {"user_id": "did:privy:xxxxx"},
    "policy_ids": ["policy-id-from-above"]
  }'
```

### 5. Send a transaction

**Client-side (React)**
```tsx
import {useSendTransaction} from '@privy-io/react-auth';

const {sendTransaction} = useSendTransaction();
const hash = await sendTransaction({
  to: '0xRecipient...',
  value: '1000000000000000000' // 1 ETH in wei
});
```

**Server-side (Node.js)**
```ts
const {hash} = await privy.wallets().ethereum().sendTransaction(walletId, {
  caip2: 'eip155:1',
  params: {
    transaction: {
      to: '0xRecipient...',
      value: '0x2386F26FC10000'
    }
  }
});
```

### 6. Listen for events (webhooks)

**Register endpoint in dashboard** (Configuration > Webhooks)

**Verify and handle webhook**
```ts
import {PrivyClient} from '@privy-io/node';

const privy = new PrivyClient({
  appId, appSecret,
  webhookSigningSecret: process.env.WEBHOOK_SECRET
});

export async function POST(req) {
  const payload = privy.webhooks().verify({
    payload: req.body,
    headers: req.headers
  });
  
  if (payload.type === 'transaction.confirmed') {
    console.log('Transaction confirmed:', payload.data.hash);
  }
}
```

## Common gotchas

- **Missing authorization signature**: Wallets with `owner_id` require an authorization signature header. Generate it using the authorization key's private key.
- **Policy evaluation defaults to DENY**: If a wallet has a policy but no rule matches the RPC method, the request is denied. Always include an "allow all" rule for methods you want to permit.
- **Numerical values are exact**: Policy conditions evaluate numbers exactly as passed (wei, lamports, etc.). Don't convert to decimals.
- **Broadcast ≠ confirmed**: `eth_sendTransaction` returns when the transaction is broadcast, not confirmed. Use webhooks to track confirmation.
- **Rate limits on wallet creation**: Batch wallet creation is subject to rate limiting. Use exponential backoff for retries.
- **User wallets require user ID**: When creating a user wallet, the owner must be a user ID (not an authorization key). Create the user first.
- **Policies are chain-specific**: A policy for Ethereum won't apply to Solana wallets. Create separate policies per chain.
- **External IDs must be unique**: If you set an `external_id` on a wallet, it must be unique per app and cannot be changed.
- **Webhook signature verification is required**: Always verify webhook signatures before trusting the payload. Use the SDK's `webhooks().verify()` method.
- **Session persistence on mobile**: React Native apps need explicit session persistence configuration. Check the [customizing session persistence](/basics/react-native/advanced/customizing-session-persistence) guide.

## Verification checklist

Before submitting work with Privy:

- [ ] Verified API credentials (app ID and secret) are correct and not exposed
- [ ] Webhook signing secret is configured and verified in code
- [ ] All wallets have appropriate owners (user ID or authorization key)
- [ ] Policies are attached to wallets if access control is needed
- [ ] Policy rules cover all RPC methods the wallet will use
- [ ] Authorization signatures are generated correctly for server-side requests
- [ ] Webhook endpoint returns 2xx status code for successful delivery
- [ ] Transaction values are in correct units (wei, lamports, etc.)
- [ ] External IDs are unique and URL-safe if used
- [ ] Rate limiting is handled with exponential backoff
- [ ] User authentication flow is tested (login, logout, session refresh)
- [ ] Wallet creation succeeds and wallet address is stored
- [ ] Transaction signing and broadcasting works end-to-end
- [ ] Webhooks are received and verified correctly

## Resources

**Comprehensive navigation**: https://docs.privy.io/llms.txt

**Critical documentation pages:**
1. [Key concepts](/basics/key-concepts) — Understand authentication, wallets, and controls
2. [Create a wallet](/wallets/wallets/create/create-a-wallet) — Wallet creation across all SDKs
3. [Policies overview](/controls/policies/overview) — Policy engine, rules, and conditions
4. [Webhooks overview](/api-reference/webhooks/overview) — Event subscriptions and verification
5. [REST API introduction](/api-reference/introduction) — API authentication and rate limits

---

> For additional documentation and navigation, see: https://docs.privy.io/llms.txt