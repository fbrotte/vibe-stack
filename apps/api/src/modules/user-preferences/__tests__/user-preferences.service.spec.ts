import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Test } from '@nestjs/testing'
import { UserPreferencesService } from '../user-preferences.service'
import { PrismaService } from '../../prisma/prisma.service'

const mockPrisma = {
  userPreference: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn(),
}

describe('UserPreferencesService', () => {
  let service: UserPreferencesService

  beforeEach(async () => {
    vi.clearAllMocks()

    const module = await Test.createTestingModule({
      providers: [UserPreferencesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()

    service = module.get(UserPreferencesService)
  })

  describe('get', () => {
    it('returns value when preference exists', async () => {
      mockPrisma.userPreference.findUnique.mockResolvedValue({
        id: '1',
        userId: 'user-1',
        key: 'theme',
        value: 'dark',
      })

      const result = await service.get('user-1', 'theme')
      expect(result).toBe('dark')
      expect(mockPrisma.userPreference.findUnique).toHaveBeenCalledWith({
        where: { userId_key: { userId: 'user-1', key: 'theme' } },
      })
    })

    it('returns null when preference does not exist', async () => {
      mockPrisma.userPreference.findUnique.mockResolvedValue(null)

      const result = await service.get('user-1', 'unknown')
      expect(result).toBeNull()
    })
  })

  describe('getAll', () => {
    it('returns all preferences as key-value map', async () => {
      mockPrisma.userPreference.findMany.mockResolvedValue([
        { key: 'theme', value: 'dark' },
        { key: 'sidebar', value: true },
      ])

      const result = await service.getAll('user-1')
      expect(result).toEqual({ theme: 'dark', sidebar: true })
    })

    it('returns empty object when no preferences', async () => {
      mockPrisma.userPreference.findMany.mockResolvedValue([])

      const result = await service.getAll('user-1')
      expect(result).toEqual({})
    })
  })

  describe('set', () => {
    it('upserts a preference', async () => {
      await service.set('user-1', 'theme', 'dark')

      expect(mockPrisma.userPreference.upsert).toHaveBeenCalledWith({
        where: { userId_key: { userId: 'user-1', key: 'theme' } },
        create: { userId: 'user-1', key: 'theme', value: 'dark' },
        update: { value: 'dark' },
      })
    })
  })

  describe('bulkSet', () => {
    it('calls $transaction with upsert operations', async () => {
      mockPrisma.$transaction.mockResolvedValue([])

      await service.bulkSet('user-1', [
        { key: 'theme', value: 'dark' },
        { key: 'sidebar', value: false },
      ])

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
      // $transaction receives an array of Prisma promises (PrismaPromise)
      const args = mockPrisma.$transaction.mock.calls[0][0]
      expect(args).toHaveLength(2)
    })
  })

  describe('delete', () => {
    it('deletes a preference', async () => {
      await service.delete('user-1', 'theme')

      expect(mockPrisma.userPreference.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', key: 'theme' },
      })
    })
  })
})
