/**
 * Capability Example
 *
 * Demonstrates how to create capabilities — both runless and runnable with generate().
 */
import { Agent } from '@openserv-labs/sdk'
import { z } from 'zod'

const agent = new Agent({
  systemPrompt: 'You are a text analysis assistant.'
})

// Runless capability — platform handles the AI call, no run function needed
agent.addCapability({
  name: 'quickSummary',
  description: 'Provide a brief one-paragraph summary of the given text.'
})

// Runless capability with structured output
agent.addCapability({
  name: 'extractKeywords',
  description: 'Extract the top keywords from the given text.',
  outputSchema: z.object({
    keywords: z.array(z.string()).describe('Top keywords from the text'),
    language: z.string().describe('Detected language of the text')
  })
})

// Runnable capability using generate() — platform-delegated LLM call, no API key needed
agent.addCapability({
  name: 'analyzeText',
  description: 'Analyze text for sentiment and key themes',
  inputSchema: z.object({
    text: z.string().describe('The text to analyze'),
    depth: z.enum(['quick', 'detailed']).optional().describe('Analysis depth')
  }),
  async run({ args, action }) {
    const { text, depth = 'quick' } = args
    console.log(`Analyzing text (${depth} mode): "${text.slice(0, 50)}..."`)

    // Use generate() instead of direct OpenAI calls — no API key needed!
    const analysis = await this.generate({
      prompt: `Analyze the following text. Provide ${
        depth === 'detailed' ? 'comprehensive' : 'brief'
      } analysis of sentiment and key themes.\n\nText: ${text}`,
      action
    })

    return analysis
  }
})

export { agent }
