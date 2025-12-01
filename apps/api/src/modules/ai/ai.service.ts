import type { OnModuleInit } from '@nestjs/common'
import { Injectable, Logger, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { OpenAIEmbeddings } from '@langchain/openai'
import { ChatOpenAI } from '@langchain/openai'
import type { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import type { BaseMessage } from '@langchain/core/messages'
import { createChatModel, createEmbeddings, createCheckpointer } from './providers'
import { LangfuseService } from '../langfuse'

export interface ChatCompletionParams {
  model?: string
  messages: BaseMessage[]
  temperature?: number
  maxTokens?: number
  userId?: string
  sessionId?: string
  tags?: string[]
}

export interface EmbeddingParams {
  model?: string
  input: string | string[]
  userId?: string
}

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name)
  private model: ChatOpenAI | null = null
  private embeddings: OpenAIEmbeddings | null = null
  private checkpointer: PostgresSaver | null = null

  private readonly litellmBaseUrl: string | undefined
  private readonly litellmApiKey: string | undefined

  constructor(
    @Inject(ConfigService) private configService: ConfigService,
    @Inject(LangfuseService) private langfuseService: LangfuseService,
  ) {
    this.litellmBaseUrl = this.configService.get('LITELLM_BASE_URL')
    this.litellmApiKey = this.configService.get('LITELLM_MASTER_KEY')
  }

  async onModuleInit() {
    await this.initializeModel()
    await this.initializeCheckpointer()
  }

  private async initializeModel() {
    if (this.litellmBaseUrl && this.litellmApiKey) {
      this.model = createChatModel({
        baseURL: this.litellmBaseUrl,
        apiKey: this.litellmApiKey,
      })

      this.embeddings = createEmbeddings({
        baseURL: this.litellmBaseUrl,
        apiKey: this.litellmApiKey,
      })

      this.logger.log('LangChain model initialized (via LiteLLM)')
    } else {
      this.logger.warn(
        'LiteLLM not configured. Set LITELLM_BASE_URL and LITELLM_MASTER_KEY to enable AI features.',
      )
    }
  }

  private async initializeCheckpointer() {
    const databaseUrl = this.configService.get('DATABASE_URL')

    if (databaseUrl) {
      try {
        this.checkpointer = await createCheckpointer(databaseUrl)
        this.logger.log('PostgreSQL checkpointer initialized for LangGraph')
      } catch (error) {
        this.logger.warn(
          `Failed to initialize checkpointer: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    } else {
      this.logger.warn('DATABASE_URL not configured. LangGraph checkpointer disabled.')
    }
  }

  // === Direct LLM calls ===

  async chatCompletion(params: ChatCompletionParams) {
    if (!this.model) {
      throw new Error('AI model not configured')
    }

    const modelName = params.model ?? 'gpt-4o-mini'
    const temperature = params.temperature ?? 0.7

    // Create model with custom settings if needed
    const needsCustomModel =
      params.model || params.temperature !== undefined || params.maxTokens !== undefined
    const model = needsCustomModel
      ? new ChatOpenAI({
          model: modelName,
          temperature,
          maxTokens: params.maxTokens,
          configuration: {
            baseURL: this.litellmBaseUrl!,
            apiKey: this.litellmApiKey!,
          },
        })
      : this.model

    // Start Langfuse trace
    const tracing = this.langfuseService.startGeneration(
      {
        name: 'chat-completion',
        userId: params.userId,
        sessionId: params.sessionId,
        tags: params.tags,
      },
      {
        model: modelName,
        input: params.messages.map((m) => ({ role: m.getType(), content: m.content })),
        modelParameters: { temperature, maxTokens: params.maxTokens ?? null },
      },
    )

    if (!tracing) {
      this.logger.debug('Langfuse tracing disabled')
    }

    try {
      const startTime = Date.now()
      const response = await model.invoke(params.messages)
      const endTime = Date.now()

      // End Langfuse trace with response
      if (tracing) {
        this.langfuseService.endGeneration(tracing.generation, response.content, {
          promptTokens: response.usage_metadata?.input_tokens,
          completionTokens: response.usage_metadata?.output_tokens,
          totalTokens: response.usage_metadata?.total_tokens,
        })
        // Fire and forget flush
        this.langfuseService.flush().catch((err) => {
          this.logger.warn('Langfuse flush failed:', err)
        })
      }

      this.logger.log(`Chat completion completed in ${endTime - startTime}ms`)
      return response
    } catch (error) {
      this.logger.error('Chat completion error:', error)
      throw error
    }
  }

  async embedding(params: EmbeddingParams): Promise<number[][]> {
    if (!this.embeddings) {
      throw new Error('Embeddings model not configured')
    }

    const embeddings = params.model
      ? createEmbeddings({
          baseURL: this.litellmBaseUrl!,
          apiKey: this.litellmApiKey!,
          model: params.model,
        })
      : this.embeddings

    try {
      const inputs = Array.isArray(params.input) ? params.input : [params.input]
      const result = await embeddings.embedDocuments(inputs)
      return result
    } catch (error) {
      this.logger.error('Embedding error:', error)
      throw error
    }
  }

  // === LangGraph helpers ===

  getModel(options?: { model?: string; temperature?: number }): ChatOpenAI {
    if (!this.litellmBaseUrl || !this.litellmApiKey) {
      throw new Error('AI model not configured')
    }

    if (options?.model || options?.temperature !== undefined) {
      return createChatModel({
        baseURL: this.litellmBaseUrl,
        apiKey: this.litellmApiKey,
        model: options.model,
        temperature: options.temperature,
      })
    }

    if (!this.model) {
      throw new Error('AI model not configured')
    }

    return this.model
  }

  getCheckpointer(): PostgresSaver | null {
    return this.checkpointer
  }

  // === Status ===

  isConfigured(): boolean {
    return this.model !== null
  }

  isCheckpointerConfigured(): boolean {
    return this.checkpointer !== null
  }

  isLangfuseConfigured(): boolean {
    return this.langfuseService.isConfigured()
  }
}
