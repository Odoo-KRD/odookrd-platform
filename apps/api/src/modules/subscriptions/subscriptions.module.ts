import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';

/**
 * Stage 4 service subscriptions.
 *
 * Stage 4.0 registers the module and the term arithmetic only. Controllers,
 * services and the expiry worker arrive in 4A onwards.
 */
@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class SubscriptionsModule {}
