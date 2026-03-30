import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UnauthorizedException } from '@nestjs/common'
import type { ExecutionContext } from '@nestjs/common'
import { SseAuthGuard } from '../sse-auth.guard'
import type { JwtService } from '@nestjs/jwt'
import type { AuthService } from '../../auth/auth.service'

function makeContext(query: Record<string, string> = {}): ExecutionContext {
  const request = { query, user: undefined as unknown }
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext
}

function makeMockJwt(payload?: object): JwtService {
  return {
    verify: vi.fn().mockReturnValue(payload ?? { sub: 'user-1', email: 'a@b.com', role: 'USER' }),
  } as unknown as JwtService
}

function makeMockAuth(user?: object | null): AuthService {
  return {
    validateUser: vi
      .fn()
      .mockResolvedValue(
        user !== undefined ? user : { id: 'user-1', email: 'a@b.com', role: 'USER' },
      ),
  } as unknown as AuthService
}

describe('SseAuthGuard', () => {
  let jwt: JwtService
  let auth: AuthService
  let guard: SseAuthGuard

  beforeEach(() => {
    jwt = makeMockJwt()
    auth = makeMockAuth()
    guard = new SseAuthGuard(jwt, auth)
  })

  it('should throw UnauthorizedException when token query param is missing', async () => {
    const ctx = makeContext({})
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
    await expect(guard.canActivate(ctx)).rejects.toThrow('Missing token query parameter')
  })

  it('should throw UnauthorizedException when token is invalid', async () => {
    const badJwt = {
      verify: vi.fn().mockImplementation(() => {
        throw new Error('jwt malformed')
      }),
    } as unknown as JwtService
    const g = new SseAuthGuard(badJwt, auth)
    const ctx = makeContext({ token: 'bad-token' })
    await expect(g.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
    await expect(g.canActivate(ctx)).rejects.toThrow('Invalid token')
  })

  it('should throw UnauthorizedException when user is not found', async () => {
    const noUserAuth = makeMockAuth(null)
    const g = new SseAuthGuard(jwt, noUserAuth)
    const ctx = makeContext({ token: 'valid-token' })
    await expect(g.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
    await expect(g.canActivate(ctx)).rejects.toThrow('User not found')
  })

  it('should return true and attach user to request when token is valid', async () => {
    const ctx = makeContext({ token: 'valid-token' })
    const result = await guard.canActivate(ctx)
    expect(result).toBe(true)
    const req = ctx.switchToHttp().getRequest() as Record<string, unknown>
    expect(req.user).toEqual({ userId: 'user-1', email: 'a@b.com', role: 'USER' })
  })

  it('should call jwtService.verify with the token from query', async () => {
    const ctx = makeContext({ token: 'my-token' })
    await guard.canActivate(ctx)
    expect(jwt.verify).toHaveBeenCalledWith('my-token')
  })

  it('should call authService.validateUser with the sub from jwt payload', async () => {
    const ctx = makeContext({ token: 'my-token' })
    await guard.canActivate(ctx)
    expect(auth.validateUser).toHaveBeenCalledWith('user-1')
  })
})
