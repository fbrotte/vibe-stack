import { Injectable, Inject } from '@nestjs/common';
import { TrpcService } from '../../trpc/trpc.service';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginSchema, RegisterSchema } from '@template-dev/shared';

@Injectable()
export class AuthTrpc {
  router: ReturnType<TrpcService['router']>;

  constructor(
    @Inject(TrpcService) private readonly trpc: TrpcService,
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(UsersService) private readonly usersService: UsersService,
  ) {
    this.router = this.trpc.router({
      login: this.trpc.procedure.input(LoginSchema).mutation(async ({ input }) => {
        return await this.authService.login(input);
      }),

      register: this.trpc.procedure.input(RegisterSchema).mutation(async ({ input }) => {
        return await this.authService.register(input);
      }),

      me: this.trpc.protectedProcedure.query(async ({ ctx }) => {
        return await this.usersService.findOne(ctx.user.userId);
      }),
    });
  }
}
