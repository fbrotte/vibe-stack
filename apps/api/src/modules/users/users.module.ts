import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersTrpc } from './users.trpc';
import { TrpcModule } from '../../trpc/trpc.module';

@Module({
  imports: [forwardRef(() => TrpcModule)],
  providers: [UsersService, UsersTrpc],
  exports: [UsersService, UsersTrpc],
})
export class UsersModule {}
