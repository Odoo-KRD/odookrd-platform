import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';
import { InvitationTemplateService } from './invitation-template.service';
import { UserAdministrationController } from './user-administration.controller';
import { UserAdministrationService } from './user-administration.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AuthorizationModule,
    SettingsModule,
    NotificationsModule,
  ],
  controllers: [UserAdministrationController],
  providers: [UserAdministrationService, InvitationTemplateService],
})
export class UserAdministrationModule {}
