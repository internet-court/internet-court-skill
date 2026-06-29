/**
 * Agent Example
 *
 * A simple agent using the SDK and Client packages.
 * Just provision() + run() - that's all you need!
 * No LLM API key needed — uses a runless capability.
 *
 * Run with: npx tsx agent.ts
 */
import 'dotenv/config'
import { Agent, run } from '@openserv-labs/sdk'
import { provision, triggers } from '@openserv-labs/client'

const agent = new Agent({
  systemPrompt: 'You are a helpful assistant.'
})

// Runless capability — no run function, no API key needed
agent.addCapability({
  name: 'processRequest',
  description: 'Process the user request and provide a helpful, thorough response.'
})

async function main() {
  // Just call provision() - it's IDEMPOTENT!
  // Creates on first run, updates on subsequent runs
  // No need to check isProvisioned() first
  const result = await provision({
    agent: {
      instance: agent, // Binds credentials directly to agent
      name: 'example-agent',
      description: 'An example assistant agent',
      // model_parameters: { model: 'gpt-5', verbosity: 'medium', reasoning_effort: 'high' } // Optional
    },
    workflow: {
      name: 'Instant AI Concierge',
      goal: 'Receive user requests via webhook, process them with AI, and return helpful responses',
      trigger: triggers.webhook({
        waitForCompletion: true,
        input: { input: { type: 'string', title: 'Your Request' } }
      }),
      task: { description: 'Process the user request' }
    }
  })

  console.log(`Webhook: https://api.openserv.ai/webhooks/trigger/${result.triggerToken}`)

  // Start the agent - credentials already bound
  await run(agent)
}

main().catch(console.error)
