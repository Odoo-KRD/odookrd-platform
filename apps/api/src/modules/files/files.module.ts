import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../infrastructure/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { SettingsModule } from '../settings/settings.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FileStorageService } from './storage/file-storage.service';
import { LocalFileStorageProvider } from './storage/local-file-storage.provider';
import { S3FileStorageProvider } from './storage/s3-file-storage.provider';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AuthorizationModule,
    AuditModule,
    SettingsModule,
  ],
  controllers: [FilesController],
  providers: [
    FilesService,
    FileStorageService,
    LocalFileStorageProvider,
    S3FileStorageProvider,
  ],
  exports: [FilesService, FileStorageService],
})
export class FilesModule {}
