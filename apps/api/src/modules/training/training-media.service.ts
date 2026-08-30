import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomUUID,
} from 'node:crypto';
import path from 'node:path';
import type { Readable } from 'node:stream';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Prisma } from '../../generated/prisma/client';
import {
  AccountScope,
  FileAssetKind,
  FileAssetStatus,
  TrainingContentStatus,
  TrainingLessonContentType,
  TrainingStorageProvider,
  TrainingVideoAssetStatus,
  TrainingVideoDeliveryMode,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { FileStorageService } from '../files/storage/file-storage.service';
import { SettingsService } from '../settings/settings.service';
import type {
  AttachTrainingSlidesDto,
  CompleteAutomatedTrainingVideoDto,
  InitAutomatedTrainingVideoDto,
  SetManualTrainingVideoDto,
  SetTrainingVideoThumbnailDto,
} from './dto/training-media.dto';
import { TrainingAwsMediaService } from './training-aws-media.service';
import { TrainingEntitlementService } from './training-entitlement.service';
import {
  TrainingLocalMediaService,
  type TrainingVideoRange,
} from './training-local-media.service';

const adminVideoSelect = {
  id: true,
  provider: true,
  status: true,
  deliveryMode: true,
  originalFilename: true,
  mimeType: true,
  sizeBytes: true,
  processedSizeBytes: true,
  checksum: true,
  durationSeconds: true,
  width: true,
  height: true,
  sourceReference: true,
  playbackManifestReference: true,
  posterReference: true,
  mediaConvertJobId: true,
  failureCode: true,
  failureMessage: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TrainingVideoAssetSelect;

interface LocalVideoInput {
  filename: string;
  sizeBytes: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
}

interface MediaTokenPayload {
  v: 1;
  userId: string;
  companyId: string;
  courseId: string;
  lessonId: string;
  assetId: string;
  source: 'AUTO' | 'MANUAL';
  reference: string;
  exp: number;
}

@Injectable()
export class TrainingMediaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TrainingMediaService.name);
  private readonly tokenKey: Buffer;
  private pollTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: TrainingEntitlementService,
    private readonly settings: SettingsService,
    private readonly storage: FileStorageService,
    private readonly local: TrainingLocalMediaService,
    private readonly aws: TrainingAwsMediaService,
    config: ConfigService,
  ) {
    this.tokenKey = Buffer.from(
      config.getOrThrow<string>('SETTINGS_ENCRYPTION_KEY'),
      'base64',
    );
    if (this.tokenKey.length !== 32) {
      throw new Error('SETTINGS_ENCRYPTION_KEY must decode to 32 bytes.');
    }
  }

  onModuleInit(): void {
    this.pollTimer = setInterval(() => {
      void this.refreshPendingAssets().catch((error: unknown) => {
        this.logger.warn(
          `Training media lifecycle poll failed: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      });
    }, 30_000);
    this.pollTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
  }

  async getAdminMedia(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
  ) {
    this.assertPlatformAdministrator(principal);
    let lesson = await this.adminLesson(courseId, sectionId, lessonId);
    let processing: {
      phase: 'PROCESSING' | 'FINALIZING';
      percent: number | null;
    } | null = null;
    if (
      lesson.videoAsset?.status === TrainingVideoAssetStatus.PROCESSING &&
      lesson.videoAsset.deliveryMode === TrainingVideoDeliveryMode.AWS_AUTOMATED
    ) {
      const inspection = await this.refreshAsset(lesson.videoAsset.id).catch(
        () => null,
      );
      if (inspection?.state === 'PROCESSING') {
        processing = {
          phase:
            (inspection.progressPercent ?? 0) >= 99
              ? 'FINALIZING'
              : 'PROCESSING',
          percent: inspection.progressPercent ?? null,
        };
      }
      lesson = await this.adminLesson(courseId, sectionId, lessonId);
    }
    return this.presentAdminMedia(lesson, processing);
  }

  async initAutomatedVideo(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    input: InitAutomatedTrainingVideoDto,
  ) {
    this.assertPlatformAdministrator(principal);
    await this.assertAdminLessonExists(courseId, sectionId, lessonId);
    await this.assertVideoSize(input.sizeBytes);

    const assetId = randomUUID();
    const sourceReference = `training/source/${assetId}/source.mp4`;
    const originalFilename = this.sanitizeFilename(input.filename);

    const previousAssetId = await this.prisma.$transaction(
      async (transaction) => {
        const existing = await transaction.trainingVideoLesson.findUnique({
          where: { id: lessonId },
          select: { videoAssetId: true },
        });
        if (!existing) {
          throw new NotFoundException('Training lesson was not found.');
        }

        await transaction.trainingVideoAsset.create({
          data: {
            id: assetId,
            provider: TrainingStorageProvider.AWS_S3,
            deliveryMode: TrainingVideoDeliveryMode.AWS_AUTOMATED,
            status: TrainingVideoAssetStatus.UPLOADING,
            originalFilename,
            mimeType: 'video/mp4',
            sizeBytes: BigInt(input.sizeBytes),
            durationSeconds: input.durationSeconds,
            width: input.width,
            height: input.height,
            sourceReference,
          },
        });
        await transaction.trainingVideoLesson.update({
          where: { id: lessonId },
          data: {
            contentType: TrainingLessonContentType.VIDEO,
            videoAssetId: assetId,
            documentAssetId: null,
            documentPageCount: null,
            articleContentTranslations: {},
          },
        });
        await transaction.auditLog.create({
          data: {
            actorUserId: principal.userId,
            action: AUDIT_ACTIONS.TRAINING_VIDEO_UPLOAD_CREATED,
            targetType: 'training_video_asset',
            targetId: assetId,
            metadata: {
              courseId,
              sectionId,
              lessonId,
              deliveryMode: TrainingVideoDeliveryMode.AWS_AUTOMATED,
            },
          },
        });
        return existing.videoAssetId;
      },
    );

    await this.cleanupDetachedVideo(previousAssetId, assetId);
    const signed = await this.aws.createUploadUrl(sourceReference);
    return {
      assetId,
      uploadUrl: signed.uploadUrl,
      expiresInSeconds: signed.expiresInSeconds,
      requiredHeaders: { 'Content-Type': 'video/mp4' as const },
    };
  }

  async completeAutomatedVideo(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    input: CompleteAutomatedTrainingVideoDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const lesson = await this.adminLesson(courseId, sectionId, lessonId);
    const asset = lesson.videoAsset;
    if (
      !asset ||
      asset.id !== input.assetId ||
      asset.deliveryMode !== TrainingVideoDeliveryMode.AWS_AUTOMATED ||
      asset.status !== TrainingVideoAssetStatus.UPLOADING ||
      asset.sizeBytes === null
    ) {
      throw new BadRequestException(
        'The automated video upload is not in a completable state.',
      );
    }

    await this.aws.verifyUploadedObject(
      asset.sourceReference,
      Number(asset.sizeBytes),
    );

    let jobId: string;
    try {
      jobId = await this.aws.createMediaConvertJob({
        assetId: asset.id,
        sourceReference: asset.sourceReference,
      });
    } catch (error) {
      await this.prisma.trainingVideoAsset.update({
        where: { id: asset.id },
        data: {
          status: TrainingVideoAssetStatus.FAILED,
          failureCode: 'JOB_CREATION_FAILED',
          failureMessage:
            error instanceof Error ? error.message.slice(0, 1000) : null,
        },
      });
      throw error;
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.trainingVideoAsset.update({
        where: { id: asset.id },
        data: {
          status: TrainingVideoAssetStatus.PROCESSING,
          mediaConvertJobId: jobId,
          failureCode: null,
          failureMessage: null,
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_VIDEO_ASSET_UPDATED,
          targetType: 'training_video_asset',
          targetId: asset.id,
          metadata: {
            courseId,
            sectionId,
            lessonId,
            status: TrainingVideoAssetStatus.PROCESSING,
          },
        },
      });
    });

    return this.getAdminMedia(principal, courseId, sectionId, lessonId);
  }

  async retryAutomatedVideo(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
  ) {
    this.assertPlatformAdministrator(principal);
    const lesson = await this.adminLesson(courseId, sectionId, lessonId);
    const asset = lesson.videoAsset;
    if (
      !asset ||
      asset.deliveryMode !== TrainingVideoDeliveryMode.AWS_AUTOMATED ||
      asset.status !== TrainingVideoAssetStatus.FAILED
    ) {
      throw new BadRequestException(
        'Only a failed automated AWS video can be retried.',
      );
    }

    await this.aws.verifyUploadedObject(
      asset.sourceReference,
      Number(asset.sizeBytes ?? 0),
    );
    await this.aws.clearAutomatedOutputs(asset.id);
    const jobId = await this.aws.createMediaConvertJob({
      assetId: asset.id,
      sourceReference: asset.sourceReference,
    });
    await this.prisma.trainingVideoAsset.update({
      where: { id: asset.id },
      data: {
        status: TrainingVideoAssetStatus.PROCESSING,
        mediaConvertJobId: jobId,
        playbackManifestReference: null,
        processedSizeBytes: null,
        failureCode: null,
        failureMessage: null,
      },
    });
    return this.getAdminMedia(principal, courseId, sectionId, lessonId);
  }

  async setManualVideo(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    input: SetManualTrainingVideoDto,
  ) {
    this.assertPlatformAdministrator(principal);
    await this.assertAdminLessonExists(courseId, sectionId, lessonId);
    const playbackUrl = await this.aws.validateManualPlaybackUrl(
      input.playbackUrl.trim(),
    );
    if (input.sourceSizeBytes !== undefined) {
      await this.assertVideoSize(input.sourceSizeBytes);
    }

    const assetId = randomUUID();
    const previousAssetId = await this.prisma.$transaction(
      async (transaction) => {
        const existing = await transaction.trainingVideoLesson.findUnique({
          where: { id: lessonId },
          select: { videoAssetId: true },
        });
        if (!existing) {
          throw new NotFoundException('Training lesson was not found.');
        }
        await transaction.trainingVideoAsset.create({
          data: {
            id: assetId,
            provider: TrainingStorageProvider.AWS_S3,
            deliveryMode: TrainingVideoDeliveryMode.AWS_MANUAL,
            status: TrainingVideoAssetStatus.READY,
            originalFilename: this.sanitizeFilename(
              input.filename?.trim() || 'manual-hls.m3u8',
            ),
            mimeType: 'application/vnd.apple.mpegurl',
            sizeBytes:
              input.sourceSizeBytes === undefined
                ? null
                : BigInt(input.sourceSizeBytes),
            processedSizeBytes:
              input.processedSizeBytes === undefined
                ? null
                : BigInt(input.processedSizeBytes),
            durationSeconds: input.durationSeconds,
            width: input.width,
            height: input.height,
            sourceReference: playbackUrl,
            playbackManifestReference: playbackUrl,
          },
        });
        await transaction.trainingVideoLesson.update({
          where: { id: lessonId },
          data: {
            contentType: TrainingLessonContentType.VIDEO,
            videoAssetId: assetId,
            documentAssetId: null,
            documentPageCount: null,
            articleContentTranslations: {},
          },
        });
        await transaction.auditLog.create({
          data: {
            actorUserId: principal.userId,
            action: AUDIT_ACTIONS.TRAINING_VIDEO_ASSET_UPDATED,
            targetType: 'training_video_asset',
            targetId: assetId,
            metadata: {
              courseId,
              sectionId,
              lessonId,
              deliveryMode: TrainingVideoDeliveryMode.AWS_MANUAL,
              status: TrainingVideoAssetStatus.READY,
            },
          },
        });
        return existing.videoAssetId;
      },
    );
    await this.cleanupDetachedVideo(previousAssetId, assetId);
    return this.getAdminMedia(principal, courseId, sectionId, lessonId);
  }

  async setLocalVideo(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    source: Readable,
    input: LocalVideoInput,
  ) {
    this.assertPlatformAdministrator(principal);
    await this.assertAdminLessonExists(courseId, sectionId, lessonId);
    if (
      (await this.settings.resolveValue(
        'trainings.video.local_upload_enabled',
      )) !== true
    ) {
      throw new ForbiddenException(
        'Local training video uploads are disabled.',
      );
    }
    const maxBytes = await this.maxUploadBytes();
    await this.assertVideoSize(input.sizeBytes);
    const stored = await this.local.store(source, input.sizeBytes, maxBytes);
    const assetId = randomUUID();

    try {
      const previousAssetId = await this.prisma.$transaction(
        async (transaction) => {
          const existing = await transaction.trainingVideoLesson.findUnique({
            where: { id: lessonId },
            select: { videoAssetId: true },
          });
          if (!existing) {
            throw new NotFoundException('Training lesson was not found.');
          }
          await transaction.trainingVideoAsset.create({
            data: {
              id: assetId,
              provider: TrainingStorageProvider.LOCAL,
              deliveryMode: TrainingVideoDeliveryMode.LOCAL,
              status: TrainingVideoAssetStatus.READY,
              originalFilename: this.sanitizeFilename(input.filename),
              mimeType: 'video/mp4',
              sizeBytes: BigInt(stored.sizeBytes),
              checksum: stored.checksum,
              durationSeconds: input.durationSeconds,
              width: input.width,
              height: input.height,
              sourceReference: stored.storageKey,
            },
          });
          await transaction.trainingVideoLesson.update({
            where: { id: lessonId },
            data: {
              contentType: TrainingLessonContentType.VIDEO,
              videoAssetId: assetId,
              documentAssetId: null,
              documentPageCount: null,
              articleContentTranslations: {},
            },
          });
          await transaction.auditLog.create({
            data: {
              actorUserId: principal.userId,
              action: AUDIT_ACTIONS.TRAINING_VIDEO_UPLOAD_CREATED,
              targetType: 'training_video_asset',
              targetId: assetId,
              metadata: {
                courseId,
                sectionId,
                lessonId,
                deliveryMode: TrainingVideoDeliveryMode.LOCAL,
                sizeBytes: stored.sizeBytes,
              },
            },
          });
          return existing.videoAssetId;
        },
      );
      await this.cleanupDetachedVideo(previousAssetId, assetId);
    } catch (error) {
      await this.local.delete(stored.storageKey).catch(() => undefined);
      throw error;
    }

    return this.getAdminMedia(principal, courseId, sectionId, lessonId);
  }

  async setVideoThumbnail(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    input: SetTrainingVideoThumbnailDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const lesson = await this.adminLesson(courseId, sectionId, lessonId);
    if (!lesson.videoAsset) {
      throw new BadRequestException(
        'Attach a video before adding a thumbnail.',
      );
    }
    const file = await this.prisma.fileAsset.findFirst({
      where: {
        id: input.fileAssetId,
        accountScope: AccountScope.PLATFORM,
        companyId: null,
        kind: FileAssetKind.IMAGE,
        status: FileAssetStatus.READY,
        mimeType: { in: ['image/jpeg', 'image/png', 'image/webp'] },
      },
      select: { id: true },
    });
    if (!file) {
      throw new BadRequestException(
        'Video thumbnails must use a ready platform image asset.',
      );
    }
    const previousPoster = lesson.videoAsset.posterReference;
    await this.prisma.trainingVideoAsset.update({
      where: { id: lesson.videoAsset.id },
      data: { posterReference: `file:${file.id}` },
    });
    await this.cleanupDetachedPoster(previousPoster, file.id);
    return this.getAdminMedia(principal, courseId, sectionId, lessonId);
  }

  async attachDocument(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    input: AttachTrainingSlidesDto,
  ) {
    this.assertPlatformAdministrator(principal);
    await this.assertAdminLessonExists(courseId, sectionId, lessonId);
    const asset = await this.prisma.fileAsset.findFirst({
      where: {
        id: input.fileAssetId,
        accountScope: AccountScope.PLATFORM,
        companyId: null,
        kind: FileAssetKind.DOCUMENT,
        mimeType: 'application/pdf',
        status: FileAssetStatus.READY,
      },
      select: { id: true },
    });
    if (!asset) {
      throw new BadRequestException(
        'Document content must use a ready platform-scoped PDF file asset.',
      );
    }

    const previousAssetId = await this.prisma.$transaction(
      async (transaction) => {
        const existing = await transaction.trainingVideoLesson.findUnique({
          where: { id: lessonId },
          select: { videoAssetId: true },
        });
        if (!existing) {
          throw new NotFoundException('Training lesson was not found.');
        }
        await transaction.trainingVideoLesson.update({
          where: { id: lessonId },
          data: {
            contentType: TrainingLessonContentType.DOCUMENT,
            videoAssetId: null,
            documentAssetId: asset.id,
            documentPageCount: input.pageCount,
            articleContentTranslations: {},
          },
        });
        await transaction.auditLog.create({
          data: {
            actorUserId: principal.userId,
            action: 'training.lesson.media_updated',
            targetType: 'training_lesson',
            targetId: lessonId,
            metadata: {
              courseId,
              sectionId,
              contentType: TrainingLessonContentType.DOCUMENT,
              pageCount: input.pageCount,
            },
          },
        });
        return existing.videoAssetId;
      },
    );
    await this.cleanupDetachedVideo(previousAssetId, null);
    return this.getAdminMedia(principal, courseId, sectionId, lessonId);
  }

  async deleteVideo(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
  ) {
    this.assertPlatformAdministrator(principal);
    const lesson = await this.adminLesson(courseId, sectionId, lessonId);
    const asset = lesson.videoAsset;
    if (!asset) {
      throw new NotFoundException('Training video was not found.');
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.trainingVideoLesson.update({
        where: { id: lessonId },
        data: { videoAssetId: null },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_VIDEO_ASSET_UPDATED,
          targetType: 'training_video_asset',
          targetId: asset.id,
          metadata: { courseId, sectionId, lessonId, deleted: true },
        },
      });
    });

    await this.permanentlyDeleteVideoAsset(asset);
    return this.getAdminMedia(principal, courseId, sectionId, lessonId);
  }

  async clearMedia(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
  ) {
    this.assertPlatformAdministrator(principal);
    await this.assertAdminLessonExists(courseId, sectionId, lessonId);
    const previousAssetId = await this.prisma.$transaction(
      async (transaction) => {
        const existing = await transaction.trainingVideoLesson.findUnique({
          where: { id: lessonId },
          select: { videoAssetId: true },
        });
        if (!existing) {
          throw new NotFoundException('Training lesson was not found.');
        }
        await transaction.trainingVideoLesson.update({
          where: { id: lessonId },
          data: {
            contentType: null,
            videoAssetId: null,
            documentAssetId: null,
            documentPageCount: null,
            articleContentTranslations: {},
          },
        });
        await transaction.auditLog.create({
          data: {
            actorUserId: principal.userId,
            action: 'training.lesson.media_cleared',
            targetType: 'training_lesson',
            targetId: lessonId,
            metadata: { courseId, sectionId },
          },
        });
        return existing.videoAssetId;
      },
    );
    await this.cleanupDetachedVideo(previousAssetId, null);
    return this.getAdminMedia(principal, courseId, sectionId, lessonId);
  }

  async getCustomerLesson(
    principal: AuthenticatedPrincipal,
    slug: string,
    lessonId: string,
  ) {
    let lesson = await this.customerLesson(principal, slug, lessonId);
    if (
      lesson.videoAsset?.status === TrainingVideoAssetStatus.PROCESSING &&
      lesson.videoAsset.deliveryMode === TrainingVideoDeliveryMode.AWS_AUTOMATED
    ) {
      await this.refreshAsset(lesson.videoAsset.id).catch(() => undefined);
      lesson = await this.customerLesson(principal, slug, lessonId);
    }

    let media:
      | {
          type: 'VIDEO';
          deliveryMode: TrainingVideoDeliveryMode;
          durationSeconds: number | null;
          width: number | null;
          height: number | null;
          sizeBytes: number | null;
          processedSizeBytes: number | null;
          playbackKind: 'HLS' | 'MP4';
          playbackPath: string;
        }
      | {
          type: 'DOCUMENT';
          pageCount: number;
          sizeBytes: number;
          contentPath: string;
        }
      | null = null;

    if (
      lesson.contentType === TrainingLessonContentType.DOCUMENT &&
      lesson.documentAsset?.status === FileAssetStatus.READY &&
      lesson.documentPageCount
    ) {
      media = {
        type: 'DOCUMENT',
        pageCount: lesson.documentPageCount,
        sizeBytes: lesson.documentAsset.sizeBytes,
        contentPath: `/training/catalog/${encodeURIComponent(slug)}/lessons/${lesson.id}/slides`,
      };
    } else if (
      lesson.contentType === TrainingLessonContentType.VIDEO &&
      lesson.videoAsset?.status === TrainingVideoAssetStatus.READY
    ) {
      const video = lesson.videoAsset;
      media = {
        type: 'VIDEO',
        deliveryMode: video.deliveryMode,
        durationSeconds: video.durationSeconds,
        width: video.width,
        height: video.height,
        sizeBytes: video.sizeBytes === null ? null : Number(video.sizeBytes),
        processedSizeBytes:
          video.processedSizeBytes === null
            ? null
            : Number(video.processedSizeBytes),
        playbackKind:
          video.deliveryMode === TrainingVideoDeliveryMode.LOCAL
            ? 'MP4'
            : 'HLS',
        playbackPath: `/training/catalog/${encodeURIComponent(slug)}/lessons/${lesson.id}/${
          video.deliveryMode === TrainingVideoDeliveryMode.LOCAL
            ? 'video'
            : 'hls'
        }`,
      };
    }

    const content =
      lesson.contentType === TrainingLessonContentType.ARTICLE
        ? {
            type: 'ARTICLE' as const,
            contentTranslations: lesson.articleContentTranslations,
          }
        : media;
    const resources = await this.prisma.trainingLessonResource.findMany({
      where: {
        lessonId: lesson.id,
        customerVisible: true,
        fileAsset: { status: FileAssetStatus.READY },
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        title: true,
        titleTranslations: true,
        fileAsset: {
          select: {
            originalFilename: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
      },
    });

    return {
      id: lesson.id,
      courseId: lesson.courseId,
      sectionId: lesson.sectionId,
      title: lesson.title,
      titleTranslations: lesson.titleTranslations,
      description: lesson.description,
      descriptionTranslations: lesson.descriptionTranslations,
      richDescriptionTranslations: lesson.richDescriptionTranslations,
      contentType: lesson.contentType,
      content,
      media,
      resources: resources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        titleTranslations: resource.titleTranslations,
        originalFilename: resource.fileAsset.originalFilename,
        mimeType: resource.fileAsset.mimeType,
        sizeBytes: resource.fileAsset.sizeBytes,
        downloadPath: `/training/catalog/${encodeURIComponent(slug)}/lessons/${lesson.id}/resources/${resource.id}`,
      })),
    };
  }

  async openCustomerResource(
    principal: AuthenticatedPrincipal,
    slug: string,
    lessonId: string,
    resourceId: string,
  ) {
    const lesson = await this.customerLesson(principal, slug, lessonId);
    const resource = await this.prisma.trainingLessonResource.findFirst({
      where: {
        id: resourceId,
        lessonId: lesson.id,
        customerVisible: true,
        fileAsset: { status: FileAssetStatus.READY },
      },
      select: {
        fileAsset: {
          select: {
            storageProvider: true,
            storageKey: true,
            originalFilename: true,
            mimeType: true,
            sizeBytes: true,
            sha256: true,
            status: true,
          },
        },
      },
    });
    if (!resource || resource.fileAsset.status !== FileAssetStatus.READY) {
      throw new NotFoundException('Training lesson resource was not found.');
    }
    const stream = await this.storage.open(
      resource.fileAsset.storageProvider,
      resource.fileAsset.storageKey,
    );
    return {
      stream,
      filename: resource.fileAsset.originalFilename,
      mimeType: resource.fileAsset.mimeType,
      sizeBytes: resource.fileAsset.sizeBytes,
      sha256: resource.fileAsset.sha256,
    };
  }

  async openLocalVideo(
    principal: AuthenticatedPrincipal,
    slug: string,
    lessonId: string,
    rangeHeader?: string,
  ): Promise<TrainingVideoRange> {
    const lesson = await this.customerLesson(principal, slug, lessonId);
    const asset = lesson.videoAsset;
    if (
      lesson.contentType !== TrainingLessonContentType.VIDEO ||
      !asset ||
      asset.status !== TrainingVideoAssetStatus.READY ||
      asset.deliveryMode !== TrainingVideoDeliveryMode.LOCAL ||
      asset.provider !== TrainingStorageProvider.LOCAL
    ) {
      throw new NotFoundException('Training video was not found.');
    }
    return this.local.openRange(asset.sourceReference, rangeHeader);
  }

  async openDocument(
    principal: AuthenticatedPrincipal,
    slug: string,
    lessonId: string,
  ) {
    const lesson = await this.customerLesson(principal, slug, lessonId);
    if (
      lesson.contentType !== TrainingLessonContentType.DOCUMENT ||
      !lesson.documentAsset ||
      lesson.documentAsset.status !== FileAssetStatus.READY ||
      lesson.documentAsset.mimeType !== 'application/pdf'
    ) {
      throw new NotFoundException('Training slides were not found.');
    }
    const stream = await this.storage.open(
      lesson.documentAsset.storageProvider,
      lesson.documentAsset.storageKey,
    );
    return {
      stream,
      sizeBytes: lesson.documentAsset.sizeBytes,
      sha256: lesson.documentAsset.sha256,
    };
  }

  async openHlsManifest(
    principal: AuthenticatedPrincipal,
    slug: string,
    lessonId: string,
  ): Promise<string> {
    const lesson = await this.customerLesson(principal, slug, lessonId);
    const asset = lesson.videoAsset;
    if (
      lesson.contentType !== TrainingLessonContentType.VIDEO ||
      !asset ||
      asset.status !== TrainingVideoAssetStatus.READY ||
      asset.deliveryMode === TrainingVideoDeliveryMode.LOCAL ||
      !asset.playbackManifestReference
    ) {
      throw new NotFoundException('Training HLS stream was not found.');
    }

    const source =
      asset.deliveryMode === TrainingVideoDeliveryMode.AWS_AUTOMATED
        ? 'AUTO'
        : 'MANUAL';
    const manifest =
      source === 'AUTO'
        ? await this.aws.readAutomatedManifest(asset.playbackManifestReference)
        : await (
            await this.aws.fetchManualResource(asset.playbackManifestReference)
          ).text();

    return this.rewriteManifest(manifest, {
      principal,
      courseId: lesson.courseId,
      lessonId: lesson.id,
      assetId: asset.id,
      source,
      baseReference: asset.playbackManifestReference,
    });
  }

  async openHlsResource(
    principal: AuthenticatedPrincipal,
    slug: string,
    lessonId: string,
    token: string,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const payload = this.decryptMediaToken(token);
    const lesson = await this.customerLesson(principal, slug, lessonId);
    const asset = lesson.videoAsset;

    if (
      payload.userId !== principal.userId ||
      payload.companyId !== principal.companyId ||
      payload.courseId !== lesson.courseId ||
      payload.lessonId !== lesson.id ||
      !asset ||
      payload.assetId !== asset.id ||
      asset.status !== TrainingVideoAssetStatus.READY ||
      asset.deliveryMode === TrainingVideoDeliveryMode.LOCAL
    ) {
      throw new NotFoundException('Training media resource was not found.');
    }

    if (payload.source === 'AUTO') {
      const prefix = `training/hls/${asset.id}/`;
      if (!payload.reference.startsWith(prefix)) {
        throw new NotFoundException('Training media resource was not found.');
      }
    }

    const response =
      payload.source === 'AUTO'
        ? await this.aws.fetchAutomatedResource(payload.reference)
        : await this.aws.fetchManualResource(payload.reference);
    const contentType =
      response.headers.get('content-type') ?? 'application/octet-stream';
    const buffer = Buffer.from(await response.arrayBuffer());

    if (
      contentType.includes('mpegurl') ||
      payload.reference.toLowerCase().includes('.m3u8')
    ) {
      const rewritten = this.rewriteManifest(buffer.toString('utf8'), {
        principal,
        courseId: lesson.courseId,
        lessonId: lesson.id,
        assetId: asset.id,
        source: payload.source,
        baseReference: payload.reference,
      });
      return {
        buffer: Buffer.from(rewritten, 'utf8'),
        contentType: 'application/vnd.apple.mpegurl',
      };
    }

    return { buffer, contentType };
  }

  private async refreshPendingAssets(): Promise<void> {
    const assets = await this.prisma.trainingVideoAsset.findMany({
      where: {
        status: TrainingVideoAssetStatus.PROCESSING,
        deliveryMode: TrainingVideoDeliveryMode.AWS_AUTOMATED,
        mediaConvertJobId: { not: null },
      },
      select: { id: true },
      orderBy: { updatedAt: 'asc' },
      take: 20,
    });
    for (const asset of assets) {
      await this.refreshAsset(asset.id).catch((error: unknown) => {
        this.logger.warn(
          `MediaConvert refresh failed for ${asset.id}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      });
    }
  }

  private async refreshAsset(
    assetId: string,
  ): Promise<Awaited<
    ReturnType<TrainingAwsMediaService['inspectMediaConvertJob']>
  > | null> {
    const asset = await this.prisma.trainingVideoAsset.findUnique({
      where: { id: assetId },
      select: {
        id: true,
        status: true,
        deliveryMode: true,
        mediaConvertJobId: true,
      },
    });
    if (
      !asset ||
      asset.status !== TrainingVideoAssetStatus.PROCESSING ||
      asset.deliveryMode !== TrainingVideoDeliveryMode.AWS_AUTOMATED ||
      !asset.mediaConvertJobId
    ) {
      return null;
    }

    const inspection = await this.aws.inspectMediaConvertJob(
      asset.mediaConvertJobId,
      asset.id,
    );
    if (inspection.state === 'PROCESSING') return inspection;
    if (inspection.state === 'FAILED') {
      await this.prisma.trainingVideoAsset.update({
        where: { id: asset.id },
        data: {
          status: TrainingVideoAssetStatus.FAILED,
          failureCode:
            inspection.failureCode?.slice(0, 80) ?? 'PROCESSING_FAILED',
          failureMessage:
            inspection.failureMessage?.slice(0, 1000) ??
            'Video processing failed.',
        },
      });
      return inspection;
    }

    await this.prisma.trainingVideoAsset.update({
      where: { id: asset.id },
      data: {
        status: TrainingVideoAssetStatus.READY,
        playbackManifestReference: inspection.manifestReference,
        processedSizeBytes:
          inspection.processedSizeBytes === undefined
            ? undefined
            : BigInt(inspection.processedSizeBytes),
        ...(inspection.durationSeconds !== undefined
          ? { durationSeconds: inspection.durationSeconds }
          : {}),
        ...(inspection.width !== undefined ? { width: inspection.width } : {}),
        ...(inspection.height !== undefined
          ? { height: inspection.height }
          : {}),
        metadata: { hlsVariants: inspection.outputVariants ?? [] },
        failureCode: null,
        failureMessage: null,
      },
    });
    return inspection;
  }

  private async customerLesson(
    principal: AuthenticatedPrincipal,
    slug: string,
    lessonId: string,
  ) {
    const { courseId } = await this.entitlements.assertEntitledCourseBySlug(
      principal,
      slug,
    );
    const lesson = await this.prisma.trainingVideoLesson.findFirst({
      where: {
        id: lessonId,
        courseId,
        status: TrainingContentStatus.PUBLISHED,
        section: { status: TrainingContentStatus.PUBLISHED },
      },
      select: {
        id: true,
        courseId: true,
        sectionId: true,
        title: true,
        titleTranslations: true,
        description: true,
        descriptionTranslations: true,
        richDescriptionTranslations: true,
        contentType: true,
        articleContentTranslations: true,
        documentPageCount: true,
        videoAsset: { select: adminVideoSelect },
        documentAsset: {
          select: {
            id: true,
            storageProvider: true,
            storageKey: true,
            originalFilename: true,
            mimeType: true,
            sizeBytes: true,
            sha256: true,
            status: true,
          },
        },
      },
    });
    if (!lesson) {
      throw new NotFoundException('Training lesson was not found.');
    }
    return lesson;
  }

  private async adminLesson(
    courseId: string,
    sectionId: string,
    lessonId: string,
  ) {
    const lesson = await this.prisma.trainingVideoLesson.findFirst({
      where: { id: lessonId, courseId, sectionId },
      select: {
        id: true,
        contentType: true,
        articleContentTranslations: true,
        documentPageCount: true,
        videoAsset: { select: adminVideoSelect },
        documentAsset: {
          select: {
            id: true,
            originalFilename: true,
            sizeBytes: true,
            mimeType: true,
            status: true,
          },
        },
      },
    });
    if (!lesson) {
      throw new NotFoundException('Training lesson was not found.');
    }
    return lesson;
  }

  private presentAdminMedia(
    lesson: Awaited<ReturnType<TrainingMediaService['adminLesson']>>,
    processing: {
      phase: 'PROCESSING' | 'FINALIZING';
      percent: number | null;
    } | null = null,
  ) {
    const video = lesson.videoAsset
      ? {
          type: 'VIDEO' as const,
          assetId: lesson.videoAsset.id,
          deliveryMode: lesson.videoAsset.deliveryMode,
          status: lesson.videoAsset.status,
          originalFilename: lesson.videoAsset.originalFilename,
          mimeType: lesson.videoAsset.mimeType,
          sizeBytes:
            lesson.videoAsset.sizeBytes === null
              ? null
              : Number(lesson.videoAsset.sizeBytes),
          processedSizeBytes:
            lesson.videoAsset.processedSizeBytes === null
              ? null
              : Number(lesson.videoAsset.processedSizeBytes),
          durationSeconds: lesson.videoAsset.durationSeconds,
          width: lesson.videoAsset.width,
          height: lesson.videoAsset.height,
          failureCode: lesson.videoAsset.failureCode,
          failureMessage: lesson.videoAsset.failureMessage,
          posterFileAssetId: this.posterFileAssetId(
            lesson.videoAsset.posterReference,
          ),
          processingProgress: processing?.percent ?? null,
          processingPhase: processing?.phase ?? null,
          outputVariants: this.hlsVariants(lesson.videoAsset.metadata),
          playbackAvailable:
            lesson.videoAsset.status === TrainingVideoAssetStatus.READY,
          updatedAt: lesson.videoAsset.updatedAt.toISOString(),
          manualPlaybackUrl:
            lesson.videoAsset.deliveryMode ===
            TrainingVideoDeliveryMode.AWS_MANUAL
              ? lesson.videoAsset.playbackManifestReference
              : null,
        }
      : null;
    const document =
      lesson.documentAsset?.status === FileAssetStatus.READY &&
      lesson.documentPageCount
        ? {
            type: 'DOCUMENT' as const,
            fileAssetId: lesson.documentAsset.id,
            originalFilename: lesson.documentAsset.originalFilename,
            sizeBytes: lesson.documentAsset.sizeBytes,
            pageCount: lesson.documentPageCount,
          }
        : null;
    return {
      lessonId: lesson.id,
      contentType: lesson.contentType,
      mediaType:
        lesson.contentType === TrainingLessonContentType.DOCUMENT
          ? ('PDF_SLIDES' as const)
          : ('VIDEO' as const),
      articleContentTranslations: lesson.articleContentTranslations,
      video,
      document,
      slides: document,
    };
  }

  private rewriteManifest(
    manifest: string,
    context: {
      principal: AuthenticatedPrincipal;
      courseId: string;
      lessonId: string;
      assetId: string;
      source: 'AUTO' | 'MANUAL';
      baseReference: string;
    },
  ): string {
    if (!manifest.trimStart().startsWith('#EXTM3U')) {
      throw new ServiceUnavailableException(
        'Training HLS manifest is invalid.',
      );
    }

    const rewrite = (child: string): string => {
      const decoded = child.trim();
      if (!decoded) return child;
      const reference =
        context.source === 'AUTO'
          ? this.aws.resolveAutomatedReference(context.baseReference, decoded)
          : this.aws.resolveManualReference(context.baseReference, decoded);
      if (
        context.source === 'AUTO' &&
        !reference.startsWith(`training/hls/${context.assetId}/`)
      ) {
        throw new ServiceUnavailableException(
          'HLS resource escaped the training asset prefix.',
        );
      }
      const token = this.encryptMediaToken({
        v: 1,
        userId: context.principal.userId,
        companyId: context.principal.companyId as string,
        courseId: context.courseId,
        lessonId: context.lessonId,
        assetId: context.assetId,
        source: context.source,
        reference,
        exp: Math.floor(Date.now() / 1000) + 900,
      });
      return `hls-resource?token=${encodeURIComponent(token)}`;
    };

    return manifest
      .split(/\r?\n/)
      .map((line) => {
        if (!line) return line;
        if (!line.startsWith('#')) return rewrite(line);
        return line.replace(/URI="([^"]+)"/g, (_match, value: string) => {
          return `URI="${rewrite(value)}"`;
        });
      })
      .join('\n');
  }

  private encryptMediaToken(payload: MediaTokenPayload): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.tokenKey, iv);
    cipher.setAAD(Buffer.from('odookrd-training-media-v1', 'utf8'));
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(payload), 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ciphertext]).toString('base64url');
  }

  private decryptMediaToken(token: string): MediaTokenPayload {
    try {
      if (!token || token.length > 8192) throw new Error('invalid token');
      const packed = Buffer.from(token, 'base64url');
      if (packed.length < 29) throw new Error('invalid token');
      const iv = packed.subarray(0, 12);
      const tag = packed.subarray(12, 28);
      const ciphertext = packed.subarray(28);
      const decipher = createDecipheriv('aes-256-gcm', this.tokenKey, iv);
      decipher.setAAD(Buffer.from('odookrd-training-media-v1', 'utf8'));
      decipher.setAuthTag(tag);
      const payload = JSON.parse(
        Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
          'utf8',
        ),
      ) as Partial<MediaTokenPayload>;
      if (
        payload.v !== 1 ||
        typeof payload.userId !== 'string' ||
        typeof payload.companyId !== 'string' ||
        typeof payload.courseId !== 'string' ||
        typeof payload.lessonId !== 'string' ||
        typeof payload.assetId !== 'string' ||
        (payload.source !== 'AUTO' && payload.source !== 'MANUAL') ||
        typeof payload.reference !== 'string' ||
        typeof payload.exp !== 'number' ||
        payload.exp < Math.floor(Date.now() / 1000)
      ) {
        throw new Error('invalid token payload');
      }
      return payload as MediaTokenPayload;
    } catch {
      throw new NotFoundException('Training media resource was not found.');
    }
  }

  private posterFileAssetId(reference: string | null): string | null {
    if (!reference?.startsWith('file:')) return null;
    const id = reference.slice(5);
    return /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  }

  private hlsVariants(metadata: unknown): number[] {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return [];
    }
    const variants = (metadata as { hlsVariants?: unknown }).hlsVariants;
    if (!Array.isArray(variants)) return [];
    return variants
      .filter(
        (value): value is number =>
          typeof value === 'number' && Number.isSafeInteger(value) && value > 0,
      )
      .sort((left, right) => right - left);
  }

  private async cleanupDetachedPoster(
    reference: string | null,
    replacementFileId: string | null,
  ): Promise<void> {
    const fileId = this.posterFileAssetId(reference);
    if (!fileId || fileId === replacementFileId) return;
    const references = await this.prisma.trainingVideoAsset.count({
      where: { posterReference: `file:${fileId}` },
    });
    if (references > 0) return;
    const file = await this.prisma.fileAsset.findUnique({
      where: { id: fileId },
      select: { id: true, storageProvider: true, storageKey: true },
    });
    if (!file) return;
    await this.storage
      .delete(file.storageProvider, file.storageKey)
      .catch(() => undefined);
    await this.prisma.fileAsset
      .delete({ where: { id: file.id } })
      .catch(() => undefined);
  }

  private async permanentlyDeleteVideoAsset(
    asset: Awaited<
      ReturnType<TrainingMediaService['adminLesson']>
    >['videoAsset'],
  ): Promise<void> {
    if (!asset) return;
    const references = await this.prisma.trainingVideoLesson.count({
      where: { videoAssetId: asset.id },
    });
    if (references > 0) return;
    if (asset.deliveryMode === TrainingVideoDeliveryMode.LOCAL) {
      await this.local.delete(asset.sourceReference).catch((error: unknown) => {
        this.logger.warn(
          `Local training video ${asset.id} could not be removed: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      });
    } else if (asset.deliveryMode === TrainingVideoDeliveryMode.AWS_AUTOMATED) {
      if (
        asset.status === TrainingVideoAssetStatus.PROCESSING &&
        asset.mediaConvertJobId
      ) {
        await this.aws.cancelMediaConvertJob(asset.mediaConvertJobId);
      }
      await this.aws.deleteAutomatedAsset(asset.id, asset.sourceReference);
    }
    const posterReference = asset.posterReference;
    await this.prisma.trainingVideoAsset.delete({ where: { id: asset.id } });
    await this.cleanupDetachedPoster(posterReference, null);
  }

  async cleanupDetachedVideoAsset(assetId: string | null): Promise<void> {
    await this.cleanupDetachedVideo(assetId, null);
  }

  private async cleanupDetachedVideo(
    previousAssetId: string | null,
    replacementAssetId: string | null,
  ): Promise<void> {
    if (!previousAssetId || previousAssetId === replacementAssetId) return;
    const references = await this.prisma.trainingVideoLesson.count({
      where: { videoAssetId: previousAssetId },
    });
    if (references > 0) return;
    const asset = await this.prisma.trainingVideoAsset.findUnique({
      where: { id: previousAssetId },
      select: {
        id: true,
        deliveryMode: true,
        sourceReference: true,
      },
    });
    if (!asset) return;
    await this.prisma.trainingVideoAsset.update({
      where: { id: asset.id },
      data: { status: TrainingVideoAssetStatus.ARCHIVED },
    });
    if (asset.deliveryMode === TrainingVideoDeliveryMode.LOCAL) {
      await this.local.delete(asset.sourceReference).catch((error: unknown) => {
        this.logger.warn(
          `Detached local training video ${asset.id} could not be removed: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      });
    }
  }

  private async assertAdminLessonExists(
    courseId: string,
    sectionId: string,
    lessonId: string,
  ): Promise<void> {
    const lesson = await this.prisma.trainingVideoLesson.findFirst({
      where: { id: lessonId, courseId, sectionId },
      select: { id: true },
    });
    if (!lesson) throw new NotFoundException('Training lesson was not found.');
  }

  private async assertVideoSize(sizeBytes: number): Promise<void> {
    const max = await this.maxUploadBytes();
    if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > max) {
      throw new BadRequestException(
        'Video size exceeds the configured training upload limit.',
      );
    }
  }

  private async maxUploadBytes(): Promise<number> {
    const configured = await this.settings.resolveValue(
      'trainings.video.max_upload_mb',
    );
    const megabytes = typeof configured === 'number' ? configured : 4096;
    return megabytes * 1_048_576;
  }

  private sanitizeFilename(filename: string): string {
    const basename = path.basename(filename || 'video.mp4').normalize('NFKC');
    const safe = Array.from(basename)
      .filter((character) => {
        const point = character.codePointAt(0);
        return point !== undefined && point >= 32 && point !== 127;
      })
      .join('')
      .trim();
    return (safe || 'video.mp4').slice(0, 255);
  }

  private assertPlatformAdministrator(principal: AuthenticatedPrincipal): void {
    if (
      principal.accountScope !== AccountScope.PLATFORM ||
      principal.companyId !== null
    ) {
      throw new ForbiddenException(
        'Training media management requires platform scope.',
      );
    }
  }
}
