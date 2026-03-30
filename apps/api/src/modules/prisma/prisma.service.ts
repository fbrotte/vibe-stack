import type { OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { Injectable, Logger } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { PrismaClient } from '@prisma/client'

type MutationInfo = { model: string; action: string; id: string }
type MutationListener = (info: MutationInfo) => void

const MUTATION_ACTIONS = [
  'create',
  'update',
  'delete',
  'upsert',
  'createMany',
  'updateMany',
  'deleteMany',
] as const
const BATCH_ACTIONS = ['createMany', 'updateMany', 'deleteMany'] as const

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)
  private mutationListeners: MutationListener[] = []

  async onModuleInit() {
    await this.$connect()
    this.logger.log('Database connected')
    this.registerMutationHook()
  }

  /**
   * Register a listener that will be called after any create/update/delete/upsert mutation.
   */
  onMutation(callback: MutationListener): void {
    this.mutationListeners.push(callback)
  }

  /**
   * Notify all registered listeners. Wrapped in try/catch so a broken listener
   * never blocks the Prisma operation that triggered it.
   */
  private notifyMutationListeners(info: MutationInfo): void {
    for (const listener of this.mutationListeners) {
      try {
        listener(info)
      } catch (err) {
        this.logger.error('SSE mutation listener threw an error', err)
      }
    }
  }

  /**
   * Install a Prisma query extension that intercepts mutations and fans out to
   * all registered listeners. Uses $extends (Prisma 6+) instead of deprecated $use.
   *
   * The extended client is assigned back to `this` via Object.assign so the
   * existing service reference keeps working throughout the application.
   */
  private registerMutationHook(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this
    const extended = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const result = await query(args)
            if (
              MUTATION_ACTIONS.includes(operation as (typeof MUTATION_ACTIONS)[number]) &&
              model
            ) {
              const isBatch = (BATCH_ACTIONS as readonly string[]).includes(operation)
              const action = operation === 'upsert' ? 'update' : operation.replace('Many', '')
              const id = isBatch ? '' : ((result as Record<string, unknown>)?.id?.toString() ?? '')
              self.notifyMutationListeners({ model, action, id })
            }
            return result
          },
        },
      },
    })
    Object.assign(this, extended)
  }

  async onModuleDestroy() {
    await this.$disconnect()
    this.logger.log('Database disconnected')
  }

  /**
   * Soft delete a record by setting deletedAt timestamp
   * Usage: await prisma.softDelete('user', { id: 'user-123' });
   */
  async softDelete<T extends Prisma.ModelName>(
    model: T,
    where: Record<string, unknown>,
  ): Promise<unknown> {
    const modelDelegate = (this as Record<string, unknown>)[this.toCamelCase(model)] as {
      update: (args: {
        where: Record<string, unknown>
        data: { deletedAt: Date }
      }) => Promise<unknown>
    }

    if (!modelDelegate?.update) {
      throw new Error(`Model ${model} not found or doesn't support update`)
    }

    return modelDelegate.update({
      where,
      data: { deletedAt: new Date() },
    })
  }

  /**
   * Restore a soft-deleted record by setting deletedAt to null
   * Usage: await prisma.restore('user', { id: 'user-123' });
   */
  async restore<T extends Prisma.ModelName>(
    model: T,
    where: Record<string, unknown>,
  ): Promise<unknown> {
    const modelDelegate = (this as Record<string, unknown>)[this.toCamelCase(model)] as {
      update: (args: {
        where: Record<string, unknown>
        data: { deletedAt: null }
      }) => Promise<unknown>
    }

    if (!modelDelegate?.update) {
      throw new Error(`Model ${model} not found or doesn't support update`)
    }

    return modelDelegate.update({
      where,
      data: { deletedAt: null },
    })
  }

  /**
   * Helper to convert PascalCase to camelCase for model names
   */
  private toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1)
  }

  /**
   * Create a transaction with automatic rollback on error
   */
  async executeTransaction<T>(
    fn: (
      tx: Omit<
        PrismaClient,
        '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
      >,
    ) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(fn)
  }
}
