import { Global, Module, forwardRef } from '@nestjs/common'
import { SseService } from './sse.service'
import { SseController } from './sse.controller'
import { SseAuthGuard } from './sse-auth.guard'
import { AuthModule } from '../auth/auth.module'

@Global()
@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [SseController],
  providers: [SseService, SseAuthGuard],
  exports: [SseService],
})
export class SseModule {}
