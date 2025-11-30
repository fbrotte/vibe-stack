import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { Langfuse } from 'langfuse';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private client: OpenAI | null = null;
  private langfuse: Langfuse | null = null;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    const baseURL = this.configService.get('LITELLM_BASE_URL');
    const apiKey = this.configService.get('LITELLM_MASTER_KEY');

    // Langfuse explicit init
    const langfusePublicKey = this.configService.get('LANGFUSE_PUBLIC_KEY');
    const langfuseSecretKey = this.configService.get('LANGFUSE_SECRET_KEY');
    const langfuseBaseUrl = this.configService.get('LANGFUSE_BASE_URL');

    if (langfusePublicKey && langfuseSecretKey) {
      this.langfuse = new Langfuse({
        publicKey: langfusePublicKey,
        secretKey: langfuseSecretKey,
        baseUrl: langfuseBaseUrl,
      });
      this.logger.log(`✅ Langfuse tracing enabled (${langfuseBaseUrl})`);
    } else {
      this.logger.warn('⚠️  Langfuse not configured. Set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY to enable tracing.');
    }

    if (baseURL && apiKey) {
      this.client = new OpenAI({ baseURL, apiKey });
      this.logger.log('✅ LiteLLM client initialized');
    } else {
      this.logger.warn('⚠️  LiteLLM not configured. Set LITELLM_BASE_URL and LITELLM_MASTER_KEY to enable.');
    }
  }

  async chatCompletion(params: {
    model: string;
    messages: Array<ChatCompletionMessageParam>;
    temperature?: number;
    maxTokens?: number;
    userId?: string;
    userEmail?: string;
    userName?: string;
  }) {
    if (!this.client) {
      throw new Error('LiteLLM client not configured');
    }

    const trace = this.langfuse?.trace({
      name: 'chat-completion',
      userId: params.userId,
      metadata: {
        model: params.model,
        userEmail: params.userEmail,
        userName: params.userName,
      },
    });

    const generation = trace?.generation({
      name: 'llm-call',
      model: params.model,
      input: params.messages,
      modelParameters: {
        temperature: params.temperature ?? 0.7,
        maxTokens: params.maxTokens ?? 1000,
      },
    });

    try {
      const startTime = Date.now();
      const response = await this.client.chat.completions.create({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 1000,
      });
      const endTime = Date.now();

      generation?.end({
        output: response.choices[0]?.message,
        usage: {
          input: response.usage?.prompt_tokens,
          output: response.usage?.completion_tokens,
          total: response.usage?.total_tokens,
        },
      });

      // Flush to ensure trace is sent
      await this.langfuse?.flushAsync();

      this.logger.log(`LLM call completed in ${endTime - startTime}ms`);
      return response;
    } catch (error) {
      generation?.end({
        output: { error: error instanceof Error ? error.message : 'Unknown error' },
        level: 'ERROR',
      });
      await this.langfuse?.flushAsync();
      this.logger.error('LLM API error:', error);
      throw error;
    }
  }

  async embedding(params: { model: string; input: string | string[]; userId?: string }) {
    if (!this.client) {
      throw new Error('LiteLLM client not configured');
    }

    const trace = this.langfuse?.trace({
      name: 'embedding',
      userId: params.userId,
      metadata: { model: params.model },
    });

    const generation = trace?.generation({
      name: 'embedding-call',
      model: params.model,
      input: params.input,
    });

    try {
      const response = await this.client.embeddings.create({
        model: params.model,
        input: params.input,
      });

      generation?.end({
        output: { dimensions: response.data[0]?.embedding?.length },
        usage: {
          input: response.usage?.prompt_tokens,
          total: response.usage?.total_tokens,
        },
      });

      await this.langfuse?.flushAsync();
      return response;
    } catch (error) {
      generation?.end({
        output: { error: error instanceof Error ? error.message : 'Unknown error' },
        level: 'ERROR',
      });
      await this.langfuse?.flushAsync();
      this.logger.error('Embedding API error:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }
}
