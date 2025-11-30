import { ForbiddenException } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { JwtPayload } from '../types/jwt-payload.type';

/**
 * Asserts that the current user is either the owner of the resource or an admin.
 * Throws ForbiddenException if the check fails (for REST endpoints).
 *
 * @param resourceUserId - The user ID that owns the resource
 * @param currentUser - The authenticated user from JWT
 *
 * @example
 * @UseGuards(JwtAuthGuard)
 * @Get('users/:id')
 * getUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
 *   assertOwnerOrAdmin(id, user);
 *   return this.usersService.findById(id);
 * }
 */
export function assertOwnerOrAdmin(resourceUserId: string, currentUser: JwtPayload): void {
  if (currentUser.role === 'ADMIN') {
    return;
  }

  if (currentUser.userId !== resourceUserId) {
    throw new ForbiddenException('You can only access your own resources');
  }
}

/**
 * Same as assertOwnerOrAdmin but throws TRPCError for use in tRPC procedures.
 *
 * @example
 * // In a tRPC router
 * getUser: this.trpc.protectedProcedure
 *   .input(z.object({ userId: z.string() }))
 *   .query(({ input, ctx }) => {
 *     assertOwnerOrAdminTrpc(input.userId, ctx.user);
 *     return this.usersService.findById(input.userId);
 *   })
 */
export function assertOwnerOrAdminTrpc(resourceUserId: string, currentUser: JwtPayload): void {
  if (currentUser.role === 'ADMIN') {
    return;
  }

  if (currentUser.userId !== resourceUserId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You can only access your own resources',
    });
  }
}
