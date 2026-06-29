# OpenServ SDK Reference

Quick reference for common patterns.

## Features

- **Built-in Tunnel** - `run()` auto-connects to `agents-proxy.openserv.ai` for local dev
- **No Endpoint URL Needed** - Skip `endpointUrl` in `provision()` during development
- **Automatic Port Fallback** - If port 7378 is busy, finds an available one
- **Direct Credential Binding** - Pass `agent.instance` to `provision()` for automatic credential binding
- **`setCredentials()` Method** - Manually bind API key and auth token to agent
- **`DISABLE_TUNNEL`** - Set `DISABLE_TUNNEL=true` in production to run HTTP server only (no WebSocket tunnel)
- **`FORCE_TUNNEL`** - Set `FORCE_TUNNEL=true` to force tunnel mode even with an `endpointUrl`
- **Public Health Check** - `/health` endpoint responds before auth middleware
- **Binary Tunnel Responses** - Tunnel sends binary frames, preserving gzip/images transparently

## Installation

```bash
npm install @openserv-labs/sdk @openserv-labs/client zod
```

> `openai` is only needed if you use `process()` for direct OpenAI calls. Most agents don't need it—use runless capabilities or `generate()` instead.

## Minimal Agent (Runless)

The simplest agent uses a runless capability—no `run` function, no API key:

```typescript
import 'dotenv/config'
import { Agent, run } from '@openserv-labs/sdk'
import { provision, triggers } from '@openserv-labs/client'

// 1. Define your agent
const agent = new Agent({
  systemPrompt: 'You are a helpful assistant.'
})

// 2. Add a runless capability (platform handles the AI call)
agent.addCapability({
  name: 'greet',
  description: 'Greet the user warmly and helpfully'
})

async function main() {
  // 3. Provision with agent instance binding (v2.1+)
  await provision({
    agent: {
      instance: agent, // Binds API key and auth token directly to agent
      name: 'my-agent',
      description: '...'
    },
    workflow: {
      name: 'Welcome Wizard',
      goal: 'Welcome users by name with a warm, personalized greeting message',
      trigger: triggers.webhook({ waitForCompletion: true })
    }
  })

  // 4. Run - auto-connects via agents-proxy.openserv.ai (no ngrok needed!)
  await run(agent)
}

main().catch(console.error)
```

> **Tip:** No need for ngrok or other tunneling tools - `run()` opens a tunnel automatically.

## Runless Capabilities

Runless capabilities have no `run` function—the platform handles the AI call automatically:

```typescript
// Simplest form
agent.addCapability({
  name: 'generate_haiku',
  description: 'Generate a haiku poem (5-7-5 syllables) about the given input.'
})

// With custom inputSchema
agent.addCapability({
  name: 'translate',
  description: 'Translate text to the target language.',
  inputSchema: z.object({
    text: z.string(),
    targetLanguage: z.string()
  })
})

// With structured output via outputSchema
agent.addCapability({
  name: 'analyze_sentiment',
  description: 'Analyze sentiment of the given text.',
  outputSchema: z.object({
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    confidence: z.number().min(0).max(1)
  })
})
```

**Rules:**
- Cannot have both `run` and `outputSchema`
- `inputSchema` is optional — defaults to `z.object({ input: z.string() })` if omitted
- `outputSchema` is optional — the platform uses it to generate structured output

## `generate()` — Platform-Delegated LLM Calls

Use `generate()` inside runnable capabilities to delegate LLM calls to the platform (no API key needed):

```typescript
agent.addCapability({
  name: 'createPost',
  description: 'Create a social media post',
  inputSchema: z.object({
    platform: z.enum(['twitter', 'linkedin']),
    topic: z.string()
  }),
  async run({ args, action }) {
    // Text generation
    const post = await this.generate({
      prompt: `Create a compelling ${args.platform} post about: ${args.topic}`,
      action
    })

    // Structured output
    const metadata = await this.generate({
      prompt: `Suggest 3 hashtags for: ${post}`,
      outputSchema: z.object({
        hashtags: z.array(z.string()).length(3)
      }),
      action
    })

    return `${post}\n\n${metadata.hashtags.map(t => `#${t}`).join(' ')}`
  }
})
```

Parameters:
- `prompt` (string) — The prompt for the LLM
- `action` (ActionSchema) — The action context from the `run` function
- `outputSchema` (Zod schema, optional) — Returns validated structured output
- `messages` (array, optional) — Conversation history for multi-turn generation

## Zod Schema Patterns

```typescript
// Required string
z.string().describe('Description')

// Optional with default
z.string().optional().default('value')

// Enum
z.enum(['a', 'b', 'c'])

// Number with constraints
z.number().min(1).max(100)

// Boolean
z.boolean().optional()

// Object
z.object({
  field: z.string(),
  nested: z.object({ sub: z.number() })
})

// Array
z.array(z.string())
```

## Trigger Types

```typescript
import { triggers } from '@openserv-labs/client'

// Webhook (free)
triggers.webhook({ waitForCompletion: true, timeout: 600 })

// x402 (paid)
triggers.x402({
  name: 'AI Service Name',
  description: 'What your service does',
  price: '0.01'
})

// Cron (scheduled)
triggers.cron({ schedule: '0 9 * * *' })

// Manual
triggers.manual()
```

## Multi-Agent Provision

`provision()` supports multi-agent workflows via `tasks` array and optional `agentIds`:

```typescript
const result = await provision({
  agent: { instance: agent, name: 'my-agent', description: '...' },
  workflow: {
    name: 'Supercharged Service Hub',
    goal: 'Execute a multi-agent pipeline where each step builds on the previous to deliver a complete service',
    trigger: triggers.x402({ name: 'Service', price: '0.01' }),
    tasks: [
      { name: 'step-1', description: 'First step' }, // assigned to provisioned agent
      { name: 'step-2', description: 'Second step', agentId: 1044 } // marketplace agent
    ]
    // edges auto-generated: trigger -> step-1 -> step-2
    // agentIds auto-derived from tasks
    // x402WalletAddress auto-injected from wallet
  }
})
```

- `task` (single) still works for backward compat
- `tasks` (array) enables multi-agent with per-task `agentId`
- `edges` are auto-generated sequentially if omitted
- `agentIds` are derived from tasks; explicit list adds extras (observers)
- x402 wallet address resolved automatically

See `openserv-multi-agent-workflows/examples/paid-image-pipeline.md` for a complete example.

## Agent Methods

```typescript
// In capability run function, use 'this':
async run({ args, action }) {
  // LLM generation (platform-delegated, no API key needed)
  const text = await this.generate({ prompt: '...', action })
  const structured = await this.generate({ prompt: '...', outputSchema: z.object({ ... }), action })

  // Tasks
  await this.addLogToTask({ workspaceId, taskId, severity: 'info', type: 'text', body: '...' })
  await this.updateTaskStatus({ workspaceId, taskId, status: 'in-progress' })
  await this.createTask({ workspaceId, assignee, description, body, input, dependencies })

  // Files
  await this.getFiles({ workspaceId })
  await this.uploadFile({ workspaceId, path, file })
  await this.deleteFile({ workspaceId, fileId })

}
```

## Payments API (x402)

```typescript
import { PlatformClient } from '@openserv-labs/client'

const client = new PlatformClient() // no API key or wallet needed for discovery

// Discover x402 services (no authentication required)
const services = await client.payments.discoverServices()

// Pay and execute an x402 workflow by ID (recommended)
const result = await client.payments.payWorkflow({
  workflowId: 123,
  input: { prompt: 'Hello' }
})

// Or by direct URL
const result = await client.payments.payWorkflow({
  triggerUrl: 'https://api.openserv.ai/webhooks/x402/trigger/...',
  input: { prompt: 'Hello' }
})

// Get trigger preflight info (no authentication required)
const preflight = await client.payments.getTriggerPreflight({ token: '...' })
```

## Web3 API (Credits Top-up)

```typescript
// Top up credits with USDC (uses WALLET_PRIVATE_KEY env var)
const result = await client.web3.topUp({ amountUsd: 10 })
console.log(`Added ${result.creditsAdded} credits`)

// Lower-level methods
const config = await client.web3.getUsdcTopupConfig()
await client.web3.verifyUsdcTransaction({ txHash: '0x...', payerAddress: '0x...', signature: '0x...' })
```

## ERC-8004: On-Chain Registration

Register after `provision()`, before `run()`. **Always wrap in try/catch** — registration requires ETH on Base for gas, and the wallet starts unfunded. Without try/catch, a failure here will crash the process and prevent `run(agent)` from starting.

**Important:** `provision()` writes `WALLET_PRIVATE_KEY` to `.env` at runtime. If you use `import 'dotenv/config'`, the env var is loaded once at startup (empty on first run) and never refreshed. Use `dotenv.config({ override: true })` after `provision()` to reload it:

```typescript
import dotenv from 'dotenv'
dotenv.config()

// ... after provision() ...

// Reload .env to pick up WALLET_PRIVATE_KEY written by provision()
dotenv.config({ override: true })

try {
  const client = new PlatformClient()
  await client.authenticate(process.env.WALLET_PRIVATE_KEY)

  const erc8004 = await client.erc8004.registerOnChain({
    workflowId: result.workflowId,       // from provision()
    privateKey: process.env.WALLET_PRIVATE_KEY!,
    name: 'My Agent',
    description: 'What this agent does',
    // chainId: 8453,                     // Default: Base mainnet
    // rpcUrl: 'https://mainnet.base.org' // Default
  })

  erc8004.agentId          // "8453:42"
  erc8004.txHash           // "0xabc..."
  erc8004.blockExplorerUrl // "https://basescan.org/tx/..."
  erc8004.agentCardUrl     // IPFS URL
  erc8004.scanUrl          // "https://www.8004scan.io/agents/base/42"
} catch (error) {
  console.warn('ERC-8004 registration skipped:', error instanceof Error ? error.message : error)
}
```

- First run → `register()` (new mint). Re-runs → `setAgentURI()` (update, same ID).
- **Never clear wallet state** unless you want a new agent ID.
- **Requires ETH on Base.** Fund the wallet logged during provisioning (`Created new wallet: 0x...`) with a small amount of ETH on Base mainnet before the first registration.

See **openserv-client** reference for full ERC-8004 API.

## Environment Variables

Most agents don't need any LLM API key—use runless capabilities or `generate()`. Only set `OPENAI_API_KEY` if you use `process()` for direct OpenAI calls.

```env
# Only needed for process() — most agents don't need this:
# OPENAI_API_KEY=your-key
# ANTHROPIC_API_KEY=your_anthropic_key  # If using Claude directly

OPENSERV_API_KEY=auto-populated
OPENSERV_AUTH_TOKEN=auto-populated
WALLET_PRIVATE_KEY=auto-populated (also used for x402 payments, USDC top-up, and ERC-8004 registration)
PORT=7378
DISABLE_TUNNEL=true        # Production: skip tunnel, run HTTP server only
FORCE_TUNNEL=true          # Force tunnel even when endpointUrl is configured
OPENSERV_PROXY_URL=...     # Custom proxy URL (default: https://agents-proxy.openserv.ai)
```
