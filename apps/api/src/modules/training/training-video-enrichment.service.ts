import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import path from 'node:path';
import type { Readable } from 'node:stream';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  AccountScope,
  FileAssetKind,
  FileAssetStatus,
  TrainingContentStatus,
  TrainingVideoAssetStatus,
  TrainingVideoDeliveryMode,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { FileStorageService } from '../files/storage/file-storage.service';
import type {
  CreateTrainingVideoChapterDto,
  UpdateTrainingCaptionDto,
  UpdateTrainingVideoChapterDto,
} from './dto/training-video-enrichment.dto';
import { TrainingAwsMediaService } from './training-aws-media.service';
import { TrainingEntitlementService } from './training-entitlement.service';
import { TrainingLearningGateService } from './training-learning-gate.service';
import {
  TrainingLocalMediaService,
  type TrainingVideoRange,
} from './training-local-media.service';

const MAX_CAPTION_BYTES = 5 * 1024 * 1024;
const LANGUAGE_PATTERN = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i;

interface PreviewTokenPayload {
  v: 1;
  userId: string;
  assetId: string;
  source: 'AUTO' | 'MANUAL';
  reference: string;
  exp: number;
}

interface CaptionUploadInput {
  source: Readable;
  declaredSize: number;
  filename: string;
  languageCode: string;
  label: string;
  isDefault: boolean;
}

@Injectable()
export class TrainingVideoEnrichmentService {
  private readonly previewTokenKey: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: TrainingEntitlementService,
    private readonly gate: TrainingLearningGateService,
    private readonly storage: FileStorageService,
    private readonly local: TrainingLocalMediaService,
    private readonly aws: TrainingAwsMediaService,
    config: ConfigService,
  ) {
    this.previewTokenKey = Buffer.from(
      config.getOrThrow<string>('SETTINGS_ENCRYPTION_KEY'),
      'base64',
    );
    if (this.previewTokenKey.length < 32) {
      throw new Error('SETTINGS_ENCRYPTION_KEY is invalid.');
    }
  }

  async getAdminEnrichment(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
  ) {
    const lesson = await this.adminVideo(
      principal,
      courseId,
      sectionId,
      lessonId,
    );
    const asset = lesson.videoAsset;
    if (!asset) throw new NotFoundException('Training video was not found.');

    const [captions, chapters] = await Promise.all([
      this.prisma.trainingVideoCaptionTrack.findMany({
        where: { videoAssetId: asset.id },
        select: {
          id: true,
          languageCode: true,
          label: true,
          isDefault: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
          fileAsset: {
            select: {
              originalFilename: true,
              mimeType: true,
              sizeBytes: true,
              status: true,
            },
          },
        },
        orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.trainingVideoChapter.findMany({
        where: { videoAssetId: asset.id },
        select: {
          id: true,
          title: true,
          titleTranslations: true,
          startSeconds: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ startSeconds: 'asc' }, { id: 'asc' }],
      }),
    ]);

    return {
      videoAssetId: asset.id,
      durationSeconds: asset.durationSeconds,
      deliveryMode: asset.deliveryMode,
      preview: {
        type: 'VIDEO' as const,
        deliveryMode: asset.deliveryMode,
        durationSeconds: asset.durationSeconds,
        width: asset.width,
        height: asset.height,
        sizeBytes: asset.sizeBytes === null ? null : Number(asset.sizeBytes),
        processedSizeBytes:
          asset.processedSizeBytes === null
            ? null
            : Number(asset.processedSizeBytes),
        playbackKind:
          asset.deliveryMode === TrainingVideoDeliveryMode.LOCAL
            ? ('MP4' as const)
            : ('HLS' as const),
        playbackPath: `/training/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/media/enrichment/preview`,
      },
      captions: captions
        .filter((track) => track.fileAsset.status === FileAssetStatus.READY)
        .map((track) => ({
          id: track.id,
          languageCode: track.languageCode,
          label: track.label,
          isDefault: track.isDefault,
          sortOrder: track.sortOrder,
          originalFilename: track.fileAsset.originalFilename,
          mimeType: track.fileAsset.mimeType,
          sizeBytes: track.fileAsset.sizeBytes,
          createdAt: track.createdAt.toISOString(),
          updatedAt: track.updatedAt.toISOString(),
        })),
      chapters: chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        titleTranslations: chapter.titleTranslations,
        startSeconds: chapter.startSeconds,
        sortOrder: chapter.sortOrder,
        createdAt: chapter.createdAt.toISOString(),
        updatedAt: chapter.updatedAt.toISOString(),
      })),
    };
  }

  async uploadCaption(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    input: CaptionUploadInput,
  ) {
    const lesson = await this.adminVideo(
      principal,
      courseId,
      sectionId,
      lessonId,
    );
    const asset = lesson.videoAsset;
    if (!asset || asset.status !== TrainingVideoAssetStatus.READY) {
      throw new BadRequestException(
        'A ready video is required before adding captions.',
      );
    }

    const languageCode = this.languageCode(input.languageCode);
    const label = this.captionLabel(input.label);
    const filename = this.captionFilename(input.filename);
    const buffer = await this.readCaptionBody(input.source, input.declaredSize);
    const normalized = this.validateWebVtt(buffer);
    const normalizedBuffer = Buffer.from(normalized, 'utf8');
    const sha256 = createHash('sha256').update(normalizedBuffer).digest('hex');
    const storageProvider = await this.storage.getConfiguredProvider();
    const storageKey = this.storage.createStorageKey(
      AccountScope.PLATFORM,
      null,
    );

    await this.storage.put(storageProvider, {
      storageKey,
      buffer: normalizedBuffer,
      mimeType: 'text/vtt',
      sha256,
    });

    let oldFile: {
      id: string;
      storageProvider: Parameters<FileStorageService['delete']>[0];
      storageKey: string;
    } | null = null;

    try {
      await this.prisma.$transaction(async (transaction) => {
        const existing = await transaction.trainingVideoCaptionTrack.findUnique(
          {
            where: {
              videoAssetId_languageCode: {
                videoAssetId: asset.id,
                languageCode,
              },
            },
            select: {
              fileAsset: {
                select: { id: true, storageProvider: true, storageKey: true },
              },
            },
          },
        );

        if (input.isDefault) {
          await transaction.trainingVideoCaptionTrack.updateMany({
            where: { videoAssetId: asset.id, isDefault: true },
            data: { isDefault: false },
          });
        }

        const fileAsset = await transaction.fileAsset.create({
          data: {
            accountScope: AccountScope.PLATFORM,
            companyId: null,
            kind: FileAssetKind.ATTACHMENT,
            storageProvider,
            storageKey,
            originalFilename: filename,
            mimeType: 'text/vtt',
            sizeBytes: normalizedBuffer.length,
            sha256,
            uploadedByUserId: principal.userId,
          },
          select: { id: true },
        });

        const nextOrder =
          existing === null
            ? await transaction.trainingVideoCaptionTrack.count({
                where: { videoAssetId: asset.id },
              })
            : undefined;

        await transaction.trainingVideoCaptionTrack.upsert({
          where: {
            videoAssetId_languageCode: { videoAssetId: asset.id, languageCode },
          },
          create: {
            id: randomUUID(),
            videoAssetId: asset.id,
            fileAssetId: fileAsset.id,
            languageCode,
            label,
            isDefault: input.isDefault,
            sortOrder: nextOrder ?? 0,
          },
          update: {
            fileAssetId: fileAsset.id,
            label,
            isDefault: input.isDefault,
          },
        });

        await transaction.auditLog.create({
          data: {
            actorUserId: principal.userId,
            action: 'training.video.caption.saved',
            targetType: 'training_video_asset',
            targetId: asset.id,
            metadata: { courseId, sectionId, lessonId, languageCode },
          },
        });
        oldFile = existing?.fileAsset ?? null;
      });
    } catch (error) {
      await this.storage
        .delete(storageProvider, storageKey)
        .catch(() => undefined);
      throw error;
    }

    if (oldFile) await this.deleteDetachedCaptionFile(oldFile);
    return this.getAdminEnrichment(principal, courseId, sectionId, lessonId);
  }

  async updateCaption(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    captionId: string,
    input: UpdateTrainingCaptionDto,
  ) {
    const lesson = await this.adminVideo(
      principal,
      courseId,
      sectionId,
      lessonId,
    );
    const asset = lesson.videoAsset;
    if (!asset) throw new NotFoundException('Training video was not found.');

    const track = await this.prisma.trainingVideoCaptionTrack.findFirst({
      where: { id: captionId, videoAssetId: asset.id },
      select: { id: true, languageCode: true },
    });
    if (!track) throw new NotFoundException('Caption track was not found.');

    const languageCode =
      input.languageCode === undefined
        ? track.languageCode
        : this.languageCode(input.languageCode);

    if (languageCode !== track.languageCode) {
      const conflict = await this.prisma.trainingVideoCaptionTrack.findUnique({
        where: {
          videoAssetId_languageCode: { videoAssetId: asset.id, languageCode },
        },
        select: { id: true },
      });
      if (conflict && conflict.id !== track.id) {
        throw new BadRequestException(
          'A caption track already exists for this language.',
        );
      }
    }

    await this.prisma.$transaction(async (transaction) => {
      if (input.isDefault === true) {
        await transaction.trainingVideoCaptionTrack.updateMany({
          where: {
            videoAssetId: asset.id,
            isDefault: true,
            id: { not: track.id },
          },
          data: { isDefault: false },
        });
      }
      await transaction.trainingVideoCaptionTrack.update({
        where: { id: track.id },
        data: {
          ...(input.languageCode === undefined ? {} : { languageCode }),
          ...(input.label === undefined
            ? {}
            : { label: this.captionLabel(input.label) }),
          ...(input.isDefault === undefined
            ? {}
            : { isDefault: input.isDefault }),
          ...(input.sortOrder === undefined
            ? {}
            : { sortOrder: input.sortOrder }),
        },
      });
    });

    return this.getAdminEnrichment(principal, courseId, sectionId, lessonId);
  }

  async deleteCaption(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    captionId: string,
  ) {
    const lesson = await this.adminVideo(
      principal,
      courseId,
      sectionId,
      lessonId,
    );
    const asset = lesson.videoAsset;
    if (!asset) throw new NotFoundException('Training video was not found.');

    const track = await this.prisma.trainingVideoCaptionTrack.findFirst({
      where: { id: captionId, videoAssetId: asset.id },
      select: {
        id: true,
        fileAsset: {
          select: { id: true, storageProvider: true, storageKey: true },
        },
      },
    });
    if (!track) throw new NotFoundException('Caption track was not found.');

    await this.prisma.trainingVideoCaptionTrack.delete({
      where: { id: track.id },
    });
    await this.deleteDetachedCaptionFile(track.fileAsset);
    return this.getAdminEnrichment(principal, courseId, sectionId, lessonId);
  }

  async createChapter(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    input: CreateTrainingVideoChapterDto,
  ) {
    const lesson = await this.adminVideo(
      principal,
      courseId,
      sectionId,
      lessonId,
    );
    const asset = lesson.videoAsset;
    if (!asset || asset.status !== TrainingVideoAssetStatus.READY) {
      throw new BadRequestException(
        'A ready video is required before adding chapters.',
      );
    }
    const startSeconds = this.chapterTime(
      input.startSeconds,
      asset.durationSeconds,
    );
    const titleTranslations = this.localizedTitles(input.titleTranslations);
    const title = this.chapterTitle(input.title, titleTranslations);

    try {
      await this.prisma.trainingVideoChapter.create({
        data: {
          id: randomUUID(),
          videoAssetId: asset.id,
          title,
          titleTranslations,
          startSeconds,
          sortOrder: startSeconds,
        },
      });
    } catch (error) {
      if (error instanceof Error && /unique|duplicate/i.test(error.message)) {
        throw new BadRequestException(
          'A chapter already starts at this timestamp.',
        );
      }
      throw error;
    }
    return this.getAdminEnrichment(principal, courseId, sectionId, lessonId);
  }

  async updateChapter(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    chapterId: string,
    input: UpdateTrainingVideoChapterDto,
  ) {
    const lesson = await this.adminVideo(
      principal,
      courseId,
      sectionId,
      lessonId,
    );
    const asset = lesson.videoAsset;
    if (!asset) throw new NotFoundException('Training video was not found.');

    const chapter = await this.prisma.trainingVideoChapter.findFirst({
      where: { id: chapterId, videoAssetId: asset.id },
      select: {
        id: true,
        title: true,
        titleTranslations: true,
        startSeconds: true,
      },
    });
    if (!chapter) throw new NotFoundException('Video chapter was not found.');

    const startSeconds =
      input.startSeconds === undefined
        ? chapter.startSeconds
        : this.chapterTime(input.startSeconds, asset.durationSeconds);
    const translations =
      input.titleTranslations === undefined
        ? this.localizedTitles(chapter.titleTranslations)
        : this.localizedTitles(input.titleTranslations);
    const title =
      input.title === undefined
        ? chapter.title
        : this.chapterTitle(input.title, translations);

    try {
      await this.prisma.trainingVideoChapter.update({
        where: { id: chapter.id },
        data: {
          title,
          titleTranslations: translations,
          startSeconds,
          sortOrder: startSeconds,
        },
      });
    } catch (error) {
      if (error instanceof Error && /unique|duplicate/i.test(error.message)) {
        throw new BadRequestException(
          'A chapter already starts at this timestamp.',
        );
      }
      throw error;
    }
    return this.getAdminEnrichment(principal, courseId, sectionId, lessonId);
  }

  async deleteChapter(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    chapterId: string,
  ) {
    const lesson = await this.adminVideo(
      principal,
      courseId,
      sectionId,
      lessonId,
    );
    const asset = lesson.videoAsset;
    if (!asset) throw new NotFoundException('Training video was not found.');

    const chapter = await this.prisma.trainingVideoChapter.findFirst({
      where: { id: chapterId, videoAssetId: asset.id },
      select: { id: true },
    });
    if (!chapter) throw new NotFoundException('Video chapter was not found.');
    await this.prisma.trainingVideoChapter.delete({
      where: { id: chapter.id },
    });
    return this.getAdminEnrichment(principal, courseId, sectionId, lessonId);
  }

  async getCustomerEnrichment(
    principal: AuthenticatedPrincipal,
    slug: string,
    lessonId: string,
  ) {
    const lesson = await this.customerVideo(principal, slug, lessonId);
    const asset = lesson.videoAsset;
    if (!asset || asset.status !== TrainingVideoAssetStatus.READY) {
      return { captions: [], chapters: [] };
    }

    const [captions, chapters] = await Promise.all([
      this.prisma.trainingVideoCaptionTrack.findMany({
        where: {
          videoAssetId: asset.id,
          fileAsset: { status: FileAssetStatus.READY },
        },
        select: {
          id: true,
          languageCode: true,
          label: true,
          isDefault: true,
          sortOrder: true,
        },
        orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.trainingVideoChapter.findMany({
        where: { videoAssetId: asset.id },
        select: {
          id: true,
          title: true,
          titleTranslations: true,
          startSeconds: true,
        },
        orderBy: [{ startSeconds: 'asc' }, { id: 'asc' }],
      }),
    ]);

    return {
      captions: captions.map((track) => ({
        id: track.id,
        languageCode: track.languageCode,
        label: track.label,
        isDefault: track.isDefault,
        contentPath: `/training/catalog/${encodeURIComponent(slug)}/lessons/${lessonId}/captions/${track.id}`,
      })),
      chapters,
    };
  }

  async openCustomerCaption(
    principal: AuthenticatedPrincipal,
    slug: string,
    lessonId: string,
    captionId: string,
  ) {
    const lesson = await this.customerVideo(principal, slug, lessonId);
    const asset = lesson.videoAsset;
    if (!asset || asset.status !== TrainingVideoAssetStatus.READY) {
      throw new NotFoundException('Caption track was not found.');
    }

    const track = await this.prisma.trainingVideoCaptionTrack.findFirst({
      where: {
        id: captionId,
        videoAssetId: asset.id,
        fileAsset: { status: FileAssetStatus.READY },
      },
      select: {
        fileAsset: {
          select: {
            storageProvider: true,
            storageKey: true,
            sizeBytes: true,
            sha256: true,
          },
        },
      },
    });
    if (!track) throw new NotFoundException('Caption track was not found.');

    const stream = await this.storage.open(
      track.fileAsset.storageProvider,
      track.fileAsset.storageKey,
    );
    const buffer = await this.readStoredFile(stream, track.fileAsset.sizeBytes);
    const sha256 = createHash('sha256').update(buffer).digest('hex');
    if (sha256 !== track.fileAsset.sha256) {
      throw new ServiceUnavailableException(
        'Caption file integrity verification failed.',
      );
    }
    return { buffer, sha256 };
  }

  async openAdminPreview(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    range?: string,
  ): Promise<
    | { kind: 'LOCAL'; range: TrainingVideoRange }
    | { kind: 'HLS'; manifest: string }
  > {
    const lesson = await this.adminVideo(
      principal,
      courseId,
      sectionId,
      lessonId,
    );
    const asset = lesson.videoAsset;
    if (!asset || asset.status !== TrainingVideoAssetStatus.READY) {
      throw new NotFoundException('Training video preview was not found.');
    }

    if (asset.deliveryMode === TrainingVideoDeliveryMode.LOCAL) {
      return {
        kind: 'LOCAL',
        range: await this.local.openRange(asset.sourceReference, range),
      };
    }

    const source =
      asset.deliveryMode === TrainingVideoDeliveryMode.AWS_AUTOMATED
        ? 'AUTO'
        : 'MANUAL';
    const manifest =
      source === 'AUTO'
        ? await this.aws.readAutomatedManifest(
            asset.playbackManifestReference as string,
          )
        : await (
            await this.aws.fetchManualResource(
              asset.playbackManifestReference as string,
            )
          ).text();

    return {
      kind: 'HLS',
      manifest: this.rewriteAdminManifest(manifest, {
        principal,
        assetId: asset.id,
        source,
        baseReference: asset.playbackManifestReference as string,
      }),
    };
  }

  async openAdminPreviewResource(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    token: string,
  ) {
    const lesson = await this.adminVideo(
      principal,
      courseId,
      sectionId,
      lessonId,
    );
    const asset = lesson.videoAsset;
    if (!asset) {
      throw new NotFoundException('Training preview resource was not found.');
    }

    const payload = this.verifyPreviewToken(token);
    if (payload.userId !== principal.userId || payload.assetId !== asset.id) {
      throw new NotFoundException('Training preview resource was not found.');
    }

    if (
      payload.source === 'AUTO' &&
      !payload.reference.startsWith(`training/hls/${asset.id}/`)
    ) {
      throw new NotFoundException('Training preview resource was not found.');
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
      const rewritten = this.rewriteAdminManifest(buffer.toString('utf8'), {
        principal,
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

  private async adminVideo(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
  ) {
    this.assertPlatformAdministrator(principal);
    const lesson = await this.prisma.trainingVideoLesson.findFirst({
      where: { id: lessonId, courseId, sectionId },
      select: {
        id: true,
        videoAsset: {
          select: {
            id: true,
            status: true,
            deliveryMode: true,
            sourceReference: true,
            playbackManifestReference: true,
            durationSeconds: true,
            width: true,
            height: true,
            sizeBytes: true,
            processedSizeBytes: true,
          },
        },
      },
    });
    if (!lesson) throw new NotFoundException('Training lesson was not found.');
    return lesson;
  }

  private async customerVideo(
    principal: AuthenticatedPrincipal,
    slug: string,
    lessonId: string,
  ) {
    const { context, courseId } =
      await this.entitlements.assertEntitledCourseBySlug(principal, slug);
    await this.gate.assertLessonAccessibleInCourse(context, courseId, lessonId);
    const lesson = await this.prisma.trainingVideoLesson.findFirst({
      where: {
        id: lessonId,
        courseId,
        status: TrainingContentStatus.PUBLISHED,
        section: { status: TrainingContentStatus.PUBLISHED },
      },
      select: {
        id: true,
        videoAsset: { select: { id: true, status: true } },
      },
    });
    if (!lesson) throw new NotFoundException('Training lesson was not found.');
    return lesson;
  }

  private async readCaptionBody(
    source: Readable,
    declaredSize: number,
  ): Promise<Buffer> {
    if (
      !Number.isSafeInteger(declaredSize) ||
      declaredSize <= 0 ||
      declaredSize > MAX_CAPTION_BYTES
    ) {
      throw new BadRequestException('Caption file size is invalid.');
    }

    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of source as AsyncIterable<unknown>) {
      if (!(typeof chunk === 'string' || chunk instanceof Uint8Array)) {
        throw new BadRequestException('Caption upload body is invalid.');
      }
      const buffer = Buffer.from(chunk);
      total += buffer.length;
      if (total > MAX_CAPTION_BYTES || total > declaredSize) {
        throw new BadRequestException(
          'Caption upload exceeded its size limit.',
        );
      }
      chunks.push(buffer);
    }
    if (total !== declaredSize) {
      throw new BadRequestException(
        'Caption upload size did not match the declared size.',
      );
    }
    return Buffer.concat(chunks);
  }

  private validateWebVtt(buffer: Buffer): string {
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      throw new BadRequestException('Caption file must contain valid UTF-8.');
    }
    text = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    if (!/^WEBVTT(?:[ \t].*)?(?:\n|$)/.test(text)) {
      throw new BadRequestException(
        'Caption file must start with a valid WEBVTT header.',
      );
    }
    if (text.includes('\u0000')) {
      throw new BadRequestException('Caption file contains invalid content.');
    }
    return text.endsWith('\n') ? text : `${text}\n`;
  }

  private async readStoredFile(
    stream: Readable,
    expectedSize: number,
  ): Promise<Buffer> {
    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of stream as AsyncIterable<unknown>) {
      if (!(typeof chunk === 'string' || chunk instanceof Uint8Array)) {
        throw new ServiceUnavailableException(
          'Stored caption returned invalid data.',
        );
      }
      const buffer = Buffer.from(chunk);
      total += buffer.length;
      if (total > expectedSize || total > MAX_CAPTION_BYTES) {
        throw new ServiceUnavailableException(
          'Stored caption exceeded its expected size.',
        );
      }
      chunks.push(buffer);
    }
    if (total !== expectedSize) {
      throw new ServiceUnavailableException(
        'Stored caption size verification failed.',
      );
    }
    return Buffer.concat(chunks);
  }

  private languageCode(value: string): string {
    const normalized = value.trim().toLowerCase();
    if (!LANGUAGE_PATTERN.test(normalized) || normalized.length > 35) {
      throw new BadRequestException('Caption language code is invalid.');
    }
    return normalized;
  }

  private captionLabel(value: string): string {
    const normalized = value.trim();
    if (!normalized || normalized.length > 100) {
      throw new BadRequestException('Caption label is invalid.');
    }
    return normalized;
  }

  private captionFilename(value: string): string {
    const basename = path.basename(value || 'captions.vtt').normalize('NFKC');
    const safe = Array.from(basename)
      .filter((character) => {
        const point = character.codePointAt(0);
        return point !== undefined && point >= 32 && point !== 127;
      })
      .join('')
      .trim();
    const filename = (safe || 'captions.vtt').slice(0, 255);
    if (!filename.toLowerCase().endsWith('.vtt')) {
      throw new BadRequestException('Caption filename must end with .vtt.');
    }
    return filename;
  }

  private chapterTime(value: number, duration: number | null): number {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new BadRequestException('Chapter start time is invalid.');
    }
    if (!duration || duration <= 0) {
      throw new BadRequestException(
        'Video duration must be known before chapters can be managed.',
      );
    }
    if (value >= duration) {
      throw new BadRequestException(
        'Chapter start time must be before the end of the video.',
      );
    }
    return value;
  }

  private localizedTitles(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const output: Record<string, string> = {};
    for (const locale of ['ku', 'ar', 'en']) {
      const raw = (value as Record<string, unknown>)[locale];
      if (typeof raw === 'string' && raw.trim()) {
        output[locale] = raw.trim().slice(0, 250);
      }
    }
    return output;
  }

  private chapterTitle(
    value: string,
    translations: Record<string, string>,
  ): string {
    const normalized = value.trim();
    const fallback =
      normalized || translations.ku || translations.en || translations.ar || '';
    if (!fallback || fallback.length > 250) {
      throw new BadRequestException('Chapter title is invalid.');
    }
    return fallback;
  }

  private async deleteDetachedCaptionFile(file: {
    id: string;
    storageProvider: Parameters<FileStorageService['delete']>[0];
    storageKey: string;
  }): Promise<void> {
    const references = await this.prisma.trainingVideoCaptionTrack.count({
      where: { fileAssetId: file.id },
    });
    if (references > 0) return;
    await this.storage
      .delete(file.storageProvider, file.storageKey)
      .catch(() => undefined);
    await this.prisma.fileAsset
      .delete({ where: { id: file.id } })
      .catch(() => undefined);
  }

  private rewriteAdminManifest(
    manifest: string,
    context: {
      principal: AuthenticatedPrincipal;
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
      const value = child.trim();
      if (!value) return child;
      const reference =
        context.source === 'AUTO'
          ? this.aws.resolveAutomatedReference(context.baseReference, value)
          : this.aws.resolveManualReference(context.baseReference, value);
      if (
        context.source === 'AUTO' &&
        !reference.startsWith(`training/hls/${context.assetId}/`)
      ) {
        throw new ServiceUnavailableException(
          'Training preview escaped the video asset prefix.',
        );
      }
      const token = this.signPreviewToken({
        v: 1,
        userId: context.principal.userId,
        assetId: context.assetId,
        source: context.source,
        reference,
        exp: Math.floor(Date.now() / 1000) + 900,
      });
      return `preview-resource?token=${encodeURIComponent(token)}`;
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

  private signPreviewToken(payload: PreviewTokenPayload): string {
    const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString(
      'base64url',
    );
    const signature = createHmac('sha256', this.previewTokenKey)
      .update(encoded)
      .digest('base64url');
    return `${encoded}.${signature}`;
  }

  private verifyPreviewToken(token: string): PreviewTokenPayload {
    try {
      if (!token || token.length > 8192) throw new Error('invalid');
      const [encoded, signature, extra] = token.split('.');
      if (!encoded || !signature || extra) throw new Error('invalid');
      const expected = createHmac('sha256', this.previewTokenKey)
        .update(encoded)
        .digest();
      const actual = Buffer.from(signature, 'base64url');
      if (
        actual.length !== expected.length ||
        !timingSafeEqual(actual, expected)
      ) {
        throw new Error('invalid');
      }
      const payload = JSON.parse(
        Buffer.from(encoded, 'base64url').toString('utf8'),
      ) as Partial<PreviewTokenPayload>;
      if (
        payload.v !== 1 ||
        typeof payload.userId !== 'string' ||
        typeof payload.assetId !== 'string' ||
        (payload.source !== 'AUTO' && payload.source !== 'MANUAL') ||
        typeof payload.reference !== 'string' ||
        typeof payload.exp !== 'number' ||
        payload.exp < Math.floor(Date.now() / 1000)
      ) {
        throw new Error('invalid');
      }
      return payload as PreviewTokenPayload;
    } catch {
      throw new NotFoundException('Training preview resource was not found.');
    }
  }

  private assertPlatformAdministrator(principal: AuthenticatedPrincipal): void {
    if (
      principal.accountScope !== AccountScope.PLATFORM ||
      principal.companyId !== null
    ) {
      throw new ForbiddenException(
        'Training video enrichment requires platform scope.',
      );
    }
  }
}
