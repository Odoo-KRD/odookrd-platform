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
import { TrainingAwsMediaService } from './training-aws-media.service';
import { TrainingLocalMediaService } from './training-local-media.service';
import { TrainingMediaController } from './training-media.controller';
import { TrainingLessonEditorController } from './training-lesson-editor.controller';
import { TrainingMediaService } from './training-media.service';
import { TrainingLessonEditorService } from './training-lesson-editor.service';

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
    TrainingMediaController,
    TrainingLessonEditorController,
  ],
  providers: [
    TrainingService,
    TrainingEntitlementService,
    TrainingCatalogService,
    TrainingAccessService,
    TrainingAwsMediaService,
    TrainingLocalMediaService,
    TrainingMediaService,
    TrainingLessonEditorService,
  ],
  exports: [TrainingEntitlementService],
})
export class TrainingModule {}
