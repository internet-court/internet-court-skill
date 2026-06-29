# Crypto Alpha Pipeline

A 3-agent sequential workflow that fetches crypto social metrics, analyzes trends, and produces investment reports.

## Pipeline

```mermaid
flowchart LR
    T[Trigger] --> A[LunarCrush Agent]
    A --> B[Data Analyst Agent]
    B --> C[Copywriter]
```

## Task Dependencies (Sequential)

```mermaid
flowchart TD
    A["Task 1: LunarCrush Agent<br/>dependencies: []"] --> B["Task 2: Data Analyst Agent<br/>dependencies: [task1Id]"]
    B --> C["Task 3: Copywriter<br/>dependencies: [task2Id]"]
```

Each task waits for the previous one to complete before starting.

---

## Complete Setup Script

### Project Structure

```
crypto-alpha-pipeline/
├── src/
│   └── setup.ts
├── .env
├── package.json
└── tsconfig.json
```

### .env

```env
WALLET_PRIVATE_KEY=0x...
```

### Dependencies

```bash
npm init -y && npm pkg set type=module
npm i @openserv-labs/client dotenv
npm i -D @types/node tsx typescript
```

> **Note:** The project must use `"type": "module"` in `package.json`. Add a `"setup": "tsx src/setup.ts"` script for local development.

### src/setup.ts

**Recommended Approach: Using `workflows.sync()`**

```typescript
import 'dotenv/config'
import { PlatformClient, triggers } from '@openserv-labs/client'

async function setup() {
  const client = new PlatformClient()

  if (!process.env.WALLET_PRIVATE_KEY) {
    console.error('Missing WALLET_PRIVATE_KEY in .env')
    process.exit(1)
  }

  console.log('1. Authenticating with wallet...')
  await client.authenticate(process.env.WALLET_PRIVATE_KEY)

  console.log('2. Finding agents from marketplace...')
  const lunarCrushResult = await client.agents.listMarketplace({ search: 'lunarcrush' })
  const dataAnalystResult = await client.agents.listMarketplace({ search: 'data analyst' })
  const copywriterResult = await client.agents.listMarketplace({ search: 'copywriter' })
  const lunarCrush = lunarCrushResult.items[0]
  const dataAnalyst = dataAnalystResult.items[0]
  const copywriter = copywriterResult.items[0]

  if (!lunarCrush || !dataAnalyst || !copywriter) {
    console.error('   Could not find required agents')
    const all = await client.agents.listMarketplace({})
    all.items.slice(0, 15).forEach(a => console.log(`   ID: ${a.id} | ${a.name}`))
    process.exit(1)
  }

  console.log(`   LunarCrush Agent: ${lunarCrush.name} (ID: ${lunarCrush.id})`)
  console.log(`   Data Analyst Agent: ${dataAnalyst.name} (ID: ${dataAnalyst.id})`)
  console.log(`   Copywriter: ${copywriter.name} (ID: ${copywriter.id})`)

  console.log('3. Creating workflow...')
  const workflow = await client.workflows.create({
    name: 'Crypto Alpha Scanner',
    goal: 'Gather real-time crypto market metrics, perform deep trend and risk analysis, and produce actionable investment intelligence reports',
    agentIds: [lunarCrush.id, dataAnalyst.id, copywriter.id],
    triggers: [
      triggers.webhook({
        name: 'webhook',
        waitForCompletion: true,
        timeout: 600,
        input: {
          symbol: { type: 'string', title: 'Crypto Symbol', description: 'Cryptocurrency symbol (e.g., BTC, ETH)' }
        }
      })
    ],
    tasks: [
      {
        name: 'fetch',
        agentId: lunarCrush.id,
        description: 'Fetch crypto social metrics',
        body: 'Fetch social metrics, sentiment data, and trending information for the specified cryptocurrency using LunarCrush API.',
        input: '{{trigger.symbol}}'
      },
      {
        name: 'analyze',
        agentId: dataAnalyst.id,
        description: 'Analyze crypto trends',
        body: 'Analyze the social metrics and sentiment data. Identify trends, correlations, and potential alpha signals. Produce a structured analysis with key insights.'
      },
      {
        name: 'report',
        agentId: copywriter.id,
        description: 'Write investment report',
        body: 'Based on the analysis, write a professional investment report. Include: executive summary, key metrics, trend analysis, risk factors, and actionable insights.'
      }
    ],
    // ⚠️ CRITICAL: Edges define the workflow execution path
    edges: [
      { from: 'trigger:webhook', to: 'task:fetch' },
      { from: 'task:fetch', to: 'task:analyze' },
      { from: 'task:analyze', to: 'task:report' }
    ]
  })
  console.log(`   Workflow ID: ${workflow.id}`)

  console.log('4. Activating workflow...')
  const trigger = workflow.triggers[0]
  await client.triggers.activate({ workflowId: workflow.id, id: trigger.id })
  await workflow.setRunning()

  console.log('\n========================================')
  console.log('Crypto Alpha Pipeline Setup Complete!')
  console.log('========================================')
  console.log(`\nWorkflow ID: ${workflow.id}`)
  console.log(`\nWorkflow: Trigger → LunarCrush Agent → Data Analyst → Copywriter`)
  console.log(`\nWebhook URL:`)
  console.log(`  POST https://api.openserv.ai/webhooks/trigger/${trigger.token}`)
  console.log(`\nExample:`)
  console.log(`  curl -X POST https://api.openserv.ai/webhooks/trigger/${trigger.token} \\`)
  console.log(`    -H "Content-Type: application/json" \\`)
  console.log(`    -d '{"symbol": "BTC"}'`)
  console.log('========================================')
}

setup().catch(err => {
  console.error('Setup failed:', err.message)
  process.exit(1)
})
```

---

## How It Works

1. **Trigger fires** with `{ "symbol": "BTC" }`
2. **LunarCrush Agent** fetches social metrics and sentiment data
3. **LunarCrush completes** → Data Analyst task becomes ready
4. **Data Analyst** analyzes trends and identifies alpha signals
5. **Data Analyst completes** → Copywriter task becomes ready
6. **Copywriter** produces a professional investment report
7. **Copywriter completes** → Report returned via webhook response

## Workflow Graph

```mermaid
flowchart TD
    T[Trigger] -->|symbol| A[Task 1: LunarCrush Agent]
    A -->|social metrics| B[Task 2: Data Analyst]
    B -->|analysis| C[Task 3: Copywriter]
    C -->|investment report| R[Result]
```

## Usage

```bash
# Run setup (creates workflow, tasks, trigger)
npm run setup

# Trigger the workflow
curl -X POST https://api.openserv.ai/webhooks/trigger/{token} \
  -H "Content-Type: application/json" \
  -d '{"symbol": "BTC"}'
```
