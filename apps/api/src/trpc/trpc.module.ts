import { Module, forwardRef } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { TrpcRouter } from './trpc.router';
import { AuthModule } from '../modules/auth/auth.module';
import { UsersModule } from '../modules/users/users.module';
import { LlmModule } from '../modules/llm/llm.module';

@Module({
  imports: [forwardRef(() => AuthModule), forwardRef(() => UsersModule), forwardRef(() => LlmModule)],
  providers: [TrpcService, TrpcRouter],
  exports: [TrpcService],
})
export class TrpcModule {}
