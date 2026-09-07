import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { TrainingEntitlementService } from './training-entitlement.service';
import { TrainingProgressService } from './training-progress.service';

const dashboardCourseSelect = {
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
} satisfies Prisma.TrainingCourseSelect;

@Injectable()
export class TrainingDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: TrainingEntitlementService,
    private readonly progress: TrainingProgressService,
  ) {}

  async summary(principal: AuthenticatedPrincipal) {
    const context = await this.entitlements.resolveCustomerContext(principal);

    if (!context.enabled) {
      return {
        enabled: false,
        metrics: {
          entitledCourses: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          averageProgressPercentage: 0,
        },
        courses: [],
      };
    }

    const entitlementWhere = this.entitlements.customerCourseWhere(context);
    const courses = await this.prisma.trainingCourse.findMany({
      where: entitlementWhere,
      select: dashboardCourseSelect,
      orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { id: 'asc' }],
    });

    if (courses.length === 0) {
      return {
        enabled: true,
        metrics: {
          entitledCourses: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          averageProgressPercentage: 0,
        },
        courses: [],
      };
    }

    const courseIds = courses.map((course) => course.id);
    const [progressRows, completions] = await Promise.all([
      Promise.all(
        courses.map((course) =>
          this.progress.getCourseForContext(context, course.id, course.slug),
        ),
      ),
      this.prisma.trainingCourseCompletion.findMany({
        where: {
          companyId: context.companyId,
          userId: context.userId,
          courseId: { in: courseIds },
        },
        select: {
          courseId: true,
          completedAt: true,
          certificate: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
    ]);

    const completionByCourse = new Map(
      completions.map((completion) => [completion.courseId, completion]),
    );

    let inProgress = 0;
    let averageTotal = 0;

    const cards = courses.map((course, index) => {
      const progress = progressRows[index];
      const completion = completionByCourse.get(course.id);
      const isCompleted = Boolean(completion);

      if (!isCompleted && progress.status !== 'NOT_STARTED') {
        inProgress += 1;
      }
      averageTotal += progress.percentage;

      const { lessons, ...summary } = progress;
      void lessons;
      const normalizedProgress = {
        ...summary,
        status: isCompleted
          ? ('COMPLETED' as const)
          : progress.status === 'NOT_STARTED'
            ? ('NOT_STARTED' as const)
            : ('IN_PROGRESS' as const),
      };

      return {
        course: {
          id: course.id,
          slug: course.slug,
          title: course.title,
          titleTranslations: course.titleTranslations,
          hasCover: Boolean(course.coverImageAssetId),
          category: course.category,
        },
        progress: normalizedProgress,
        completedAt: completion?.completedAt.toISOString() ?? null,
        certificate: completion?.certificate
          ? {
              id: completion.certificate.id,
              status: completion.certificate.status,
            }
          : null,
      };
    });

    cards.sort((left, right) => {
      const rank = (status: string) =>
        status === 'IN_PROGRESS' ? 0 : status === 'COMPLETED' ? 1 : 2;
      const rankDelta =
        rank(left.progress.status) - rank(right.progress.status);
      if (rankDelta !== 0) return rankDelta;

      const leftDate = left.progress.lastAccessedAt ?? left.completedAt ?? '';
      const rightDate =
        right.progress.lastAccessedAt ?? right.completedAt ?? '';
      return rightDate.localeCompare(leftDate);
    });

    const completed = completions.length;
    const entitledCourses = courses.length;
    const notStarted = Math.max(0, entitledCourses - completed - inProgress);

    return {
      enabled: true,
      metrics: {
        entitledCourses,
        completed,
        inProgress,
        notStarted,
        averageProgressPercentage: Math.round(averageTotal / entitledCourses),
      },
      courses: cards.slice(0, 6),
    };
  }
}
