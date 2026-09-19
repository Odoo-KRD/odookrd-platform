import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { HelpdeskAdminController } from './helpdesk-admin.controller';
import { HelpdeskAdminService } from './helpdesk-admin.service';
import { HelpdeskController } from './helpdesk.controller';
import { HelpdeskService } from './helpdesk.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule],
  controllers: [HelpdeskController, HelpdeskAdminController],
  providers: [HelpdeskService, HelpdeskAdminService],
})
export class HelpdeskModule {}
