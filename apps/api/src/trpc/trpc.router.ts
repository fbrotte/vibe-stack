import { INestApplication, Injectable, OnApplicationBootstrap, Inject } from '@nestjs/common';
import * as trpcExpress from '@trpc/server/adapters/express';
import { TrpcService } from './trpc.service';
import { AuthTrpc } from '../modules/auth/auth.trpc';
import { UsersTrpc } from '../modules/users/users.trpc';
import { LlmTrpc } from '../modules/llm/llm.trpc';
import { createContext } from './trpc.context';

@Injectable()
export class TrpcRouter implements OnApplicationBootstrap {
  appRouter: ReturnType<TrpcService['router']>;

  constructor(
    @Inject(TrpcService) private readonly trpc: TrpcService,
    @Inject(AuthTrpc) private readonly authTrpc: AuthTrpc,
    @Inject(UsersTrpc) private readonly usersTrpc: UsersTrpc,
    @Inject(LlmTrpc) private readonly llmTrpc: LlmTrpc,
  ) {
    // Assemble modular routers
    this.appRouter = this.trpc.router({
      auth: this.authTrpc.router,
      users: this.usersTrpc.router,
      llm: this.llmTrpc.router,
    });
  }

  onApplicationBootstrap() {
    // Hook is called but we don't need to do anything here
    // since routers are already initialized in constructor
  }

  async applyMiddleware(app: INestApplication) {
    app.use(
      '/trpc',
      trpcExpress.createExpressMiddleware({
        router: this.appRouter,
        createContext,
      }),
    );
  }

  getRouter() {
    return this.appRouter;
  }
}

export type AppRouter = TrpcRouter['appRouter'];
