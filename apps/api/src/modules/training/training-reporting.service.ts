import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import {
  AccountScope,
  TrainingCertificateStatus,
  TrainingQuizAttemptStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { ApiLocale } from '../../i18n/types';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import {
  buildTrainingCertificateReportCsv,
  buildTrainingCourseReportCsv,
  buildTrainingLearnerReportCsv,
  buildTrainingQuizReportCsv,
} from './training-reporting.csv';
import {
  type TrainingReportExportDataset,
  type TrainingReportingExportQueryDto,
  type TrainingReportingFiltersDto,
  type TrainingReportingListQueryDto,
} from './dto/training-reporting.dto';
import {
  buildTrainingReportDateRange,
  type TrainingReportDateRange,
  latestTrainingReportDate,
  trainingReportAverage,
  trainingReportPercentage,
} from './training-reporting.rules';

const EXPORT_ROW_LIMIT = 10_000;

interface ReportDateFilter {
  gte?: Date;
  lt?: Date;
}

interface ReportContext {
  companyId: string | null;
  courseId?: string;
  categoryId?: string;
  date: ReportDateFilter | undefined;
}

@Injectable()
export class TrainingReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async options(
    principal: AuthenticatedPrincipal,
    query: TrainingReportingFiltersDto,
  ) {
    const context = this.context(principal, query);
    const courseWhere = this.courseWhere(context);

    const [courses, companies] = await Promise.all([
      this.prisma.trainingCourse.findMany({
        where: courseWhere,
        select: {
          id: true,
          title: true,
          titleTranslations: true,
          status: true,
          category: {
            select: {
              id: true,
              name: true,
              nameTranslations: true,
            },
          },
        },
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
      }),
      principal.accountScope === AccountScope.PLATFORM
        ? this.prisma.company.findMany({
            select: {
              id: true,
              name: true,
              nameTranslations: true,
              status: true,
            },
            orderBy: [{ name: 'asc' }, { id: 'asc' }],
          })
        : Promise.resolve([]),
    ]);

    const categoryMap = new Map<
      string,
      {
        id: string;
        name: string;
        nameTranslations: Prisma.JsonValue;
      }
    >();

    for (const course of courses) {
      categoryMap.set(course.category.id, course.category);
    }

    return {
      companies,
      categories: [...categoryMap.values()].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
      courses,
    };
  }

  async overview(
    principal: AuthenticatedPrincipal,
    query: TrainingReportingFiltersDto,
  ) {
    const context = this.context(principal, query);
    const progressWhere = this.progressWhere(context);
    const completionWhere = this.completionWhere(context);
    const quizWhere = this.quizAttemptWhere(context);
    const certificateWhere = this.certificateWhere(context);

    const [
      progressLearners,
      completionLearners,
      quizLearners,
      certificateLearners,
      engagedCourses,
      completions,
      quizAggregate,
      quizPasses,
      certificateGroups,
    ] = await Promise.all([
      this.prisma.trainingCourseProgress.groupBy({
        by: ['userId'],
        where: progressWhere,
      }),
      this.prisma.trainingCourseCompletion.groupBy({
        by: ['userId'],
        where: completionWhere,
      }),
      this.prisma.trainingQuizAttempt.groupBy({
        by: ['userId'],
        where: quizWhere,
      }),
      this.prisma.trainingCertificate.groupBy({
        by: ['userId'],
        where: certificateWhere,
      }),
      this.prisma.trainingCourseProgress.groupBy({
        by: ['courseId'],
        where: progressWhere,
      }),
      this.prisma.trainingCourseCompletion.count({
        where: completionWhere,
      }),
      this.prisma.trainingQuizAttempt.aggregate({
        where: quizWhere,
        _count: { _all: true },
        _avg: { percentage: true },
      }),
      this.prisma.trainingQuizAttempt.count({
        where: {
          ...quizWhere,
          status: TrainingQuizAttemptStatus.PASSED,
        },
      }),
      this.prisma.trainingCertificate.groupBy({
        by: ['status'],
        where: certificateWhere,
        _count: { _all: true },
      }),
    ]);

    const activeLearnerIds = new Set([
      ...progressLearners.map((row) => row.userId),
      ...completionLearners.map((row) => row.userId),
      ...quizLearners.map((row) => row.userId),
      ...certificateLearners.map((row) => row.userId),
    ]);

    const certificateCounts = new Map(
      certificateGroups.map((group) => [group.status, group._count._all]),
    );
    const certificatesIssued = certificateGroups.reduce(
      (total, group) => total + group._count._all,
      0,
    );

    return {
      activeLearners: activeLearnerIds.size,
      coursesEngaged: engagedCourses.length,
      completions,
      quizAttempts: quizAggregate._count._all,
      quizPassRate: trainingReportPercentage(
        quizPasses,
        quizAggregate._count._all,
      ),
      quizAverageScore: trainingReportAverage(quizAggregate._avg.percentage),
      certificatesIssued,
      activeCertificates:
        certificateCounts.get(TrainingCertificateStatus.ACTIVE) ?? 0,
      revokedCertificates:
        certificateCounts.get(TrainingCertificateStatus.REVOKED) ?? 0,
    };
  }

  async courses(
    principal: AuthenticatedPrincipal,
    query: TrainingReportingListQueryDto,
  ) {
    const context = this.context(principal, query);
    const where = this.courseWhere(context);

    const [courses, total] = await Promise.all([
      this.prisma.trainingCourse.findMany({
        where,
        select: {
          id: true,
          title: true,
          titleTranslations: true,
          status: true,
          category: {
            select: {
              id: true,
              name: true,
              nameTranslations: true,
            },
          },
        },
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.trainingCourse.count({ where }),
    ]);

    const courseIds = courses.map((course) => course.id);
    if (courseIds.length === 0) {
      return {
        items: [],
        pagination: { limit: query.limit, offset: query.offset, total },
      };
    }

    const [
      progressGroups,
      completionGroups,
      quizGroups,
      quizPassGroups,
      certificateGroups,
    ] = await Promise.all([
      this.prisma.trainingCourseProgress.groupBy({
        by: ['courseId'],
        where: {
          ...this.progressWhere(context),
          courseId: { in: courseIds },
        },
        _count: { _all: true },
        _max: { lastAccessedAt: true },
      }),
      this.prisma.trainingCourseCompletion.groupBy({
        by: ['courseId'],
        where: {
          ...this.completionWhere(context),
          courseId: { in: courseIds },
        },
        _count: { _all: true },
        _max: { completedAt: true },
      }),
      this.prisma.trainingQuizAttempt.groupBy({
        by: ['courseId'],
        where: {
          ...this.quizAttemptWhere(context),
          courseId: { in: courseIds },
        },
        _count: { _all: true },
        _avg: { percentage: true },
        _max: { submittedAt: true },
      }),
      this.prisma.trainingQuizAttempt.groupBy({
        by: ['courseId'],
        where: {
          ...this.quizAttemptWhere(context),
          courseId: { in: courseIds },
          status: TrainingQuizAttemptStatus.PASSED,
        },
        _count: { _all: true },
      }),
      this.prisma.trainingCertificate.groupBy({
        by: ['courseId'],
        where: {
          ...this.certificateWhere(context),
          courseId: { in: courseIds },
        },
        _count: { _all: true },
        _max: { issuedAt: true },
      }),
    ]);

    const progress = new Map(
      progressGroups.map((group) => [group.courseId, group]),
    );
    const completion = new Map(
      completionGroups.map((group) => [group.courseId, group]),
    );
    const quiz = new Map(quizGroups.map((group) => [group.courseId, group]));
    const quizPasses = new Map(
      quizPassGroups.map((group) => [group.courseId, group._count._all]),
    );
    const certificate = new Map(
      certificateGroups.map((group) => [group.courseId, group]),
    );

    return {
      items: courses.map((course) => {
        const progressRow = progress.get(course.id);
        const completionRow = completion.get(course.id);
        const quizRow = quiz.get(course.id);
        const certificateRow = certificate.get(course.id);
        const quizAttempts = quizRow?._count._all ?? 0;
        const passed = quizPasses.get(course.id) ?? 0;

        return {
          id: course.id,
          title: course.title,
          titleTranslations: course.titleTranslations,
          status: course.status,
          category: course.category,
          engagedLearners: progressRow?._count._all ?? 0,
          completions: completionRow?._count._all ?? 0,
          quizAttempts,
          quizPasses: passed,
          quizPassRate: trainingReportPercentage(passed, quizAttempts),
          quizAverageScore: trainingReportAverage(
            quizRow?._avg.percentage ?? null,
          ),
          certificatesIssued: certificateRow?._count._all ?? 0,
          latestActivityAt: latestTrainingReportDate(
            progressRow?._max.lastAccessedAt,
            completionRow?._max.completedAt,
            quizRow?._max.submittedAt,
            certificateRow?._max.issuedAt,
          ),
        };
      }),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async learners(
    principal: AuthenticatedPrincipal,
    query: TrainingReportingListQueryDto,
  ) {
    const context = this.context(principal, query);
    const progressWhere = this.progressWhere(context);
    const completionWhere = this.completionWhere(context);
    const quizWhere = this.quizAttemptWhere(context);
    const certificateWhere = this.certificateWhere(context);

    const userWhere: Prisma.UserWhereInput = {
      accountScope: AccountScope.COMPANY,
      ...(context.companyId ? { companyId: context.companyId } : {}),
      OR: [
        { trainingCourseProgress: { some: progressWhere } },
        { trainingQuizAttempts: { some: quizWhere } },
        { trainingCourseCompletions: { some: completionWhere } },
        { trainingCertificates: { some: certificateWhere } },
      ],
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          email: true,
          certificateName: true,
          company: {
            select: {
              id: true,
              name: true,
              nameTranslations: true,
            },
          },
        },
        orderBy: [{ normalizedEmail: 'asc' }, { id: 'asc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.user.count({ where: userWhere }),
    ]);

    const userIds = users.map((user) => user.id);
    if (userIds.length === 0) {
      return {
        items: [],
        pagination: { limit: query.limit, offset: query.offset, total },
      };
    }

    const [
      progressGroups,
      completionGroups,
      quizGroups,
      quizPassGroups,
      certificateGroups,
    ] = await Promise.all([
      this.prisma.trainingCourseProgress.groupBy({
        by: ['userId'],
        where: {
          ...progressWhere,
          userId: { in: userIds },
        },
        _count: { _all: true },
        _max: { lastAccessedAt: true },
      }),
      this.prisma.trainingCourseCompletion.groupBy({
        by: ['userId'],
        where: {
          ...completionWhere,
          userId: { in: userIds },
        },
        _count: { _all: true },
        _max: { completedAt: true },
      }),
      this.prisma.trainingQuizAttempt.groupBy({
        by: ['userId'],
        where: {
          ...quizWhere,
          userId: { in: userIds },
        },
        _count: { _all: true },
        _avg: { percentage: true },
        _max: { submittedAt: true },
      }),
      this.prisma.trainingQuizAttempt.groupBy({
        by: ['userId'],
        where: {
          ...quizWhere,
          userId: { in: userIds },
          status: TrainingQuizAttemptStatus.PASSED,
        },
        _count: { _all: true },
      }),
      this.prisma.trainingCertificate.groupBy({
        by: ['userId'],
        where: {
          ...certificateWhere,
          userId: { in: userIds },
        },
        _count: { _all: true },
        _max: { issuedAt: true },
      }),
    ]);

    const progress = new Map(
      progressGroups.map((group) => [group.userId, group]),
    );
    const completion = new Map(
      completionGroups.map((group) => [group.userId, group]),
    );
    const quiz = new Map(quizGroups.map((group) => [group.userId, group]));
    const quizPasses = new Map(
      quizPassGroups.map((group) => [group.userId, group._count._all]),
    );
    const certificate = new Map(
      certificateGroups.map((group) => [group.userId, group]),
    );

    return {
      items: users.map((user) => {
        if (!user.company) {
          throw new ForbiddenException(
            'Company learner reporting scope is invalid.',
          );
        }

        const progressRow = progress.get(user.id);
        const completionRow = completion.get(user.id);
        const quizRow = quiz.get(user.id);
        const certificateRow = certificate.get(user.id);
        const attempts = quizRow?._count._all ?? 0;
        const passes = quizPasses.get(user.id) ?? 0;

        return {
          id: user.id,
          email: user.email,
          learnerName: user.certificateName?.trim() || user.email,
          company: user.company,
          coursesEngaged: progressRow?._count._all ?? 0,
          completedCourses: completionRow?._count._all ?? 0,
          quizAttempts: attempts,
          quizPassRate: trainingReportPercentage(passes, attempts),
          quizAverageScore: trainingReportAverage(
            quizRow?._avg.percentage ?? null,
          ),
          certificatesIssued: certificateRow?._count._all ?? 0,
          latestActivityAt: latestTrainingReportDate(
            progressRow?._max.lastAccessedAt,
            completionRow?._max.completedAt,
            quizRow?._max.submittedAt,
            certificateRow?._max.issuedAt,
          ),
        };
      }),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async quizzes(
    principal: AuthenticatedPrincipal,
    query: TrainingReportingListQueryDto,
  ) {
    const context = this.context(principal, query);
    const where: Prisma.TrainingQuizWhereInput = {
      course: {
        is: this.courseWhere(context),
      },
    };

    const [quizzes, total] = await Promise.all([
      this.prisma.trainingQuiz.findMany({
        where,
        select: {
          id: true,
          title: true,
          titleTranslations: true,
          placement: true,
          status: true,
          course: {
            select: {
              id: true,
              title: true,
              titleTranslations: true,
            },
          },
        },
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.trainingQuiz.count({ where }),
    ]);

    const quizIds = quizzes.map((quiz) => quiz.id);
    if (quizIds.length === 0) {
      return {
        items: [],
        pagination: { limit: query.limit, offset: query.offset, total },
      };
    }

    const attemptsWhere: Prisma.TrainingQuizAttemptWhereInput = {
      ...this.quizAttemptWhere(context),
      quizId: { in: quizIds },
    };

    const [attemptGroups, passGroups, uniqueLearners] = await Promise.all([
      this.prisma.trainingQuizAttempt.groupBy({
        by: ['quizId'],
        where: attemptsWhere,
        _count: { _all: true },
        _avg: { percentage: true },
        _max: { submittedAt: true },
      }),
      this.prisma.trainingQuizAttempt.groupBy({
        by: ['quizId'],
        where: {
          ...attemptsWhere,
          status: TrainingQuizAttemptStatus.PASSED,
        },
        _count: { _all: true },
      }),
      this.prisma.trainingQuizAttempt.groupBy({
        by: ['quizId', 'userId'],
        where: attemptsWhere,
      }),
    ]);

    const attempts = new Map(
      attemptGroups.map((group) => [group.quizId, group]),
    );
    const passes = new Map(
      passGroups.map((group) => [group.quizId, group._count._all]),
    );
    const learnerCounts = new Map<string, number>();

    for (const row of uniqueLearners) {
      learnerCounts.set(row.quizId, (learnerCounts.get(row.quizId) ?? 0) + 1);
    }

    return {
      items: quizzes.map((quiz) => {
        const attempt = attempts.get(quiz.id);
        const attemptCount = attempt?._count._all ?? 0;
        const passed = passes.get(quiz.id) ?? 0;

        return {
          id: quiz.id,
          title: quiz.title,
          titleTranslations: quiz.titleTranslations,
          placement: quiz.placement,
          status: quiz.status,
          course: quiz.course,
          learners: learnerCounts.get(quiz.id) ?? 0,
          attempts: attemptCount,
          passed,
          failed: Math.max(0, attemptCount - passed),
          passRate: trainingReportPercentage(passed, attemptCount),
          averagePercentage: trainingReportAverage(
            attempt?._avg.percentage ?? null,
          ),
          latestAttemptAt: attempt?._max.submittedAt?.toISOString() ?? null,
        };
      }),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async certificates(
    principal: AuthenticatedPrincipal,
    query: TrainingReportingListQueryDto,
  ) {
    const context = this.context(principal, query);
    const where = this.certificateWhere(context);

    const [certificates, total] = await Promise.all([
      this.prisma.trainingCertificate.findMany({
        where,
        select: {
          id: true,
          certificateNumber: true,
          learnerNameSnapshot: true,
          learnerEmailSnapshot: true,
          companyNameSnapshot: true,
          courseTitleSnapshot: true,
          courseTitleTranslations: true,
          scorePercentage: true,
          status: true,
          issuedAt: true,
          revokedAt: true,
        },
        orderBy: [{ issuedAt: 'desc' }, { id: 'desc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.trainingCertificate.count({ where }),
    ]);

    return {
      items: certificates.map((certificate) => ({
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        learnerName: certificate.learnerNameSnapshot,
        learnerEmail: certificate.learnerEmailSnapshot,
        companyName: certificate.companyNameSnapshot,
        courseTitle: certificate.courseTitleSnapshot,
        courseTitleTranslations: certificate.courseTitleTranslations,
        scorePercentage: certificate.scorePercentage,
        status: certificate.status,
        issuedAt: certificate.issuedAt.toISOString(),
        revokedAt: certificate.revokedAt?.toISOString() ?? null,
      })),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async exportCsv(
    principal: AuthenticatedPrincipal,
    query: TrainingReportingExportQueryDto,
    locale: ApiLocale,
  ): Promise<{ filename: string; buffer: Buffer }> {
    const listQuery: TrainingReportingListQueryDto = {
      companyId: query.companyId,
      courseId: query.courseId,
      categoryId: query.categoryId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      limit: EXPORT_ROW_LIMIT + 1,
      offset: 0,
    };

    const result = await this.exportDataset(
      principal,
      query.dataset,
      listQuery,
      locale,
    );

    return {
      filename: `odookrd-training-${query.dataset}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      buffer: Buffer.from(result, 'utf8'),
    };
  }

  private async exportDataset(
    principal: AuthenticatedPrincipal,
    dataset: TrainingReportExportDataset,
    query: TrainingReportingListQueryDto,
    locale: ApiLocale,
  ): Promise<string> {
    if (dataset === 'courses') {
      const result = await this.courses(principal, query);
      this.assertExportSize(result.pagination.total);
      return buildTrainingCourseReportCsv(locale, result.items);
    }

    if (dataset === 'learners') {
      const result = await this.learners(principal, query);
      this.assertExportSize(result.pagination.total);
      return buildTrainingLearnerReportCsv(locale, result.items);
    }

    if (dataset === 'quizzes') {
      const result = await this.quizzes(principal, query);
      this.assertExportSize(result.pagination.total);
      return buildTrainingQuizReportCsv(locale, result.items);
    }

    const result = await this.certificates(principal, query);
    this.assertExportSize(result.pagination.total);
    return buildTrainingCertificateReportCsv(locale, result.items);
  }

  private assertExportSize(total: number): void {
    if (total > EXPORT_ROW_LIMIT) {
      throw new BadRequestException(
        `Training report export exceeds ${EXPORT_ROW_LIMIT.toLocaleString(
          'en-US',
        )} rows. Narrow the filters before exporting.`,
      );
    }
  }

  private context(
    principal: AuthenticatedPrincipal,
    query: TrainingReportingFiltersDto,
  ): ReportContext {
    let companyId: string | null;

    if (principal.accountScope === AccountScope.COMPANY) {
      if (!principal.companyId) {
        throw new ForbiddenException('Company reporting scope is invalid.');
      }
      if (query.companyId && query.companyId !== principal.companyId) {
        throw new ForbiddenException(
          'Cross-company training reporting is forbidden.',
        );
      }
      companyId = principal.companyId;
    } else if (
      principal.accountScope === AccountScope.PLATFORM &&
      principal.companyId === null
    ) {
      companyId = query.companyId ?? null;
    } else {
      throw new ForbiddenException('Training reporting scope is invalid.');
    }

    let range: TrainingReportDateRange;
    try {
      range = buildTrainingReportDateRange(query.dateFrom, query.dateTo);
    } catch (error: unknown) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Training report date range is invalid.',
      );
    }

    const date: ReportDateFilter | undefined =
      range.from || range.toExclusive
        ? {
            ...(range.from ? { gte: range.from } : {}),
            ...(range.toExclusive ? { lt: range.toExclusive } : {}),
          }
        : undefined;

    return {
      companyId,
      courseId: query.courseId,
      categoryId: query.categoryId,
      date,
    };
  }

  private courseWhere(context: ReportContext): Prisma.TrainingCourseWhereInput {
    const filters: Prisma.TrainingCourseWhereInput[] = [];

    if (context.courseId) {
      filters.push({ id: context.courseId });
    }
    if (context.categoryId) {
      filters.push({ categoryId: context.categoryId });
    }
    if (context.companyId) {
      filters.push(this.companyVisibleCourseWhere(context.companyId));
    }

    return filters.length > 0 ? { AND: filters } : {};
  }

  private companyVisibleCourseWhere(
    companyId: string,
  ): Prisma.TrainingCourseWhereInput {
    return {
      OR: [
        { companyAccess: { some: { companyId } } },
        { userAccess: { some: { companyId } } },
        {
          serviceAccess: {
            some: {
              service: {
                assignments: {
                  some: { companyId },
                },
              },
            },
          },
        },
        { courseProgress: { some: { companyId } } },
        { quizAttempts: { some: { companyId } } },
        { completions: { some: { companyId } } },
        { certificates: { some: { companyId } } },
      ],
    };
  }

  private progressWhere(
    context: ReportContext,
  ): Prisma.TrainingCourseProgressWhereInput {
    return {
      ...(context.companyId ? { companyId: context.companyId } : {}),
      ...(context.courseId ? { courseId: context.courseId } : {}),
      ...(context.categoryId
        ? { course: { categoryId: context.categoryId } }
        : {}),
      ...(context.date ? { lastAccessedAt: context.date } : {}),
    };
  }

  private completionWhere(
    context: ReportContext,
  ): Prisma.TrainingCourseCompletionWhereInput {
    return {
      ...(context.companyId ? { companyId: context.companyId } : {}),
      ...(context.courseId ? { courseId: context.courseId } : {}),
      ...(context.categoryId
        ? { course: { categoryId: context.categoryId } }
        : {}),
      ...(context.date ? { completedAt: context.date } : {}),
    };
  }

  private quizAttemptWhere(
    context: ReportContext,
  ): Prisma.TrainingQuizAttemptWhereInput {
    return {
      ...(context.companyId ? { companyId: context.companyId } : {}),
      ...(context.courseId ? { courseId: context.courseId } : {}),
      ...(context.categoryId
        ? { course: { categoryId: context.categoryId } }
        : {}),
      status: {
        in: [
          TrainingQuizAttemptStatus.PASSED,
          TrainingQuizAttemptStatus.FAILED,
        ],
      },
      ...(context.date ? { submittedAt: context.date } : {}),
    };
  }

  private certificateWhere(
    context: ReportContext,
  ): Prisma.TrainingCertificateWhereInput {
    return {
      ...(context.companyId ? { companyId: context.companyId } : {}),
      ...(context.courseId ? { courseId: context.courseId } : {}),
      ...(context.categoryId
        ? { course: { categoryId: context.categoryId } }
        : {}),
      ...(context.date ? { issuedAt: context.date } : {}),
    };
  }
}
