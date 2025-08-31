import { OpenAI } from 'openai'
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { DEFAULT_SYSTEM_PROMPT } from './prompts'
export async function callBasicLlm(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  const client = new OpenAI({ apiKey })
  const r = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  })
  return r.choices[0].message.content || ''
}

export async function callLlm(prompt: string, system: string = DEFAULT_SYSTEM_PROMPT): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return await callBasicLlm(prompt)
  }
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system,
    messages: [{ role: 'user', content: prompt }],
  })
  return text
}
