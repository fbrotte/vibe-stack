import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
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
      update: (args: { where: Record<string, unknown>; data: { deletedAt: Date } }) => Promise<unknown>;
    };

    if (!modelDelegate?.update) {
      throw new Error(`Model ${model} not found or doesn't support update`);
    }

    return modelDelegate.update({
      where,
      data: { deletedAt: new Date() },
    });
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
      update: (args: { where: Record<string, unknown>; data: { deletedAt: null } }) => Promise<unknown>;
    };

    if (!modelDelegate?.update) {
      throw new Error(`Model ${model} not found or doesn't support update`);
    }

    return modelDelegate.update({
      where,
      data: { deletedAt: null },
    });
  }

  /**
   * Helper to convert PascalCase to camelCase for model names
   */
  private toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * Create a transaction with automatic rollback on error
   */
  async executeTransaction<T>(
    fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(fn);
  }
}
