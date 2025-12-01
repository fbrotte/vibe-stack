import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { CallbackHandler } from '@langfuse/langchain';
import type { BaseMessage } from '@langchain/core/messages';
import { createChatModel, createEmbeddings, createCheckpointer } from './providers';

export interface ChatCompletionParams {
  model?: string;
  messages: BaseMessage[];
  temperature?: number;
  maxTokens?: number;
  userId?: string;
  sessionId?: string;
  tags?: string[];
}

export interface EmbeddingParams {
  model?: string;
  input: string | string[];
  userId?: string;
}

export interface LangfuseHandlerOptions {
  sessionId?: string;
  userId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private model: ChatOpenAI | null = null;
  private embeddings: OpenAIEmbeddings | null = null;
  private checkpointer: PostgresSaver | null = null;

  private langfusePublicKey: string | undefined;
  private langfuseSecretKey: string | undefined;
  private langfuseBaseUrl: string | undefined;

  private litellmBaseUrl: string | undefined;
  private litellmApiKey: string | undefined;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    this.litellmBaseUrl = this.configService.get('LITELLM_BASE_URL');
    this.litellmApiKey = this.configService.get('LITELLM_MASTER_KEY');

    this.langfusePublicKey = this.configService.get('LANGFUSE_PUBLIC_KEY');
    this.langfuseSecretKey = this.configService.get('LANGFUSE_SECRET_KEY');
    this.langfuseBaseUrl = this.configService.get('LANGFUSE_BASE_URL');
  }

  async onModuleInit() {
    await this.initializeModel();
    await this.initializeCheckpointer();
  }

  private async initializeModel() {
    if (this.litellmBaseUrl && this.litellmApiKey) {
      this.model = createChatModel({
        baseURL: this.litellmBaseUrl,
        apiKey: this.litellmApiKey,
      });

      this.embeddings = createEmbeddings({
        baseURL: this.litellmBaseUrl,
        apiKey: this.litellmApiKey,
      });

      this.logger.log('LangChain model initialized (via LiteLLM)');
    } else {
      this.logger.warn(
        'LiteLLM not configured. Set LITELLM_BASE_URL and LITELLM_MASTER_KEY to enable AI features.',
      );
    }
  }

  private async initializeCheckpointer() {
    const databaseUrl = this.configService.get('DATABASE_URL');

    if (databaseUrl) {
      try {
        this.checkpointer = await createCheckpointer(databaseUrl);
        this.logger.log('PostgreSQL checkpointer initialized for LangGraph');
      } catch (error) {
        this.logger.warn(
          `Failed to initialize checkpointer: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    } else {
      this.logger.warn(
        'DATABASE_URL not configured. LangGraph checkpointer disabled.',
      );
    }
  }

  // === Direct LLM calls ===

  async chatCompletion(params: ChatCompletionParams) {
    if (!this.model) {
      throw new Error('AI model not configured');
    }

    // Create model with custom settings if needed
    const needsCustomModel = params.model || params.temperature !== undefined || params.maxTokens !== undefined;
    const model = needsCustomModel
      ? new ChatOpenAI({
          model: params.model ?? 'gpt-4o-mini',
          temperature: params.temperature ?? 0.7,
          maxTokens: params.maxTokens,
          configuration: {
            baseURL: this.litellmBaseUrl!,
            apiKey: this.litellmApiKey!,
          },
        })
      : this.model;

    const handler = this.createLangfuseHandler({
      userId: params.userId,
      sessionId: params.sessionId,
      tags: params.tags,
    });

    const callbacks = handler ? [handler] : [];

    try {
      const startTime = Date.now();
      const response = await model.invoke(params.messages, { callbacks });
      const endTime = Date.now();

      this.logger.log(`Chat completion completed in ${endTime - startTime}ms`);
      return response;
    } catch (error) {
      this.logger.error('Chat completion error:', error);
      throw error;
    }
  }

  async embedding(params: EmbeddingParams): Promise<number[][]> {
    if (!this.embeddings) {
      throw new Error('Embeddings model not configured');
    }

    const embeddings = params.model
      ? createEmbeddings({
          baseURL: this.litellmBaseUrl!,
          apiKey: this.litellmApiKey!,
          model: params.model,
        })
      : this.embeddings;

    try {
      const inputs = Array.isArray(params.input) ? params.input : [params.input];
      const result = await embeddings.embedDocuments(inputs);
      return result;
    } catch (error) {
      this.logger.error('Embedding error:', error);
      throw error;
    }
  }

  // === LangGraph helpers ===

  getModel(options?: { model?: string; temperature?: number }): ChatOpenAI {
    if (!this.litellmBaseUrl || !this.litellmApiKey) {
      throw new Error('AI model not configured');
    }

    if (options?.model || options?.temperature !== undefined) {
      return createChatModel({
        baseURL: this.litellmBaseUrl,
        apiKey: this.litellmApiKey,
        model: options.model,
        temperature: options.temperature,
      });
    }

    if (!this.model) {
      throw new Error('AI model not configured');
    }

    return this.model;
  }

  getCheckpointer(): PostgresSaver | null {
    return this.checkpointer;
  }

  createLangfuseHandler(options?: LangfuseHandlerOptions): CallbackHandler | null {
    if (!this.langfusePublicKey || !this.langfuseSecretKey) {
      return null;
    }

    return new CallbackHandler({
      publicKey: this.langfusePublicKey,
      secretKey: this.langfuseSecretKey,
      baseUrl: this.langfuseBaseUrl,
      sessionId: options?.sessionId,
      userId: options?.userId,
      tags: options?.tags,
      metadata: options?.metadata,
    } as ConstructorParameters<typeof CallbackHandler>[0]);
  }

  // === Status ===

  isConfigured(): boolean {
    return this.model !== null;
  }

  isCheckpointerConfigured(): boolean {
    return this.checkpointer !== null;
  }

  isLangfuseConfigured(): boolean {
    return !!(this.langfusePublicKey && this.langfuseSecretKey);
  }
}
