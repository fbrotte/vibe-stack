import { Injectable, Inject } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '../../trpc/trpc.service';
import { LlmService } from './llm.service';

@Injectable()
export class LlmTrpc {
  router: ReturnType<TrpcService['router']>;

  constructor(
    @Inject(TrpcService) private readonly trpc: TrpcService,
    @Inject(LlmService) private readonly llmService: LlmService,
  ) {
    this.router = this.trpc.router({
      test: this.trpc.protectedProcedure
        .input(
          z.object({
            message: z.string().min(1).default('Hello, who are you?'),
          }),
        )
        .mutation(async ({ input, ctx }) => {
          if (!this.llmService.isConfigured()) {
            return {
              success: false,
              error: 'LLM not configured. Set LITELLM_BASE_URL and LITELLM_MASTER_KEY.',
              response: null,
            };
          }

          try {
            const response = await this.llmService.chatCompletion({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: input.message }],
              maxTokens: 100,
              userId: ctx.user?.userId,
              userEmail: ctx.user?.email,
            });

            return {
              success: true,
              error: null,
              response: response.choices[0]?.message?.content ?? 'No response',
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              response: null,
            };
          }
        }),

      status: this.trpc.protectedProcedure.query(() => {
        return {
          configured: this.llmService.isConfigured(),
        };
      }),
    });
  }
}
