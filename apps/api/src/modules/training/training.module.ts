import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { FilesModule } from '../files/files.module';
import { SettingsModule } from '../settings/settings.module';
import { TrainingAccessController } from './training-access.controller';
import { TrainingAccessService } from './training-access.service';
import { TrainingCatalogController } from './training-catalog.controller';
import { TrainingCatalogService } from './training-catalog.service';
import { TrainingController } from './training.controller';
import { TrainingEntitlementService } from './training-entitlement.service';
import { TrainingService } from './training.service';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AuthorizationModule,
    SettingsModule,
    FilesModule,
  ],
  controllers: [
    TrainingController,
    TrainingCatalogController,
    TrainingAccessController,
  ],
  providers: [
    TrainingService,
    TrainingEntitlementService,
    TrainingCatalogService,
    TrainingAccessService,
  ],
  exports: [TrainingEntitlementService],
})
export class TrainingModule {}
