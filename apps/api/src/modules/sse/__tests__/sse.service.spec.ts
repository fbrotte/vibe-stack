import { describe, it, expect, vi, beforeEach } from 'vitest'
import { firstValueFrom, take, toArray } from 'rxjs'
import { SseService } from '../sse.service'
import type { PrismaService } from '../../prisma/prisma.service'

function makeMockPrisma(): PrismaService {
  return {
    onMutation: vi.fn(),
  } as unknown as PrismaService
}

describe('SseService', () => {
  let prisma: PrismaService
  let service: SseService

  beforeEach(() => {
    prisma = makeMockPrisma()
    service = new SseService(prisma)
  })

  it('should register a mutation listener on PrismaService during onModuleInit()', () => {
    service.onModuleInit()
    expect(prisma.onMutation).toHaveBeenCalledOnce()
    expect(prisma.onMutation).toHaveBeenCalledWith(expect.any(Function))
  })

  it('should expose an events$ Observable', () => {
    expect(service.events$).toBeDefined()
    // Observable has a subscribe method
    expect(typeof service.events$.subscribe).toBe('function')
  })

  it('should emit an entity_changed MessageEvent when emit() is called', async () => {
    const collected = firstValueFrom(service.events$.pipe(take(1)))

    service.emit({
      type: 'entity_changed',
      entity: 'User',
      action: 'create',
      id: '42',
    })

    const msg = await collected
    expect(msg).toEqual({
      data: JSON.stringify({ type: 'entity_changed', entity: 'User', action: 'create', id: '42' }),
    })
  })

  it('should fan out events to multiple subscribers', async () => {
    const sub1 = firstValueFrom(service.events$.pipe(take(1)))
    const sub2 = firstValueFrom(service.events$.pipe(take(1)))

    service.emit({ type: 'entity_changed', entity: 'Post', action: 'delete', id: '7' })

    const [msg1, msg2] = await Promise.all([sub1, sub2])
    expect(msg1).toEqual(msg2)
  })

  it('should emit events from Prisma mutation listener when onModuleInit runs', async () => {
    // Capture the listener registered with prisma.onMutation
    let capturedListener:
      | ((info: { model: string; action: string; id: string }) => void)
      | undefined
    vi.mocked(prisma.onMutation).mockImplementation((fn) => {
      capturedListener = fn
    })

    service.onModuleInit()

    const collected = firstValueFrom(service.events$.pipe(take(1)))

    // Simulate a Prisma mutation notification
    capturedListener!({ model: 'User', action: 'create', id: 'abc' })

    const msg = await collected
    expect(msg).toEqual({
      data: JSON.stringify({ type: 'entity_changed', entity: 'User', action: 'create', id: 'abc' }),
    })
  })

  it('should emit a heartbeat event correctly', async () => {
    const collected = firstValueFrom(service.events$.pipe(take(1)))

    service.emit({ type: 'heartbeat' })

    const msg = await collected
    expect(msg).toEqual({ data: JSON.stringify({ type: 'heartbeat' }) })
  })
})
