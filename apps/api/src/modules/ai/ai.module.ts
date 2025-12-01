import { Module, forwardRef } from '@nestjs/common'
import { TrpcModule } from '../../trpc/trpc.module'
import { LangfuseModule } from '../langfuse'
import { AiService } from './ai.service'
import { AiTrpc } from './ai.trpc'

@Module({
  imports: [forwardRef(() => TrpcModule), LangfuseModule],
  providers: [AiService, AiTrpc],
  exports: [AiService, AiTrpc],
})
export class AiModule {}
