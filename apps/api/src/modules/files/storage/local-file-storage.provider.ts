import { randomUUID } from 'node:crypto';
import { mkdir, open, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Readable } from 'node:stream';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FileStorageProvider } from '../../../generated/prisma/enums';
import type {
  FileStorageProviderAdapter,
  StoreFileInput,
} from './file-storage.provider';

@Injectable()
export class LocalFileStorageProvider implements FileStorageProviderAdapter {
  readonly provider = FileStorageProvider.LOCAL;
  private readonly root: string;

  constructor(configService: ConfigService) {
    this.root = path.resolve(
      configService.get<string>(
        'FILES_LOCAL_ROOT',
        '/opt/odookrd-platform/var/uploads',
      ),
    );
  }

  async put(input: StoreFileInput): Promise<void> {
    const target = this.resolveStorageKey(input.storageKey);
    await mkdir(path.dirname(target), { recursive: true, mode: 0o750 });

    const temporary = `${target}.tmp-${randomUUID()}`;
    try {
      await writeFile(temporary, input.buffer, { flag: 'wx', mode: 0o640 });
      await rename(temporary, target);
    } catch (error) {
      await rm(temporary, { force: true }).catch(() => undefined);
      throw error;
    }
  }

  async open(storageKey: string): Promise<Readable> {
    const target = this.resolveStorageKey(storageKey);
    const handle = await open(target, 'r');

    try {
      const stats = await handle.stat();
      if (!stats.isFile()) {
        throw new Error('Stored local object is not a regular file.');
      }
      return handle.createReadStream({ autoClose: true });
    } catch (error) {
      await handle.close().catch(() => undefined);
      throw error;
    }
  }

  async delete(storageKey: string): Promise<void> {
    await rm(this.resolveStorageKey(storageKey), { force: true });
  }

  private resolveStorageKey(storageKey: string): string {
    if (!/^[a-z0-9/_-]+$/i.test(storageKey)) {
      throw new Error('Invalid local storage key.');
    }

    const resolved = path.resolve(this.root, storageKey);
    const rootPrefix = `${this.root}${path.sep}`;
    if (!resolved.startsWith(rootPrefix)) {
      throw new Error('Storage key escaped the configured local root.');
    }

    return resolved;
  }
}
