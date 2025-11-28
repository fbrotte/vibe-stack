import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private client: OpenAI | null = null;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    const baseURL = this.configService.get('LITELLM_BASE_URL');
    const apiKey = this.configService.get('LITELLM_MASTER_KEY');

    if (baseURL && apiKey) {
      this.client = new OpenAI({
        baseURL,
        apiKey,
      });
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
  }) {
    if (!this.client) {
      throw new Error('LiteLLM client not configured');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 1000,
      });

      return response;
    } catch (error) {
      this.logger.error('LLM API error:', error);
      throw error;
    }
  }

  async embedding(params: { model: string; input: string | string[] }) {
    if (!this.client) {
      throw new Error('LiteLLM client not configured');
    }

    try {
      const response = await this.client.embeddings.create({
        model: params.model,
        input: params.input,
      });

      return response;
    } catch (error) {
      this.logger.error('Embedding API error:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }
}
