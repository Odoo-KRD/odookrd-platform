import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { KnowledgeAdminController } from './knowledge-admin.controller';
import { KnowledgeAdminService } from './knowledge-admin.service';
import { KnowledgeSearchService } from './knowledge-search.service';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule],
  controllers: [KnowledgeController, KnowledgeAdminController],
  providers: [KnowledgeService, KnowledgeSearchService, KnowledgeAdminService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
