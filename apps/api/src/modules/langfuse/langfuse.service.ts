import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallbackHandler } from '@langfuse/langchain';

export interface LangfuseHandlerOptions {
  sessionId?: string;
  userId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

@Injectable()
export class LangfuseService {
  private readonly logger = new Logger(LangfuseService.name);
  private readonly publicKey: string | undefined;
  private readonly secretKey: string | undefined;
  private readonly baseUrl: string | undefined;

  constructor(@Inject(ConfigService) private configService: ConfigService) {
    this.publicKey = this.configService.get('LANGFUSE_PUBLIC_KEY');
    this.secretKey = this.configService.get('LANGFUSE_SECRET_KEY');
    this.baseUrl = this.configService.get('LANGFUSE_HOST');

    if (this.isConfigured()) {
      this.logger.log(`Langfuse tracing enabled (${this.baseUrl})`);
    } else {
      this.logger.warn(
        'Langfuse not configured. Set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY to enable tracing.',
      );
    }
  }

  createHandler(options?: LangfuseHandlerOptions): CallbackHandler | null {
    if (!this.isConfigured()) {
      return null;
    }

    return new CallbackHandler({
      publicKey: this.publicKey,
      secretKey: this.secretKey,
      baseUrl: this.baseUrl,
      sessionId: options?.sessionId,
      userId: options?.userId,
      tags: options?.tags,
      metadata: options?.metadata,
    } as ConstructorParameters<typeof CallbackHandler>[0]);
  }

  isConfigured(): boolean {
    return !!(this.publicKey && this.secretKey);
  }
}
