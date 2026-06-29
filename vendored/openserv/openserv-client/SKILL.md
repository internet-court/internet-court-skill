---
name: openserv-client
description: Complete guide to using @openserv-labs/client for managing agents, workflows, triggers, and tasks on the OpenServ Platform. Covers provisioning, authentication, x402 payments, ERC-8004 on-chain identity, and the full Platform API. IMPORTANT - Always read the companion skill openserv-agent-sdk alongside this skill, as both packages are required to build any agent. Read reference.md for the full API reference.
---

# OpenServ Client

The `@openserv-labs/client` package is the TypeScript client for the OpenServ Platform API. You use it whenever your code needs to talk to the platform—to register an agent, create workflows, set up triggers, or run tasks.

## Why you need this package

Your agent (built with `@openserv-labs/sdk`) runs on your machine or server. The platform doesn’t know about it until you tell it: what the agent is, where it’s reachable, and how it can be triggered. The client is how you do that. It lets you create a platform account (or reuse one), register your agent, define workflows and triggers (webhook, cron, manual, or x402 paid), and bind credentials so your agent can accept tasks. Without it, your agent would have no way to get onto the platform or receive work.

## What you can do with it

- **Provision** — One-shot setup: create or reuse an account (via wallet), register the agent, create a workflow with trigger and task, and get API key and auth token. Typically you call `provision()` once per app startup; it’s idempotent.
- **Platform API** — Full control via `PlatformClient`: create and list agents, workflows, triggers, and tasks; fire triggers; run workflows; manage credentials. Use this when you need more than the default provision flow.
- **Model Parameters** — Configure which LLM model and parameters the platform uses for your agent's tasks. Set `model_parameters` on agent creation/update or via `provision()`.
- **Models API** — Discover available LLM models and their parameter schemas via `client.models.list()`.
- **x402 payments** — Expose your agent behind a paywall; callers pay per request (e.g. USDC) before the task runs. Provision can set up an x402 trigger and return a paywall URL.
- **ERC-8004 on-chain identity** — Register your agent on-chain (Base), mint an identity NFT, and publish service metadata to IPFS so others can discover and pay your agent in a standard way.

**Reference:** `reference.md` (full API) · `troubleshooting.md` (common issues) · `examples/` (runnable code)

## Installation

```bash
npm install @openserv-labs/client
```

---

## Quick Start: Just `provision()` + `run()`

**The simplest deployment is just two calls: `provision()` and `run()`.** That's it.

You need an account on the platform to register agents and workflows. The easiest way is to let `provision()` create one for you: it creates a wallet and signs you up with it (no email required). That account is reused on every run.

See `examples/agent.ts` for a complete runnable example.

> **Key Point:** `provision()` is **idempotent**. Call it every time your app starts - no need to check `isProvisioned()` first.

### What `provision()` Does

1. Creates or reuses an Ethereum wallet (and platform account if new)
2. Authenticates with the OpenServ platform
3. Creates or updates the agent (idempotent)
4. Generates API key and auth token
5. **Binds credentials to agent instance** (if `agent.instance` is provided)
6. Creates or updates the workflow with trigger and task
7. Creates workflow graph (edges linking trigger to task)
8. Activates trigger and sets workflow to running
9. Persists state to `.openserv.json`

### Workflow Name & Goal

The `workflow` config requires two important properties:

- **`name`** (string) - This becomes the **agent name in ERC-8004**. Make it polished, punchy, and memorable — this is the public-facing brand name users see. Think product launch, not variable name. Examples: `'Viral Content Engine'`, `'Crypto Alpha Scanner'`, `'Life Catalyst Pro'`.
- **`goal`** (string, required) - A detailed description of what the workflow accomplishes. Must be descriptive and thorough — short or vague goals will cause API calls to fail. Write at least a full sentence explaining the workflow's purpose.

```typescript
workflow: {
  name: 'Deep Research Pro',
  goal: 'Research any topic in depth, synthesize findings from multiple sources, and produce a comprehensive report with citations',
  trigger: triggers.webhook({ waitForCompletion: true, timeout: 600 }),
  task: { description: 'Research the given topic' }
}
```

### Agent Instance Binding (v1.1+)

Pass your agent instance to `provision()` for automatic credential binding:

```typescript
const agent = new Agent({ systemPrompt: '...' })

await provision({
  agent: {
    instance: agent, // Calls agent.setCredentials() automatically
    name: 'my-agent',
    description: '...',
    model_parameters: { model: 'gpt-5', verbosity: 'medium', reasoning_effort: 'high' } // Optional
  },
  workflow: { ... }
})

// agent now has apiKey and authToken set - ready for run()
await run(agent)
```

This eliminates the need to manually set `OPENSERV_API_KEY` environment variables.

### Model Parameters

The optional `model_parameters` field controls which LLM model and parameters the platform uses when executing tasks for your agent (including runless capabilities and `generate()` calls). If not provided, the platform default is used.

```typescript
await provision({
  agent: {
    instance: agent,
    name: 'my-agent',
    description: '...',
    model_parameters: {
      model: 'gpt-4o',
      temperature: 0.5,
      parallel_tool_calls: false
    }
  },
  workflow: { ... }
})
```

Discover available models and their parameters:

```typescript
const { models, default: defaultModel } = await client.models.list()
// models: [{ model: 'gpt-5', provider: 'openai', parameters: { ... } }, ...]
// default: 'gpt-5-mini'
```

### Provision Result

```typescript
interface ProvisionResult {
  agentId: number
  apiKey: string
  authToken?: string
  workflowId: number
  triggerId: string
  triggerToken: string
  paywallUrl?: string // For x402 triggers
  apiEndpoint?: string // For webhook triggers
}
```

---

## API Keys: Agent vs User

`provision()` creates two types of credentials. They are **not interchangeable**:

| Credential    | Env Variable            | Used By          | Purpose                                                                                                                                       |
| ------------- | ----------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent API key | `OPENSERV_API_KEY`      | SDK internals    | Authenticates the agent when receiving tasks from the platform. Set automatically via `agent.instance`. **Do not** use with `PlatformClient`. |
| Wallet key    | `WALLET_PRIVATE_KEY`    | `PlatformClient` | Authenticates your account for management calls (list tasks, debug workflows, manage agents).                                                 |
| User API key  | `OPENSERV_USER_API_KEY` | `PlatformClient` | Alternative to wallet auth. Get from the platform dashboard.                                                                                  |

If you get a **401 Unauthorized** when using `PlatformClient`, you are likely using the agent API key by mistake. Use wallet authentication or the user API key instead.

---

## PlatformClient: Full API Access

For advanced use cases, use `PlatformClient` directly:

```typescript
import { PlatformClient } from '@openserv-labs/client'

// Using wallet authentication (recommended — uses wallet from provision)
const client = new PlatformClient()
await client.authenticate(process.env.WALLET_PRIVATE_KEY)

// Or using User API key (NOT the agent API key)
const client = new PlatformClient({
  apiKey: process.env.OPENSERV_USER_API_KEY // NOT OPENSERV_API_KEY
})
```

See `reference.md` for full API documentation on:

- `client.agents.*` - Agent management
- `client.workflows.*` - Workflow management
- `client.triggers.*` - Trigger management
- `client.tasks.*` - Task management
- `client.models.*` - Available LLM models and parameters
- `client.integrations.*` - Integration connections
- `client.payments.*` - x402 payments
- `client.web3.*` - Credits top-up

---

## Triggers Factory

Use the `triggers` factory for type-safe trigger configuration:

```typescript
import { triggers } from '@openserv-labs/client'

// Webhook (free, public endpoint)
triggers.webhook({
  input: { query: { type: 'string', description: 'Search query' } },
  waitForCompletion: true,
  timeout: 600
})

// x402 (paid API with paywall)
triggers.x402({
  name: 'AI Research Assistant',
  description: 'Get comprehensive research reports on any topic',
  price: '0.01',
  timeout: 600,
  input: {
    prompt: {
      type: 'string',
      title: 'Your Request',
      description: 'Describe what you would like the agent to do'
    }
  }
})

// Cron (scheduled)
triggers.cron({
  schedule: '0 9 * * *', // Daily at 9 AM
  timezone: 'America/New_York'
})

// Manual (platform UI only)
triggers.manual()
```

### Timeout

> **Important:** Always set `timeout` to at least **600 seconds** (10 minutes) for webhook and x402 triggers. Agents often take significant time to process requests — especially in multi-agent workflows or when performing research, content generation, or other complex tasks. A low timeout (e.g., 180s) will cause premature failures. When in doubt, err on the side of a longer timeout. For multi-agent pipelines with many sequential steps, consider 900 seconds or more.

### Input Schema

Define fields for webhook/x402 paywall UI:

```typescript
triggers.x402({
  name: 'Content Writer',
  description: 'Generate polished content on any topic',
  price: '0.01',
  input: {
    topic: {
      type: 'string',
      title: 'Content Topic',
      description: 'Enter the subject you want covered'
    },
    style: {
      type: 'string',
      title: 'Writing Style',
      enum: ['formal', 'casual', 'humorous'],
      default: 'casual'
    }
  }
})
```

### Cron Expressions

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-6, Sunday=0)
* * * * *
```

Common: `0 9 * * *` (daily 9 AM), `*/5 * * * *` (every 5 min), `0 9 * * 1-5` (weekdays 9 AM)

---

## Deploy to OpenServ Cloud

Deploy your agent to the OpenServ managed cloud with:

```bash
npx @openserv-labs/client deploy [path]
```

Where `[path]` is the directory containing your agent code (defaults to current directory).

### Prerequisites

1. **`OPENSERV_USER_API_KEY` in `.env`** — Your `.env` file in the agent directory must contain `OPENSERV_USER_API_KEY`. Get this from the OpenServ platform dashboard. This key is required by the deploy command (and by `PlatformClient` for management operations). Note that `provision()` itself does **not** need this key — it creates its own wallet, authenticates, and persists credentials to `.openserv.json` independently. The user API key is also saved to `.openserv.json` after provision if present.

2. **Call `provision()` first** — `provision()` must run at least once before deploying. It registers the agent on the platform and persists credentials to `.openserv.json`. The recommended agent template already calls `provision()` before `run(agent)` in `main()`, so starting the agent locally (`npm run dev` or `npx tsx src/agent.ts`) is enough. If your code does not call `provision()` (e.g., you only call `run(agent)` in a custom script), you must add an explicit `provision()` call and run it once before deploying.

### Deploy Workflow

```text
1. Set OPENSERV_USER_API_KEY in .env
2. Call provision() during local startup (npm run dev) — registers the agent and writes .openserv.json
3. npx @openserv-labs/client deploy .
```

---

## State Management

```typescript
import { getProvisionedInfo, clearProvisionedState } from '@openserv-labs/client'

// Get stored IDs and tokens
const info = getProvisionedInfo('my-agent', 'My Awesome Workflow')

// Clear state (forces fresh creation)
clearProvisionedState()
```

---

## Discovering & Firing x402 Services

### Discover Available Services (No Auth Required)

`discoverServices()` lists all public x402-enabled workflows. **No authentication is needed** — you can call it on a bare `PlatformClient`:

```typescript
import { PlatformClient } from '@openserv-labs/client'

const client = new PlatformClient() // no API key or wallet needed
const services = await client.payments.discoverServices()

for (const service of services) {
  console.log(`${service.name}: $${service.x402Pricing}`)
  console.log(`URL: ${service.webhookUrl}`)
}
```

### Firing Triggers

```typescript
// By workflow ID (recommended — resolves the URL automatically)
const result = await client.triggers.fireWebhook({
  workflowId: 123,
  input: { query: 'hello world' }
})

// Or by direct URL
const result = await client.triggers.fireWebhook({
  triggerUrl: 'https://api.openserv.ai/webhooks/trigger/TOKEN',
  input: { query: 'hello world' }
})
```

#### x402 (Programmatic)

```typescript
// By workflow ID (recommended)
const result = await client.payments.payWorkflow({
  workflowId: 123,
  input: { prompt: 'Hello world' }
})

// Or by direct URL
const result = await client.payments.payWorkflow({
  triggerUrl: 'https://api.openserv.ai/webhooks/x402/trigger/TOKEN',
  input: { prompt: 'Hello world' }
})
```

---

## Environment Variables

| Variable                | Description                                                            | Required |
| ----------------------- | ---------------------------------------------------------------------- | -------- |
| `OPENSERV_USER_API_KEY` | User API key (from platform). Required for deploy and `PlatformClient` | Yes\*    |
| `WALLET_PRIVATE_KEY`    | Wallet for SIWE auth                                                   | Yes\*    |
| `OPENSERV_API_URL`      | Custom API URL                                                         | No       |

\*Either API key or wallet key required for `PlatformClient`. `OPENSERV_USER_API_KEY` is required for `npx @openserv-labs/client deploy`.

---

## ERC-8004: On-Chain Agent Identity

Register your agent on-chain after provisioning. This mints an NFT on the Identity Registry and publishes your agent's service endpoints to IPFS.

> **Requires ETH on Base.** The wallet created by `provision()` starts with zero balance. Fund it with a small amount of ETH on Base mainnet before registration. Always wrap in try/catch so failures don't prevent `run(agent)` from starting.

> **Reload `.env` after `provision()`.** `provision()` writes `WALLET_PRIVATE_KEY` to `.env` at runtime, but `process.env` already loaded the empty value at startup. Use `dotenv.config({ override: true })` after `provision()` to pick up the freshly written key. See **openserv-agent-sdk** skill for the full dotenv pattern.

```typescript
import { PlatformClient } from '@openserv-labs/client'

// Reload .env to pick up WALLET_PRIVATE_KEY written by provision()
dotenv.config({ override: true })

try {
  const client = new PlatformClient()
  await client.authenticate(process.env.WALLET_PRIVATE_KEY)

  const erc8004 = await client.erc8004.registerOnChain({
    workflowId: result.workflowId,
    privateKey: process.env.WALLET_PRIVATE_KEY!,
    name: 'My Agent',
    description: 'What this agent does'
  })

  console.log(`Agent ID: ${erc8004.agentId}`) // "8453:42"
  console.log(`Explorer: ${erc8004.blockExplorerUrl}`)
  console.log(`Scan: ${erc8004.scanUrl}`) // "https://www.8004scan.io/agents/base/42"
} catch (error) {
  console.warn('ERC-8004 registration skipped:', error instanceof Error ? error.message : error)
}
```

- **First run** mints a new NFT. **Re-runs update the URI** — agent ID stays the same.
- Default chain is Base mainnet (8453). Pass `chainId` and `rpcUrl` for other chains.
- **Never clear the wallet state** unless you intentionally want a new agent ID.

See `reference.md` for the full ERC-8004 API (wallet management, chain helpers, troubleshooting).

---

## Cleanup

```typescript
await client.workflows.delete({ id: workflowId })
await client.agents.delete({ id: agentId })
clearProvisionedState()
```

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

- **openserv-agent-sdk** - Building agents with capabilities
- **openserv-multi-agent-workflows** - Multi-agent collaboration patterns
- **openserv-launch** - Launch tokens on Base blockchain
- **openserv-ideaboard-api** - Find ideas and ship agent services on the Ideaboard
