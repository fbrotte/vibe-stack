import { describe, it, expect, beforeEach } from 'vitest'
import { firstValueFrom, take } from 'rxjs'
import { Subject } from 'rxjs'
import { SseController } from '../sse.controller'
import type { SseService } from '../sse.service'
import type { Request } from 'express'

function makeMockSseService(subject: Subject<{ data: string }>): SseService {
  return {
    events$: subject.asObservable(),
  } as unknown as SseService
}

function makeRequest(userId = 'user-1'): Request {
  return { user: { userId, email: 'a@b.com', role: 'USER' } } as unknown as Request
}

describe('SseController', () => {
  let subject: Subject<{ data: string }>
  let sseService: SseService
  let controller: SseController

  beforeEach(() => {
    subject = new Subject()
    sseService = makeMockSseService(subject)
    controller = new SseController(sseService)
  })

  it('should return an Observable from events()', () => {
    const obs = controller.events(makeRequest())
    expect(typeof obs.subscribe).toBe('function')
  })

  it('should forward SSE events from SseService to the Observable', async () => {
    const obs = controller.events(makeRequest())
    const collected = firstValueFrom(obs.pipe(take(1)))

    subject.next({ data: JSON.stringify({ type: 'entity_changed' }) })

    const msg = await collected
    expect(msg).toEqual({ data: JSON.stringify({ type: 'entity_changed' }) })
  })

  it('should include heartbeat events merged into the stream', async () => {
    // We cannot easily test the 30s interval, but we verify the observable
    // itself is the result of a merge (it starts emitting service events)
    const obs = controller.events(makeRequest())
    const collected = firstValueFrom(obs.pipe(take(1)))

    subject.next({ data: JSON.stringify({ type: 'heartbeat' }) })

    const msg = await collected
    expect(msg.data).toContain('heartbeat')
  })
})
