/**
 * File Operations Example
 *
 * Demonstrates workspace file operations.
 */
import { Agent } from '@openserv-labs/sdk'
import { z } from 'zod'

const agent = new Agent({
  systemPrompt: 'You are a file management assistant.'
})

agent.addCapability({
  name: 'listFiles',
  description: 'List all files in the workspace',
  inputSchema: z.object({}),
  async run({ action }) {
    if (action?.type !== 'do-task') return 'No workspace context'

    const files = await this.getFiles({ workspaceId: action.workspace.id })

    return files.map(f => `- ${f.path} (${f.size} bytes)`).join('\n') || 'No files found'
  }
})

agent.addCapability({
  name: 'saveFile',
  description: 'Save content to a file',
  inputSchema: z.object({
    path: z.string().describe('File path'),
    content: z.string().describe('File content')
  }),
  async run({ args, action }) {
    if (action?.type !== 'do-task') return 'No workspace context'

    const result = await this.uploadFile({
      workspaceId: action.workspace.id,
      path: args.path,
      file: args.content,
      taskIds: action.task ? [action.task.id] : undefined
    })

    return `File saved: ${result.fullUrl}`
  }
})

agent.addCapability({
  name: 'removeFile',
  description: 'Delete a file from the workspace',
  inputSchema: z.object({
    fileId: z.number().describe('File ID to delete')
  }),
  async run({ args, action }) {
    if (action?.type !== 'do-task') return 'No workspace context'

    await this.deleteFile({
      workspaceId: action.workspace.id,
      fileId: args.fileId
    })

    return `File ${args.fileId} deleted`
  }
})

export { agent }
