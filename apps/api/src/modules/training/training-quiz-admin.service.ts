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
  TrainingLessonContentType,
  TrainingQuizPlacement,
  TrainingQuizStatus,
  TrainingQuizVersionStatus,
} from '../../generated/prisma/enums';
import { normalizeLocalizedText } from '../../i18n/localized-content';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type {
  ReorderTrainingQuizQuestionsDto,
  UpsertTrainingQuizDto,
  UpsertTrainingQuizQuestionDto,
} from './dto/training-quiz-admin.dto';
import { validateTrainingQuizQuestionShape } from './training-quiz-admin.rules';

export interface QuizTarget {
  placement: TrainingQuizPlacement;
  courseId: string;
  sectionId: string | null;
  lessonId: string | null;
}

@Injectable()
export class TrainingQuizAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getLessonQuiz(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
  ) {
    this.assertPlatformAdministrator(principal);
    await this.assertQuizLesson(courseId, sectionId, lessonId);
    const quiz = await this.prisma.trainingQuiz.findUnique({
      where: { lessonId },
      select: { id: true },
    });
    return this.presentTarget(
      {
        placement: TrainingQuizPlacement.SECTION,
        courseId,
        sectionId,
        lessonId,
      },
      quiz?.id ?? null,
    );
  }

  async upsertLessonQuiz(
    principal: AuthenticatedPrincipal,
    courseId: string,
    sectionId: string,
    lessonId: string,
    input: UpsertTrainingQuizDto,
  ) {
    this.assertPlatformAdministrator(principal);
    await this.assertQuizLesson(courseId, sectionId, lessonId);
    return this.upsertTarget(
      principal,
      {
        placement: TrainingQuizPlacement.SECTION,
        courseId,
        sectionId,
        lessonId,
      },
      input,
    );
  }

  async getFinalQuiz(principal: AuthenticatedPrincipal, courseId: string) {
    this.assertPlatformAdministrator(principal);
    await this.assertCourse(courseId);
    const quiz = await this.prisma.trainingQuiz.findFirst({
      where: { courseId, placement: TrainingQuizPlacement.COURSE_FINAL },
      select: { id: true },
    });
    return this.presentTarget(
      {
        placement: TrainingQuizPlacement.COURSE_FINAL,
        courseId,
        sectionId: null,
        lessonId: null,
      },
      quiz?.id ?? null,
    );
  }

  async upsertFinalQuiz(
    principal: AuthenticatedPrincipal,
    courseId: string,
    input: UpsertTrainingQuizDto,
  ) {
    this.assertPlatformAdministrator(principal);
    await this.assertCourse(courseId);
    return this.upsertTarget(
      principal,
      {
        placement: TrainingQuizPlacement.COURSE_FINAL,
        courseId,
        sectionId: null,
        lessonId: null,
      },
      input,
    );
  }

  async addQuestion(
    principal: AuthenticatedPrincipal,
    quizId: string,
    input: UpsertTrainingQuizQuestionDto,
  ) {
    this.assertPlatformAdministrator(principal);
    this.assertQuestionShape(input);
    const draft = await this.requireDraftVersion(quizId);
    const count = await this.prisma.trainingQuizQuestion.count({
      where: { quizVersionId: draft.id },
    });
    if (count >= 200) {
      throw new BadRequestException(
        'A quiz version cannot contain more than 200 questions.',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      const question = await transaction.trainingQuizQuestion.create({
        data: {
          quizVersionId: draft.id,
          type: input.type,
          prompt: input.prompt.trim(),
          promptTranslations: normalizeLocalizedText(
            input.promptTranslations,
            input.prompt,
          ),
          explanation: this.optionalText(input.explanation),
          explanationTranslations: normalizeLocalizedText(
            input.explanationTranslations,
            input.explanation,
          ),
          points: input.points,
          sortOrder: count,
          options: {
            create: input.options.map((option, index) => ({
              text: option.text.trim(),
              textTranslations: normalizeLocalizedText(
                option.textTranslations,
                option.text,
              ),
              isCorrect: option.isCorrect,
              sortOrder: index,
            })),
          },
        },
        select: { id: true },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: 'training.quiz.question.created',
          targetType: 'training_quiz_question',
          targetId: question.id,
          metadata: { quizId, versionId: draft.id, type: input.type },
        },
      });
    });
    return this.presentQuiz(quizId);
  }

  async updateQuestion(
    principal: AuthenticatedPrincipal,
    quizId: string,
    questionId: string,
    input: UpsertTrainingQuizQuestionDto,
  ) {
    this.assertPlatformAdministrator(principal);
    this.assertQuestionShape(input);
    const draft = await this.requireDraftVersion(quizId);
    const existing = await this.prisma.trainingQuizQuestion.findFirst({
      where: { id: questionId, quizVersionId: draft.id },
      select: { id: true },
    });
    if (!existing)
      throw new NotFoundException('Training quiz question was not found.');

    await this.prisma.$transaction(async (transaction) => {
      await transaction.trainingQuizOption.deleteMany({
        where: { questionId },
      });
      await transaction.trainingQuizQuestion.update({
        where: { id: questionId },
        data: {
          type: input.type,
          prompt: input.prompt.trim(),
          promptTranslations: normalizeLocalizedText(
            input.promptTranslations,
            input.prompt,
          ),
          explanation: this.optionalText(input.explanation),
          explanationTranslations: normalizeLocalizedText(
            input.explanationTranslations,
            input.explanation,
          ),
          points: input.points,
          options: {
            create: input.options.map((option, index) => ({
              text: option.text.trim(),
              textTranslations: normalizeLocalizedText(
                option.textTranslations,
                option.text,
              ),
              isCorrect: option.isCorrect,
              sortOrder: index,
            })),
          },
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: 'training.quiz.question.updated',
          targetType: 'training_quiz_question',
          targetId: questionId,
          metadata: { quizId, versionId: draft.id, type: input.type },
        },
      });
    });
    return this.presentQuiz(quizId);
  }

  async deleteQuestion(
    principal: AuthenticatedPrincipal,
    quizId: string,
    questionId: string,
  ) {
    this.assertPlatformAdministrator(principal);
    const draft = await this.requireDraftVersion(quizId);
    const existing = await this.prisma.trainingQuizQuestion.findFirst({
      where: { id: questionId, quizVersionId: draft.id },
      select: { id: true },
    });
    if (!existing)
      throw new NotFoundException('Training quiz question was not found.');

    await this.prisma.$transaction(async (transaction) => {
      await transaction.trainingQuizQuestion.delete({
        where: { id: questionId },
      });
      const remaining = await transaction.trainingQuizQuestion.findMany({
        where: { quizVersionId: draft.id },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: { id: true },
      });
      for (const [index, question] of remaining.entries()) {
        await transaction.trainingQuizQuestion.update({
          where: { id: question.id },
          data: { sortOrder: index },
        });
      }
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: 'training.quiz.question.deleted',
          targetType: 'training_quiz_question',
          targetId: questionId,
          metadata: { quizId, versionId: draft.id },
        },
      });
    });
    return this.presentQuiz(quizId);
  }

  async reorderQuestions(
    principal: AuthenticatedPrincipal,
    quizId: string,
    input: ReorderTrainingQuizQuestionsDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const draft = await this.requireDraftVersion(quizId);
    const questions = await this.prisma.trainingQuizQuestion.findMany({
      where: { quizVersionId: draft.id },
      select: { id: true },
    });
    const expected = new Set(questions.map((question) => question.id));
    const provided = new Set(input.questionIds);
    if (
      expected.size !== provided.size ||
      input.questionIds.length !== provided.size ||
      input.questionIds.some((id) => !expected.has(id))
    ) {
      throw new BadRequestException(
        'Question reorder must contain every draft question exactly once.',
      );
    }
    await this.prisma.$transaction(async (transaction) => {
      for (const [index, questionId] of input.questionIds.entries()) {
        await transaction.trainingQuizQuestion.update({
          where: { id: questionId },
          data: { sortOrder: index },
        });
      }
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: 'training.quiz.questions.reordered',
          targetType: 'training_quiz',
          targetId: quizId,
          metadata: { versionId: draft.id, questionIds: input.questionIds },
        },
      });
    });
    return this.presentQuiz(quizId);
  }

  async publish(principal: AuthenticatedPrincipal, quizId: string) {
    this.assertPlatformAdministrator(principal);
    const draft = await this.prisma.trainingQuizVersion.findFirst({
      where: { quizId, status: TrainingQuizVersionStatus.DRAFT },
      include: {
        questions: {
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          include: {
            options: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
          },
        },
      },
    });
    if (!draft)
      throw new ConflictException('There is no draft quiz version to publish.');
    if (draft.questions.length === 0) {
      throw new ConflictException(
        'Add at least one valid question before publishing the quiz.',
      );
    }
    for (const question of draft.questions) {
      const blockers = validateTrainingQuizQuestionShape({
        type: question.type,
        options: question.options,
      });
      if (blockers.length > 0) {
        throw new ConflictException(
          `Quiz question ${question.id} is invalid: ${blockers.join(', ')}.`,
        );
      }
    }

    const publishedAt = new Date();
    await this.prisma.$transaction(async (transaction) => {
      await transaction.trainingQuizVersion.updateMany({
        where: { quizId, status: TrainingQuizVersionStatus.PUBLISHED },
        data: { status: TrainingQuizVersionStatus.RETIRED },
      });
      await transaction.trainingQuizVersion.update({
        where: { id: draft.id },
        data: { status: TrainingQuizVersionStatus.PUBLISHED, publishedAt },
      });
      await transaction.trainingQuiz.update({
        where: { id: quizId },
        data: { status: TrainingQuizStatus.PUBLISHED },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: 'training.quiz.version.published',
          targetType: 'training_quiz',
          targetId: quizId,
          metadata: {
            quizVersionId: draft.id,
            version: draft.version,
            questionCount: draft.questions.length,
          },
        },
      });
    });
    return this.presentQuiz(quizId);
  }

  async createDraftFromPublished(
    principal: AuthenticatedPrincipal,
    quizId: string,
  ) {
    this.assertPlatformAdministrator(principal);
    const existingDraft = await this.prisma.trainingQuizVersion.findFirst({
      where: { quizId, status: TrainingQuizVersionStatus.DRAFT },
      select: { id: true },
    });
    if (existingDraft)
      throw new ConflictException('This quiz already has an editable draft.');

    const source = await this.prisma.trainingQuizVersion.findFirst({
      where: { quizId, status: TrainingQuizVersionStatus.PUBLISHED },
      orderBy: { version: 'desc' },
      include: {
        questions: {
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          include: {
            options: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
          },
        },
      },
    });
    if (!source) {
      throw new ConflictException(
        'Publish the first quiz version before creating another draft.',
      );
    }
    const latest = await this.prisma.trainingQuizVersion.aggregate({
      where: { quizId },
      _max: { version: true },
    });
    const nextVersion = (latest._max.version ?? 0) + 1;

    await this.prisma.$transaction(async (transaction) => {
      const draft = await transaction.trainingQuizVersion.create({
        data: {
          quizId,
          version: nextVersion,
          status: TrainingQuizVersionStatus.DRAFT,
          passPercentage: source.passPercentage,
          maxAttempts: source.maxAttempts,
          timeLimitSeconds: source.timeLimitSeconds,
          shuffleQuestions: source.shuffleQuestions,
          shuffleOptions: source.shuffleOptions,
          revealAnswers: source.revealAnswers,
          questions: {
            create: source.questions.map((question) => ({
              type: question.type,
              prompt: question.prompt,
              promptTranslations: this.copyJsonValue(
                question.promptTranslations,
              ),
              explanation: question.explanation,
              explanationTranslations: this.copyJsonValue(
                question.explanationTranslations,
              ),
              points: question.points,
              sortOrder: question.sortOrder,
              options: {
                create: question.options.map((option) => ({
                  text: option.text,
                  textTranslations: this.copyJsonValue(option.textTranslations),
                  isCorrect: option.isCorrect,
                  sortOrder: option.sortOrder,
                })),
              },
            })),
          },
        },
        select: { id: true },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: 'training.quiz.version.draft_created',
          targetType: 'training_quiz',
          targetId: quizId,
          metadata: {
            sourceVersionId: source.id,
            quizVersionId: draft.id,
            version: nextVersion,
          },
        },
      });
    });
    return this.presentQuiz(quizId);
  }

  private async upsertTarget(
    principal: AuthenticatedPrincipal,
    target: QuizTarget,
    input: UpsertTrainingQuizDto,
  ) {
    const existing =
      target.placement === TrainingQuizPlacement.SECTION
        ? await this.prisma.trainingQuiz.findUnique({
            where: { lessonId: target.lessonId! },
            select: { id: true },
          })
        : await this.prisma.trainingQuiz.findFirst({
            where: {
              courseId: target.courseId,
              placement: TrainingQuizPlacement.COURSE_FINAL,
            },
            select: { id: true },
          });
    const title = input.title.trim();
    const instructions = this.optionalText(input.instructions);

    if (!existing) {
      const created = await this.prisma.$transaction(async (transaction) => {
        const quiz = await transaction.trainingQuiz.create({
          data: {
            courseId: target.courseId,
            sectionId: target.sectionId,
            lessonId: target.lessonId,
            placement: target.placement,
            title,
            titleTranslations: normalizeLocalizedText(
              input.titleTranslations,
              title,
            ),
            instructions,
            instructionTranslations: normalizeLocalizedText(
              input.instructionTranslations,
              instructions,
            ),
            status: TrainingQuizStatus.DRAFT,
            requiredForCompletion: input.requiredForCompletion,
            requiredToContinue:
              target.placement === TrainingQuizPlacement.SECTION
                ? input.requiredToContinue
                : false,
            versions: {
              create: {
                version: 1,
                status: TrainingQuizVersionStatus.DRAFT,
                passPercentage: input.passPercentage,
                maxAttempts: input.maxAttempts ?? null,
                timeLimitSeconds: input.timeLimitSeconds ?? null,
                shuffleQuestions: input.shuffleQuestions,
                shuffleOptions: input.shuffleOptions,
                revealAnswers: input.revealAnswers,
              },
            },
          },
          select: { id: true },
        });
        await transaction.auditLog.create({
          data: {
            actorUserId: principal.userId,
            action: 'training.quiz.created',
            targetType: 'training_quiz',
            targetId: quiz.id,
            metadata: {
              placement: target.placement,
              courseId: target.courseId,
              sectionId: target.sectionId,
              lessonId: target.lessonId,
            },
          },
        });
        return quiz;
      });
      return this.presentTarget(target, created.id);
    }

    const draft = await this.requireDraftVersion(existing.id);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.trainingQuiz.update({
        where: { id: existing.id },
        data: {
          title,
          titleTranslations: normalizeLocalizedText(
            input.titleTranslations,
            title,
          ),
          instructions,
          instructionTranslations: normalizeLocalizedText(
            input.instructionTranslations,
            instructions,
          ),
          requiredForCompletion: input.requiredForCompletion,
          requiredToContinue:
            target.placement === TrainingQuizPlacement.SECTION
              ? input.requiredToContinue
              : false,
        },
      });
      await transaction.trainingQuizVersion.update({
        where: { id: draft.id },
        data: {
          passPercentage: input.passPercentage,
          maxAttempts: input.maxAttempts ?? null,
          timeLimitSeconds: input.timeLimitSeconds ?? null,
          shuffleQuestions: input.shuffleQuestions,
          shuffleOptions: input.shuffleOptions,
          revealAnswers: input.revealAnswers,
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: 'training.quiz.draft.updated',
          targetType: 'training_quiz',
          targetId: existing.id,
          metadata: { quizVersionId: draft.id, placement: target.placement },
        },
      });
    });
    return this.presentTarget(target, existing.id);
  }

  private async requireDraftVersion(quizId: string) {
    const quiz = await this.prisma.trainingQuiz.findUnique({
      where: { id: quizId },
      select: { id: true },
    });
    if (!quiz) throw new NotFoundException('Training quiz was not found.');
    const draft = await this.prisma.trainingQuizVersion.findFirst({
      where: { quizId, status: TrainingQuizVersionStatus.DRAFT },
      select: { id: true, version: true },
    });
    if (!draft) {
      throw new ConflictException(
        'This quiz has no editable draft. Create a new version first.',
      );
    }
    return draft;
  }

  private async presentTarget(target: QuizTarget, quizId: string | null) {
    return { target, quiz: quizId ? await this.quizRecord(quizId) : null };
  }

  private async presentQuiz(quizId: string) {
    const quiz = await this.quizRecord(quizId);
    return {
      target: {
        placement: quiz.placement,
        courseId: quiz.courseId,
        sectionId: quiz.sectionId,
        lessonId: quiz.lessonId,
      },
      quiz,
    };
  }

  private async quizRecord(quizId: string) {
    const quiz = await this.prisma.trainingQuiz.findUnique({
      where: { id: quizId },
      include: {
        versions: {
          where: {
            status: {
              in: [
                TrainingQuizVersionStatus.DRAFT,
                TrainingQuizVersionStatus.PUBLISHED,
              ],
            },
          },
          orderBy: { version: 'desc' },
          include: {
            questions: {
              orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
              include: {
                options: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
              },
            },
          },
        },
      },
    });
    if (!quiz) throw new NotFoundException('Training quiz was not found.');

    const pick = (status: TrainingQuizVersionStatus) =>
      quiz.versions.find((item) => item.status === status) ?? null;
    const presentVersion = (item: (typeof quiz.versions)[number] | null) =>
      item
        ? {
            id: item.id,
            version: item.version,
            status: item.status,
            passPercentage: item.passPercentage,
            maxAttempts: item.maxAttempts,
            timeLimitSeconds: item.timeLimitSeconds,
            shuffleQuestions: item.shuffleQuestions,
            shuffleOptions: item.shuffleOptions,
            revealAnswers: item.revealAnswers,
            publishedAt: item.publishedAt?.toISOString() ?? null,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
            questions: item.questions.map((question) => ({
              id: question.id,
              type: question.type,
              prompt: question.prompt,
              promptTranslations: question.promptTranslations,
              explanation: question.explanation,
              explanationTranslations: question.explanationTranslations,
              points: question.points,
              sortOrder: question.sortOrder,
              options: question.options.map((option) => ({
                id: option.id,
                text: option.text,
                textTranslations: option.textTranslations,
                isCorrect: option.isCorrect,
                sortOrder: option.sortOrder,
              })),
            })),
          }
        : null;

    return {
      id: quiz.id,
      courseId: quiz.courseId,
      sectionId: quiz.sectionId,
      lessonId: quiz.lessonId,
      placement: quiz.placement,
      title: quiz.title,
      titleTranslations: quiz.titleTranslations,
      instructions: quiz.instructions,
      instructionTranslations: quiz.instructionTranslations,
      status: quiz.status,
      requiredForCompletion: quiz.requiredForCompletion,
      requiredToContinue: quiz.requiredToContinue,
      draftVersion: presentVersion(pick(TrainingQuizVersionStatus.DRAFT)),
      publishedVersion: presentVersion(
        pick(TrainingQuizVersionStatus.PUBLISHED),
      ),
      createdAt: quiz.createdAt.toISOString(),
      updatedAt: quiz.updatedAt.toISOString(),
    };
  }

  private async assertCourse(courseId: string): Promise<void> {
    const course = await this.prisma.trainingCourse.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) throw new NotFoundException('Training course was not found.');
  }

  private async assertQuizLesson(
    courseId: string,
    sectionId: string,
    lessonId: string,
  ): Promise<void> {
    const lesson = await this.prisma.trainingVideoLesson.findFirst({
      where: { id: lessonId, courseId, sectionId },
      select: { id: true, contentType: true },
    });
    if (!lesson) throw new NotFoundException('Training lesson was not found.');
    if (lesson.contentType !== TrainingLessonContentType.QUIZ) {
      throw new BadRequestException(
        'Select Quiz as the lesson content type before configuring an assessment.',
      );
    }
  }

  private assertQuestionShape(input: UpsertTrainingQuizQuestionDto): void {
    const blockers = validateTrainingQuizQuestionShape({
      type: input.type,
      options: input.options,
    });
    if (blockers.length > 0) {
      throw new BadRequestException(
        `Quiz question is invalid: ${blockers.join(', ')}.`,
      );
    }
  }

  private copyJsonValue(value: Prisma.JsonValue): Prisma.InputJsonValue {
    if (value === null) return {};
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private optionalText(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private assertPlatformAdministrator(principal: AuthenticatedPrincipal): void {
    if (
      principal.accountScope !== AccountScope.PLATFORM ||
      principal.companyId !== null
    ) {
      throw new ForbiddenException(
        'Training quiz management requires platform scope.',
      );
    }
  }
}
