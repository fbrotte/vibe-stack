import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@template-dev/shared';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles can access a route.
 * Use with RolesGuard to enforce role-based access control.
 *
 * @example
 * @Roles('ADMIN')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Get('admin/dashboard')
 * getAdminDashboard() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
