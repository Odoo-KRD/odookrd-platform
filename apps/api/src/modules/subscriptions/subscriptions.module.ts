import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionAdministrationController } from './subscription-administration.controller';
import {
  AssignmentRenewalRequestController,
  SubscriptionRenewalRequestController,
} from './subscription-renewal-request.controller';
import { SubscriptionRenewalRequestService } from './subscription-renewal-request.service';
import { SubscriptionAdministrationService } from './subscription-administration.service';
import { SubscriptionReminderService } from './subscription-reminder.service';
import { SubscriptionSweepService } from './subscription-sweep.service';
import { SubscriptionWorkerService } from './subscription-worker.service';

/**
 * Stage 4 service subscriptions.
 *
 * Entitlement resolution lives in plain functions rather than providers, so it
 * can be used from any module without an injection edge.
 */
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AuthorizationModule,
    NotificationsModule,
  ],
  controllers: [
    SubscriptionAdministrationController,
    SubscriptionRenewalRequestController,
    AssignmentRenewalRequestController,
  ],
  providers: [
    SubscriptionAdministrationService,
    SubscriptionRenewalRequestService,
    SubscriptionReminderService,
    SubscriptionSweepService,
    SubscriptionWorkerService,
  ],
  exports: [
    SubscriptionAdministrationService,
    SubscriptionRenewalRequestService,
    SubscriptionReminderService,
    SubscriptionSweepService,
  ],
})
export class SubscriptionsModule {}
