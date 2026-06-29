/**
 * Basic Agent Example
 *
 * A minimal agent setup using @openserv-labs/sdk and @openserv-labs/client.
 * Just define, provision, and run!
 *
 * Run with: npx tsx basic-agent.ts
 */
import 'dotenv/config'
import { Agent, run } from '@openserv-labs/sdk'
import { provision, triggers } from '@openserv-labs/client'
import { z } from 'zod'

// 1. Define your agent
const agent = new Agent({
  systemPrompt: 'You are a helpful assistant that greets users.'
})

// 2. Add capabilities
agent.addCapability({
  name: 'greet',
  description: 'Greet a user by name',
  inputSchema: z.object({
    name: z.string().describe('The name of the user to greet')
  }),
  async run({ args }) {
    console.log(`Greeting: ${args.name}`)
    return `Hello, ${args.name}! Welcome to OpenServ.`
  }
})

async function main() {
  // 3. Provision with agent instance binding (v2.1+)
  // Binds API key and auth token directly to agent - no env vars needed!
  const result = await provision({
    agent: {
      instance: agent, // Calls agent.setCredentials() automatically
      name: 'basic-greeter',
      description: 'A simple greeting agent'
    },
    workflow: {
      name: 'Welcome Wizard',
      goal: 'Welcome users by name with a warm, personalized greeting message',
      trigger: triggers.webhook({
        waitForCompletion: true,
        input: {
          name: { type: 'string', title: 'Your Name', description: 'Who should we greet?' }
        }
      }),
      task: { description: 'Greet the user' }
    }
  })

  console.log(`Webhook: https://api.openserv.ai/webhooks/trigger/${result.triggerToken}`)

  // 4. Run the agent - credentials already bound via provision()
  await run(agent)
}

main().catch(console.error)
