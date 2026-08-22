import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { SettingsModule } from '../settings/settings.module';
import { NotificationAdministrationService } from './notification-administration.service';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { NotificationAdministrationTemplateService } from './notification-administration-template.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationWorkerService } from './notification-worker.service';
import { NotificationAdministrationController } from './notification-administration.controller';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailProviderService } from './providers/email-provider.service';
import { WhatsAppProviderService } from './providers/whatsapp-provider.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, SettingsModule],
  controllers: [NotificationsController, NotificationAdministrationController],
  providers: [
    NotificationAdministrationTemplateService,
    NotificationAdministrationService,
    NotificationsService,
    NotificationTemplateService,
    NotificationDispatcherService,
    NotificationWorkerService,
    EmailProviderService,
    WhatsAppProviderService,
  ],
  exports: [
    NotificationsService,
    EmailProviderService,
    WhatsAppProviderService,
  ],
})
export class NotificationsModule {}
