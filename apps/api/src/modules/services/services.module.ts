import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { ServiceFeatureDefinitionsController } from './service-feature-definitions.controller';
import { ServiceAssignmentsController } from './service-assignments.controller';
import { ServicesController } from './services.controller';
import { ServiceAssignmentsService } from './service-assignments.service';
import { ServiceCatalogService } from './service-catalog.service';
import { ServiceFeatureDefinitionsService } from './service-feature-definitions.service';
import { ServiceFeaturesService } from './service-features.service';
import { ServiceLifecycleService } from './service-lifecycle.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule],
  controllers: [
    ServicesController,
    ServiceAssignmentsController,
    ServiceFeatureDefinitionsController,
  ],
  providers: [
    ServiceCatalogService,
    ServiceFeatureDefinitionsService,
    ServiceFeaturesService,
    ServiceAssignmentsService,
    ServiceLifecycleService,
  ],
  exports: [
    ServiceCatalogService,
    ServiceFeatureDefinitionsService,
    ServiceFeaturesService,
    ServiceAssignmentsService,
    ServiceLifecycleService,
  ],
})
export class ServicesModule {}
