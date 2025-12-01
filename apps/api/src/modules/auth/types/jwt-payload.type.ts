import type { UserRole } from '@template-dev/shared'

/**
 * JWT payload structure after validation by JwtStrategy.
 * This is what's available in request.user after JwtAuthGuard validates the token.
 */
export interface JwtPayload {
  userId: string
  email: string
  role: UserRole
}
