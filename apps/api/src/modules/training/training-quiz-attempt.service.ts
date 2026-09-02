import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import {
  TrainingContentStatus,
  TrainingQuizAttemptStatus,
  TrainingQuizPlacement,
  TrainingQuizQuestionType,
  TrainingQuizStatus,
  TrainingQuizVersionStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { SaveTrainingQuizAnswerDto } from './dto/training-quiz-attempt.dto';
import { TrainingEntitlementService } from './training-entitlement.service';
import { TrainingLearningGateService } from './training-learning-gate.service';
import { TrainingProgressService } from './training-progress.service';
import {
  deterministicQuizOrder,
  exactQuizSelectionMatch,
  quizPercentage,
} from './training-quiz-attempt.rules';

@Injectable()
export class TrainingQuizAttemptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: TrainingEntitlementService,
    private readonly gate: TrainingLearningGateService,
    private readonly progress: TrainingProgressService,
  ) {}

  async getQuiz(
    principal: AuthenticatedPrincipal,
    slug: string,
    quizId: string,
  ) {
    const resolved = await this.resolvePublishedQuiz(principal, slug, quizId);
    await this.expireActiveAttempts(
      resolved.context.companyId,
      resolved.context.userId,
      quizId,
      resolved.context.now,
    );

    const [attemptsUsed, activeAttempt] = await Promise.all([
      this.prisma.trainingQuizAttempt.count({
        where: {
          companyId: resolved.context.companyId,
          userId: resolved.context.userId,
          quizId,
        },
      }),
      this.prisma.trainingQuizAttempt.findFirst({
        where: {
          companyId: resolved.context.companyId,
          userId: resolved.context.userId,
          quizId,
          status: TrainingQuizAttemptStatus.IN_PROGRESS,
        },
        orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
        select: { id: true, expiresAt: true },
      }),
    ]);

    const maxAttempts = resolved.version.maxAttempts;
    const attemptsRemaining =
      maxAttempts === null ? null : Math.max(0, maxAttempts - attemptsUsed);

    return {
      id: resolved.quiz.id,
      courseId: resolved.courseId,
      lessonId: resolved.quiz.lessonId,
      placement: resolved.quiz.placement,
      title: resolved.quiz.title,
      titleTranslations: resolved.quiz.titleTranslations,
      instructions: resolved.quiz.instructions,
      instructionTranslations: resolved.quiz.instructionTranslations,
      requiredForCompletion: resolved.quiz.requiredForCompletion,
      requiredToContinue: resolved.quiz.requiredToContinue,
      version: resolved.version.version,
      passPercentage: resolved.version.passPercentage,
      maxAttempts,
      attemptsUsed,
      attemptsRemaining,
      timeLimitSeconds: resolved.version.timeLimitSeconds,
      shuffleQuestions: resolved.version.shuffleQuestions,
      shuffleOptions: resolved.version.shuffleOptions,
      revealAnswers: resolved.version.revealAnswers,
      questionCount: resolved.version.questions.length,
      totalPoints: resolved.version.questions.reduce(
        (sum, question) => sum + question.points,
        0,
      ),
      activeAttemptId: activeAttempt?.id ?? null,
      activeAttemptExpiresAt: activeAttempt?.expiresAt?.toISOString() ?? null,
    };
  }

  async startAttempt(
    principal: AuthenticatedPrincipal,
    slug: string,
    quizId: string,
  ) {
    const resolved = await this.resolvePublishedQuiz(principal, slug, quizId);
    const now = resolved.context.now;

    await this.expireActiveAttempts(
      resolved.context.companyId,
      resolved.context.userId,
      quizId,
      now,
    );

    const active = await this.prisma.trainingQuizAttempt.findFirst({
      where: {
        companyId: resolved.context.companyId,
        userId: resolved.context.userId,
        quizId,
        status: TrainingQuizAttemptStatus.IN_PROGRESS,
      },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
      select: { id: true },
    });

    if (active) {
      if (
        resolved.quiz.placement === TrainingQuizPlacement.SECTION &&
        resolved.quiz.lessonId
      ) {
        await this.progress.startLesson(
          principal,
          slug,
          resolved.quiz.lessonId,
        );
      }
      return this.getAttempt(principal, slug, quizId, active.id);
    }

    const attemptsUsed = await this.prisma.trainingQuizAttempt.count({
      where: {
        companyId: resolved.context.companyId,
        userId: resolved.context.userId,
        quizId,
      },
    });

    if (
      resolved.version.maxAttempts !== null &&
      attemptsUsed >= resolved.version.maxAttempts
    ) {
      throw new ConflictException(
        'The maximum number of quiz attempts has been reached.',
      );
    }

    const latest = await this.prisma.trainingQuizAttempt.aggregate({
      where: {
        userId: resolved.context.userId,
        quizId,
      },
      _max: { attemptNumber: true },
    });
    const attemptNumber = (latest._max.attemptNumber ?? 0) + 1;
    const expiresAt =
      resolved.version.timeLimitSeconds === null
        ? null
        : new Date(now.getTime() + resolved.version.timeLimitSeconds * 1000);

    let attemptId: string;
    try {
      const attempt = await this.prisma.trainingQuizAttempt.create({
        data: {
          companyId: resolved.context.companyId,
          userId: resolved.context.userId,
          courseId: resolved.courseId,
          quizId,
          quizVersionId: resolved.version.id,
          attemptNumber,
          status: TrainingQuizAttemptStatus.IN_PROGRESS,
          startedAt: now,
          expiresAt,
        },
        select: { id: true },
      });
      attemptId = attempt.id;
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException(
          'A quiz attempt was created concurrently. Please retry.',
        );
      }
      throw error;
    }

    if (
      resolved.quiz.placement === TrainingQuizPlacement.SECTION &&
      resolved.quiz.lessonId
    ) {
      await this.progress.startLesson(principal, slug, resolved.quiz.lessonId);
    }

    return this.getAttempt(principal, slug, quizId, attemptId);
  }

  async getAttempt(
    principal: AuthenticatedPrincipal,
    slug: string,
    quizId: string,
    attemptId: string,
  ) {
    const { context, courseId } =
      await this.entitlements.assertEntitledCourseBySlug(principal, slug);

    let attempt = await this.scopedAttempt(
      context.companyId,
      context.userId,
      courseId,
      quizId,
      attemptId,
    );
    await this.assertAttemptGate(context, courseId, attempt);

    if (
      attempt.status === TrainingQuizAttemptStatus.IN_PROGRESS &&
      attempt.expiresAt &&
      attempt.expiresAt <= context.now
    ) {
      await this.prisma.trainingQuizAttempt.update({
        where: { id: attempt.id },
        data: { status: TrainingQuizAttemptStatus.EXPIRED },
      });
      attempt = await this.scopedAttempt(
        context.companyId,
        context.userId,
        courseId,
        quizId,
        attemptId,
      );
    }

    return this.presentAttempt(attempt);
  }

  async saveAnswer(
    principal: AuthenticatedPrincipal,
    slug: string,
    quizId: string,
    attemptId: string,
    questionId: string,
    input: SaveTrainingQuizAnswerDto,
  ) {
    const { context, courseId } =
      await this.entitlements.assertEntitledCourseBySlug(principal, slug);
    const attempt = await this.scopedAttempt(
      context.companyId,
      context.userId,
      courseId,
      quizId,
      attemptId,
    );
    await this.assertAttemptGate(context, courseId, attempt);

    await this.assertWritableAttempt(attempt, context.now);

    const question = attempt.quizVersion.questions.find(
      (candidate) => candidate.id === questionId,
    );
    if (!question) {
      throw new NotFoundException('Training quiz question was not found.');
    }

    const selected = [...new Set(input.selectedOptionIds)];
    if (selected.length !== input.selectedOptionIds.length) {
      throw new BadRequestException(
        'Selected quiz options must not contain duplicates.',
      );
    }

    const validOptionIds = new Set(question.options.map((option) => option.id));
    if (selected.some((optionId) => !validOptionIds.has(optionId))) {
      throw new BadRequestException(
        'One or more selected quiz options are invalid.',
      );
    }

    if (
      (question.type === TrainingQuizQuestionType.SINGLE_CHOICE ||
        question.type === TrainingQuizQuestionType.TRUE_FALSE) &&
      selected.length > 1
    ) {
      throw new BadRequestException(
        'This question accepts only one selected option.',
      );
    }

    await this.prisma.trainingQuizAttemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      create: {
        attemptId,
        questionId,
        selectedOptionIds: selected,
        isCorrect: null,
        pointsAwarded: null,
        answeredAt: context.now,
      },
      update: {
        selectedOptionIds: selected,
        isCorrect: null,
        pointsAwarded: null,
        answeredAt: context.now,
      },
    });

    return this.getAttempt(principal, slug, quizId, attemptId);
  }

  async submitAttempt(
    principal: AuthenticatedPrincipal,
    slug: string,
    quizId: string,
    attemptId: string,
  ) {
    const { context, courseId } =
      await this.entitlements.assertEntitledCourseBySlug(principal, slug);
    let attempt = await this.scopedAttempt(
      context.companyId,
      context.userId,
      courseId,
      quizId,
      attemptId,
    );
    await this.assertAttemptGate(context, courseId, attempt);

    if (
      attempt.status === TrainingQuizAttemptStatus.PASSED ||
      attempt.status === TrainingQuizAttemptStatus.FAILED ||
      attempt.status === TrainingQuizAttemptStatus.SUBMITTED
    ) {
      if (
        attempt.status === TrainingQuizAttemptStatus.PASSED &&
        attempt.quiz.placement === TrainingQuizPlacement.SECTION &&
        attempt.quiz.lessonId
      ) {
        await this.progress.completeQuizLesson(
          principal,
          slug,
          attempt.quiz.lessonId,
        );
      }
      return this.presentAttempt(attempt);
    }

    await this.assertWritableAttempt(attempt, context.now);

    const answerByQuestion = new Map(
      attempt.answers.map((answer) => [
        answer.questionId,
        this.jsonStringArray(answer.selectedOptionIds),
      ]),
    );

    let score = 0;
    const maxScore = attempt.quizVersion.questions.reduce(
      (sum, question) => sum + question.points,
      0,
    );

    const grading = attempt.quizVersion.questions.map((question) => {
      const selected = answerByQuestion.get(question.id) ?? [];
      const correct = question.options
        .filter((option) => option.isCorrect)
        .map((option) => option.id);
      const isCorrect = exactQuizSelectionMatch(selected, correct);
      const pointsAwarded = isCorrect ? question.points : 0;
      score += pointsAwarded;

      return {
        questionId: question.id,
        selected,
        isCorrect,
        pointsAwarded,
      };
    });

    const percentage = quizPercentage(score, maxScore);
    const status =
      percentage >= attempt.quizVersion.passPercentage
        ? TrainingQuizAttemptStatus.PASSED
        : TrainingQuizAttemptStatus.FAILED;

    await this.prisma.$transaction(async (transaction) => {
      for (const result of grading) {
        await transaction.trainingQuizAttemptAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId,
              questionId: result.questionId,
            },
          },
          create: {
            attemptId,
            questionId: result.questionId,
            selectedOptionIds: result.selected,
            isCorrect: result.isCorrect,
            pointsAwarded: result.pointsAwarded,
            answeredAt: context.now,
          },
          update: {
            isCorrect: result.isCorrect,
            pointsAwarded: result.pointsAwarded,
          },
        });
      }

      await transaction.trainingQuizAttempt.update({
        where: { id: attemptId },
        data: {
          status,
          score,
          maxScore,
          percentage,
          submittedAt: context.now,
        },
      });
    });

    attempt = await this.scopedAttempt(
      context.companyId,
      context.userId,
      courseId,
      quizId,
      attemptId,
    );

    if (
      attempt.status === TrainingQuizAttemptStatus.PASSED &&
      attempt.quiz.placement === TrainingQuizPlacement.SECTION &&
      attempt.quiz.lessonId
    ) {
      await this.progress.completeQuizLesson(
        principal,
        slug,
        attempt.quiz.lessonId,
      );
    }

    return this.presentAttempt(attempt);
  }

  async history(
    principal: AuthenticatedPrincipal,
    slug: string,
    quizId: string,
  ) {
    const resolved = await this.resolvePublishedQuiz(principal, slug, quizId);
    await this.expireActiveAttempts(
      resolved.context.companyId,
      resolved.context.userId,
      quizId,
      resolved.context.now,
    );

    const attempts = await this.prisma.trainingQuizAttempt.findMany({
      where: {
        companyId: resolved.context.companyId,
        userId: resolved.context.userId,
        courseId: resolved.courseId,
        quizId,
      },
      orderBy: [{ attemptNumber: 'desc' }, { startedAt: 'desc' }],
      take: 50,
      select: {
        id: true,
        attemptNumber: true,
        status: true,
        score: true,
        maxScore: true,
        percentage: true,
        startedAt: true,
        submittedAt: true,
        expiresAt: true,
        quizVersion: { select: { version: true, passPercentage: true } },
      },
    });

    return {
      items: attempts.map((attempt) => ({
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        version: attempt.quizVersion.version,
        passPercentage: attempt.quizVersion.passPercentage,
        score: attempt.score,
        maxScore: attempt.maxScore,
        percentage: attempt.percentage,
        startedAt: attempt.startedAt.toISOString(),
        submittedAt: attempt.submittedAt?.toISOString() ?? null,
        expiresAt: attempt.expiresAt?.toISOString() ?? null,
      })),
    };
  }

  private async resolvePublishedQuiz(
    principal: AuthenticatedPrincipal,
    slug: string,
    quizId: string,
  ) {
    const { context, courseId } =
      await this.entitlements.assertEntitledCourseBySlug(principal, slug);

    const quiz = await this.prisma.trainingQuiz.findFirst({
      where: {
        id: quizId,
        courseId,
        status: TrainingQuizStatus.PUBLISHED,
        OR: [
          {
            placement: TrainingQuizPlacement.SECTION,
            lessonId: { not: null },
            sectionId: { not: null },
            lesson: {
              status: TrainingContentStatus.PUBLISHED,
              section: { status: TrainingContentStatus.PUBLISHED },
            },
          },
          {
            placement: TrainingQuizPlacement.COURSE_FINAL,
            lessonId: null,
            sectionId: null,
          },
        ],
      },
      select: {
        id: true,
        courseId: true,
        sectionId: true,
        lessonId: true,
        placement: true,
        title: true,
        titleTranslations: true,
        instructions: true,
        instructionTranslations: true,
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
            maxAttempts: true,
            timeLimitSeconds: true,
            shuffleQuestions: true,
            shuffleOptions: true,
            revealAnswers: true,
            questions: {
              orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
              select: {
                id: true,
                type: true,
                prompt: true,
                promptTranslations: true,
                explanation: true,
                explanationTranslations: true,
                points: true,
                sortOrder: true,
                options: {
                  orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
                  select: {
                    id: true,
                    text: true,
                    textTranslations: true,
                    isCorrect: true,
                    sortOrder: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const version = quiz?.versions[0];
    if (!quiz || !version || version.questions.length === 0) {
      throw new NotFoundException('Training quiz was not found.');
    }

    if (quiz.placement === TrainingQuizPlacement.SECTION && quiz.lessonId) {
      await this.gate.assertLessonAccessibleInCourse(
        context,
        courseId,
        quiz.lessonId,
      );
    } else if (quiz.placement === TrainingQuizPlacement.COURSE_FINAL) {
      await this.gate.assertFinalQuizAccessibleInCourse(
        context,
        courseId,
        quiz.id,
      );
    }

    return { context, courseId, quiz, version };
  }

  private async assertAttemptGate(
    context: Awaited<
      ReturnType<TrainingEntitlementService['resolveCustomerContext']>
    >,
    courseId: string,
    attempt: Awaited<ReturnType<TrainingQuizAttemptService['scopedAttempt']>>,
  ): Promise<void> {
    if (
      attempt.quiz.placement === TrainingQuizPlacement.SECTION &&
      attempt.quiz.lessonId
    ) {
      await this.gate.assertLessonAccessibleInCourse(
        context,
        courseId,
        attempt.quiz.lessonId,
      );
      return;
    }

    if (attempt.quiz.placement === TrainingQuizPlacement.COURSE_FINAL) {
      await this.gate.assertFinalQuizAccessibleInCourse(
        context,
        courseId,
        attempt.quizId,
      );
    }
  }

  private async scopedAttempt(
    companyId: string,
    userId: string,
    courseId: string,
    quizId: string,
    attemptId: string,
  ) {
    const attempt = await this.prisma.trainingQuizAttempt.findFirst({
      where: {
        id: attemptId,
        companyId,
        userId,
        courseId,
        quizId,
      },
      select: {
        id: true,
        companyId: true,
        userId: true,
        courseId: true,
        quizId: true,
        quizVersionId: true,
        attemptNumber: true,
        status: true,
        score: true,
        maxScore: true,
        percentage: true,
        startedAt: true,
        submittedAt: true,
        expiresAt: true,
        quiz: {
          select: {
            lessonId: true,
            placement: true,
            title: true,
            titleTranslations: true,
            instructions: true,
            instructionTranslations: true,
          },
        },
        quizVersion: {
          select: {
            id: true,
            version: true,
            passPercentage: true,
            maxAttempts: true,
            timeLimitSeconds: true,
            shuffleQuestions: true,
            shuffleOptions: true,
            revealAnswers: true,
            questions: {
              orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
              select: {
                id: true,
                type: true,
                prompt: true,
                promptTranslations: true,
                explanation: true,
                explanationTranslations: true,
                points: true,
                sortOrder: true,
                options: {
                  orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
                  select: {
                    id: true,
                    text: true,
                    textTranslations: true,
                    isCorrect: true,
                    sortOrder: true,
                  },
                },
              },
            },
          },
        },
        answers: {
          select: {
            questionId: true,
            selectedOptionIds: true,
            isCorrect: true,
            pointsAwarded: true,
            answeredAt: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Training quiz attempt was not found.');
    }

    return attempt;
  }

  private async assertWritableAttempt(
    attempt: Awaited<ReturnType<TrainingQuizAttemptService['scopedAttempt']>>,
    now: Date,
  ): Promise<void> {
    if (attempt.status !== TrainingQuizAttemptStatus.IN_PROGRESS) {
      throw new ConflictException('This quiz attempt is no longer editable.');
    }

    if (attempt.expiresAt && attempt.expiresAt <= now) {
      await this.prisma.trainingQuizAttempt.update({
        where: { id: attempt.id },
        data: { status: TrainingQuizAttemptStatus.EXPIRED },
      });
      throw new ConflictException('This quiz attempt has expired.');
    }
  }

  private async expireActiveAttempts(
    companyId: string,
    userId: string,
    quizId: string,
    now: Date,
  ): Promise<void> {
    await this.prisma.trainingQuizAttempt.updateMany({
      where: {
        companyId,
        userId,
        quizId,
        status: TrainingQuizAttemptStatus.IN_PROGRESS,
        expiresAt: { not: null, lte: now },
      },
      data: { status: TrainingQuizAttemptStatus.EXPIRED },
    });
  }

  private presentAttempt(
    attempt: Awaited<ReturnType<TrainingQuizAttemptService['scopedAttempt']>>,
  ) {
    const submitted =
      attempt.status === TrainingQuizAttemptStatus.PASSED ||
      attempt.status === TrainingQuizAttemptStatus.FAILED ||
      attempt.status === TrainingQuizAttemptStatus.SUBMITTED;
    const reveal = submitted && attempt.quizVersion.revealAnswers;

    const answerByQuestion = new Map(
      attempt.answers.map((answer) => [answer.questionId, answer] as const),
    );

    const questionIds = attempt.quizVersion.questions.map(
      (question) => question.id,
    );
    const orderedQuestionIds = attempt.quizVersion.shuffleQuestions
      ? deterministicQuizOrder(questionIds, `${attempt.id}:questions`)
      : questionIds;
    const questionById = new Map(
      attempt.quizVersion.questions.map((question) => [question.id, question]),
    );

    const questions = orderedQuestionIds.map((questionId) => {
      const question = questionById.get(questionId);
      if (!question) {
        throw new NotFoundException('Training quiz question was not found.');
      }

      const optionIds = question.options.map((option) => option.id);
      const orderedOptionIds = attempt.quizVersion.shuffleOptions
        ? deterministicQuizOrder(
            optionIds,
            `${attempt.id}:question:${question.id}:options`,
          )
        : optionIds;
      const optionById = new Map(
        question.options.map((option) => [option.id, option]),
      );
      const answer = answerByQuestion.get(question.id);

      return {
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        promptTranslations: question.promptTranslations,
        explanation: reveal ? question.explanation : null,
        explanationTranslations: reveal ? question.explanationTranslations : {},
        points: question.points,
        selectedOptionIds: answer
          ? this.jsonStringArray(answer.selectedOptionIds)
          : [],
        isCorrect: reveal ? (answer?.isCorrect ?? false) : null,
        pointsAwarded: submitted ? (answer?.pointsAwarded ?? 0) : null,
        options: orderedOptionIds.map((optionId) => {
          const option = optionById.get(optionId);
          if (!option) {
            throw new NotFoundException('Training quiz option was not found.');
          }

          return {
            id: option.id,
            text: option.text,
            textTranslations: option.textTranslations,
            isCorrect: reveal ? option.isCorrect : null,
          };
        }),
      };
    });

    return {
      id: attempt.id,
      quizId: attempt.quizId,
      quizVersionId: attempt.quizVersionId,
      quizVersion: attempt.quizVersion.version,
      courseId: attempt.courseId,
      lessonId: attempt.quiz.lessonId,
      placement: attempt.quiz.placement,
      title: attempt.quiz.title,
      titleTranslations: attempt.quiz.titleTranslations,
      instructions: attempt.quiz.instructions,
      instructionTranslations: attempt.quiz.instructionTranslations,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      passPercentage: attempt.quizVersion.passPercentage,
      maxAttempts: attempt.quizVersion.maxAttempts,
      timeLimitSeconds: attempt.quizVersion.timeLimitSeconds,
      revealAnswers: attempt.quizVersion.revealAnswers,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      expiresAt: attempt.expiresAt?.toISOString() ?? null,
      questions,
    };
  }

  private jsonStringArray(value: Prisma.JsonValue): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter(
      (candidate): candidate is string => typeof candidate === 'string',
    );
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2002'
    );
  }
}
