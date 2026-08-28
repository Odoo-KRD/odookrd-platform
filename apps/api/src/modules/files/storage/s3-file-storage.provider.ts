import { createHash, randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FileStorageProvider } from '../../../generated/prisma/enums';
import { SettingsService } from '../../settings/settings.service';
import type {
  FileStorageProviderAdapter,
  StoreFileInput,
} from './file-storage.provider';

export interface S3ConnectionTestResult {
  ok: true;
  region: string;
  bucket: string;
  credentialSource: 'default_chain' | 'stored';
}

@Injectable()
export class S3FileStorageProvider implements FileStorageProviderAdapter {
  readonly provider = FileStorageProvider.AWS_S3;
  private clientInstance: S3Client | null = null;
  private clientFingerprint: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly settings: SettingsService,
  ) {}

  async put(input: StoreFileInput): Promise<void> {
    const { client, bucket } = await this.getConfiguration();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.storageKey,
        Body: input.buffer,
        ContentType: input.mimeType,
        Metadata: { sha256: input.sha256 },
      }),
    );
  }

  async open(storageKey: string): Promise<Readable> {
    const { client, bucket } = await this.getConfiguration();
    const response = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: storageKey }),
    );

    if (!response.Body || typeof response.Body !== 'object') {
      throw new Error('S3 returned an empty file body.');
    }

    const body = response.Body as unknown;
    if (!this.isReadable(body)) {
      throw new Error('S3 returned a non-streaming file body.');
    }

    return body;
  }

  async delete(storageKey: string): Promise<void> {
    const { client, bucket } = await this.getConfiguration();
    await client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: storageKey }),
    );
  }

  async testConnection(): Promise<S3ConnectionTestResult> {
    const { client, bucket, region, credentialSource } =
      await this.getConfiguration();
    const key = `.odookrd/connection-tests/${randomUUID()}`;
    const expected = Buffer.from(`odookrd-s3-test:${randomUUID()}`, 'utf8');
    let uploaded = false;

    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: expected,
          ContentType: 'application/octet-stream',
        }),
      );
      uploaded = true;

      const response = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      );

      if (!response.Body) {
        throw new Error('AWS S3 connection test returned an empty body.');
      }

      const actual = await this.readBody(response.Body as unknown);
      if (!actual.equals(expected)) {
        throw new Error('AWS S3 connection test returned unexpected data.');
      }

      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      uploaded = false;

      return { ok: true, region, bucket, credentialSource };
    } catch {
      if (uploaded) {
        await client
          .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
          .catch(() => undefined);
      }
      throw new Error(
        'AWS S3 connection test failed. Verify the region, bucket, credential source and Put/Get/Delete permissions.',
      );
    }
  }

  private async getConfiguration(): Promise<{
    client: S3Client;
    bucket: string;
    region: string;
    credentialSource: 'default_chain' | 'stored';
  }> {
    const [configuredRegion, configuredBucket, sourceValue] = await Promise.all(
      [
        this.settings.resolveConfiguredValue('files.aws_s3.region'),
        this.settings.resolveConfiguredValue('files.aws_s3.bucket'),
        this.settings.resolveValue('files.aws_s3.credential_source'),
      ],
    );

    const region =
      (typeof configuredRegion === 'string' ? configuredRegion.trim() : '') ||
      this.configService.get<string>('FILES_S3_REGION') ||
      '';
    const bucket =
      (typeof configuredBucket === 'string' ? configuredBucket.trim() : '') ||
      this.configService.get<string>('FILES_S3_BUCKET') ||
      '';
    const credentialSource =
      sourceValue === 'stored' ? 'stored' : 'default_chain';

    if (!region || !bucket) {
      throw new Error(
        'AWS S3 file storage requires a region and bucket in File Storage settings or environment configuration.',
      );
    }

    let accessKeyId = '';
    let secretAccessKey = '';
    let sessionToken = '';

    if (credentialSource === 'stored') {
      const resolved = await Promise.all([
        this.settings.resolveSecret('files.aws_s3.access_key_id'),
        this.settings.resolveSecret('files.aws_s3.secret_access_key'),
        this.settings.resolveSecret('files.aws_s3.session_token'),
      ]);
      accessKeyId = resolved[0]?.trim() ?? '';
      secretAccessKey = resolved[1]?.trim() ?? '';
      sessionToken = resolved[2]?.trim() ?? '';

      if (!accessKeyId || !secretAccessKey) {
        throw new Error(
          'Stored AWS S3 credentials require both Access Key ID and Secret Access Key.',
        );
      }
    }

    const fingerprint = createHash('sha256')
      .update(
        JSON.stringify({
          region,
          credentialSource,
          accessKeyId,
          secretAccessKey,
          sessionToken,
        }),
      )
      .digest('hex');

    if (!this.clientInstance || this.clientFingerprint !== fingerprint) {
      this.clientInstance?.destroy();
      this.clientInstance = new S3Client({
        region,
        ...(credentialSource === 'stored'
          ? {
              credentials: {
                accessKeyId,
                secretAccessKey,
                ...(sessionToken ? { sessionToken } : {}),
              },
            }
          : {}),
      });
      this.clientFingerprint = fingerprint;
    }

    return {
      client: this.clientInstance,
      bucket,
      region,
      credentialSource,
    };
  }

  private async readBody(value: unknown): Promise<Buffer> {
    if (this.isReadable(value)) {
      const chunks: Buffer[] = [];
      for await (const chunk of value as AsyncIterable<unknown>) {
        if (typeof chunk === 'string' || chunk instanceof Uint8Array) {
          chunks.push(Buffer.from(chunk));
          continue;
        }
        throw new Error('S3 returned an unsupported stream chunk.');
      }
      return Buffer.concat(chunks);
    }

    if (
      typeof value === 'object' &&
      value !== null &&
      'transformToByteArray' in value &&
      typeof (value as { transformToByteArray?: unknown })
        .transformToByteArray === 'function'
    ) {
      const bytes = await (
        value as { transformToByteArray: () => Promise<Uint8Array> }
      ).transformToByteArray();
      return Buffer.from(bytes);
    }

    throw new Error('S3 returned an unsupported response body.');
  }

  private isReadable(value: unknown): value is Readable {
    return (
      typeof value === 'object' &&
      value !== null &&
      'pipe' in value &&
      typeof (value as { pipe?: unknown }).pipe === 'function'
    );
  }
}
