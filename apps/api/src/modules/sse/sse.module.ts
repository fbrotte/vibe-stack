import { Global, Module, forwardRef } from '@nestjs/common'
import { SseService } from './sse.service'
import { AuthModule } from '../auth/auth.module'

@Global()
@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [SseService],
  exports: [SseService],
})
export class SseModule {}
