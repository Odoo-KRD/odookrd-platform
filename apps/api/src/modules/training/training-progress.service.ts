import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import {
  FileAssetStatus,
  TrainingContentStatus,
  TrainingLessonContentType,
  TrainingProgressStatus,
  TrainingQuizStatus,
  TrainingQuizVersionStatus,
  TrainingVideoAssetStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { UpdateTrainingLessonProgressDto } from './dto/training-progress.dto';
import {
  type CustomerTrainingContext,
  TrainingEntitlementService,
} from './training-entitlement.service';
import { TrainingCourseCompletionService } from './training-course-completion.service';
import { TrainingLearningGateService } from './training-learning-gate.service';
import { evaluateTrainingLessonReadiness } from './training-lesson-readiness';
import {
  calculateTrainingProgressPercentage,
  isVideoLessonComplete,
  normalizeDocumentPage,
  normalizeVideoPosition,
} from './training-progress.rules';

interface ReadyLessonRecord {
  id: string;
  contentType: TrainingLessonContentType;
  sectionSortOrder: number;
  sortOrder: number;
}

interface LessonProgressRecord {
  courseId: string;
  lessonId: string;
  status: TrainingProgressStatus;
  lastPositionSeconds: number;
  furthestPositionSeconds: number;
  lastPageNumber: number;
  furthestPageNumber: number;
  completedAt: Date | null;
  lastAccessedAt: Date;
}

interface ResolvedProgressLesson {
  context: CustomerTrainingContext;
  courseId: string;
  lesson: {
    id: string;
    contentType: TrainingLessonContentType;
    documentPageCount: number | null;
    articleContentTranslations: Prisma.JsonValue;
    videoAsset: {
      status: TrainingVideoAssetStatus;
      durationSeconds: number | null;
    } | null;
    documentAsset: {
      status: FileAssetStatus;
    } | null;
    quizConfigured: boolean;
  };
}

@Injectable()
export class TrainingProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: TrainingEntitlementService,
    private readonly gate: TrainingLearningGateService,
    private readonly completions: TrainingCourseCompletionService,
  ) {}

  async continueLearning(principal: AuthenticatedPrincipal) {
    const context = await this.entitlements.resolveCustomerContext(principal);
    if (!context.enabled) return { items: [] };

    const records = await this.prisma.trainingCourseProgress.findMany({
      where: {
        companyId: context.companyId,
        userId: context.userId,
        status: TrainingProgressStatus.IN_PROGRESS,
        course: this.entitlements.customerCourseWhere(context),
      },
      select: {
        courseId: true,
        lastAccessedAt: true,
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            titleTranslations: true,
            coverImageAssetId: true,
            category: {
              select: {
                id: true,
                key: true,
                name: true,
                nameTranslations: true,
              },
            },
          },
        },
      },
      orderBy: [{ lastAccessedAt: 'desc' }, { courseId: 'asc' }],
      take: 4,
    });

    const items = await Promise.all(
      records.map(async (record) => {
        const progress = await this.prisma.$transaction((tx) =>
          this.buildCourseProgress(
            tx,
            context,
            record.courseId,
            record.course.slug,
          ),
        );

        return {
          course: {
            id: record.course.id,
            slug: record.course.slug,
            title: record.course.title,
            titleTranslations: record.course.titleTranslations,
            hasCover: Boolean(record.course.coverImageAssetId),
            category: record.course.category,
          },
          progress,
        };
      }),
    );

    return {
      items: items.filter(
        (item) =>
          item.progress.totalLessons > 0 &&
          item.progress.resumeLessonId !== null &&
          item.progress.status !== 'COMPLETED',
      ),
    };
  }

  async getCourse(principal: AuthenticatedPrincipal, slug: string) {
    const { context, courseId } =
      await this.entitlements.assertEntitledCourseBySlug(principal, slug);

    return this.getCourseForContext(context, courseId, slug);
  }

  async getCourseForContext(
    context: CustomerTrainingContext,
    courseId: string,
    slug: string,
  ) {
    return this.prisma.$transaction((tx) =>
      this.buildCourseProgress(tx, context, courseId, slug),
    );
  }

  async getLesson(
    principal: AuthenticatedPrincipal,
    slug: string,
    lessonId: string,
  ) {
    const resolved = await this.resolveLesson(principal, slug, lessonId);
    const progress = await this.prisma.trainingLessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: resolved.context.userId,
          lessonId,
        },
      },
    });

    if (progress && progress.companyId !== resolved.context.companyId) {
      return this.lessonState(
        resolved.courseId,
        lessonId,
        resolved.lesson.contentType,
        null,
      );
    }

    return this.lessonState(
      resolved.courseId,
      lessonId,
      resolved.lesson.contentType,
      progress,
    );
  }

  async startLesson(
    principal: AuthenticatedPrincipal,
    slug: string,
    lessonId: string,
  ) {
    const resolved = await this.resolveLesson(principal, slug, lessonId);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.trainingLessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: resolved.context.userId,
            lessonId,
          },
        },
      });

      if (existing && existing.companyId !== resolved.context.companyId) {
        throw new NotFoundException('Training lesson was not found.');
      }

      const page =
        resolved.lesson.contentType === TrainingLessonContentType.DOCUMENT
          ? 1
          : 0;

      const progress = existing
        ? await tx.trainingLessonProgress.update({
            where: { id: existing.id },
            data: { lastAccessedAt: now },
          })
        : await tx.trainingLessonProgress.create({
            data: {
              companyId: resolved.context.companyId,
              userId: resolved.context.userId,
              courseId: resolved.courseId,
              lessonId,
              status: TrainingProgressStatus.IN_PROGRESS,
              lastPageNumber: page,
              furthestPageNumber: page,
              lastAccessedAt: now,
            },
          });

      await this.syncCourseProgress(
        tx,
        resolved.context,
        resolved.courseId,
        lessonId,
        now,
      );

      return this.lessonState(
        resolved.courseId,
        lessonId,
        resolved.lesson.contentType,
        progress,
      );
    });
  }

  async updateLesson(
    principal: AuthenticatedPrincipal,
    slug: string,
    lessonId: string,
    body: UpdateTrainingLessonProgressDto,
  ) {
    const resolved = await this.resolveLesson(principal, slug, lessonId);
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.trainingLessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: resolved.context.userId,
            lessonId,
          },
        },
      });

      if (existing && existing.companyId !== resolved.context.companyId) {
        throw new NotFoundException('Training lesson was not found.');
      }

      const base = existing ?? {
        lastPositionSeconds: 0,
        furthestPositionSeconds: 0,
        lastPageNumber: 0,
        furthestPageNumber: 0,
        status: TrainingProgressStatus.IN_PROGRESS,
        completedAt: null,
      };

      let lastPositionSeconds = base.lastPositionSeconds;
      let furthestPositionSeconds = base.furthestPositionSeconds;
      let lastPageNumber = base.lastPageNumber;
      let furthestPageNumber = base.furthestPageNumber;
      let completed = base.status === TrainingProgressStatus.COMPLETED;

      if (resolved.lesson.contentType === TrainingLessonContentType.VIDEO) {
        if (
          body.positionSeconds === undefined ||
          body.pageNumber !== undefined
        ) {
          throw new BadRequestException(
            'Video progress requires positionSeconds only.',
          );
        }

        const durationSeconds =
          resolved.lesson.videoAsset?.durationSeconds ?? null;
        lastPositionSeconds = normalizeVideoPosition(
          body.positionSeconds,
          durationSeconds,
        );
        furthestPositionSeconds = Math.max(
          furthestPositionSeconds,
          lastPositionSeconds,
        );
        completed =
          completed ||
          isVideoLessonComplete(furthestPositionSeconds, durationSeconds);
      } else if (
        resolved.lesson.contentType === TrainingLessonContentType.DOCUMENT
      ) {
        if (
          body.pageNumber === undefined ||
          body.positionSeconds !== undefined
        ) {
          throw new BadRequestException(
            'Document progress requires pageNumber only.',
          );
        }

        const pageCount = resolved.lesson.documentPageCount ?? 0;
        lastPageNumber = normalizeDocumentPage(body.pageNumber, pageCount);
        furthestPageNumber = Math.max(furthestPageNumber, lastPageNumber);
        completed = completed || furthestPageNumber >= pageCount;
      } else {
        throw new BadRequestException(
          'Article lessons are completed with the explicit completion action.',
        );
      }

      const status = completed
        ? TrainingProgressStatus.COMPLETED
        : TrainingProgressStatus.IN_PROGRESS;
      const completedAt = completed ? (base.completedAt ?? now) : null;

      const progress = existing
        ? await tx.trainingLessonProgress.update({
            where: { id: existing.id },
            data: {
              status,
              lastPositionSeconds,
              furthestPositionSeconds,
              lastPageNumber,
              furthestPageNumber,
              completedAt,
              lastAccessedAt: now,
            },
          })
        : await tx.trainingLessonProgress.create({
            data: {
              companyId: resolved.context.companyId,
              userId: resolved.context.userId,
              courseId: resolved.courseId,
              lessonId,
              status,
              lastPositionSeconds,
              furthestPositionSeconds,
              lastPageNumber,
              furthestPageNumber,
              completedAt,
              lastAccessedAt: now,
            },
          });

      await this.syncCourseProgress(
        tx,
        resolved.context,
        resolved.courseId,
        lessonId,
        now,
      );

      return this.lessonState(
        resolved.courseId,
        lessonId,
        resolved.lesson.contentType,
        progress,
      );
    });
  }

  async completeLesson(
    principal: AuthenticatedPrincipal,
    slug: string,
    lessonId: string,
  ) {
    const resolved = await this.resolveLesson(principal, slug, lessonId);

    if (resolved.lesson.contentType !== TrainingLessonContentType.ARTICLE) {
      throw new BadRequestException(
        'Only article lessons support explicit completion.',
      );
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.trainingLessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: resolved.context.userId,
            lessonId,
          },
        },
      });

      if (existing && existing.companyId !== resolved.context.companyId) {
        throw new NotFoundException('Training lesson was not found.');
      }

      const progress = existing
        ? await tx.trainingLessonProgress.update({
            where: { id: existing.id },
            data: {
              status: TrainingProgressStatus.COMPLETED,
              completedAt: existing.completedAt ?? now,
              lastAccessedAt: now,
            },
          })
        : await tx.trainingLessonProgress.create({
            data: {
              companyId: resolved.context.companyId,
              userId: resolved.context.userId,
              courseId: resolved.courseId,
              lessonId,
              status: TrainingProgressStatus.COMPLETED,
              completedAt: now,
              lastAccessedAt: now,
            },
          });

      await this.syncCourseProgress(
        tx,
        resolved.context,
        resolved.courseId,
        lessonId,
        now,
      );

      return this.lessonState(
        resolved.courseId,
        lessonId,
        resolved.lesson.contentType,
        progress,
      );
    });
  }

  async completeQuizLesson(
    principal: AuthenticatedPrincipal,
    slug: string,
    lessonId: string,
  ) {
    const resolved = await this.resolveLesson(principal, slug, lessonId);

    if (resolved.lesson.contentType !== TrainingLessonContentType.QUIZ) {
      throw new BadRequestException(
        'Only quiz lessons support scored quiz completion.',
      );
    }

    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.trainingLessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: resolved.context.userId,
            lessonId,
          },
        },
      });

      if (existing && existing.companyId !== resolved.context.companyId) {
        throw new NotFoundException('Training lesson was not found.');
      }

      const progress = existing
        ? await tx.trainingLessonProgress.update({
            where: { id: existing.id },
            data: {
              status: TrainingProgressStatus.COMPLETED,
              completedAt: existing.completedAt ?? now,
              lastAccessedAt: now,
            },
          })
        : await tx.trainingLessonProgress.create({
            data: {
              companyId: resolved.context.companyId,
              userId: resolved.context.userId,
              courseId: resolved.courseId,
              lessonId,
              status: TrainingProgressStatus.COMPLETED,
              completedAt: now,
              lastAccessedAt: now,
            },
          });

      await this.syncCourseProgress(
        tx,
        resolved.context,
        resolved.courseId,
        lessonId,
        now,
      );

      return this.lessonState(
        resolved.courseId,
        lessonId,
        resolved.lesson.contentType,
        progress,
      );
    });
  }

  private async resolveLesson(
    principal: AuthenticatedPrincipal,
    slug: string,
    lessonId: string,
  ): Promise<ResolvedProgressLesson> {
    const { context, courseId } =
      await this.entitlements.assertEntitledCourseBySlug(principal, slug);

    const lesson = await this.prisma.trainingVideoLesson.findFirst({
      where: {
        id: lessonId,
        courseId,
        status: TrainingContentStatus.PUBLISHED,
        section: { status: TrainingContentStatus.PUBLISHED },
      },
      select: {
        id: true,
        contentType: true,
        documentPageCount: true,
        articleContentTranslations: true,
        videoAsset: {
          select: {
            status: true,
            durationSeconds: true,
          },
        },
        documentAsset: {
          select: {
            status: true,
          },
        },
        quiz: {
          select: {
            status: true,
            versions: {
              where: {
                status: TrainingQuizVersionStatus.PUBLISHED,
              },
              orderBy: { version: 'desc' },
              take: 1,
              select: {
                _count: { select: { questions: true } },
              },
            },
          },
        },
      },
    });

    if (!lesson || !lesson.contentType) {
      throw new NotFoundException('Training lesson was not found.');
    }

    const quizConfigured =
      lesson.quiz?.status === TrainingQuizStatus.PUBLISHED &&
      (lesson.quiz.versions[0]?._count.questions ?? 0) > 0;

    const readiness = evaluateTrainingLessonReadiness({
      contentType: lesson.contentType,
      videoStatus: lesson.videoAsset?.status ?? null,
      documentStatus: lesson.documentAsset?.status ?? null,
      documentPageCount: lesson.documentPageCount,
      articleContentTranslations: lesson.articleContentTranslations,
      quizConfigured,
    });

    if (!readiness.ready) {
      throw new NotFoundException('Training lesson was not found.');
    }

    await this.gate.assertLessonAccessibleInCourse(context, courseId, lessonId);

    return {
      context,
      courseId,
      lesson: {
        ...lesson,
        contentType: lesson.contentType,
        videoAsset: lesson.videoAsset
          ? {
              status: lesson.videoAsset.status,
              durationSeconds: lesson.videoAsset.durationSeconds,
            }
          : null,
        documentAsset: lesson.documentAsset
          ? { status: lesson.documentAsset.status }
          : null,
        quizConfigured,
      },
    };
  }

  private async readyLessons(
    tx: Prisma.TransactionClient,
    courseId: string,
  ): Promise<ReadyLessonRecord[]> {
    const records = await tx.trainingVideoLesson.findMany({
      where: {
        courseId,
        status: TrainingContentStatus.PUBLISHED,
        section: { status: TrainingContentStatus.PUBLISHED },
      },
      select: {
        id: true,
        contentType: true,
        sortOrder: true,
        documentPageCount: true,
        articleContentTranslations: true,
        videoAsset: { select: { status: true } },
        documentAsset: { select: { status: true } },
        quiz: {
          select: {
            status: true,
            versions: {
              where: {
                status: TrainingQuizVersionStatus.PUBLISHED,
              },
              orderBy: { version: 'desc' },
              take: 1,
              select: {
                _count: { select: { questions: true } },
              },
            },
          },
        },
        section: { select: { sortOrder: true } },
      },
    });

    return records
      .filter((lesson) => {
        if (!lesson.contentType) return false;
        return evaluateTrainingLessonReadiness({
          contentType: lesson.contentType,
          videoStatus: lesson.videoAsset?.status ?? null,
          documentStatus: lesson.documentAsset?.status ?? null,
          documentPageCount: lesson.documentPageCount,
          articleContentTranslations: lesson.articleContentTranslations,
          quizConfigured:
            lesson.quiz?.status === TrainingQuizStatus.PUBLISHED &&
            (lesson.quiz.versions[0]?._count.questions ?? 0) > 0,
        }).ready;
      })
      .map((lesson) => ({
        id: lesson.id,
        contentType: lesson.contentType as TrainingLessonContentType,
        sectionSortOrder: lesson.section.sortOrder,
        sortOrder: lesson.sortOrder,
      }))
      .sort(
        (left, right) =>
          left.sectionSortOrder - right.sectionSortOrder ||
          left.sortOrder - right.sortOrder ||
          left.id.localeCompare(right.id),
      );
  }

  private async syncCourseProgress(
    tx: Prisma.TransactionClient,
    context: CustomerTrainingContext,
    courseId: string,
    lastLessonId: string,
    now: Date,
  ): Promise<void> {
    const readyLessons = await this.readyLessons(tx, courseId);
    const readyIds = readyLessons.map((lesson) => lesson.id);

    const lessonProgress =
      readyIds.length === 0
        ? []
        : await tx.trainingLessonProgress.findMany({
            where: {
              companyId: context.companyId,
              userId: context.userId,
              courseId,
              lessonId: { in: readyIds },
            },
            select: {
              lessonId: true,
              status: true,
            },
          });

    const completedLessons = lessonProgress.filter(
      (item) => item.status === TrainingProgressStatus.COMPLETED,
    ).length;
    const shouldReconcileCompletion = lessonProgress.some(
      (item) =>
        item.lessonId === lastLessonId &&
        item.status === TrainingProgressStatus.COMPLETED,
    );
    const status =
      readyIds.length > 0 && completedLessons === readyIds.length
        ? TrainingProgressStatus.COMPLETED
        : TrainingProgressStatus.IN_PROGRESS;

    const existing = await tx.trainingCourseProgress.findUnique({
      where: {
        userId_courseId: {
          userId: context.userId,
          courseId,
        },
      },
    });

    if (existing && existing.companyId !== context.companyId) {
      throw new NotFoundException('Training course was not found.');
    }

    const completedAt =
      status === TrainingProgressStatus.COMPLETED
        ? (existing?.completedAt ?? now)
        : null;

    if (existing) {
      await tx.trainingCourseProgress.update({
        where: { id: existing.id },
        data: {
          lastLessonId,
          status,
          completedAt,
          lastAccessedAt: now,
        },
      });

      if (shouldReconcileCompletion) {
        await this.completions.reconcileForContext(context, courseId, now, tx);
      }
      return;
    }

    await tx.trainingCourseProgress.create({
      data: {
        companyId: context.companyId,
        userId: context.userId,
        courseId,
        lastLessonId,
        status,
        completedAt,
        lastAccessedAt: now,
      },
    });

    if (shouldReconcileCompletion) {
      await this.completions.reconcileForContext(context, courseId, now, tx);
    }
  }

  private async buildCourseProgress(
    tx: Prisma.TransactionClient,
    context: CustomerTrainingContext,
    courseId: string,
    slug: string,
  ) {
    const readyLessons = await this.readyLessons(tx, courseId);
    const readyIds = readyLessons.map((lesson) => lesson.id);

    const progressRows =
      readyIds.length === 0
        ? []
        : await tx.trainingLessonProgress.findMany({
            where: {
              companyId: context.companyId,
              userId: context.userId,
              courseId,
              lessonId: { in: readyIds },
            },
          });

    const courseProgress = await tx.trainingCourseProgress.findFirst({
      where: {
        companyId: context.companyId,
        userId: context.userId,
        courseId,
      },
    });

    const progressByLesson = new Map(
      progressRows.map((progress) => [progress.lessonId, progress] as const),
    );
    const completedLessons = readyLessons.filter(
      (lesson) =>
        progressByLesson.get(lesson.id)?.status ===
        TrainingProgressStatus.COMPLETED,
    ).length;
    const totalLessons = readyLessons.length;
    const percentage = calculateTrainingProgressPercentage(
      completedLessons,
      totalLessons,
    );

    const calculatedStatus =
      totalLessons > 0 && completedLessons === totalLessons
        ? 'COMPLETED'
        : courseProgress || progressRows.length > 0
          ? 'IN_PROGRESS'
          : 'NOT_STARTED';

    const gate = await this.gate.courseState(context, courseId);
    const accessibleIds = new Set(
      readyIds.filter((lessonId) => !gate.lockedByLessonId[lessonId]),
    );

    const preferredResume =
      courseProgress?.lastLessonId &&
      accessibleIds.has(courseProgress.lastLessonId) &&
      progressByLesson.get(courseProgress.lastLessonId)?.status !==
        TrainingProgressStatus.COMPLETED
        ? courseProgress.lastLessonId
        : null;
    const firstIncomplete =
      readyLessons.find(
        (lesson) =>
          accessibleIds.has(lesson.id) &&
          progressByLesson.get(lesson.id)?.status !==
            TrainingProgressStatus.COMPLETED,
      )?.id ?? null;
    const firstAccessible =
      readyLessons.find((lesson) => accessibleIds.has(lesson.id))?.id ?? null;
    const resumeLessonId =
      preferredResume ?? firstIncomplete ?? firstAccessible;

    const latestLessonAccess = progressRows.reduce<Date | null>(
      (latest, progress) =>
        !latest || progress.lastAccessedAt > latest
          ? progress.lastAccessedAt
          : latest,
      null,
    );

    return {
      courseId,
      slug,
      status: calculatedStatus,
      completedLessons,
      totalLessons,
      percentage,
      resumeLessonId,
      lastAccessedAt:
        (
          courseProgress?.lastAccessedAt ??
          latestLessonAccess ??
          null
        )?.toISOString() ?? null,
      lessons: readyLessons.map((lesson) =>
        this.lessonState(
          courseId,
          lesson.id,
          lesson.contentType,
          progressByLesson.get(lesson.id) ?? null,
        ),
      ),
    };
  }

  private lessonState(
    courseId: string,
    lessonId: string,
    contentType: TrainingLessonContentType,
    progress: LessonProgressRecord | null,
  ) {
    return {
      courseId,
      lessonId,
      contentType,
      status: progress?.status ?? 'NOT_STARTED',
      lastPositionSeconds: progress?.lastPositionSeconds ?? 0,
      furthestPositionSeconds: progress?.furthestPositionSeconds ?? 0,
      lastPageNumber: progress?.lastPageNumber ?? 0,
      furthestPageNumber: progress?.furthestPageNumber ?? 0,
      completedAt: progress?.completedAt?.toISOString() ?? null,
      lastAccessedAt: progress?.lastAccessedAt?.toISOString() ?? null,
    };
  }
}
