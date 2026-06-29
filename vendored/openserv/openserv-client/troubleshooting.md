# OpenServ Client Troubleshooting

Common issues and solutions.

---

## Task stuck in "to-do"

1. Check workflow is running: `await client.workflows.setRunning({ id })`
2. Check trigger is activated: `await client.triggers.activate({ workflowId, id })`
3. Verify trigger-to-task edge exists in workflow graph

---

## Triggers not created via sync

The sync endpoint requires actual **integration connection IDs** (UUIDs), not just integration identifiers. The `workflows.sync()` method handles this automatically by:

1. Resolving the trigger `type` (e.g., `'webhook'`) to an integration identifier (e.g., `'webhook-trigger'`)
2. Calling `client.integrations.getOrCreateConnection()` to get the actual UUID
3. Using that UUID in the sync payload

If building triggers manually, always use `getOrCreateConnection()`:

```typescript
const connectionId = await client.integrations.getOrCreateConnection('webhook-trigger')

await client.triggers.create({
  workflowId,
  name: 'My Trigger',
  integrationConnectionId: connectionId, // UUID required
  props: { ... }
})
```

---

## Adding agents to an existing workspace

When you `sync()` or re-provision a workflow with tasks assigned to agents not yet in the workspace, the client library automatically adds them. You can also add agents explicitly:

```typescript
// Automatic: sync() adds missing agents before syncing
await workflow.sync({
  tasks: [
    { name: 'task1', agentId: existingAgent, description: '...' },
    { name: 'task2', agentId: newAgent, description: '...' }  // added automatically
  ]
})

// Explicit: add an agent without assigning a task
await workflow.addAgent(456)
// or
await client.workflows.addAgent({ id: workflowId, agentId: 456 })
```

---

## Edges not created

Edges link triggers to tasks in the workflow graph. They can be:

1. **Auto-generated**: When you call `sync()` with triggers and tasks but no edges, each trigger connects to the first task
2. **Explicit**: Provide the `edges` array to define custom connections
3. **Created via provision()**: The `provision()` function automatically creates nodes and edges

To verify edges exist:

```typescript
const workflow = await client.workflows.get({ id })
console.log('Edges:', workflow.edges)
// Should show: [{ id, source: 'trigger-...', target: 'task-...', ... }]
```

---

## Paywall shows wrong fields

Ensure `input` schema is defined in trigger config:

```typescript
triggers.x402({
  price: '0.01',
  input: {
    myField: { type: 'string', title: 'My Label' }
  }
})
```

---

## Authentication errors

- Verify `WALLET_PRIVATE_KEY` or `OPENSERV_USER_API_KEY` is set
- For wallet auth, ensure key starts with `0x`
- If `WALLET_PRIVATE_KEY` is empty after `provision()`, reload `.env` with `dotenv.config({ override: true })` — see below

---

## ERC-8004: "insufficient funds for transfer"

The wallet has no ETH on Base mainnet for gas. Fund the wallet address (logged during provisioning) with a small amount of ETH on Base. Always wrap `registerOnChain` in try/catch so the agent can still start.

---

## ERC-8004: 401 on first run

`WALLET_PRIVATE_KEY` is empty because `provision()` writes it to `.env` after the initial `dotenv` load. Use `dotenv` programmatically and reload after provision:

```typescript
import dotenv from 'dotenv'
dotenv.config()
// ... provision() ...
dotenv.config({ override: true })
```
