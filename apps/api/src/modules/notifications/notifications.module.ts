import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { SettingsModule } from '../settings/settings.module';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationWorkerService } from './notification-worker.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailProviderService } from './providers/email-provider.service';
import { WhatsAppProviderService } from './providers/whatsapp-provider.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, SettingsModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationTemplateService,
    NotificationDispatcherService,
    NotificationWorkerService,
    EmailProviderService,
    WhatsAppProviderService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
