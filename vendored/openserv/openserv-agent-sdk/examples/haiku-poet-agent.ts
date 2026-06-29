/**
 * Haiku Poet Agent Example (Runless Capability)
 *
 * A paid agent that generates haikus — no LLM API key needed!
 * Uses a runless capability: just name + description, the platform handles the AI call.
 *
 * Run with: npx tsx haiku-poet-agent.ts
 */
import 'dotenv/config'
import { Agent, run } from '@openserv-labs/sdk'
import { provision, triggers } from '@openserv-labs/client'

// 1. Define your agent
const agent = new Agent({
  systemPrompt: 'You are a haiku poet. Generate beautiful haikus when asked.'
})

// 2. Add a runless capability — no run function, no API key needed!
//    The platform handles the AI call automatically.
agent.addCapability({
  name: 'generate_haiku',
  description:
    'Generate a haiku poem (5-7-5 syllables) about the given input. Only output the haiku, nothing else.'
})

async function main() {
  // 3. Provision with agent instance binding
  const result = await provision({
    agent: {
      instance: agent, // Binds credentials directly to agent
      name: 'haiku-poet',
      description: 'A poet that creates beautiful haikus on any topic'
    },
    workflow: {
      name: 'Haiku Poetry Generator',
      goal: 'Transform any theme or emotion into a beautiful traditional 5-7-5 haiku poem using AI',
      trigger: triggers.x402({
        name: 'Haiku Poetry Generator',
        description: 'Transform any theme into a beautiful traditional haiku poem',
        price: '0.01',
        input: {
          topic: {
            type: 'string',
            title: 'Inspiration for Your Haiku',
            description: 'Share a theme, emotion, or scene — nature, seasons, love, life moments'
          }
        }
      }),
      task: { description: 'Generate a haiku about the given topic' }
    }
  })

  console.log(`Paywall: ${result.paywallUrl}`)
  console.log(`Price: $0.01 per haiku`)

  // 4. Run the agent - credentials already bound
  await run(agent)
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
