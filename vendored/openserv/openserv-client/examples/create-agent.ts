/**
 * Create Agent Example
 *
 * Demonstrates using PlatformClient directly for more control.
 * Run with: npx tsx create-agent.ts
 */
import 'dotenv/config'
import { PlatformClient, triggers } from '@openserv-labs/client'

async function createAgent() {
  // Initialize client
  const client = new PlatformClient()

  // Authenticate with wallet
  await client.authenticate(process.env.WALLET_PRIVATE_KEY)
  console.log('✅ Authenticated')

  // Create agent (with optional model_parameters)
  const agent = await client.agents.create({
    name: 'my-custom-agent',
    capabilities_description: 'Processes data and generates reports',
    endpoint_url: 'https://my-agent.example.com',
    model_parameters: { model: 'gpt-4o', temperature: 0.5, parallel_tool_calls: false }
  })
  console.log(`✅ Created agent: ${agent.id}`)

  // Get API key
  const apiKey = await client.agents.getApiKey({ id: agent.id })
  console.log(`✅ API key: ${apiKey.slice(0, 8)}...`)

  // Generate auth token for security
  const { authToken, authTokenHash } = await client.agents.generateAuthToken()
  await client.agents.saveAuthToken({ id: agent.id, authTokenHash })
  console.log(`✅ Auth token saved`)

  // Create workflow
  const workflow = await client.workflows.create({
    name: 'Instant AI Concierge',
    goal: 'Receive incoming requests, analyze and process them with AI, and return structured responses',
    agentIds: [agent.id]
  })
  console.log(`✅ Created workflow: ${workflow.id}`)

  // Create trigger
  const connId = await client.integrations.getOrCreateConnection('webhook-trigger')
  const trigger = await client.triggers.create({
    workflowId: workflow.id,
    name: 'API Endpoint',
    integrationConnectionId: connId,
    props: {
      waitForCompletion: true,
      timeout: 600,
      inputSchema: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: { data: { type: 'string', title: 'Input Data' } },
        required: ['data']
      }
    }
  })
  console.log(`✅ Created trigger: ${trigger.id}`)

  // Create task
  await client.tasks.create({
    workflowId: workflow.id,
    agentId: agent.id,
    description: 'Process the incoming request',
    body: 'Handle the request and return results'
  })
  console.log(`✅ Created task`)

  // Activate
  await client.triggers.activate({ workflowId: workflow.id, id: trigger.id })
  await workflow.setRunning()
  console.log(`✅ Workflow running`)

  console.log('\n' + '='.repeat(50))
  console.log('Setup complete!')
  console.log(`Webhook: https://api.openserv.ai/webhooks/trigger/${trigger.token}`)
  console.log('='.repeat(50))

  // Return info for .env
  return {
    agentId: agent.id,
    apiKey,
    authToken,
    workflowId: workflow.id,
    triggerToken: trigger.token
  }
}

createAgent().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
