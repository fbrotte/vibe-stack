import { Controller, Sse, UseGuards, Inject, Req } from '@nestjs/common'
import type { Request } from 'express'
import type { Observable } from 'rxjs'
import { merge, interval, map } from 'rxjs'
import { SseService } from './sse.service'
import { SseAuthGuard } from './sse-auth.guard'

interface MessageEvent {
  data: string
}

@Controller('sse')
@UseGuards(SseAuthGuard)
export class SseController {
  constructor(@Inject(SseService) private readonly sseService: SseService) {}

  @Sse('events')
  events(@Req() _req: Request): Observable<MessageEvent> {
    const heartbeat$ = interval(30000).pipe(
      map(() => ({ data: JSON.stringify({ type: 'heartbeat' }) })),
    )

    return merge(this.sseService.events$, heartbeat$)
  }
}
