import { Module, forwardRef } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LlmController } from './llm.controller';
import { LlmTrpc } from './llm.trpc';
import { TrpcModule } from '../../trpc/trpc.module';

@Module({
  imports: [forwardRef(() => TrpcModule)],
  controllers: [LlmController],
  providers: [LlmService, LlmTrpc],
  exports: [LlmService, LlmTrpc],
})
export class LlmModule {}
