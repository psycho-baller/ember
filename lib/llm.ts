import { OpenAI } from 'openai'
import { openai } from "@ai-sdk/openai"
import { generateText, LanguageModel, ModelMessage } from "ai"
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

export async function callLlm(messages: ModelMessage[] = [], system: string = DEFAULT_SYSTEM_PROMPT, model: LanguageModel = openai('gpt-4o-mini')): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  const { text } = await generateText({
    model,
    system,
    messages,
  })
  return text
}
