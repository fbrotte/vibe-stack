import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'

export interface ModelConfig {
  baseURL: string
  apiKey: string
  model?: string
  temperature?: number
}

export interface EmbeddingsConfig {
  baseURL: string
  apiKey: string
  model?: string
}

export const createChatModel = (config: ModelConfig): ChatOpenAI => {
  return new ChatOpenAI({
    model: config.model ?? 'gpt-4o-mini',
    temperature: config.temperature ?? 0.7,
    configuration: {
      baseURL: config.baseURL,
      apiKey: config.apiKey,
    },
  })
}

export const createEmbeddings = (config: EmbeddingsConfig): OpenAIEmbeddings => {
  return new OpenAIEmbeddings({
    model: config.model ?? 'text-embedding-3-small',
    configuration: {
      baseURL: config.baseURL,
      apiKey: config.apiKey,
    },
  })
}
