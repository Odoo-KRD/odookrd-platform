import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { SubscriptionAdministrationController } from './subscription-administration.controller';
import { SubscriptionAdministrationService } from './subscription-administration.service';
import { SubscriptionSweepService } from './subscription-sweep.service';
import { SubscriptionWorkerService } from './subscription-worker.service';

/**
 * Stage 4 service subscriptions.
 *
 * Entitlement resolution lives in plain functions rather than providers, so it
 * can be used from any module without an injection edge.
 */
@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule],
  controllers: [SubscriptionAdministrationController],
  providers: [
    SubscriptionAdministrationService,
    SubscriptionSweepService,
    SubscriptionWorkerService,
  ],
  exports: [SubscriptionAdministrationService, SubscriptionSweepService],
})
export class SubscriptionsModule {}
