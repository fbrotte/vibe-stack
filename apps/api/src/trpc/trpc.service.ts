import { Injectable } from '@nestjs/common';
import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './trpc.context';

@Injectable()
export class TrpcService {
  trpc = initTRPC.context<Context>().create();
  procedure = this.trpc.procedure;
  router = this.trpc.router;
  mergeRouters = this.trpc.mergeRouters;

  protectedProcedure = this.trpc.procedure.use(async (opts) => {
    const { ctx } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    return opts.next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  });
}
