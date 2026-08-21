import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { ServiceAssignmentsController } from './service-assignments.controller';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule],
  controllers: [ServicesController, ServiceAssignmentsController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
