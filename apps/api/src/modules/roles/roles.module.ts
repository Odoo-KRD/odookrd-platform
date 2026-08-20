import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
