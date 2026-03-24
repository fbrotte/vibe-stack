import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaService } from '../prisma.service'

// PrismaService extends PrismaClient — mock it as a proper class
vi.mock('@prisma/client', () => {
  class PrismaClientMock {
    $connect = vi.fn().mockResolvedValue(undefined)
    $disconnect = vi.fn().mockResolvedValue(undefined)
    $extends = vi.fn().mockReturnValue({})
    $transaction = vi.fn()
  }
  return { PrismaClient: PrismaClientMock }
})

describe('PrismaService - mutation listener', () => {
  let service: PrismaService

  beforeEach(() => {
    service = new PrismaService()
  })

  it('should register a mutation listener via onMutation()', () => {
    const listener = vi.fn()
    service.onMutation(listener)

    const listeners = (service as unknown as { mutationListeners: unknown[] }).mutationListeners
    expect(listeners).toHaveLength(1)
    expect(listeners[0]).toBe(listener)
  })

  it('should call all registered listeners when notifyMutationListeners is called', () => {
    const listener1 = vi.fn()
    const listener2 = vi.fn()
    service.onMutation(listener1)
    service.onMutation(listener2)

    const info = { model: 'User', action: 'create', id: 'abc-123' }
    ;(
      service as unknown as { notifyMutationListeners: (info: typeof info) => void }
    ).notifyMutationListeners(info)

    expect(listener1).toHaveBeenCalledWith(info)
    expect(listener2).toHaveBeenCalledWith(info)
  })

  it('should not throw if a listener throws (defensive)', () => {
    const badListener = vi.fn().mockImplementation(() => {
      throw new Error('listener error')
    })
    service.onMutation(badListener)

    const info = { model: 'User', action: 'create', id: 'abc-123' }
    expect(() => {
      ;(
        service as unknown as { notifyMutationListeners: (info: typeof info) => void }
      ).notifyMutationListeners(info)
    }).not.toThrow()
  })

  it('should invoke each registered listener once per notifyMutationListeners call', () => {
    const listener = vi.fn()
    service.onMutation(listener)

    type NotifyFn = (info: { model: string; action: string; id: string }) => void
    const notify = (
      service as unknown as { notifyMutationListeners: NotifyFn }
    ).notifyMutationListeners.bind(service)

    notify({ model: 'User', action: 'create', id: '1' })
    notify({ model: 'Post', action: 'update', id: '2' })

    expect(listener).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenNthCalledWith(1, { model: 'User', action: 'create', id: '1' })
    expect(listener).toHaveBeenNthCalledWith(2, { model: 'Post', action: 'update', id: '2' })
  })
})
