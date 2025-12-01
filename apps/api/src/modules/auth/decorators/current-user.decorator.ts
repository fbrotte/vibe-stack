import type { ExecutionContext } from '@nestjs/common'
import { createParamDecorator } from '@nestjs/common'
import type { JwtPayload } from '../types/jwt-payload.type'

/**
 * Parameter decorator to extract the current authenticated user from the request.
 * Requires JwtAuthGuard to be applied to the route.
 *
 * @example
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: JwtPayload) {
 *   return user;
 * }
 *
 * // Access specific property
 * @Get('my-id')
 * getMyId(@CurrentUser('sub') userId: string) {
 *   return userId;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user as JwtPayload

    return data ? user?.[data] : user
  },
)
