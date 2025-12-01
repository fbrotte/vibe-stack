import { Injectable, Inject } from '@nestjs/common'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import { TrpcService } from '../../trpc/trpc.service'
import { AiService } from './ai.service'
import { ChatCompletionSchema, EmbeddingSchema } from '@template-dev/shared'

@Injectable()
export class AiTrpc {
  router: ReturnType<TrpcService['router']>

  constructor(
    @Inject(TrpcService) private readonly trpc: TrpcService,
    @Inject(AiService) private readonly aiService: AiService,
  ) {
    this.router = this.trpc.router({
      status: this.trpc.protectedProcedure.query(() => {
        return {
          configured: this.aiService.isConfigured(),
          checkpointerConfigured: this.aiService.isCheckpointerConfigured(),
          langfuseConfigured: this.aiService.isLangfuseConfigured(),
        }
      }),

      chat: this.trpc.protectedProcedure
        .input(ChatCompletionSchema)
        .mutation(async ({ input, ctx }) => {
          if (!this.aiService.isConfigured()) {
            return {
              success: false,
              error: 'AI not configured. Set LITELLM_BASE_URL and LITELLM_MASTER_KEY.',
              response: null,
            }
          }

          try {
            const messages = input.messages.map((msg) => {
              switch (msg.role) {
                case 'system':
                  return new SystemMessage(msg.content)
                case 'assistant':
                  return new AIMessage(msg.content)
                case 'user':
                default:
                  return new HumanMessage(msg.content)
              }
            })

            const response = await this.aiService.chatCompletion({
              model: input.model,
              messages,
              temperature: input.temperature,
              maxTokens: input.maxTokens,
              userId: ctx.user?.userId,
              sessionId: input.sessionId,
              tags: input.tags,
            })

            return {
              success: true,
              error: null,
              response: response.content as string,
            }
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              response: null,
            }
          }
        }),

      embedding: this.trpc.protectedProcedure
        .input(EmbeddingSchema)
        .mutation(async ({ input, ctx }) => {
          if (!this.aiService.isConfigured()) {
            return {
              success: false,
              error: 'AI not configured. Set LITELLM_BASE_URL and LITELLM_MASTER_KEY.',
              embeddings: null,
            }
          }

          try {
            const embeddings = await this.aiService.embedding({
              model: input.model,
              input: input.input,
              userId: ctx.user?.userId,
            })

            return {
              success: true,
              error: null,
              embeddings,
            }
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              embeddings: null,
            }
          }
        }),
    })
  }
}
