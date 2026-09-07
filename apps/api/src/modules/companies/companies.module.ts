import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { FilesModule } from '../files/files.module';
import { CompaniesController } from './companies.controller';
import { CompanyProfileAdminController } from './company-profile-admin.controller';
import { CompanyProfileService } from './company-profile.service';
import { CompaniesService } from './companies.service';
import { WorkspaceCompanyController } from './workspace-company.controller';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AuthorizationModule,
    AuditModule,
    FilesModule,
  ],
  controllers: [
    CompaniesController,
    CompanyProfileAdminController,
    WorkspaceCompanyController,
  ],
  providers: [CompaniesService, CompanyProfileService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
