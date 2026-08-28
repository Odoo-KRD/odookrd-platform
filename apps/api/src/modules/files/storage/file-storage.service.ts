import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AccountScope,
  FileStorageProvider,
} from '../../../generated/prisma/enums';
import { SettingsService } from '../../settings/settings.service';
import type { StoreFileInput } from './file-storage.provider';
import { LocalFileStorageProvider } from './local-file-storage.provider';
import { S3FileStorageProvider } from './s3-file-storage.provider';

@Injectable()
export class FileStorageService {
  constructor(
    private readonly configService: ConfigService,
    private readonly settings: SettingsService,
    private readonly local: LocalFileStorageProvider,
    private readonly s3: S3FileStorageProvider,
  ) {}

  async getConfiguredProvider(): Promise<FileStorageProvider> {
    const configured = await this.settings.resolveConfiguredValue(
      'files.storage.default_provider',
    );
    const fallback = this.configService.get<string>(
      'FILES_STORAGE_PROVIDER',
      FileStorageProvider.LOCAL,
    );
    const selected = configured ?? fallback;

    return selected === FileStorageProvider.AWS_S3
      ? FileStorageProvider.AWS_S3
      : FileStorageProvider.LOCAL;
  }

  createStorageKey(scope: AccountScope, companyId: string | null): string {
    const date = new Date();
    const year = String(date.getUTCFullYear());
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const owner = companyId ?? 'platform';
    return `${scope.toLowerCase()}/${owner}/${year}/${month}/${randomUUID()}`;
  }

  async put(
    provider: FileStorageProvider,
    input: StoreFileInput,
  ): Promise<void> {
    await this.getProvider(provider).put(input);
  }

  open(provider: FileStorageProvider, storageKey: string): Promise<Readable> {
    return this.getProvider(provider).open(storageKey);
  }

  async delete(
    provider: FileStorageProvider,
    storageKey: string,
  ): Promise<void> {
    await this.getProvider(provider).delete(storageKey);
  }

  testS3Connection() {
    return this.s3.testConnection();
  }

  private getProvider(provider: FileStorageProvider) {
    switch (provider) {
      case FileStorageProvider.LOCAL:
        return this.local;
      case FileStorageProvider.AWS_S3:
        return this.s3;
      default:
        throw new Error(
          `Unsupported file storage provider: ${String(provider)}`,
        );
    }
  }
}
