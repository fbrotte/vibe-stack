import type { LoggerService as NestLoggerService } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import type { Logger } from 'pino'
import pino from 'pino'

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: Logger

  constructor() {
    this.logger = pino({
      transport:
        process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
      level: process.env.LOG_LEVEL || 'info',
    })
  }

  log(message: string, context?: string): void {
    this.logger.info({ context }, message)
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error({ context, trace }, message)
  }

  warn(message: string, context?: string): void {
    this.logger.warn({ context }, message)
  }

  debug(message: string, context?: string): void {
    this.logger.debug({ context }, message)
  }

  verbose(message: string, context?: string): void {
    this.logger.trace({ context }, message)
  }

  // Extended methods for structured logging
  info(message: string, data?: Record<string, unknown>, context?: string): void {
    this.logger.info({ context, ...data }, message)
  }

  logWithData(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    data: Record<string, unknown>,
  ): void {
    this.logger[level](data, message)
  }

  // Create child logger with bound context
  child(bindings: Record<string, unknown>): Logger {
    return this.logger.child(bindings)
  }

  // Get raw pino instance for advanced usage
  getPinoInstance(): Logger {
    return this.logger
  }
}
