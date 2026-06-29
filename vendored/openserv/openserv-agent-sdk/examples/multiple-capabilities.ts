/**
 * Multiple Capabilities Example
 *
 * Demonstrates adding multiple capabilities — both runless and runnable with generate().
 * No LLM API key needed for any of these.
 */
import { Agent } from '@openserv-labs/sdk'
import { z } from 'zod'

const agent = new Agent({
  systemPrompt: 'You are a versatile text processing assistant.'
})

// Add multiple capabilities at once
agent.addCapabilities([
  // Runless capability — platform handles the AI call
  {
    name: 'summarize',
    description: 'Summarize the given text content in 100 words or less.'
  },
  // Runless capability with structured output
  {
    name: 'extractKeywords',
    description: 'Extract the top keywords from the given text.',
    outputSchema: z.object({
      keywords: z.array(z.string()).describe('Extracted keywords'),
      count: z.number().describe('Number of keywords extracted')
    })
  },
  // Runnable capability using generate() for custom logic
  {
    name: 'translate',
    description: 'Translate text to another language',
    inputSchema: z.object({
      text: z.string().describe('Text to translate'),
      targetLanguage: z.string().describe('Target language')
    }),
    async run({ args, action }) {
      // Use generate() for platform-delegated LLM call (no API key needed)
      const translation = await this.generate({
        prompt: `Translate the following text to ${args.targetLanguage}. Output only the translation, nothing else.\n\nText: ${args.text}`,
        action
      })
      return translation
    }
  }
])

export { agent }
