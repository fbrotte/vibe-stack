import { Module, forwardRef } from '@nestjs/common'
import { UserPreferencesService } from './user-preferences.service'
import { UserPreferencesTrpc } from './user-preferences.trpc'
import { TrpcModule } from '../../trpc/trpc.module'

@Module({
  imports: [forwardRef(() => TrpcModule)],
  providers: [UserPreferencesService, UserPreferencesTrpc],
  exports: [UserPreferencesService, UserPreferencesTrpc],
})
export class UserPreferencesModule {}
