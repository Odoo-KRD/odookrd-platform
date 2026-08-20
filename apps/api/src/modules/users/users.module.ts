import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { UserInvitationsController } from './user-invitations.controller';
import { UserInvitationService } from './user-invitation.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule],
  controllers: [UsersController, UserInvitationsController],
  providers: [UsersService, UserInvitationService],
  exports: [UsersService, UserInvitationService],
})
export class UsersModule {}
