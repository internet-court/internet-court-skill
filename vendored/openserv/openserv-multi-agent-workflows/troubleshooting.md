# Multi-Agent Workflows Troubleshooting

Common issues and solutions for multi-agent workflows.

---

## Workflow graph looks like spaghetti

If your workflow diagram shows a web of interconnected edges:

1. **Stop and redesign**: Don't try to fix it by adding more edges
2. **Map out the actual data flow**: Write down what each agent needs as input
3. **Rebuild as stages**:
   - Stage 1: Initial processing (parallel if independent)
   - Stage 2: Tasks that need Stage 1 outputs
   - Stage 3: Final combination/output
4. **Delete unnecessary edges**: If an agent doesn't truly need another's output, remove that edge
5. **Use the declarative sync**: Define edges explicitly rather than letting them accumulate

---

## Workflow creation fails with INVALID_PROJECT_GOAL

The backend validates workflow goals and rejects vague or placeholder-like descriptions.

**Error messages:**

- `"The description is too vague and lacks a clear objective."`
- `"The description seems like a placeholder or technical jargon without a clear objective."`

**Rejected examples:**

- `"Test something"`
- `"Process data"`
- `"Handle requests"`
- Technical jargon without clear business purpose

**Working examples:**

- `"Research topics and produce engaging blog posts"`
- `"Process incoming requests and generate automated responses"`
- `"Analyze customer feedback and create actionable reports"`

Goals should describe a clear business objective, not test names or implementation details.

---

## Tasks not executing in order

- Verify `dependencies` array contains correct task IDs
- Each task should only depend on the previous one (not all previous tasks)

---

## Workflow stuck

- Check all dependencies are satisfied (all `done`)
- Verify workflow is in `running` state
- Check agent endpoints are reachable

---

## Output not flowing between tasks

- Ensure workflow edges connect the tasks correctly
- Verify tasks have proper input/output configuration

---

## Triggers not firing tasks

**Most common cause:** Missing workflow edges.

1. **Check edges exist**: Triggers must be connected to tasks via edges in the workflow graph

```typescript
const workflow = await client.workflows.get({ id })
console.log('Edges:', workflow.edges)
// Should show connections like: trigger-xxx → task-xxx
```

If edges are missing, tasks will never execute even if dependencies are set correctly.

2. **Verify trigger is activated**: `await client.triggers.activate({ workflowId, id: triggerId })`

3. **Check workflow is running**: `await workflow.setRunning()`

---

## "Assignee agent not found in workspace"

This error means a task references an agent that isn't a member of the workspace.

**With `workflows.create()`:** This should not happen -- `agentIds` are automatically derived from `tasks[].agentId`. Every agent referenced in a task is included in the workspace. You don't need to specify `agentIds` manually.

```typescript
// This just works -- agents 123 and 456 are auto-included
const workflow = await client.workflows.create({
  name: 'Hyper Agent Relay',
  goal: 'Route incoming requests through a multi-step agent pipeline for processing and response generation',
  triggers: [triggers.webhook({ name: 'api' })],
  tasks: [
    { name: 'step-1', agentId: 123, description: 'First step' },
    { name: 'step-2', agentId: 456, description: 'Second step' }
  ],
  edges: [
    { from: 'trigger:api', to: 'task:step-1' },
    { from: 'task:step-1', to: 'task:step-2' }
  ]
})
```

**With `workflow.sync()`:** `sync()` automatically adds any agents referenced in tasks that aren't already in the workspace. If you sync a task assigned to a new agent, that agent is added to the workspace before the sync happens. You can also add agents explicitly:

```typescript
await workflow.addAgent(789)  // Add agent 789 to the workspace
// or
await client.workflows.addAgent({ id: workflowId, agentId: 789 })
```

**With `provision()`:** Agents are derived from `tasks[].agentId` at creation time, and on re-provision, `sync()` automatically adds any new agents. This is fully idempotent -- you can re-provision with additional agents without recreating the workspace.

---

## "Workspace payout wallet address not found" (x402 triggers)

The x402 trigger needs an `x402WalletAddress` in its props to know where to send payments.

**If using `provision()`:** This is handled automatically via `client.resolveWalletAddress()`.

**If using `workflows.create()` or `workflow.sync()` directly:** Ensure the client was authenticated with a wallet (`client.authenticate(privateKey)`) or that `WALLET_PRIVATE_KEY` is in the environment. The wallet address is auto-injected for x402 triggers. You can also set it explicitly per-trigger:

```typescript
triggers: [
  triggers.x402({ price: '0.01', walletAddress: '0x...explicit-payout-address' })
]
```

---

## Integration connection errors

The `workflows.sync()` and `workflows.create()` methods automatically handle integration connection IDs when you provide a trigger `type`. If you're creating triggers manually using the triggers API directly, you need to resolve connection IDs first:

```typescript
// Always resolve to actual connection ID first
const connId = await client.integrations.getOrCreateConnection('webhook-trigger')

await client.triggers.create({
  workflowId,
  name: 'My Trigger',
  integrationConnectionId: connId, // UUID required
  props: { ... }
})
```
