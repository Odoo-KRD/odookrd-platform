import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule, AuditModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
