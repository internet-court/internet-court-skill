/**
 * Task Management Example
 *
 * Demonstrates task-related agent methods.
 */
import { Agent } from '@openserv-labs/sdk'
import { z } from 'zod'

const agent = new Agent({
  systemPrompt: 'You are a task management assistant.'
})

agent.addCapability({
  name: 'processWithTasks',
  description: 'Process data while managing task status',
  inputSchema: z.object({
    data: z.string().describe('Data to process')
  }),
  async run({ args, action }) {
    if (action?.type !== 'do-task' || !action.task) {
      return 'No task context available'
    }

    const { workspace, task, me } = action

    try {
      // Update status to in-progress
      await this.updateTaskStatus({
        workspaceId: workspace.id,
        taskId: task.id,
        status: 'in-progress'
      })

      // Log progress
      await this.addLogToTask({
        workspaceId: workspace.id,
        taskId: task.id,
        severity: 'info',
        type: 'text',
        body: 'Starting data processing...'
      })

      // Simulate processing
      const result = `Processed: ${args.data}`

      // Log completion
      await this.addLogToTask({
        workspaceId: workspace.id,
        taskId: task.id,
        severity: 'info',
        type: 'text',
        body: 'Processing complete!'
      })

      return result
    } catch (error: any) {
      // Mark task as errored
      await this.markTaskAsErrored({
        workspaceId: workspace.id,
        taskId: task.id,
        error: error.message || 'Unknown error'
      })

      throw error
    }
  }
})

// Creating subtasks example
agent.addCapability({
  name: 'delegateWork',
  description: 'Create subtasks for other agents',
  inputSchema: z.object({
    description: z.string().describe('Task description')
  }),
  async run({ args, action }) {
    if (action?.type !== 'do-task' || !action.task) {
      return 'No task context available'
    }

    const { workspace, me } = action

    // Get available agents
    const agents = await this.getAgents({ workspaceId: workspace.id })

    // Create a subtask
    const newTask = await this.createTask({
      workspaceId: workspace.id,
      assignee: agents[0]?.id || me.id,
      description: args.description,
      body: 'Detailed instructions here',
      input: '',
      expectedOutput: 'Expected result',
      dependencies: []
    })

    return `Created task ${newTask.id}`
  }
})

export { agent }
