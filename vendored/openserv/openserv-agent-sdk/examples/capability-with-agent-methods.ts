/**
 * Capability with Agent Methods Example
 *
 * Demonstrates using agent methods (this.generate, this.addLogToTask, this.uploadFile, etc.)
 * inside capabilities. Uses generate() for platform-delegated LLM calls — no API key needed.
 */
import { Agent } from '@openserv-labs/sdk'
import { z } from 'zod'

const agent = new Agent({
  systemPrompt: 'You are a report generation assistant.'
})

agent.addCapability({
  name: 'generateReport',
  description: 'Generate a report and save it to the workspace',
  inputSchema: z.object({
    topic: z.string().describe('Report topic'),
    format: z.enum(['brief', 'detailed']).optional()
  }),
  async run({ args, action }) {
    const { topic, format = 'brief' } = args

    // Only log/upload if we're in a task context
    if (action?.type === 'do-task' && action.task) {
      const { workspace, task } = action

      // Log progress
      await this.addLogToTask({
        workspaceId: workspace.id,
        taskId: task.id,
        severity: 'info',
        type: 'text',
        body: `Starting ${format} report on "${topic}"...`
      })

      // Generate report using platform-delegated LLM call (no API key needed)
      const report = await this.generate({
        prompt: `Generate a ${format} report on the following topic: ${topic}`,
        action
      })

      // Upload as file
      await this.uploadFile({
        workspaceId: workspace.id,
        path: `reports/${topic.replace(/\s+/g, '-').toLowerCase()}.txt`,
        file: report,
        taskIds: [task.id]
      })

      // Log completion
      await this.addLogToTask({
        workspaceId: workspace.id,
        taskId: task.id,
        severity: 'info',
        type: 'text',
        body: 'Report generated and saved!'
      })

      return report
    }

    // Fallback if no task context
    return await this.generate({
      prompt: `Generate a ${format} report on the following topic: ${topic}`,
      action
    })
  }
})

export { agent }
