import type { Readable } from 'node:stream';

import { getSignedUrl as getCloudFrontSignedUrl } from '@aws-sdk/cloudfront-signer';
import {
  CancelJobCommand,
  CreateJobCommand,
  GetJobCommand,
  MediaConvertClient,
} from '@aws-sdk/client-mediaconvert';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SettingsService } from '../settings/settings.service';

interface AwsConfiguration {
  region: string;
  bucket: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
}

export interface MediaConvertInspection {
  state: 'PROCESSING' | 'READY' | 'FAILED';
  manifestReference?: string;
  processedSizeBytes?: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  failureCode?: string;
  failureMessage?: string;
  progressPercent?: number;
  outputVariants?: number[];
}

@Injectable()
export class TrainingAwsMediaService {
  constructor(
    private readonly settings: SettingsService,
    private readonly config: ConfigService,
  ) {}

  async createUploadUrl(
    storageKey: string,
  ): Promise<{ uploadUrl: string; expiresInSeconds: number }> {
    const { client, bucket } = await this.s3();
    const expiresInSeconds = await this.numberSetting(
      'trainings.video.aws.upload_url_ttl_seconds',
      900,
    );
    const uploadUrl = await getS3SignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        ContentType: 'video/mp4',
      }),
      { expiresIn: expiresInSeconds },
    );
    return { uploadUrl, expiresInSeconds };
  }

  async verifyUploadedObject(
    storageKey: string,
    expectedSize: number,
  ): Promise<void> {
    const { client, bucket } = await this.s3();
    let head;
    try {
      head = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: storageKey }),
      );
    } catch {
      throw new BadRequestException(
        'The uploaded S3 video could not be verified.',
      );
    }
    if (Number(head.ContentLength ?? -1) !== expectedSize) {
      throw new BadRequestException(
        'The uploaded S3 object size does not match the declared video size.',
      );
    }
    if (head.ContentType && head.ContentType !== 'video/mp4') {
      throw new BadRequestException('The uploaded S3 object is not MP4 video.');
    }
  }

  async createMediaConvertJob(input: {
    assetId: string;
    sourceReference: string;
  }): Promise<string> {
    const aws = await this.awsConfiguration();
    const roleArn = await this.requiredStringSetting(
      'trainings.video.aws.mediaconvert_role_arn',
      'MediaConvert role ARN is not configured.',
    );
    const queueArn = await this.stringSetting(
      'trainings.video.aws.mediaconvert_queue_arn',
    );
    const client = new MediaConvertClient({
      region: aws.region,
      ...(aws.credentials ? { credentials: aws.credentials } : {}),
    });
    const outputPrefix = `training/hls/${input.assetId}`;

    try {
      const response = await client.send(
        new CreateJobCommand({
          Role: roleArn,
          ...(queueArn ? { Queue: queueArn } : {}),
          AccelerationSettings: { Mode: 'DISABLED' },
          StatusUpdateInterval: 'SECONDS_60',
          UserMetadata: { trainingAssetId: input.assetId },
          Settings: {
            TimecodeConfig: { Source: 'ZEROBASED' },
            Inputs: [
              {
                FileInput: `s3://${aws.bucket}/${input.sourceReference}`,
                AudioSelectors: {
                  'Default Audio': { DefaultSelection: 'DEFAULT' },
                },
                VideoSelector: { Rotate: 'AUTO' },
                TimecodeSource: 'ZEROBASED',
              },
            ],
            OutputGroups: [
              {
                Name: 'OdooKRD HLS',
                OutputGroupSettings: {
                  Type: 'HLS_GROUP_SETTINGS',
                  HlsGroupSettings: {
                    Destination: `s3://${aws.bucket}/${outputPrefix}/`,
                    SegmentLength: 6,
                    MinSegmentLength: 0,
                    DirectoryStructure: 'SINGLE_DIRECTORY',
                    ManifestDurationFormat: 'INTEGER',
                    OutputSelection: 'MANIFESTS_AND_SEGMENTS',
                    StreamInfResolution: 'INCLUDE',
                    ClientCache: 'ENABLED',
                    CodecSpecification: 'RFC_4281',
                  },
                },
                Outputs: [
                  this.hlsOutput(1920, 1080, 5_000_000, '-1080p'),
                  this.hlsOutput(1280, 720, 2_800_000, '-720p'),
                  this.hlsOutput(854, 480, 1_200_000, '-480p'),
                ],
              },
            ],
          },
        }),
      );
      if (!response.Job?.Id) {
        throw new Error('MediaConvert did not return a job identifier.');
      }
      return response.Job.Id;
    } catch (error) {
      throw new ServiceUnavailableException(
        error instanceof Error
          ? `MediaConvert job creation failed: ${error.message}`
          : 'MediaConvert job creation failed.',
      );
    } finally {
      client.destroy();
    }
  }

  async inspectMediaConvertJob(
    jobId: string,
    assetId: string,
  ): Promise<MediaConvertInspection> {
    const aws = await this.awsConfiguration();
    const client = new MediaConvertClient({
      region: aws.region,
      ...(aws.credentials ? { credentials: aws.credentials } : {}),
    });
    try {
      const response = await client.send(new GetJobCommand({ Id: jobId }));
      const job = response.Job;
      if (!job?.Status) {
        throw new Error('MediaConvert returned no job status.');
      }
      if (job.Status === 'ERROR' || job.Status === 'CANCELED') {
        return {
          state: 'FAILED',
          failureCode: job.Status,
          failureMessage:
            job.ErrorMessage?.slice(0, 1000) ??
            `MediaConvert job ended with status ${job.Status}.`,
        };
      }
      if (job.Status !== 'COMPLETE') {
        const progress = job.JobPercentComplete;
        return {
          state: 'PROCESSING',
          ...(typeof progress === 'number' && Number.isFinite(progress)
            ? {
                progressPercent: Math.max(
                  0,
                  Math.min(99, Math.round(progress)),
                ),
              }
            : {}),
        };
      }

      const manifestReference = await this.findManifest(assetId);
      if (!manifestReference) {
        return {
          state: 'FAILED',
          failureCode: 'MANIFEST_NOT_FOUND',
          failureMessage: 'MediaConvert completed without an HLS manifest.',
        };
      }

      const firstDetail = job.OutputGroupDetails?.flatMap(
        (group) => group.OutputDetails ?? [],
      )[0];
      const durationMs = firstDetail?.DurationInMs;
      const width = firstDetail?.VideoDetails?.WidthInPx;
      const height = firstDetail?.VideoDetails?.HeightInPx;
      const outputVariants = Array.from(
        new Set(
          (job.OutputGroupDetails ?? [])
            .flatMap((group) => group.OutputDetails ?? [])
            .map((detail) => detail.VideoDetails?.HeightInPx)
            .filter(
              (value): value is number =>
                typeof value === 'number' && value > 0,
            ),
        ),
      ).sort((left, right) => right - left);

      return {
        state: 'READY',
        manifestReference,
        processedSizeBytes: await this.sumPrefix(`training/hls/${assetId}/`),
        ...(typeof durationMs === 'number' && durationMs > 0
          ? { durationSeconds: Math.max(1, Math.round(durationMs / 1000)) }
          : {}),
        ...(typeof width === 'number' && width > 0 ? { width } : {}),
        ...(typeof height === 'number' && height > 0 ? { height } : {}),
        outputVariants,
      };
    } catch (error) {
      throw new ServiceUnavailableException(
        error instanceof Error
          ? `MediaConvert status check failed: ${error.message}`
          : 'MediaConvert status check failed.',
      );
    } finally {
      client.destroy();
    }
  }

  async cancelMediaConvertJob(jobId: string): Promise<void> {
    const aws = await this.awsConfiguration();
    const client = new MediaConvertClient({
      region: aws.region,
      ...(aws.credentials ? { credentials: aws.credentials } : {}),
    });
    try {
      await client.send(new CancelJobCommand({ Id: jobId }));
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!/complete|cancel|not found/i.test(message)) throw error;
    } finally {
      client.destroy();
    }
  }

  async clearAutomatedOutputs(assetId: string): Promise<void> {
    await this.deletePrefix(`training/hls/${assetId}/`);
  }

  async deleteAutomatedAsset(
    assetId: string,
    sourceReference: string,
  ): Promise<void> {
    await this.deleteKeys([sourceReference]);
    await this.deletePrefix(`training/hls/${assetId}/`);
  }

  async readAutomatedManifest(storageKey: string): Promise<string> {
    if (!/^training\/hls\/[0-9a-f-]+\/.+\.m3u8$/i.test(storageKey)) {
      throw new BadRequestException('Invalid automated HLS reference.');
    }
    const { client, bucket } = await this.s3();
    const response = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: storageKey }),
    );
    if (!response.Body) {
      throw new ServiceUnavailableException('HLS manifest is unavailable.');
    }
    return this.readText(response.Body as unknown);
  }

  async fetchAutomatedResource(storageKey: string): Promise<Response> {
    if (!/^training\/hls\/[0-9a-f-]+\/.+$/i.test(storageKey)) {
      throw new BadRequestException('Invalid automated HLS resource.');
    }
    return this.fetchSignedCloudFrontUrl(
      await this.cloudFrontUrlForKey(storageKey),
    );
  }

  async validateManualPlaybackUrl(raw: string): Promise<string> {
    const target = this.parseHttpsUrl(raw, 'Manual playback URL is invalid.');
    if (!target.pathname.toLowerCase().endsWith('.m3u8')) {
      throw new BadRequestException(
        'Manual playback URL must reference an HLS manifest.',
      );
    }
    await this.assertManualWithinConfiguredBase(target);
    return target.toString();
  }

  async fetchManualResource(url: string): Promise<Response> {
    const target = this.parseHttpsUrl(
      url,
      'Manual HLS resource URL is invalid.',
    );
    await this.assertManualWithinConfiguredBase(target);
    return this.fetchSignedCloudFrontUrl(target.toString());
  }

  resolveAutomatedReference(baseReference: string, child: string): string {
    if (/^[a-z][a-z0-9+.-]*:/i.test(child) || child.startsWith('//')) {
      throw new BadRequestException(
        'Automated HLS manifest contains an external resource reference.',
      );
    }
    const base = new URL(`https://training.invalid/${baseReference}`);
    const resolved = new URL(child, base);
    return resolved.pathname.replace(/^\//, '');
  }

  resolveManualReference(baseReference: string, child: string): string {
    const resolved = new URL(child, baseReference);
    if (
      resolved.protocol !== 'https:' ||
      resolved.username ||
      resolved.password
    ) {
      throw new BadRequestException('Manual HLS resource URL is invalid.');
    }
    return resolved.toString();
  }

  private hlsOutput(
    width: number,
    height: number,
    maxBitrate: number,
    nameModifier: string,
  ) {
    return {
      NameModifier: nameModifier,
      ContainerSettings: { Container: 'M3U8' as const, M3u8Settings: {} },
      VideoDescription: {
        Width: width,
        Height: height,
        RespondToAfd: 'NONE' as const,
        ScalingBehavior: 'DEFAULT' as const,
        Sharpness: 50,
        CodecSettings: {
          Codec: 'H_264' as const,
          H264Settings: {
            RateControlMode: 'QVBR' as const,
            MaxBitrate: maxBitrate,
            QvbrSettings: { QvbrQualityLevel: 8 },
            FramerateControl: 'INITIALIZE_FROM_SOURCE' as const,
            GopSize: 2,
            GopSizeUnits: 'SECONDS' as const,
            SceneChangeDetect: 'TRANSITION_DETECTION' as const,
          },
        },
      },
      AudioDescriptions: [
        {
          AudioSourceName: 'Default Audio',
          CodecSettings: {
            Codec: 'AAC' as const,
            AacSettings: {
              Bitrate: 128000,
              CodingMode: 'CODING_MODE_2_0' as const,
              SampleRate: 48000,
            },
          },
        },
      ],
    };
  }

  private async deletePrefix(prefix: string): Promise<void> {
    const keys = await this.listPrefixKeys(prefix);
    await this.deleteKeys(keys);
  }

  private async listPrefixKeys(prefix: string): Promise<string[]> {
    const { client, bucket } = await this.s3();
    let continuationToken: string | undefined;
    const keys: string[] = [];
    do {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );
      for (const object of response.Contents ?? []) {
        if (object.Key) keys.push(object.Key);
      }
      continuationToken = response.IsTruncated
        ? response.NextContinuationToken
        : undefined;
    } while (continuationToken);
    return keys;
  }

  private async deleteKeys(keys: readonly string[]): Promise<void> {
    if (keys.length === 0) return;
    const { client, bucket } = await this.s3();
    for (let index = 0; index < keys.length; index += 1000) {
      const batch = keys.slice(index, index + 1000);
      const response = await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Quiet: true,
            Objects: batch.map((Key) => ({ Key })),
          },
        }),
      );
      if ((response.Errors ?? []).length > 0) {
        throw new ServiceUnavailableException(
          'One or more AWS training media objects could not be deleted.',
        );
      }
    }
  }

  private async findManifest(assetId: string): Promise<string | undefined> {
    const { client, bucket } = await this.s3();
    const prefix = `training/hls/${assetId}/`;
    const response = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }),
    );
    return (response.Contents ?? [])
      .map((object) => object.Key)
      .filter((key): key is string => Boolean(key?.endsWith('.m3u8')))
      .sort((left, right) => left.length - right.length)[0];
  }

  private async sumPrefix(prefix: string): Promise<number> {
    const { client, bucket } = await this.s3();
    let continuationToken: string | undefined;
    let total = 0;
    do {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );
      for (const object of response.Contents ?? []) {
        total += Number(object.Size ?? 0);
      }
      continuationToken = response.IsTruncated
        ? response.NextContinuationToken
        : undefined;
    } while (continuationToken);
    return total;
  }

  private async cloudFrontUrlForKey(storageKey: string): Promise<string> {
    const base = await this.cloudFrontBaseUrl();
    const encoded = storageKey.split('/').map(encodeURIComponent).join('/');
    return new URL(encoded, `${base.replace(/\/$/, '')}/`).toString();
  }

  private async fetchSignedCloudFrontUrl(url: string): Promise<Response> {
    const [keyPairId, privateKeyBase64, ttlSeconds] = await Promise.all([
      this.requiredStringSetting(
        'trainings.video.aws.cloudfront_key_pair_id',
        'CloudFront key pair ID is not configured.',
      ),
      this.settings.resolveSecret(
        'trainings.video.aws.cloudfront_private_key_base64',
      ),
      this.numberSetting('trainings.video.aws.delivery_url_ttl_seconds', 300),
    ]);
    if (!privateKeyBase64?.trim()) {
      throw new ServiceUnavailableException(
        'CloudFront private signing key is not configured.',
      );
    }
    let privateKey: string;
    try {
      privateKey = Buffer.from(privateKeyBase64.trim(), 'base64').toString(
        'utf8',
      );
    } catch {
      throw new ServiceUnavailableException(
        'CloudFront private signing key is invalid.',
      );
    }
    if (!privateKey.includes('PRIVATE KEY')) {
      throw new ServiceUnavailableException(
        'CloudFront private signing key is invalid.',
      );
    }

    const signed = getCloudFrontSignedUrl({
      url,
      keyPairId,
      privateKey,
      dateLessThan: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    });
    let response: Response;
    try {
      response = await fetch(signed, {
        method: 'GET',
        redirect: 'error',
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'CloudFront training resource is temporarily unavailable.',
      );
    }
    if (!response.ok || !response.body) {
      throw new ServiceUnavailableException(
        'CloudFront training resource could not be loaded.',
      );
    }
    return response;
  }

  private async cloudFrontBaseUrl(): Promise<string> {
    const raw = await this.requiredStringSetting(
      'trainings.video.aws.cloudfront_base_url',
      'CloudFront base URL is not configured.',
    );
    const base = this.parseHttpsUrl(raw, 'CloudFront base URL is invalid.');
    base.search = '';
    base.hash = '';
    return base.toString().replace(/\/$/, '');
  }

  private async assertManualWithinConfiguredBase(target: URL): Promise<void> {
    const base = new URL(await this.cloudFrontBaseUrl());
    const basePrefix = base.pathname.endsWith('/')
      ? base.pathname
      : `${base.pathname}/`;
    if (
      target.origin !== base.origin ||
      (target.pathname !== base.pathname &&
        !target.pathname.startsWith(basePrefix))
    ) {
      throw new BadRequestException(
        'Manual HLS URL must be inside the configured CloudFront distribution.',
      );
    }
  }

  private parseHttpsUrl(raw: string, message: string): URL {
    let value: URL;
    try {
      value = new URL(raw);
    } catch {
      throw new BadRequestException(message);
    }
    if (value.protocol !== 'https:' || value.username || value.password) {
      throw new BadRequestException(message);
    }
    return value;
  }

  private async s3(): Promise<{ client: S3Client; bucket: string }> {
    const aws = await this.awsConfiguration();
    return {
      client: new S3Client({
        region: aws.region,
        ...(aws.credentials ? { credentials: aws.credentials } : {}),
      }),
      bucket: aws.bucket,
    };
  }

  private async awsConfiguration(): Promise<AwsConfiguration> {
    const [regionValue, bucketValue, sourceValue] = await Promise.all([
      this.settings.resolveConfiguredValue('files.aws_s3.region'),
      this.settings.resolveConfiguredValue('files.aws_s3.bucket'),
      this.settings.resolveValue('files.aws_s3.credential_source'),
    ]);
    const region =
      (typeof regionValue === 'string' ? regionValue.trim() : '') ||
      this.config.get<string>('FILES_S3_REGION') ||
      '';
    const bucket =
      (typeof bucketValue === 'string' ? bucketValue.trim() : '') ||
      this.config.get<string>('FILES_S3_BUCKET') ||
      '';
    if (!region || !bucket) {
      throw new ServiceUnavailableException(
        'AWS S3 region and bucket must be configured before using training video delivery.',
      );
    }

    if (sourceValue !== 'stored') return { region, bucket };
    const [accessKeyId, secretAccessKey, sessionToken] = await Promise.all([
      this.settings.resolveSecret('files.aws_s3.access_key_id'),
      this.settings.resolveSecret('files.aws_s3.secret_access_key'),
      this.settings.resolveSecret('files.aws_s3.session_token'),
    ]);
    if (!accessKeyId?.trim() || !secretAccessKey?.trim()) {
      throw new ServiceUnavailableException(
        'Stored AWS credentials require both Access Key ID and Secret Access Key.',
      );
    }
    return {
      region,
      bucket,
      credentials: {
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
        ...(sessionToken?.trim() ? { sessionToken: sessionToken.trim() } : {}),
      },
    };
  }

  private async readText(body: unknown): Promise<string> {
    if (
      typeof body === 'object' &&
      body !== null &&
      'transformToString' in body &&
      typeof (body as { transformToString?: unknown }).transformToString ===
        'function'
    ) {
      return (
        body as { transformToString: () => Promise<string> }
      ).transformToString();
    }
    if (this.isReadable(body)) {
      const chunks: Buffer[] = [];
      for await (const chunk of body as AsyncIterable<unknown>) {
        if (typeof chunk === 'string' || chunk instanceof Uint8Array) {
          chunks.push(Buffer.from(chunk));
        }
      }
      return Buffer.concat(chunks).toString('utf8');
    }
    throw new ServiceUnavailableException('AWS returned an unsupported body.');
  }

  private isReadable(value: unknown): value is Readable {
    return (
      typeof value === 'object' &&
      value !== null &&
      'pipe' in value &&
      typeof (value as { pipe?: unknown }).pipe === 'function'
    );
  }

  private async stringSetting(key: string): Promise<string> {
    const value = await this.settings.resolveValue(key);
    return typeof value === 'string' ? value.trim() : '';
  }

  private async requiredStringSetting(
    key: string,
    message: string,
  ): Promise<string> {
    const value = await this.stringSetting(key);
    if (!value) throw new ServiceUnavailableException(message);
    return value;
  }

  private async numberSetting(key: string, fallback: number): Promise<number> {
    const value = await this.settings.resolveValue(key);
    return typeof value === 'number' ? value : fallback;
  }
}
