/**
 * Error Handling Example
 *
 * Demonstrates proper error handling in capabilities.
 */
import { Agent } from '@openserv-labs/sdk'
import { z } from 'zod'

const agent = new Agent({
  systemPrompt: 'You are an assistant with robust error handling.',
  onError: (error, context) => {
    // Custom error handler for the agent
    console.error('Agent error:', error.message, context)
  }
})

agent.addCapability({
  name: 'riskyOperation',
  description: 'An operation that might fail',
  inputSchema: z.object({
    shouldFail: z.boolean().optional().describe('Force failure for testing')
  }),
  async run({ args, action }) {
    try {
      // Log start
      if (action?.type === 'do-task' && action.task) {
        await this.addLogToTask({
          workspaceId: action.workspace.id,
          taskId: action.task.id,
          severity: 'info',
          type: 'text',
          body: 'Starting risky operation...'
        })
      }

      // Simulate potential failure
      if (args.shouldFail) {
        throw new Error('Intentional failure for testing')
      }

      // Success
      return 'Operation completed successfully!'
    } catch (error: any) {
      // Log error
      if (action?.type === 'do-task' && action.task) {
        await this.addLogToTask({
          workspaceId: action.workspace.id,
          taskId: action.task.id,
          severity: 'error',
          type: 'text',
          body: `Error: ${error.message}`
        })

        // Mark task as errored
        await this.markTaskAsErrored({
          workspaceId: action.workspace.id,
          taskId: action.task.id,
          error: error.message
        })
      }

      throw error
    }
  }
})

export { agent }
