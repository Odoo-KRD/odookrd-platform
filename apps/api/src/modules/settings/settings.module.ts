import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { SettingsCryptoService } from './settings-crypto.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [DatabaseModule, AuthModule, AuthorizationModule],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsCryptoService],
  exports: [SettingsService],
})
export class SettingsModule {}
