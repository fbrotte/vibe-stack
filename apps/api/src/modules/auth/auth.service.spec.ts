import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi
    .fn()
    .mockImplementation((plain, hashed) => Promise.resolve(plain === 'correct_password')),
}))

describe('AuthService', () => {
  let service: AuthService
  let prismaService: PrismaService
  let jwtService: JwtService

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed_password',
    name: 'Test User',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockPrismaService = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  }

  const mockJwtService = {
    sign: vi.fn().mockReturnValue('mock_token'),
    verify: vi.fn().mockReturnValue({ sub: 'user-123' }),
  }

  const mockConfigService = {
    get: vi.fn().mockImplementation((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
      }
      return config[key] ?? defaultValue
    }),
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    prismaService = module.get<PrismaService>(PrismaService)
    jwtService = module.get<JwtService>(JwtService)
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null)
      mockPrismaService.user.create.mockResolvedValue(mockUser)
      mockPrismaService.refreshToken.create.mockResolvedValue({})

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      })

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result.user.email).toBe('test@example.com')
    })

    it('should throw ConflictException if user already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        }),
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)
      mockPrismaService.refreshToken.create.mockResolvedValue({})

      const result = await service.login({
        email: 'test@example.com',
        password: 'correct_password',
      })

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })

    it('should throw UnauthorizedException with wrong password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser)

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrong_password',
        }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null)

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password',
        }),
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('validateUser', () => {
    it('should return user data without password', async () => {
      const { password, ...userWithoutPassword } = mockUser
      mockPrismaService.user.findUnique.mockResolvedValue(userWithoutPassword)

      const result = await service.validateUser('user-123')

      expect(result).toBeDefined()
      expect(result).not.toHaveProperty('password')
    })
  })
})
