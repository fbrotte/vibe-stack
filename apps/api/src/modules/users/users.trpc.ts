import { Injectable, Inject } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '../../trpc/trpc.service';
import { UsersService } from './users.service';

@Injectable()
export class UsersTrpc {
  router: ReturnType<TrpcService['router']>;

  constructor(
    @Inject(TrpcService) private readonly trpc: TrpcService,
    @Inject(UsersService) private readonly usersService: UsersService,
  ) {
    this.router = this.trpc.router({
      list: this.trpc.protectedProcedure.query(async () => {
        return await this.usersService.findAll();
      }),

      getById: this.trpc.protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
          return await this.usersService.findOne(input.id);
        }),
    });
  }
}
