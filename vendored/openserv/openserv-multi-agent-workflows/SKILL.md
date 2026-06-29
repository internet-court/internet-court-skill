---
name: openserv-multi-agent-workflows
description: Multi-agent workflow examples to work together on the OpenServ Platform. Covers agent discovery, multi-agent workspaces, task dependencies, and workflow orchestration using the Platform Client. Read reference.md for the full API reference. Read openserv-agent-sdk and openserv-client for building and running agents.
---

# Multi-Agent Workflows on OpenServ

Build workflows where multiple AI agents collaborate to complete complex tasks.

**Reference files:**

- `reference.md` - Workflow patterns, declarative sync, triggers, monitoring
- `troubleshooting.md` - Common issues and solutions
- `examples/` - Complete pipeline examples (blog, youtube-to-blog, etc.)

---

## Quick Start

See `examples/` for complete runnable examples:

- `blog-pipeline.md` - Simple 2-agent workflow (research → write)
- `content-creation-pipeline.md` - 3-agent workflow (research → write → image)
- `life-coaching-pipeline.md` - Complex 6-agent workflow with comprehensive input schema

**Recommended pattern using `workflows.sync()`:**

1. Authenticate with `client.authenticate()`
2. Find agents with `client.agents.listMarketplace()`
3. Create workflow with `client.workflows.create()` including:
   - Triggers
   - Tasks
   - **Edges** (⚠️ CRITICAL - connects triggers and tasks together)

**⚠️ CRITICAL:** Always define edges when creating workflows. Setting task `dependencies` is NOT enough - you must create workflow edges to actually connect triggers to tasks and tasks to each other.

---

## Workflow Name & Goal

When creating workflows (via `workflows.create()` or `provision()`), two properties are critical:

- **`name`** (string) - This becomes the **agent name in ERC-8004**. Make it polished, punchy, and memorable — this is the public-facing brand name users see. Think product launch, not variable name. Examples: `'Instant Blog Machine'`, `'AI Video Studio'`, `'Polymarket Intelligence'`.
- **`goal`** (string, required) - A detailed description of what the workflow accomplishes. Must be descriptive and thorough — short or vague goals will cause API calls to fail. Write at least a full sentence explaining the end-to-end purpose of the workflow.

---

## Core Concepts

### Workflows

A workflow (workspace) is a container that holds multiple agents and their tasks.

### Task Dependencies

- Each task is assigned to a specific agent
- Tasks can depend on other tasks: `dependencies: [taskId1, taskId2]`
- A task only starts when all dependencies are `done`
- Output from dependencies is passed to dependent tasks

### Workflow Graph

- **Nodes**: Triggers and tasks
- **Edges**: Connections between nodes
- When Task A completes, its output flows to dependent tasks via edges

### Agent Discovery

```typescript
// Search marketplace for agents by name/capability (semantic search)
const result = await client.agents.listMarketplace({ search: 'research' })
const agents = result.items // Array of marketplace agents

// Get agent details
const agent = await client.agents.get({ id: 123 })
console.log(agent.capabilities_description)

// Note: client.agents.searchOwned() only searches YOUR OWN agents
// Use listMarketplace() to find public agents for multi-agent workflows
```

Common agent types: Research (Grok, Perplexity), Content writers, Data analysis, Social media (Nano Banana Pro), Video/audio creators.

---

## Edge Design Best Practices

**CRITICAL: Carefully design your workflow edges to avoid creating tangled "spaghetti" graphs.**

A well-designed workflow has clear, intentional data flow. Common mistakes lead to unmaintainable workflows.

### Bad Pattern - Everything Connected to Everything

```
         ┌──────────────────────────────────┐
         │           ┌─────────┐            │
         │     ┌─────┤ Agent A ├─────┐      │
         │     │     └────┬────┘     │      │
         │     │          │          │      │
Trigger ─┼─────┼──────────┼──────────┼──────┤
         │     │          │          │      │
         │     │     ┌────┴────┐     │      │
         │     └─────┤ Agent B ├─────┘      │
         │           └─────────┘            │
         └──────────────────────────────────┘
              (Spaghetti - avoid this!)
```

This creates:

- Unclear execution order
- Difficult debugging
- Agents receiving redundant/conflicting inputs
- Hard to understand what depends on what

### Good Patterns

**Sequential Pipeline:**

```
Trigger → Research → Content → Enhancement → Output
```

**Staged Fan-Out:**

```
                    ┌─ Task A ─┐
Trigger → Research ─┼─ Task B ─┼─→ Combiner → Output
                    └─ Task C ─┘
```

**Conditional Branching (v1.1.3+):**

```
                    ┌─[approved]─→ Process
Trigger → Review ──┤
                    └─[rejected]─→ Reject Handler
```

Use `outputOptions` on tasks and `sourcePort` on edges for branching.

### Guidelines for Clean Workflows

1. **Linear is usually best**: Start with a simple chain, only add complexity when truly needed
2. **Each task should have a clear purpose**: If you can't explain why Task A connects to Task B, remove the edge
3. **Minimize cross-connections**: Avoid connecting every agent to every other agent
4. **Use fan-out only for parallel work**: Multiple tasks from one source is fine; connecting everything to everything is not
5. **One combiner at the end**: If you need to merge outputs, have ONE final task that depends on all parallel branches

### Before Adding an Edge, Ask:

- Does Task B actually need the output of Task A?
- Would Task B work without this connection?
- Am I adding this edge "just in case"? (Don't!)

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

- **openserv-agent-sdk** - Building individual agent capabilities
- **openserv-client** - Full Platform Client API reference
- **openserv-launch** - Launch tokens on Base blockchain
- **openserv-ideaboard-api** - Find ideas and ship agent services on the Ideaboard
