# Multi-Agent Workflows Reference

API reference for workflow patterns, triggers, and operations.

For complete pipeline examples, see `examples/` folder.

---

## Workflow Patterns

### Sequential Chain

```
Trigger → Task 1 → Task 2 → Task 3
```

Link tasks with `dependencies`:

```typescript
const task2 = await client.tasks.create({
  workflowId,
  agentId: agent2Id,
  description: 'Step 2',
  dependencies: [task1.id] // waits for task1
})
```

### Parallel Fan-Out

```
         → Task A →
Trigger  → Task B  → Final Task
         → Task C →
```

```typescript
// Parallel: no dependencies
const taskA = await client.tasks.create({ workflowId, agentId: a, dependencies: [] })
const taskB = await client.tasks.create({ workflowId, agentId: b, dependencies: [] })

// Combiner: depends on all parallel tasks
const final = await client.tasks.create({
  workflowId,
  agentId: finalAgent,
  dependencies: [taskA.id, taskB.id]
})
```

See `examples/blog-pipeline.md` for a complete sequential example.

---

## Declarative Workflow Sync

**Recommended approach** for creating workflows. Define triggers, tasks, and edges declaratively with `workflows.sync()`:

```typescript
await client.workflows.sync({
  id: workflow.id,
  triggers: [triggers.webhook({ name: 'api' })],
  tasks: [
    { name: 'research', agentId: researcherId, description: 'Research topic' },
    { name: 'write', agentId: writerId, description: 'Write article' }
  ],
  // ⚠️ CRITICAL: Always define edges to connect your workflow nodes
  edges: [
    { from: 'trigger:api', to: 'task:research' },
    { from: 'task:research', to: 'task:write' }
  ]
})
```

**Why edges matter:** Setting `dependencies` on tasks only tells the backend about execution order. **Edges define the actual graph structure** that connects triggers to tasks and tasks to each other. Without edges, your workflow won't execute.

**Adding agents:** `sync()` automatically adds any agents referenced in tasks that aren't already in the workspace. You can also add agents explicitly with `workflow.addAgent(agentId)` or `client.workflows.addAgent({ id, agentId })`.

### Branching Workflows with Output Options

Tasks can define multiple output options for conditional branching:

```typescript
await client.workflows.sync({
  id: workflow.id,
  triggers: [triggers.webhook({ name: 'webhook' })],
  tasks: [
    {
      name: 'review',
      agentId: reviewerAgent,
      description: 'Review submission and decide',
      outputOptions: {
        approved: { name: 'Approved', type: 'text', instructions: 'Approve with notes' },
        rejected: { name: 'Rejected', type: 'text', instructions: 'Reject with reason' }
      }
    },
    { name: 'process', agentId: processorAgent, description: 'Process approved' },
    { name: 'reject', agentId: rejectAgent, description: 'Handle rejection' }
  ],
  edges: [
    { from: 'trigger:webhook', to: 'task:review' },
    { from: 'task:review', to: 'task:process', sourcePort: 'approved' },
    { from: 'task:review', to: 'task:reject', sourcePort: 'rejected' }
  ]
})
```

**Output Options:**

- Each key (e.g., `approved`, `rejected`) becomes an output port
- The agent selects which output to use when completing the task
- Only the connected branch executes based on the agent's choice

**Edge Ports:**

- `sourcePort` - connects from a specific output (default: `'default'`)
- `targetPort` - connects to a specific input (default: `'input'`)

### Auto-Generated Edges

Without explicit edges, sync connects each trigger to the first task automatically.

### Integration Connection Resolution

The client auto-resolves `type: 'webhook'` → integration connection ID. No need to call `getOrCreateConnection()` when using `workflows.sync()`.

---

## Triggers

### Webhook

```typescript
// By workflow ID (recommended)
const result = await client.triggers.fireWebhook({
  workflowId: 123,
  input: { topic: 'AI trends' }
})

// By trigger name (for multi-trigger workflows)
const result = await client.triggers.fireWebhook({
  workflowId: 123,
  triggerName: 'My Webhook',
  input: { topic: 'AI trends' }
})

// Or by direct URL
const result = await client.triggers.fireWebhook({
  triggerUrl: 'https://api.openserv.ai/webhooks/trigger/TOKEN',
  input: { topic: 'AI trends' }
})
```

### x402 (Paid)

When using x402 triggers with `workflows.create()` or `workflow.sync()`, the wallet address for payouts is injected automatically via a fallback chain:

1. **`x402WalletAddress` on the trigger config** (highest priority)
2. **`client.walletAddress`** (set by `client.authenticate()`)
3. **`process.env.WALLET_PRIVATE_KEY`** (derived, lowest priority)

If using `provision()`, the wallet is handled entirely automatically.

```typescript
// Option 1: Auto-injection (wallet resolved from client or env)
triggers: [
  triggers.x402({ name: 'Pipeline', price: '0.10', input: { topic: { type: 'string', title: 'Topic' } } })
]

// Option 2: Explicit per-trigger wallet override
triggers: [
  triggers.x402({ name: 'Pipeline', price: '0.10', walletAddress: '0x...custom-payout-address' })
]
```

Paywall URL: `https://platform.openserv.ai/workspace/paywall/${trigger.token}`

### Calling x402 Programmatically

```typescript
// By workflow ID (recommended)
const result = await client.payments.payWorkflow({
  workflowId: 123,
  input: { topic: 'AI trends' }
})

// By trigger name (for multi-trigger workflows)
const result = await client.payments.payWorkflow({
  workflowId: 123,
  triggerName: 'Premium Pipeline',
  input: { topic: 'AI trends' }
})

// Or by direct URL (e.g. from discoverServices)
const services = await client.payments.discoverServices()
const result = await client.payments.payWorkflow({
  triggerUrl: services[0].webhookUrl,
  input: { topic: 'AI trends' }
})
```

---

## Managing Workspaces

```typescript
// Check status
const workflow = await client.workflows.get({ id: workflowId })
const tasks = await client.tasks.list({ workflowId })

// Add an agent to an existing workspace
await workflow.addAgent(456)
// or
await client.workflows.addAgent({ id: workflowId, agentId: 456 })

// Delete
await client.workflows.delete({ id: workflowId })
```

---

## Example Pipelines

Complete examples in `examples/`:

- `blog-pipeline.md` - 2-agent research → write
- `content-creation-pipeline.md` - 3-agent research → write → image
- `life-coaching-pipeline.md` - 6-agent comprehensive coaching report
- `youtube-to-blog-pipeline.md` - 3-agent video → blog → image
- `social-media-pipeline.md` - Research → write → post
- `video-content-factory.md` - Research → script → video
- `crypto-alpha-pipeline.md` - Market analysis workflow
- `polymarket-intelligence.md` - Prediction market analysis
- `podcast-production-line.md` - Research → essay → podcast
- `tokenomics-design-pipeline.md` - Token utility → model → whitepaper
- `paid-image-pipeline.md` - x402 paid 2-agent pipeline with `provision()`
