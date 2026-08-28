import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule],
  controllers: [TrainingController],
  providers: [TrainingService],
})
export class TrainingModule {}
