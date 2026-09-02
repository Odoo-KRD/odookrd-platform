import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  TrainingContentStatus,
  TrainingProgressStatus,
  TrainingQuizAttemptStatus,
  TrainingQuizStatus,
  TrainingQuizVersionStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { CustomerTrainingContext } from './training-entitlement.service';
import { calculateTrainingLearningGate } from './training-learning-gate.rules';
import { evaluateTrainingLessonReadiness } from './training-lesson-readiness';

@Injectable()
export class TrainingLearningGateService {
  constructor(private readonly prisma: PrismaService) {}

  async courseState(context: CustomerTrainingContext, courseId: string) {
    const lessons = await this.prisma.trainingVideoLesson.findMany({
      where: {
        courseId,
        status: TrainingContentStatus.PUBLISHED,
        section: { status: TrainingContentStatus.PUBLISHED },
      },
      orderBy: [
        { section: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
        { id: 'asc' },
      ],
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
            requiredToContinue: true,
            requiredForCompletion: true,
            versions: {
              where: { status: TrainingQuizVersionStatus.PUBLISHED },
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

    const readyLessons = lessons
      .filter((lesson) => {
        const quizConfigured =
          lesson.quiz?.status === TrainingQuizStatus.PUBLISHED &&
          (lesson.quiz.versions[0]?._count.questions ?? 0) > 0;

        return evaluateTrainingLessonReadiness({
          contentType: lesson.contentType,
          videoStatus: lesson.videoAsset?.status ?? null,
          documentStatus: lesson.documentAsset?.status ?? null,
          documentPageCount: lesson.documentPageCount,
          articleContentTranslations: lesson.articleContentTranslations,
          quizConfigured,
        }).ready;
      })
      .map((lesson) => {
        const quizConfigured =
          lesson.quiz?.status === TrainingQuizStatus.PUBLISHED &&
          (lesson.quiz.versions[0]?._count.questions ?? 0) > 0;

        return {
          id: lesson.id,
          quizId: quizConfigured ? (lesson.quiz?.id ?? null) : null,
          requiredToContinue:
            quizConfigured && lesson.quiz?.requiredToContinue === true,
          requiredForCompletion:
            !quizConfigured ||
            lesson.quiz?.requiredForCompletion === true ||
            lesson.quiz?.requiredToContinue === true,
        };
      });

    const readyIds = readyLessons.map((lesson) => lesson.id);
    const progressRows =
      readyIds.length === 0
        ? []
        : await this.prisma.trainingLessonProgress.findMany({
            where: {
              companyId: context.companyId,
              userId: context.userId,
              courseId,
              lessonId: { in: readyIds },
              status: TrainingProgressStatus.COMPLETED,
            },
            select: { lessonId: true },
          });

    const completedIds = new Set(
      progressRows.map((progress) => progress.lessonId),
    );
    const gate = calculateTrainingLearningGate(readyLessons, completedIds);

    return {
      readyLessonIds: readyIds,
      completedLessonIds: [...completedIds],
      lockedByLessonId: gate.lockedByLessonId,
      requiredLearningCompleted: gate.requiredLearningCompleted,
    };
  }

  async assertLessonAccessibleInCourse(
    context: CustomerTrainingContext,
    courseId: string,
    lessonId: string,
  ) {
    const state = await this.courseState(context, courseId);

    if (
      !state.readyLessonIds.includes(lessonId) ||
      state.lockedByLessonId[lessonId]
    ) {
      throw new NotFoundException('Training lesson was not found.');
    }

    return state;
  }

  async assertFinalQuizAccessibleInCourse(
    context: CustomerTrainingContext,
    courseId: string,
    quizId: string,
  ) {
    const state = await this.courseState(context, courseId);
    if (state.requiredLearningCompleted) return state;

    const passed = await this.prisma.trainingQuizAttempt.findFirst({
      where: {
        companyId: context.companyId,
        userId: context.userId,
        courseId,
        quizId,
        status: TrainingQuizAttemptStatus.PASSED,
      },
      select: { id: true },
    });

    if (passed) return state;

    throw new ConflictException(
      'Complete all available course lessons before starting the final quiz.',
    );
  }
}
