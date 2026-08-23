import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { UserInvitationService } from './user-invitation.service';
import { UserInvitationsController } from './user-invitations.controller';
import { UserUiPreferencesController } from './user-ui-preferences.controller';
import { UserUiPreferencesService } from './user-ui-preferences.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule],
  controllers: [
    UsersController,
    UserInvitationsController,
    UserUiPreferencesController,
  ],
  providers: [UsersService, UserInvitationService, UserUiPreferencesService],
  exports: [UsersService, UserInvitationService, UserUiPreferencesService],
})
export class UsersModule {}
