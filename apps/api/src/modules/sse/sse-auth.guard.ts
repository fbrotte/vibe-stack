import { Injectable, Inject, UnauthorizedException } from '@nestjs/common'
import type { CanActivate, ExecutionContext } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AuthService } from '../auth/auth.service'

@Injectable()
export class SseAuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(AuthService) private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const token = request.query?.token as string

    if (!token) {
      throw new UnauthorizedException('Missing token query parameter')
    }

    try {
      const payload = this.jwtService.verify(token)
      const user = await this.authService.validateUser(payload.sub)

      if (!user) {
        throw new UnauthorizedException('User not found')
      }

      request.user = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      }

      return true
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error
      throw new UnauthorizedException('Invalid token')
    }
  }
}
