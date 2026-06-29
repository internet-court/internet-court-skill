/**
 * Cleanup Example
 *
 * Demonstrates how to clean up resources on the platform.
 * Run with: npx tsx cleanup.ts
 */
import 'dotenv/config'
import { PlatformClient, clearProvisionedState } from '@openserv-labs/client'

async function cleanup() {
  const args = process.argv.slice(2)

  if (args.includes('--help')) {
    console.log(`
Usage: npx tsx cleanup.ts [options]

Options:
  (no options)       List all workspaces and agents
  --all              Delete all workspaces and agents
  --workflow <id>    Delete a specific workflow
  --agent <id>       Delete a specific agent
  --local            Clear local .openserv.json state only
`)
    return
  }

  // Clear local state only
  if (args.includes('--local')) {
    clearProvisionedState()
    console.log('✅ Cleared local .openserv.json state')
    return
  }

  // Authenticate
  const client = new PlatformClient()
  await client.authenticate(process.env.WALLET_PRIVATE_KEY)
  console.log('✅ Authenticated\n')

  // Delete specific workflow
  const workflowIdx = args.indexOf('--workflow')
  if (workflowIdx !== -1) {
    const id = parseInt(args[workflowIdx + 1])
    await client.workflows.delete({ id })
    console.log(`✅ Deleted workflow ${id}`)
    return
  }

  // Delete specific agent
  const agentIdx = args.indexOf('--agent')
  if (agentIdx !== -1) {
    const id = parseInt(args[agentIdx + 1])
    await client.agents.delete({ id })
    console.log(`✅ Deleted agent ${id}`)
    return
  }

  // Delete all
  if (args.includes('--all')) {
    console.log('Deleting all resources...\n')

    // Delete workflows first
    const workflows = await client.workflows.list()
    for (const w of workflows) {
      await client.workflows.delete({ id: w.id })
      console.log(`  Deleted workflow: ${w.name} (${w.id})`)
    }

    // Delete agents
    const agents = await client.agents.list()
    for (const a of agents) {
      await client.agents.delete({ id: a.id })
      console.log(`  Deleted agent: ${a.name} (${a.id})`)
    }

    // Clear local state
    clearProvisionedState()
    console.log('\n✅ Cleanup complete!')
    return
  }

  // List resources (default)
  console.log('Your resources:\n')

  const workflows = await client.workflows.list()
  console.log('Workflows:')
  if (workflows.length === 0) {
    console.log('  (none)')
  } else {
    for (const w of workflows) {
      console.log(`  - ${w.name} (ID: ${w.id}, Status: ${w.status})`)
    }
  }

  const agents = await client.agents.list()
  console.log('\nAgents:')
  if (agents.length === 0) {
    console.log('  (none)')
  } else {
    for (const a of agents) {
      console.log(`  - ${a.name} (ID: ${a.id})`)
    }
  }

  console.log('\nTo delete all: npx tsx cleanup.ts --all')
}

cleanup().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
