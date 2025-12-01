import { Injectable, Logger, Inject, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Langfuse } from 'langfuse';

export interface LangfuseTraceOptions {
  name: string;
  sessionId?: string;
  userId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface LangfuseGenerationOptions {
  name?: string;
  model: string;
  input: unknown;
  modelParameters?: Record<string, string | number | boolean | string[] | null>;
}

@Injectable()
export class LangfuseService implements OnModuleDestroy {
  private readonly logger = new Logger(LangfuseService.name);
  private langfuse: Langfuse | null = null;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    const publicKey = this.configService.get('LANGFUSE_PUBLIC_KEY');
    const secretKey = this.configService.get('LANGFUSE_SECRET_KEY');
    const baseUrl = this.configService.get('LANGFUSE_HOST') || this.configService.get('LANGFUSE_BASE_URL');

    if (publicKey && secretKey) {
      this.langfuse = new Langfuse({
        publicKey,
        secretKey,
        baseUrl,
      });
      this.logger.log(`Langfuse tracing enabled (${baseUrl || 'cloud.langfuse.com'})`);
    } else {
      this.logger.warn(
        'Langfuse not configured. Set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY to enable tracing.',
      );
    }
  }

  async onModuleDestroy() {
    if (this.langfuse) {
      await this.langfuse.flushAsync();
      await this.langfuse.shutdownAsync();
    }
  }

  /**
   * Create a trace for tracking an operation
   */
  createTrace(options: LangfuseTraceOptions) {
    if (!this.langfuse) {
      this.logger.debug('Langfuse not configured - skipping trace creation');
      return null;
    }

    return this.langfuse.trace({
      name: options.name,
      sessionId: options.sessionId,
      userId: options.userId,
      tags: options.tags,
      metadata: options.metadata,
    });
  }

  /**
   * Helper to trace an LLM generation and return trace/generation for manual end
   */
  startGeneration(
    traceOptions: LangfuseTraceOptions,
    generationOptions: LangfuseGenerationOptions,
  ) {
    const trace = this.createTrace(traceOptions);
    if (!trace) return null;

    const generation = trace.generation({
      name: generationOptions.name || 'llm-call',
      model: generationOptions.model,
      input: generationOptions.input,
      modelParameters: generationOptions.modelParameters,
    });

    return { trace, generation };
  }

  /**
   * End a generation with output and usage
   */
  endGeneration(
    generation: ReturnType<ReturnType<Langfuse['trace']>['generation']>,
    output: unknown,
    usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number },
  ) {
    generation.end({
      output,
      usage,
    });
  }

  /**
   * Flush pending events - call this after completing operations
   */
  async flush() {
    if (this.langfuse) {
      await this.langfuse.flushAsync();
    }
  }

  /**
   * Get the raw Langfuse client for advanced usage
   */
  getClient(): Langfuse | null {
    return this.langfuse;
  }

  isConfigured(): boolean {
    return this.langfuse !== null;
  }
}
