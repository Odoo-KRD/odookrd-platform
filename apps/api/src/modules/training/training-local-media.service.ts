import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Readable } from 'node:stream';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface StoredTrainingVideo {
  storageKey: string;
  sizeBytes: number;
  checksum: string;
}

export interface TrainingVideoRange {
  stream: Readable;
  statusCode: 200 | 206;
  sizeBytes: number;
  start: number;
  end: number;
  contentLength: number;
}

@Injectable()
export class TrainingLocalMediaService {
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = path.resolve(
      config.get<string>(
        'TRAINING_LOCAL_MEDIA_ROOT',
        '/opt/odookrd-platform/var/training-media',
      ),
    );
  }

  async store(
    source: Readable,
    expectedSize: number,
    maxBytes: number,
  ): Promise<StoredTrainingVideo> {
    if (
      !Number.isSafeInteger(expectedSize) ||
      expectedSize <= 0 ||
      expectedSize > maxBytes
    ) {
      throw new BadRequestException(
        'Video size exceeds the configured training upload limit.',
      );
    }

    const storageKey = `video/${randomUUID()}.mp4`;
    const target = this.resolveStorageKey(storageKey);
    await mkdir(path.dirname(target), { recursive: true, mode: 0o750 });
    const temporary = `${target}.tmp-${randomUUID()}`;
    const checksum = createHash('sha256');
    let sizeBytes = 0;
    let prefix = Buffer.alloc(0);

    const guard = new Transform({
      transform(chunk: Buffer | string, _encoding, callback) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        sizeBytes += buffer.length;
        if (sizeBytes > maxBytes || sizeBytes > expectedSize) {
          callback(
            new Error('Video upload exceeded the declared or configured size.'),
          );
          return;
        }
        checksum.update(buffer);
        if (prefix.length < 64) {
          prefix = Buffer.concat([prefix, buffer]).subarray(0, 64);
        }
        callback(null, buffer);
      },
    });

    try {
      await pipeline(
        source,
        guard,
        createWriteStream(temporary, { flags: 'wx', mode: 0o640 }),
      );

      if (sizeBytes !== expectedSize) {
        throw new Error('Video upload size did not match the declared size.');
      }
      if (!this.hasMp4Signature(prefix)) {
        throw new Error('Uploaded content is not a valid MP4 container.');
      }

      await rename(temporary, target);
      return {
        storageKey,
        sizeBytes,
        checksum: checksum.digest('hex'),
      };
    } catch (error) {
      await rm(temporary, { force: true }).catch(() => undefined);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Local video upload failed.',
      );
    }
  }

  async openRange(
    storageKey: string,
    rangeHeader?: string,
  ): Promise<TrainingVideoRange> {
    const target = this.resolveStorageKey(storageKey);
    let stats;
    try {
      stats = await stat(target);
    } catch {
      throw new NotFoundException('Training video was not found.');
    }
    if (!stats.isFile() || stats.size <= 0) {
      throw new NotFoundException('Training video was not found.');
    }

    const sizeBytes = stats.size;
    if (!rangeHeader) {
      return {
        stream: createReadStream(target),
        statusCode: 200,
        sizeBytes,
        start: 0,
        end: sizeBytes - 1,
        contentLength: sizeBytes,
      };
    }

    const { start, end } = this.parseRange(rangeHeader, sizeBytes);
    return {
      stream: createReadStream(target, { start, end }),
      statusCode: 206,
      sizeBytes,
      start,
      end,
      contentLength: end - start + 1,
    };
  }

  async delete(storageKey: string): Promise<void> {
    await rm(this.resolveStorageKey(storageKey), { force: true });
  }

  private parseRange(
    value: string,
    sizeBytes: number,
  ): { start: number; end: number } {
    if (value.includes(',')) {
      throw new HttpException('Multiple byte ranges are not supported.', 416);
    }
    const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
    if (!match || (!match[1] && !match[2])) {
      throw new HttpException('Requested byte range is invalid.', 416);
    }

    let start: number;
    let end: number;
    if (!match[1]) {
      const suffix = Number(match[2]);
      if (!Number.isSafeInteger(suffix) || suffix <= 0) {
        throw new HttpException('Requested byte range is invalid.', 416);
      }
      start = Math.max(0, sizeBytes - suffix);
      end = sizeBytes - 1;
    } else {
      start = Number(match[1]);
      end = match[2] ? Number(match[2]) : sizeBytes - 1;
    }

    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 0 ||
      end < start ||
      start >= sizeBytes
    ) {
      throw new HttpException('Requested byte range is not satisfiable.', 416);
    }

    return { start, end: Math.min(end, sizeBytes - 1) };
  }

  private hasMp4Signature(prefix: Buffer): boolean {
    return (
      prefix.length >= 12 && prefix.subarray(4, 8).toString('ascii') === 'ftyp'
    );
  }

  private resolveStorageKey(storageKey: string): string {
    if (!/^video\/[0-9a-f-]+\.mp4$/i.test(storageKey)) {
      throw new Error('Invalid training local storage key.');
    }
    const resolved = path.resolve(this.root, storageKey);
    if (!resolved.startsWith(`${this.root}${path.sep}`)) {
      throw new Error('Training storage key escaped the configured root.');
    }
    return resolved;
  }
}
