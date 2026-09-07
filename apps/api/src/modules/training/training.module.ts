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
import {
  TrainingCertificateAdminController,
  TrainingCertificateController,
  TrainingCertificateTemplateController,
} from './training-certificate.controller';
import { TrainingCertificateService } from './training-certificate.service';
import { TrainingCourseCompletionController } from './training-course-completion.controller';
import { TrainingCourseCompletionService } from './training-course-completion.service';
import { TrainingDashboardController } from './training-dashboard.controller';
import { TrainingDashboardService } from './training-dashboard.service';
import { TrainingController } from './training.controller';
import { TrainingEntitlementService } from './training-entitlement.service';
import { TrainingService } from './training.service';
import { TrainingAwsMediaService } from './training-aws-media.service';
import { TrainingLocalMediaService } from './training-local-media.service';
import { TrainingMediaController } from './training-media.controller';
import { TrainingLessonEditorController } from './training-lesson-editor.controller';
import { TrainingMediaService } from './training-media.service';
import { TrainingPlayerSettingsController } from './training-player-settings.controller';
import { TrainingPlayerSettingsService } from './training-player-settings.service';
import { TrainingProgressController } from './training-progress.controller';
import { TrainingProgressService } from './training-progress.service';
import { TrainingReportingController } from './training-reporting.controller';
import { TrainingReportingService } from './training-reporting.service';
import { TrainingLearningGateService } from './training-learning-gate.service';
import { TrainingQuizAdminController } from './training-quiz-admin.controller';
import { TrainingQuizAttemptController } from './training-quiz-attempt.controller';
import { TrainingQuizAdminService } from './training-quiz-admin.service';
import { TrainingQuizAttemptService } from './training-quiz-attempt.service';
import { TrainingLessonEditorService } from './training-lesson-editor.service';
import { TrainingVideoEnrichmentController } from './training-video-enrichment.controller';
import { TrainingVideoEnrichmentService } from './training-video-enrichment.service';

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
    TrainingCertificateTemplateController,
    TrainingCertificateController,
    TrainingCertificateAdminController,
    TrainingCourseCompletionController,
    TrainingDashboardController,
    TrainingAccessController,
    TrainingMediaController,
    TrainingLessonEditorController,
    TrainingPlayerSettingsController,
    TrainingProgressController,
    TrainingReportingController,
    TrainingQuizAdminController,
    TrainingQuizAttemptController,
    TrainingVideoEnrichmentController,
  ],
  providers: [
    TrainingService,
    TrainingEntitlementService,
    TrainingCatalogService,
    TrainingCertificateService,
    TrainingCourseCompletionService,
    TrainingDashboardService,
    TrainingAccessService,
    TrainingAwsMediaService,
    TrainingLocalMediaService,
    TrainingMediaService,
    TrainingLessonEditorService,
    TrainingPlayerSettingsService,
    TrainingProgressService,
    TrainingReportingService,
    TrainingLearningGateService,
    TrainingQuizAdminService,
    TrainingQuizAttemptService,
    TrainingVideoEnrichmentService,
  ],
  exports: [TrainingEntitlementService],
})
export class TrainingModule {}
