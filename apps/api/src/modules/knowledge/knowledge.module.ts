import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { KnowledgeSearchService } from './knowledge-search.service';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeSearchService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
