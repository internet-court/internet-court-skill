# OpenServ Client API Reference

Detailed API reference for PlatformClient methods.

For complete examples, see `examples/` folder.

## Provision API

The `provision()` function is the recommended way to deploy agents:

```typescript
import { provision, triggers } from '@openserv-labs/client'
import { Agent, run } from '@openserv-labs/sdk'

const agent = new Agent({ systemPrompt: '...' })

const result = await provision({
  agent: {
    instance: agent, // Binds credentials directly to agent (v1.1+)
    name: 'my-agent',
    description: 'Agent capabilities',
    // endpointUrl: 'https://...' // Optional for dev, required for production
    // model_parameters: { model: 'gpt-5', verbosity: 'medium', reasoning_effort: 'high' } // Optional
  },
  workflow: {
    name: 'Instant AI Concierge',
    goal: 'Receive incoming requests, analyze and process them, and return structured responses',
    trigger: triggers.webhook({ waitForCompletion: true }),
    task: { description: 'Process requests' }
  }
})

// result contains: agentId, apiKey, authToken, workflowId, triggerId, etc.
await run(agent)
```

### Workflow Config

- **`name`** (string) - The **agent name in ERC-8004**. Make it polished, punchy, and memorable (e.g., `'Crypto Alpha Scanner'`, `'AI Video Studio'`). This is the brand name users see — not a slug or kebab-case identifier.
- **`goal`** (string, required) - A detailed description of what the workflow accomplishes. Must be descriptive and thorough — short or vague goals will cause API calls to fail.
- **`trigger`** - Trigger configuration (use the `triggers` factory)
- **`task`** / **`tasks`** - Single task shorthand or array for multi-agent workflows

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

## Agents API

```typescript
// List YOUR OWN agents
const agents = await client.agents.list()

// Search YOUR OWN agents by name/description
const myAgents = await client.agents.searchOwned({ query: 'my-agent' })

// Search ALL PUBLIC marketplace agents (semantic search)
const marketplace = await client.agents.listMarketplace({
  search: 'data processing',
  page: 1,
  pageSize: 20,
  showPrivateAgents: true
})
// Returns: { items: Agent[], total: number }

// Get agent by ID
const agent = await client.agents.get({ id: 123 })

// Create an agent
const agent = await client.agents.create({
  name: 'My Agent',
  capabilities_description: 'Processes data and generates reports',
  endpoint_url: 'https://my-agent.example.com',
  model_parameters: { model: 'gpt-4o', temperature: 0.5, parallel_tool_calls: false } // Optional
})

// Update an agent
await client.agents.update({
  id: 123,
  name: 'Updated Name',
  endpoint_url: 'https://new-endpoint.com',
  model_parameters: { model: 'gpt-5', verbosity: 'medium', reasoning_effort: 'high' } // Optional
})

// Delete an agent
await client.agents.delete({ id: 123 })

// Get agent API key
const apiKey = await client.agents.getApiKey({ id: 123 })

// Generate and save auth token
const { authToken, authTokenHash } = await client.agents.generateAuthToken()
await client.agents.saveAuthToken({ id: 123, authTokenHash })
```

---

## Workflows API

```typescript
// Create a workflow
const workflow = await client.workflows.create({
  name: 'Turbo Data Engine',
  goal: 'Ingest raw data from multiple sources, process and analyze it, and produce structured insights',
  agentIds: [123, 456]
})

// Get a workflow
const workflow = await client.workflows.get({ id: 789 })

// List all workflows
const workflows = await client.workflows.list()

// Update a workflow
await client.workflows.update({
  id: 789,
  name: 'Turbo Data Engine v2',
  goal: 'Process and analyze incoming data with improved validation and error handling'
})

// Delete a workflow
await client.workflows.delete({ id: 789 })

// Set workflow to running state
await client.workflows.setRunning({ id: 789 })

// Add an agent to an existing workspace
await client.workflows.addAgent({ id: 789, agentId: 456 })
```

### Declarative Workflow Sync

```typescript
await client.workflows.sync({
  id: 789,
  triggers: [triggers.webhook({ name: 'api' })],
  tasks: [
    { name: 'process', agentId: 123, description: 'Process the data' },
    { name: 'report', agentId: 456, description: 'Generate report' }
  ],
  edges: [
    { from: 'trigger:api', to: 'task:process' },
    { from: 'task:process', to: 'task:report' }
  ]
})
```

### Branching Workflows with Output Options

Tasks can define multiple output options for branching logic:

```typescript
await client.workflows.sync({
  id: 789,
  triggers: [triggers.webhook({ name: 'webhook' })],
  tasks: [
    {
      name: 'review',
      agentId: reviewerAgent,
      description: 'Review and decide on the submission',
      outputOptions: {
        approved: {
          name: 'Approved',
          type: 'text',
          instructions: 'Mark as approved with notes'
        },
        rejected: {
          name: 'Rejected',
          type: 'text',
          instructions: 'Mark as rejected with reason'
        }
      }
    },
    { name: 'process-approved', agentId: processorAgent, description: 'Process approved item' },
    { name: 'handle-rejection', agentId: rejectionAgent, description: 'Handle rejected item' }
  ],
  edges: [
    { from: 'trigger:webhook', to: 'task:review' },
    { from: 'task:review', to: 'task:process-approved', sourcePort: 'approved' },
    { from: 'task:review', to: 'task:handle-rejection', sourcePort: 'rejected' }
  ]
})
```

### Workflow Object Methods

```typescript
const workflow = await client.workflows.get({ id: 789 })

workflow.id
workflow.name
workflow.status // 'draft', 'running', etc.
workflow.triggers
workflow.tasks
workflow.edges
workflow.agents // Array of agents in the workspace

await workflow.addAgent(456)   // Add an agent to the workspace
await workflow.sync({ tasks: [...] })
await workflow.setRunning()
```

> **Note:** `sync()` automatically adds any agents referenced in tasks that aren't already in the workspace. You only need to call `addAgent()` explicitly if you want to add an agent without assigning it to a task.

---

## Triggers API

```typescript
// Get integration connection
const connId = await client.integrations.getOrCreateConnection('webhook-trigger')

// Create trigger
const trigger = await client.triggers.create({
  workflowId: 789,
  name: 'API Endpoint',
  integrationConnectionId: connId,
  props: { waitForCompletion: true, timeout: 600 }
})

// Get trigger (includes token)
const trigger = await client.triggers.get({ workflowId: 789, id: 'trigger-id' })

// List triggers
const allTriggers = await client.triggers.list({ workflowId: 789 })

// Update trigger
await client.triggers.update({
  workflowId: 789,
  id: 'trigger-id',
  props: { timeout: 600 }
})

// Activate trigger
await client.triggers.activate({ workflowId: 789, id: 'trigger-id' })

// Fire trigger manually (internal API, requires workflowId + triggerId)
await client.triggers.fire({
  workflowId: 789,
  id: 'trigger-id',
  input: JSON.stringify({ query: 'test' })
})

// Fire webhook trigger (simplified — resolves token automatically)
await client.triggers.fireWebhook({
  workflowId: 789,                         // Resolves the webhook trigger automatically
  input: { query: 'hello world' }
})

// Fire webhook by trigger name (for multi-trigger workflows)
await client.triggers.fireWebhook({
  workflowId: 789,
  triggerName: 'My Webhook',               // Target a specific trigger by name
  input: { query: 'hello world' }
})

// Fire webhook by trigger ID
await client.triggers.fireWebhook({
  workflowId: 789,
  triggerId: 'trigger-id',
  input: { query: 'hello world' }
})

// Fire webhook by direct URL (when you already have the URL)
await client.triggers.fireWebhook({
  triggerUrl: 'https://api.openserv.ai/webhooks/trigger/TOKEN',
  input: { query: 'hello world' }
})

// Delete trigger
await client.triggers.delete({ workflowId: 789, id: 'trigger-id' })
```

### Webhook/x402 URLs

URL construction is handled automatically by `fireWebhook()` and `payWorkflow()`. If you need the raw URLs:

```typescript
const trigger = await client.triggers.get({ workflowId, id: triggerId })

// Webhook URL
const webhookUrl = `https://api.openserv.ai/webhooks/trigger/${trigger.token}`

// x402 URL
const x402Url = `https://api.openserv.ai/webhooks/x402/trigger/${trigger.token}`

// Paywall page (x402 only)
const paywallUrl = `https://platform.openserv.ai/workspace/paywall/${trigger.token}`
```

### x402 Wallet Address Resolution

x402 triggers require an `x402WalletAddress` for payout. When using `workflows.create()`, `workflow.sync()`, or `provision()`, this is resolved automatically via a fallback chain:

1. **`x402WalletAddress` on the trigger config** -- per-trigger override (highest priority)
2. **`client.walletAddress`** -- set automatically by `client.authenticate(privateKey)`
3. **`process.env.WALLET_PRIVATE_KEY`** -- address derived from the env variable

```typescript
// Per-trigger override (different triggers, different wallets):
triggers: [
  triggers.x402({ price: '0.01', walletAddress: '0x...custom-payout-address' })
]
```

`client.resolveWalletAddress()` returns the resolved address (or `undefined` if no wallet is available).

### agentIds Derivation

`WorkflowConfig.agentIds` is optional. If omitted, agent IDs are derived from `tasks[].agentId`. If provided, they are merged with task-derived IDs:

```typescript
// No explicit agentIds -- derived from tasks automatically
const workflow = await client.workflows.create({
  name: 'Smart Data Forge',
  goal: 'Validate incoming data, transform it through multiple processing steps, and produce structured output',
  tasks: [
    { name: 'step1', agentId: 123, description: 'First step' },
    { name: 'step2', agentId: 456, description: 'Second step' }
  ]
})
// Workspace automatically includes agents 123 and 456
```

---

## Tasks API

```typescript
// Create a task
const task = await client.tasks.create({
  workflowId: 789,
  agentId: 123,
  description: 'Process the data',
  body: 'Detailed instructions for the agent',
  input: 'Optional input data',
  dependencies: [otherTaskId]
})

// Get a task
const task = await client.tasks.get({ workflowId: 789, id: 1 })

// List tasks
const tasks = await client.tasks.list({ workflowId: 789 })

// Update a task
await client.tasks.update({
  workflowId: 789,
  id: 1,
  description: 'Updated description',
  status: 'in-progress'
})

// Delete a task
await client.tasks.delete({ workflowId: 789, id: 1 })
```

---

## Integrations API

```typescript
// List all integration connections
const connections = await client.integrations.listConnections()

// Create a connection
await client.integrations.connect({
  identifier: 'webhook-trigger',
  props: {}
})

// Get or create (recommended)
const connectionId = await client.integrations.getOrCreateConnection('webhook-trigger')
```

Integration identifiers: `webhook-trigger`, `x402-trigger`, `cron-trigger`, `manual-trigger`

---

## Models API

Discover available LLM models and their parameter schemas:

```typescript
const { models, default: defaultModel } = await client.models.list()

// defaultModel: 'gpt-5-mini'
// models: array of ModelInfo objects

for (const model of models) {
  console.log(`${model.model} (${model.provider})`)
  // model.parameters: Record<string, ModelParameterMeta>
  // Each parameter has: type ('number' | 'boolean' | 'enum'), default, min?, max?, values?
}
```

### Types

```typescript
interface ModelParameterMeta {
  type: 'number' | 'boolean' | 'enum'
  default: number | boolean | string
  min?: number     // For number types
  max?: number     // For number types
  values?: string[] // For enum types
}

interface ModelInfo {
  model: string
  provider: string
  parameters: Record<string, ModelParameterMeta>
}

interface ModelsResponse {
  models: ModelInfo[]
  default: string // Default model name
}
```

Use `model_parameters` in `agents.create()`, `agents.update()`, or `provision()` to configure the model:

```typescript
// Example model_parameters values:
{ model: 'gpt-5', verbosity: 'medium', reasoning_effort: 'high' }
{ model: 'gpt-4o', temperature: 0.5, parallel_tool_calls: false }
```

---

## Payments API (x402)

```typescript
// Discover x402 services (no authentication required)
const services = await client.payments.discoverServices()

// Pay and execute an x402 workflow by ID (recommended)
const result = await client.payments.payWorkflow({
  workflowId: 789,
  input: { prompt: 'Generate a summary' }
})

// Pay by trigger name (for multi-trigger workflows)
const result = await client.payments.payWorkflow({
  workflowId: 789,
  triggerName: 'Premium Service',
  input: { prompt: 'Generate a summary' }
})

// Pay by direct URL (when you already have the URL)
const result = await client.payments.payWorkflow({
  triggerUrl: 'https://api.openserv.ai/webhooks/x402/trigger/...',
  input: { prompt: 'Generate a summary' }
})

// Get trigger preflight info (no authentication required)
const preflight = await client.payments.getTriggerPreflight({ token: '...' })
```

---

## Web3 API (Credits Top-up)

```typescript
// Top up credits with USDC
const result = await client.web3.topUp({ amountUsd: 10 })

// Get USDC config
const config = await client.web3.getUsdcTopupConfig()

// Verify transaction manually
await client.web3.verifyUsdcTransaction({
  txHash: '0x...',
  payerAddress: '0x...',
  signature: '0x...'
})
```

---

## ERC-8004 API

On-chain agent identity registration via the Identity Registry contract.

### Register On-Chain (High-Level)

> **Requires ETH on Base.** The wallet starts unfunded. Always wrap in try/catch so failures don't crash the agent. Reload `.env` after `provision()` with `dotenv.config({ override: true })` to pick up the freshly written `WALLET_PRIVATE_KEY`.

```typescript
// Reload .env after provision() to pick up WALLET_PRIVATE_KEY
dotenv.config({ override: true })

try {
  const client = new PlatformClient()
  await client.authenticate(process.env.WALLET_PRIVATE_KEY)

  const result = await client.erc8004.registerOnChain({
    workflowId: 123,
    privateKey: process.env.WALLET_PRIVATE_KEY!,
    chainId: 8453,                          // Default: Base mainnet
    rpcUrl: 'https://mainnet.base.org',     // Default
    name: 'My Agent',
    description: 'What this agent does',
  })

  result.agentId          // "8453:42" (chainId:tokenId)
  result.ipfsCid          // "bafkrei..."
  result.txHash           // "0xabc..."
  result.agentCardUrl     // "https://gateway.pinata.cloud/ipfs/..."
  result.blockExplorerUrl // "https://basescan.org/tx/..."
} catch (error) {
  console.warn('ERC-8004 registration skipped:', error instanceof Error ? error.message : error)
}
```

**First run:** mints NFT via `register()` → uploads agent card to IPFS → sets token URI.
**Re-runs:** detects existing `erc8004AgentId` → uploads updated card → calls `setAgentURI()`. **Agent ID stays the same.**

### Wallet Management

```typescript
const wallet = await client.workflows.generateWallet({ id: workflowId })
const imported = await client.workflows.importWallet({
  id: workflowId, address: '0x...', network: 'base', chainId: 8453, privateKey: '0x...'
})
const wallet = await client.workflows.getWallet({ id: workflowId })
// wallet.address, wallet.erc8004AgentId, wallet.deployed
await client.workflows.deleteWallet({ id: workflowId })
```

### Deploy (Low-Level State Management)

```typescript
// Save or clear deployment state
await client.erc8004.deploy({
  workflowId,
  erc8004AgentId: '8453:42',       // or '' to clear stale state
  stringifiedAgentCard: JSON.stringify(agentCard),
  walletAddress: '0x...',
  network: 'base',
  chainId: 8453,
  rpcUrl: 'https://mainnet.base.org',
})
```

### Other Methods

```typescript
// Get callable triggers (used to build agent card)
const triggers = await client.triggers.getCallableTriggers({ workflowId })

// Presign IPFS upload URL (expires in 60s)
const { url } = await client.erc8004.presignIpfsUrl({ workflowId })

// Sign feedback auth for reputation system
const { signature } = await client.workflows.signFeedbackAuth({
  id: workflowId, buyerAddress: '0xBuyer...',
})
```

### Chain Configuration Helpers

```typescript
import { listErc8004ChainIds, getErc8004Chain } from '@openserv-labs/client'

const mainnets = listErc8004ChainIds('mainnet')  // [1, 8453, 137, 42161, ...]
const testnets = listErc8004ChainIds('testnet')  // [11155111, 84532, ...]

const base = getErc8004Chain(8453)
base?.contracts.IDENTITY_REGISTRY  // "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
```

### Re-deploy vs Fresh Mint

`registerOnChain` checks the workflow wallet's `erc8004AgentId`:

- **Has value** → `setAgentURI` (update metadata, same agent ID)
- **Empty/null** → `register` (mint new NFT, new agent ID)

**Never clear the wallet state unless you intentionally want a new agent ID.** To update name/description/endpoints, just re-run.

### Troubleshooting: "Not authorized" on `setAgentURI`

The signing wallet doesn't own the on-chain token. Before doing anything, investigate:

1. **Check the chain ID.** Agent IDs are chain-specific (e.g. `84532:243` is Base Sepolia, `8453:243` is Base mainnet). If you previously deployed on a different chain, the stored `erc8004AgentId` won't work on the target chain. Make sure `chainId` in `registerOnChain()` matches the chain where the agent was originally registered.

2. **Check the wallet.** Verify that `WALLET_PRIVATE_KEY` derives to the same address that owns the token on-chain. If the wallet was regenerated (e.g. after deleting `.openserv.json` and re-provisioning), it won't match the original owner.

3. **Last resort: fresh mint.** Only if the original wallet is unrecoverable and you accept getting a new agent ID:

```typescript
await client.erc8004.deploy({
  workflowId,
  erc8004AgentId: '',
  stringifiedAgentCard: '',
  network: 'base',
  chainId: 8453,
  rpcUrl: 'https://mainnet.base.org',
})
// registerOnChain will now mint a new agent — you lose the old ID
```

---

## Authentication

```typescript
// API Key
const client = new PlatformClient({
  apiKey: process.env.OPENSERV_USER_API_KEY
})

// Wallet (SIWE)
const client = new PlatformClient()
await client.authenticate(process.env.WALLET_PRIVATE_KEY)
```
