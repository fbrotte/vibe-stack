import type { OnModuleInit } from '@nestjs/common'
import { Injectable, Inject, Logger } from '@nestjs/common'
import { Subject } from 'rxjs'
import type { Observable } from 'rxjs'
import { PrismaService } from '../prisma/prisma.service'
import type { SseEvent } from '@template-dev/shared'

interface MessageEvent {
  data: string
}

// NOTE: Events are broadcast to ALL connected users (single Subject).
// For per-user filtering, replace with a Map<userId, Subject> if needed.
@Injectable()
export class SseService implements OnModuleInit {
  private readonly logger = new Logger(SseService.name)
  private readonly subject = new Subject<MessageEvent>()

  readonly events$: Observable<MessageEvent> = this.subject.asObservable()

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    this.prisma.onMutation(({ model, action, id }) => {
      this.emit({
        type: 'entity_changed',
        entity: model,
        action: action as 'create' | 'update' | 'delete',
        id,
      })
    })
    this.logger.log('SSE mutation listener registered')
  }

  emit(event: SseEvent): void {
    this.subject.next({ data: JSON.stringify(event) })
  }
}
