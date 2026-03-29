import { Injectable, Inject } from '@nestjs/common'
import { TrpcService } from '../../trpc/trpc.service'
import { UserPreferencesService } from './user-preferences.service'
import {
  GetUserPreferenceSchema,
  SetUserPreferenceSchema,
  DeleteUserPreferenceSchema,
  BulkSetUserPreferencesSchema,
} from '@template-dev/shared'

@Injectable()
export class UserPreferencesTrpc {
  router: ReturnType<TrpcService['router']>

  constructor(
    @Inject(TrpcService) private readonly trpc: TrpcService,
    @Inject(UserPreferencesService) private readonly preferencesService: UserPreferencesService,
  ) {
    this.router = this.trpc.router({
      get: this.trpc.protectedProcedure
        .input(GetUserPreferenceSchema)
        .query(async ({ ctx, input }) => {
          return this.preferencesService.get(ctx.user.id, input.key)
        }),

      getAll: this.trpc.protectedProcedure.query(async ({ ctx }) => {
        return this.preferencesService.getAll(ctx.user.id)
      }),

      set: this.trpc.protectedProcedure
        .input(SetUserPreferenceSchema)
        .mutation(async ({ ctx, input }) => {
          await this.preferencesService.set(ctx.user.id, input.key, input.value)
          return { success: true }
        }),

      bulkSet: this.trpc.protectedProcedure
        .input(BulkSetUserPreferencesSchema)
        .mutation(async ({ ctx, input }) => {
          await this.preferencesService.bulkSet(ctx.user.id, input.preferences)
          return { success: true }
        }),

      delete: this.trpc.protectedProcedure
        .input(DeleteUserPreferenceSchema)
        .mutation(async ({ ctx, input }) => {
          await this.preferencesService.delete(ctx.user.id, input.key)
          return { success: true }
        }),
    })
  }
}
