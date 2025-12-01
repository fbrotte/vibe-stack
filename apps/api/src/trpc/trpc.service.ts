import { Injectable } from '@nestjs/common'
import { initTRPC, TRPCError } from '@trpc/server'
import { ZodError } from 'zod'
import type { Context } from './trpc.context'

@Injectable()
export class TrpcService {
  trpc = initTRPC.context<Context>().create({
    errorFormatter: ({ shape, error }) => {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
          // Include a user-friendly message for common errors
          message: this.getErrorMessage(error),
        },
      }
    },
  })

  procedure = this.trpc.procedure
  router = this.trpc.router
  mergeRouters = this.trpc.mergeRouters

  /**
   * Procedure that requires authentication.
   * Use for endpoints that any logged-in user can access.
   */
  protectedProcedure = this.trpc.procedure.use(async (opts) => {
    const { ctx } = opts

    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      })
    }

    return opts.next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    })
  })

  /**
   * Procedure that requires ADMIN role.
   * Use for admin-only endpoints.
   *
   * @example
   * adminDashboard: this.trpc.adminProcedure.query(() => {
   *   return { stats: ... };
   * })
   */
  adminProcedure = this.protectedProcedure.use(async (opts) => {
    if (opts.ctx.user.role !== 'ADMIN') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin access required',
      })
    }
    return opts.next(opts)
  })

  private getErrorMessage(error: TRPCError): string {
    // Handle Zod validation errors
    if (error.cause instanceof ZodError) {
      const issues = error.cause.issues
      if (issues.length > 0) {
        const firstIssue = issues[0]
        const path = firstIssue.path.join('.')
        return path ? `${path}: ${firstIssue.message}` : firstIssue.message
      }
      return 'Validation error'
    }

    // Return the error message or a default based on code
    if (error.message) {
      return error.message
    }

    switch (error.code) {
      case 'UNAUTHORIZED':
        return 'You must be logged in to access this resource'
      case 'FORBIDDEN':
        return 'You do not have permission to access this resource'
      case 'NOT_FOUND':
        return 'The requested resource was not found'
      case 'BAD_REQUEST':
        return 'Invalid request'
      case 'INTERNAL_SERVER_ERROR':
        return 'An unexpected error occurred'
      default:
        return 'An error occurred'
    }
  }
}
