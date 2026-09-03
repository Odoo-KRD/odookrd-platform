import { Injectable, NotFoundException } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import {
  TrainingContentStatus,
  TrainingProgressStatus,
  TrainingQuizAttemptStatus,
  TrainingQuizPlacement,
  TrainingQuizStatus,
  TrainingQuizVersionStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { canCompleteTrainingCourse } from './training-course-completion.rules';
import {
  type CustomerTrainingContext,
  TrainingEntitlementService,
} from './training-entitlement.service';
import { evaluateTrainingLessonReadiness } from './training-lesson-readiness';

type CompletionDatabase = Pick<
  Prisma.TransactionClient,
  | 'trainingCourse'
  | 'trainingCourseCompletion'
  | 'trainingLessonProgress'
  | 'trainingQuizAttempt'
>;

const completionSelect = {
  id: true,
  companyId: true,
  userId: true,
  courseId: true,
  finalScorePercentage: true,
  completedAt: true,
  createdAt: true,
} satisfies Prisma.TrainingCourseCompletionSelect;

@Injectable()
export class TrainingCourseCompletionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: TrainingEntitlementService,
  ) {}

  async getCourseStatus(principal: AuthenticatedPrincipal, slug: string) {
    const { context, courseId } =
      await this.entitlements.assertEntitledCourseBySlug(principal, slug);

    const completion = await this.reconcileForContext(
      context,
      courseId,
      context.now,
    );

    return {
      courseId,
      completed: completion !== null,
      completion: completion ? this.presentCompletion(completion) : null,
    };
  }

  async reconcileForContext(
    context: CustomerTrainingContext,
    courseId: string,
    now: Date,
    transaction?: Prisma.TransactionClient,
  ) {
    const db: CompletionDatabase = transaction ?? this.prisma;

    const existing = await db.trainingCourseCompletion.findUnique({
      where: {
        userId_courseId: {
          userId: context.userId,
          courseId,
        },
      },
      select: completionSelect,
    });

    if (existing) {
      if (existing.companyId !== context.companyId) {
        throw new NotFoundException(
          'Training course completion was not found.',
        );
      }
      return existing;
    }

    const course = await db.trainingCourse.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        titleTranslations: true,
        lessons: {
          where: {
            status: TrainingContentStatus.PUBLISHED,
            section: { status: TrainingContentStatus.PUBLISHED },
          },
          select: {
            id: true,
            contentType: true,
            documentPageCount: true,
            articleContentTranslations: true,
            videoAsset: { select: { status: true } },
            documentAsset: { select: { status: true } },
            quiz: {
              select: {
                id: true,
                status: true,
                requiredForCompletion: true,
                requiredToContinue: true,
                versions: {
                  where: { status: TrainingQuizVersionStatus.PUBLISHED },
                  orderBy: { version: 'desc' },
                  take: 1,
                  select: {
                    id: true,
                    version: true,
                    passPercentage: true,
                    _count: { select: { questions: true } },
                  },
                },
              },
            },
          },
        },
        quizzes: {
          where: {
            placement: TrainingQuizPlacement.COURSE_FINAL,
            status: TrainingQuizStatus.PUBLISHED,
          },
          take: 1,
          select: {
            id: true,
            requiredForCompletion: true,
            versions: {
              where: { status: TrainingQuizVersionStatus.PUBLISHED },
              orderBy: { version: 'desc' },
              take: 1,
              select: {
                id: true,
                version: true,
                passPercentage: true,
                _count: { select: { questions: true } },
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Training course was not found.');
    }

    const readyLessons = course.lessons
      .map((lesson) => {
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

        if (!readiness.ready) return null;

        const requiredForCompletion =
          !quizConfigured ||
          lesson.quiz?.requiredForCompletion === true ||
          lesson.quiz?.requiredToContinue === true;

        return {
          id: lesson.id,
          requiredForCompletion,
          quiz:
            quizConfigured && lesson.quiz
              ? {
                  id: lesson.quiz.id,
                  requiredForCompletion: lesson.quiz.requiredForCompletion,
                  requiredToContinue: lesson.quiz.requiredToContinue,
                  version: lesson.quiz.versions[0] ?? null,
                }
              : null,
        };
      })
      .filter(
        (lesson): lesson is NonNullable<typeof lesson> => lesson !== null,
      );

    const requiredLessons = readyLessons.filter(
      (lesson) => lesson.requiredForCompletion,
    );
    const requiredLessonIds = requiredLessons.map((lesson) => lesson.id);

    const lessonProgress =
      requiredLessonIds.length === 0
        ? []
        : await db.trainingLessonProgress.findMany({
            where: {
              companyId: context.companyId,
              userId: context.userId,
              courseId,
              lessonId: { in: requiredLessonIds },
              status: TrainingProgressStatus.COMPLETED,
            },
            select: {
              lessonId: true,
              completedAt: true,
            },
          });

    const progressByLesson = new Map(
      lessonProgress.map((progress) => [progress.lessonId, progress] as const),
    );

    const requiredLearningCompleted = requiredLessons.every((lesson) =>
      progressByLesson.has(lesson.id),
    );

    const requiredSectionQuizzes = requiredLessons
      .filter(
        (
          lesson,
        ): lesson is typeof lesson & {
          quiz: NonNullable<typeof lesson.quiz>;
        } => lesson.quiz !== null,
      )
      .map((lesson) => ({
        lessonId: lesson.id,
        ...lesson.quiz,
      }));

    const finalQuiz =
      course.quizzes.find(
        (quiz) =>
          quiz.requiredForCompletion &&
          (quiz.versions[0]?._count.questions ?? 0) > 0,
      ) ?? null;

    const requiredQuizIds = [
      ...requiredSectionQuizzes.map((quiz) => quiz.id),
      ...(finalQuiz ? [finalQuiz.id] : []),
    ];

    const passedAttempts =
      requiredQuizIds.length === 0
        ? []
        : await db.trainingQuizAttempt.findMany({
            where: {
              companyId: context.companyId,
              userId: context.userId,
              courseId,
              quizId: { in: requiredQuizIds },
              status: TrainingQuizAttemptStatus.PASSED,
            },
            orderBy: [
              { submittedAt: 'asc' },
              { startedAt: 'asc' },
              { id: 'asc' },
            ],
            select: {
              id: true,
              quizId: true,
              quizVersionId: true,
              percentage: true,
              startedAt: true,
              submittedAt: true,
              quizVersion: {
                select: {
                  version: true,
                  passPercentage: true,
                },
              },
            },
          });

    const firstPassByQuiz = new Map<string, (typeof passedAttempts)[number]>();
    for (const attempt of passedAttempts) {
      if (!firstPassByQuiz.has(attempt.quizId)) {
        firstPassByQuiz.set(attempt.quizId, attempt);
      }
    }

    const requiredSectionQuizzesPassed = requiredSectionQuizzes.every((quiz) =>
      firstPassByQuiz.has(quiz.id),
    );
    const finalQuizPass = finalQuiz
      ? (firstPassByQuiz.get(finalQuiz.id) ?? null)
      : null;

    const requirementsSatisfied = canCompleteTrainingCourse({
      hasRequirements: requiredLessons.length > 0 || finalQuiz !== null,
      requiredLearningCompleted,
      requiredSectionQuizzesPassed,
      finalQuizRequired: finalQuiz !== null,
      finalQuizPassed: finalQuiz === null || finalQuizPass !== null,
    });

    if (!requirementsSatisfied) return null;

    const evidenceDates: Date[] = [];
    for (const progress of lessonProgress) {
      if (progress.completedAt) evidenceDates.push(progress.completedAt);
    }
    for (const quiz of requiredSectionQuizzes) {
      const pass = firstPassByQuiz.get(quiz.id);
      if (pass) evidenceDates.push(pass.submittedAt ?? pass.startedAt);
    }
    if (finalQuizPass) {
      evidenceDates.push(finalQuizPass.submittedAt ?? finalQuizPass.startedAt);
    }

    const completedAt =
      evidenceDates.length === 0
        ? now
        : new Date(Math.max(...evidenceDates.map((date) => date.getTime())));

    const requirementSnapshot = {
      version: 1,
      requiredLessonIds,
      requiredSectionQuizzes: requiredSectionQuizzes.map((quiz) => {
        const pass = firstPassByQuiz.get(quiz.id);
        return {
          quizId: quiz.id,
          lessonId: quiz.lessonId,
          requiredForCompletion: quiz.requiredForCompletion,
          requiredToContinue: quiz.requiredToContinue,
          configuredVersionId: quiz.version?.id ?? null,
          configuredVersion: quiz.version?.version ?? null,
          configuredPassPercentage: quiz.version?.passPercentage ?? null,
          passedAttemptId: pass?.id ?? null,
          passedQuizVersionId: pass?.quizVersionId ?? null,
          passedVersion: pass?.quizVersion.version ?? null,
          passedPercentage: pass?.percentage ?? null,
        };
      }),
      ...(finalQuiz
        ? {
            finalQuiz: {
              quizId: finalQuiz.id,
              requiredForCompletion: true,
              configuredVersionId: finalQuiz.versions[0]?.id ?? null,
              configuredVersion: finalQuiz.versions[0]?.version ?? null,
              configuredPassPercentage:
                finalQuiz.versions[0]?.passPercentage ?? null,
              passedAttemptId: finalQuizPass?.id ?? null,
              passedQuizVersionId: finalQuizPass?.quizVersionId ?? null,
              passedVersion: finalQuizPass?.quizVersion.version ?? null,
              passedPercentage: finalQuizPass?.percentage ?? null,
            },
          }
        : {}),
      capturedAt: now.toISOString(),
    } as Prisma.InputJsonObject;

    return db.trainingCourseCompletion.upsert({
      where: {
        userId_courseId: {
          userId: context.userId,
          courseId,
        },
      },
      update: {},
      create: {
        companyId: context.companyId,
        userId: context.userId,
        courseId,
        courseTitleSnapshot: course.title,
        courseTitleTranslations: this.localizedTextSnapshot(
          course.titleTranslations,
        ),
        finalScorePercentage: finalQuizPass?.percentage ?? null,
        requirementSnapshot,
        completedAt,
      },
      select: completionSelect,
    });
  }

  private presentCompletion(completion: {
    id: string;
    finalScorePercentage: number | null;
    completedAt: Date;
    createdAt: Date;
  }) {
    return {
      id: completion.id,
      completedAt: completion.completedAt.toISOString(),
      finalScorePercentage: completion.finalScorePercentage,
      recordedAt: completion.createdAt.toISOString(),
    };
  }

  private localizedTextSnapshot(
    value: Prisma.JsonValue,
  ): Prisma.InputJsonObject {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    const source = value;
    const ku = source.ku;
    const ar = source.ar;
    const en = source.en;

    return {
      ...(typeof ku === 'string' && ku.trim() ? { ku } : {}),
      ...(typeof ar === 'string' && ar.trim() ? { ar } : {}),
      ...(typeof en === 'string' && en.trim() ? { en } : {}),
    };
  }
}
