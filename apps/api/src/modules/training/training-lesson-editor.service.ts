import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import {
  AccountScope,
  FileAssetKind,
  FileAssetStatus,
  TrainingContentStatus,
  TrainingLessonContentType,
} from '../../generated/prisma/enums';
import { normalizeLocalizedText } from '../../i18n/localized-content';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type {
  AddTrainingLessonResourceDto,
  ReorderTrainingLessonResourcesDto,
  SetTrainingLessonContentTypeDto,
  UpdateTrainingLessonArticleDto,
  UpdateTrainingLessonGeneralDto,
  UpdateTrainingLessonResourceDto,
} from './dto/training-lesson-editor.dto';
import { TrainingMediaService } from './training-media.service';
import { evaluateTrainingLessonReadiness } from './training-lesson-readiness';

const editorLessonSelect = {
  id: true,
  courseId: true,
  sectionId: true,
  title: true,
  titleTranslations: true,
  description: true,
  descriptionTranslations: true,
  richDescriptionTranslations: true,
  status: true,
  sortOrder: true,
  contentType: true,
  articleContentTranslations: true,
  videoAssetId: true,
  documentAssetId: true,
  documentPageCount: true,
  createdAt: true,
  updatedAt: true,
  videoAsset: { select: { status: true } },
  documentAsset: { select: { status: true } },
} satisfies Prisma.TrainingVideoLessonSelect;

const resourceSelect = {
  id: true,
  lessonId: true,
  fileAssetId: true,
  title: true,
  titleTranslations: true,
  customerVisible: true,
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
} satisfies Prisma.TrainingLessonResourceSelect;

type EditorLessonRecord = Prisma.TrainingVideoLessonGetPayload<{
  select: typeof editorLessonSelect;
}>;
type ResourceRecord = Prisma.TrainingLessonResourceGetPayload<{
  select: typeof resourceSelect;
}>;

@Injectable()
export class TrainingLessonEditorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: TrainingMediaService,
  ) {}

  async getEditor(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
  ) {
    this.assertPlatformAdministrator(principal);
    const lesson = await this.lesson(courseId, sectionId, lessonId);
    const [media, resources] = await Promise.all([
      this.media.getAdminMedia(principal, courseId, sectionId, lessonId),
      this.resources(lessonId),
    ]);
    return this.presentEditor(lesson, media, resources);
  }

  async updateGeneral(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    input: UpdateTrainingLessonGeneralDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const existing = await this.lesson(courseId, sectionId, lessonId);
    const title = input.title?.trim();
    if (input.title !== undefined && !title) {
      throw new BadRequestException('Training lesson title cannot be blank.');
    }

    if (input.status === TrainingContentStatus.PUBLISHED) {
      const review = this.review(existing);
      if (!review.ready) {
        throw new ConflictException(
          `Lesson is not ready to publish: ${review.blockers.join(', ')}.`,
        );
      }
    }

    await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.trainingVideoLesson.update({
        where: { id: lessonId },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(input.titleTranslations !== undefined
            ? {
                titleTranslations: normalizeLocalizedText(
                  input.titleTranslations,
                  title ?? existing.title,
                ),
              }
            : {}),
          ...(input.description !== undefined
            ? { description: this.optionalText(input.description) }
            : {}),
          ...(input.descriptionTranslations !== undefined
            ? {
                descriptionTranslations: normalizeLocalizedText(
                  input.descriptionTranslations,
                  input.description !== undefined
                    ? input.description
                    : existing.description,
                ),
              }
            : {}),
          ...(input.richDescriptionTranslations !== undefined
            ? {
                richDescriptionTranslations: this.normalizeRichJson(
                  input.richDescriptionTranslations,
                  150_000,
                  'Lesson description',
                ),
              }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
        select: { id: true, status: true },
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: 'training.lesson.editor.general_updated',
          targetType: 'training_lesson',
          targetId: updated.id,
          metadata: { courseId, sectionId, status: updated.status },
        },
      });
    });

    return this.getEditor(principal, courseId, sectionId, lessonId);
  }

  async setContentType(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    input: SetTrainingLessonContentTypeDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const existing = await this.lesson(courseId, sectionId, lessonId);
    if (existing.contentType === input.contentType) {
      return this.getEditor(principal, courseId, sectionId, lessonId);
    }

    const hasPrimaryContent =
      Boolean(existing.videoAssetId) ||
      Boolean(existing.documentAssetId) ||
      this.hasJsonContent(existing.articleContentTranslations);
    if (hasPrimaryContent && !input.confirmDetach) {
      throw new ConflictException(
        'Changing the content type will detach the current primary content. Confirm the change to continue.',
      );
    }

    const previousVideoAssetId = existing.videoAssetId;
    await this.prisma.$transaction(async (transaction) => {
      await transaction.trainingVideoLesson.update({
        where: { id: lessonId },
        data: {
          contentType: input.contentType,
          ...(input.contentType === TrainingLessonContentType.VIDEO
            ? {
                documentAssetId: null,
                documentPageCount: null,
                articleContentTranslations: {},
              }
            : input.contentType === TrainingLessonContentType.DOCUMENT
              ? {
                  videoAssetId: null,
                  articleContentTranslations: {},
                }
              : input.contentType === TrainingLessonContentType.ARTICLE
                ? {
                    videoAssetId: null,
                    documentAssetId: null,
                    documentPageCount: null,
                  }
                : {
                    videoAssetId: null,
                    documentAssetId: null,
                    documentPageCount: null,
                    articleContentTranslations: {},
                  }),
          ...(existing.status === TrainingContentStatus.PUBLISHED
            ? { status: TrainingContentStatus.DRAFT }
            : {}),
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: 'training.lesson.editor.content_type_changed',
          targetType: 'training_lesson',
          targetId: lessonId,
          metadata: {
            courseId,
            sectionId,
            previousContentType: existing.contentType,
            contentType: input.contentType,
          },
        },
      });
    });

    if (
      previousVideoAssetId &&
      input.contentType !== TrainingLessonContentType.VIDEO
    ) {
      await this.media.cleanupDetachedVideoAsset(previousVideoAssetId);
    }

    return this.getEditor(principal, courseId, sectionId, lessonId);
  }

  async clearContent(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
  ) {
    this.assertPlatformAdministrator(principal);
    await this.media.clearMedia(principal, courseId, sectionId, lessonId);
    await this.prisma.trainingVideoLesson.update({
      where: { id: lessonId },
      data: {
        contentType: null,
        articleContentTranslations: {},
        ...(await this.currentStatusDraftPatch(lessonId)),
      },
    });
    return this.getEditor(principal, courseId, sectionId, lessonId);
  }

  async updateArticle(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    input: UpdateTrainingLessonArticleDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const existing = await this.lesson(courseId, sectionId, lessonId);
    if (existing.contentType !== TrainingLessonContentType.ARTICLE) {
      throw new BadRequestException(
        'Select Article as the lesson content type before saving article content.',
      );
    }

    const article = this.normalizeRichJson(
      input.articleContentTranslations,
      300_000,
      'Article content',
    );
    await this.prisma.$transaction(async (transaction) => {
      await transaction.trainingVideoLesson.update({
        where: { id: lessonId },
        data: {
          articleContentTranslations: article,
          ...(existing.status === TrainingContentStatus.PUBLISHED
            ? { status: TrainingContentStatus.DRAFT }
            : {}),
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: 'training.lesson.editor.article_updated',
          targetType: 'training_lesson',
          targetId: lessonId,
          metadata: { courseId, sectionId },
        },
      });
    });
    return this.getEditor(principal, courseId, sectionId, lessonId);
  }

  async addResource(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    input: AddTrainingLessonResourceDto,
  ) {
    this.assertPlatformAdministrator(principal);
    await this.lesson(courseId, sectionId, lessonId);

    const asset = await this.prisma.fileAsset.findFirst({
      where: {
        id: input.fileAssetId,
        accountScope: AccountScope.PLATFORM,
        companyId: null,
        status: FileAssetStatus.READY,
        kind: { in: [FileAssetKind.DOCUMENT, FileAssetKind.ATTACHMENT] },
      },
      select: { id: true, originalFilename: true },
    });
    if (!asset) {
      throw new BadRequestException(
        'Lesson resources must reference a ready platform document or attachment.',
      );
    }

    const duplicate = await this.prisma.trainingLessonResource.findUnique({
      where: {
        lessonId_fileAssetId: { lessonId, fileAssetId: asset.id },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException(
        'This file is already attached to the lesson.',
      );
    }

    const last = await this.prisma.trainingLessonResource.findFirst({
      where: { lessonId },
      orderBy: [{ sortOrder: 'desc' }, { id: 'desc' }],
      select: { sortOrder: true },
    });
    const title = input.title?.trim() || asset.originalFilename;

    await this.prisma.$transaction(async (transaction) => {
      const resource = await transaction.trainingLessonResource.create({
        data: {
          lessonId,
          fileAssetId: asset.id,
          title,
          titleTranslations: normalizeLocalizedText(
            input.titleTranslations,
            title,
          ),
          customerVisible: input.customerVisible ?? true,
          sortOrder: (last?.sortOrder ?? -1) + 1,
        },
        select: { id: true },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: 'training.lesson.resource.created',
          targetType: 'training_lesson_resource',
          targetId: resource.id,
          metadata: { courseId, sectionId, lessonId, fileAssetId: asset.id },
        },
      });
    });

    return this.getEditor(principal, courseId, sectionId, lessonId);
  }

  async updateResource(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    resourceId: string,
    input: UpdateTrainingLessonResourceDto,
  ) {
    this.assertPlatformAdministrator(principal);
    await this.lesson(courseId, sectionId, lessonId);
    const existing = await this.prisma.trainingLessonResource.findFirst({
      where: { id: resourceId, lessonId },
      select: { id: true, title: true },
    });
    if (!existing) {
      throw new NotFoundException('Training lesson resource was not found.');
    }
    const title = input.title?.trim();
    if (input.title !== undefined && !title) {
      throw new BadRequestException('Resource title cannot be blank.');
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.trainingLessonResource.update({
        where: { id: resourceId },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(input.titleTranslations !== undefined
            ? {
                titleTranslations: normalizeLocalizedText(
                  input.titleTranslations,
                  title ?? existing.title,
                ),
              }
            : {}),
          ...(input.customerVisible !== undefined
            ? { customerVisible: input.customerVisible }
            : {}),
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: 'training.lesson.resource.updated',
          targetType: 'training_lesson_resource',
          targetId: resourceId,
          metadata: { courseId, sectionId, lessonId },
        },
      });
    });
    return this.getEditor(principal, courseId, sectionId, lessonId);
  }

  async deleteResource(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    resourceId: string,
  ) {
    this.assertPlatformAdministrator(principal);
    await this.lesson(courseId, sectionId, lessonId);
    const existing = await this.prisma.trainingLessonResource.findFirst({
      where: { id: resourceId, lessonId },
      select: { id: true, fileAssetId: true },
    });
    if (!existing) {
      throw new NotFoundException('Training lesson resource was not found.');
    }
    await this.prisma.$transaction(async (transaction) => {
      await transaction.trainingLessonResource.delete({
        where: { id: resourceId },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: 'training.lesson.resource.deleted',
          targetType: 'training_lesson_resource',
          targetId: resourceId,
          metadata: {
            courseId,
            sectionId,
            lessonId,
            fileAssetId: existing.fileAssetId,
          },
        },
      });
    });
    return this.getEditor(principal, courseId, sectionId, lessonId);
  }

  async reorderResources(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    input: ReorderTrainingLessonResourcesDto,
  ) {
    this.assertPlatformAdministrator(principal);
    await this.lesson(courseId, sectionId, lessonId);
    const existing = await this.prisma.trainingLessonResource.findMany({
      where: { lessonId },
      select: { id: true },
    });
    const submitted = [...new Set(input.resourceIds)];
    if (
      submitted.length !== input.resourceIds.length ||
      submitted.length !== existing.length ||
      existing.some((resource) => !submitted.includes(resource.id))
    ) {
      throw new BadRequestException(
        'Resource ordering must contain every lesson resource exactly once.',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      for (const [sortOrder, id] of submitted.entries()) {
        await transaction.trainingLessonResource.update({
          where: { id },
          data: { sortOrder },
        });
      }
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: 'training.lesson.resources.reordered',
          targetType: 'training_lesson',
          targetId: lessonId,
          metadata: { courseId, sectionId, resourceCount: submitted.length },
        },
      });
    });
    return this.getEditor(principal, courseId, sectionId, lessonId);
  }

  async getReview(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
  ) {
    this.assertPlatformAdministrator(principal);
    const lesson = await this.lesson(courseId, sectionId, lessonId);
    const resources = await this.resources(lessonId);
    return { ...this.review(lesson), resourcesCount: resources.length };
  }

  private async lesson(
    courseId: string,
    sectionId: string,
    lessonId: string,
  ): Promise<EditorLessonRecord> {
    const lesson = await this.prisma.trainingVideoLesson.findFirst({
      where: { id: lessonId, courseId, sectionId },
      select: editorLessonSelect,
    });
    if (!lesson) throw new NotFoundException('Training lesson was not found.');
    return lesson;
  }

  private async resources(lessonId: string): Promise<ResourceRecord[]> {
    return this.prisma.trainingLessonResource.findMany({
      where: { lessonId },
      select: resourceSelect,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  private review(lesson: EditorLessonRecord) {
    return evaluateTrainingLessonReadiness({
      contentType: lesson.contentType,
      videoStatus: lesson.videoAsset?.status ?? null,
      documentStatus: lesson.documentAsset?.status ?? null,
      documentPageCount: lesson.documentPageCount,
      articleContentTranslations: lesson.articleContentTranslations,
      quizConfigured: false,
    });
  }

  private presentEditor(
    lesson: EditorLessonRecord,
    media: Awaited<ReturnType<TrainingMediaService['getAdminMedia']>>,
    resources: ResourceRecord[],
  ) {
    const { videoAsset, documentAsset, ...visibleLesson } = lesson;
    void videoAsset;
    void documentAsset;
    const review = this.review(lesson);
    return {
      lesson: { ...visibleLesson, contentReady: review.ready },
      media,
      resources: resources.map((resource) => ({
        id: resource.id,
        fileAssetId: resource.fileAssetId,
        title: resource.title,
        titleTranslations: resource.titleTranslations,
        customerVisible: resource.customerVisible,
        sortOrder: resource.sortOrder,
        originalFilename: resource.fileAsset.originalFilename,
        mimeType: resource.fileAsset.mimeType,
        sizeBytes: resource.fileAsset.sizeBytes,
        status: resource.fileAsset.status,
        createdAt: resource.createdAt.toISOString(),
        updatedAt: resource.updatedAt.toISOString(),
      })),
      review: { ...review, resourcesCount: resources.length },
    };
  }

  private normalizeRichJson(
    value: Record<string, unknown>,
    maxBytes: number,
    label: string,
  ): Prisma.InputJsonValue {
    const supported: Record<string, unknown> = {};
    for (const locale of ['ku', 'ar', 'en']) {
      if (value[locale] !== undefined) supported[locale] = value[locale];
    }
    const serialized = JSON.stringify(supported);
    if (serialized.length > maxBytes) {
      throw new BadRequestException(`${label} is too large.`);
    }
    this.assertSafeJson(supported, 0, { nodes: 0 });
    return JSON.parse(serialized) as Prisma.InputJsonValue;
  }

  private assertSafeJson(
    value: unknown,
    depth: number,
    counter: { nodes: number },
  ): void {
    if (depth > 30 || counter.nodes++ > 10_000) {
      throw new BadRequestException('Rich content is too complex.');
    }
    if (
      value === null ||
      ['string', 'number', 'boolean'].includes(typeof value)
    ) {
      if (typeof value === 'string' && value.length > 20_000) {
        throw new BadRequestException(
          'Rich content contains an oversized value.',
        );
      }
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) this.assertSafeJson(item, depth + 1, counter);
      return;
    }
    if (typeof value !== 'object') {
      throw new BadRequestException('Rich content contains an invalid value.');
    }
    for (const [key, item] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (['href', 'src'].includes(key) && typeof item === 'string') {
        const safe =
          item.startsWith('/') ||
          item.startsWith('https://') ||
          item.startsWith('http://');
        if (!safe)
          throw new BadRequestException('Rich content contains an unsafe URL.');
      }
      this.assertSafeJson(item, depth + 1, counter);
    }
  }

  private hasJsonContent(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    return JSON.stringify(value) !== '{}';
  }

  private optionalText(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private async currentStatusDraftPatch(
    lessonId: string,
  ): Promise<{ status?: TrainingContentStatus }> {
    const lesson = await this.prisma.trainingVideoLesson.findUnique({
      where: { id: lessonId },
      select: { status: true },
    });
    return lesson?.status === TrainingContentStatus.PUBLISHED
      ? { status: TrainingContentStatus.DRAFT }
      : {};
  }

  private assertPlatformAdministrator(principal: AuthenticatedPrincipal): void {
    if (principal.accountScope !== AccountScope.PLATFORM) {
      throw new ForbiddenException(
        'Platform administrator access is required.',
      );
    }
  }
}
