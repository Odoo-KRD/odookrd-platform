import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import {
  AccountScope,
  CompanyServiceStatus,
  CompanyStatus,
  ServiceCategory,
  TrainingAudienceMode,
  TrainingCategoryStatus,
  TrainingCourseStatus,
  TrainingUserAccessSource,
  UserStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { SettingsService } from '../settings/settings.service';
import { resolveEntitlement } from '../subscriptions/subscription-entitlement';

export interface CustomerTrainingContext {
  companyId: string;
  userId: string;
  now: Date;
  enabled: boolean;
  activeTrainingServiceIds: string[];
}

export interface CompanyTrainingEligibility {
  hasAny: boolean;
  hasAllUsers: boolean;
  hasAssignedUsers: boolean;
  requiresAssignment: boolean;
}

@Injectable()
export class TrainingEntitlementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async resolveCustomerContext(
    principal: AuthenticatedPrincipal,
  ): Promise<CustomerTrainingContext> {
    if (
      principal.accountScope !== AccountScope.COMPANY ||
      !principal.companyId
    ) {
      throw new ForbiddenException('A company-scoped account is required.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: principal.userId },
      select: {
        accountScope: true,
        companyId: true,
        status: true,
        company: { select: { status: true } },
      },
    });

    if (
      !user ||
      user.accountScope !== AccountScope.COMPANY ||
      user.companyId !== principal.companyId ||
      user.status !== UserStatus.ACTIVE ||
      user.company?.status !== CompanyStatus.ACTIVE
    ) {
      throw new ForbiddenException('The customer training scope is inactive.');
    }

    const now = new Date();
    const enabled =
      (await this.settings.resolveValue(
        'trainings.enabled',
        principal.companyId,
      )) === true;

    return {
      companyId: principal.companyId,
      userId: principal.userId,
      now,
      enabled,
      activeTrainingServiceIds: await this.resolveActiveTrainingServiceIds(
        principal.companyId,
        now,
      ),
    };
  }

  async resolveActiveTrainingServiceIds(
    companyId: string,
    now: Date = new Date(),
  ): Promise<string[]> {
    const assignments = await this.prisma.companyService.findMany({
      where: {
        companyId,
        status: CompanyServiceStatus.ACTIVE,
        ...this.activeWindow(now),
        service: {
          category: ServiceCategory.TRAINING,
        },
      },
      select: {
        serviceId: true,
        status: true,
        service: { select: { billingModel: true } },
        subscription: {
          select: {
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            gracePeriodDays: true,
            autoRenew: true,
            cancelAtPeriodEnd: true,
          },
        },
      },
    });

    // Course access follows the subscription: once a training service lapses,
    // the courses it granted close. Progress, completions and issued
    // certificates are left untouched, so renewing restores the learner
    // exactly where they were.
    const entitled = assignments.filter(
      (assignment) =>
        resolveEntitlement(
          {
            billingModel: assignment.service.billingModel,
            assignmentStatus: assignment.status,
            subscription: assignment.subscription,
          },
          now,
        ).available,
    );

    return [...new Set(entitled.map((assignment) => assignment.serviceId))];
  }

  customerCourseWhere(
    context: CustomerTrainingContext,
  ): Prisma.TrainingCourseWhereInput {
    const activeWindow = this.activeWindow(context.now);
    const accessRules: Prisma.TrainingCourseWhereInput[] = [
      {
        userAccess: {
          some: {
            userId: context.userId,
            companyId: context.companyId,
            source: TrainingUserAccessSource.PLATFORM,
            ...activeWindow,
          },
        },
      },
      {
        companyAccess: {
          some: {
            companyId: context.companyId,
            mode: TrainingAudienceMode.ALL_USERS,
            ...activeWindow,
          },
        },
      },
    ];

    if (context.activeTrainingServiceIds.length > 0) {
      accessRules.push({
        serviceAccess: {
          some: {
            serviceId: { in: context.activeTrainingServiceIds },
            mode: TrainingAudienceMode.ALL_USERS,
            ...activeWindow,
          },
        },
      });
    }

    const assignmentScopes: Prisma.TrainingCourseWhereInput[] = [
      {
        companyAccess: {
          some: {
            companyId: context.companyId,
            mode: TrainingAudienceMode.ASSIGNED_USERS,
            ...activeWindow,
          },
        },
      },
    ];

    if (context.activeTrainingServiceIds.length > 0) {
      assignmentScopes.push({
        serviceAccess: {
          some: {
            serviceId: { in: context.activeTrainingServiceIds },
            mode: TrainingAudienceMode.ASSIGNED_USERS,
            ...activeWindow,
          },
        },
      });
    }

    accessRules.push({
      AND: [
        {
          userAccess: {
            some: {
              userId: context.userId,
              companyId: context.companyId,
              ...activeWindow,
            },
          },
        },
        { OR: assignmentScopes },
      ],
    });

    return {
      status: TrainingCourseStatus.PUBLISHED,
      category: { status: TrainingCategoryStatus.ACTIVE },
      OR: accessRules,
    };
  }

  async companyEligibleCourseWhere(
    companyId: string,
    now: Date = new Date(),
  ): Promise<Prisma.TrainingCourseWhereInput> {
    const activeServiceIds = await this.resolveActiveTrainingServiceIds(
      companyId,
      now,
    );
    const activeWindow = this.activeWindow(now);
    const accessRules: Prisma.TrainingCourseWhereInput[] = [
      {
        companyAccess: {
          some: {
            companyId,
            ...activeWindow,
          },
        },
      },
    ];

    if (activeServiceIds.length > 0) {
      accessRules.push({
        serviceAccess: {
          some: {
            serviceId: { in: activeServiceIds },
            ...activeWindow,
          },
        },
      });
    }

    return {
      status: TrainingCourseStatus.PUBLISHED,
      category: { status: TrainingCategoryStatus.ACTIVE },
      OR: accessRules,
    };
  }

  async getCompanyEligibility(
    courseId: string,
    companyId: string,
    now: Date = new Date(),
  ): Promise<CompanyTrainingEligibility> {
    const activeServiceIds = await this.resolveActiveTrainingServiceIds(
      companyId,
      now,
    );
    const activeWindow = this.activeWindow(now);

    const [companyAccess, serviceAccess] = await Promise.all([
      this.prisma.trainingCourseCompanyAccess.findMany({
        where: {
          courseId,
          companyId,
          ...activeWindow,
        },
        select: { mode: true },
      }),
      activeServiceIds.length > 0
        ? this.prisma.trainingCourseServiceAccess.findMany({
            where: {
              courseId,
              serviceId: { in: activeServiceIds },
              ...activeWindow,
            },
            select: { mode: true },
          })
        : Promise.resolve([]),
    ]);

    const modes = [...companyAccess, ...serviceAccess].map(
      (access) => access.mode,
    );
    const hasAllUsers = modes.includes(TrainingAudienceMode.ALL_USERS);
    const hasAssignedUsers = modes.includes(
      TrainingAudienceMode.ASSIGNED_USERS,
    );

    return {
      hasAny: modes.length > 0,
      hasAllUsers,
      hasAssignedUsers,
      requiresAssignment: !hasAllUsers && hasAssignedUsers,
    };
  }

  async assertEntitledCourseBySlug(
    principal: AuthenticatedPrincipal,
    slug: string,
  ): Promise<{ context: CustomerTrainingContext; courseId: string }> {
    const context = await this.resolveCustomerContext(principal);
    if (!context.enabled) {
      throw new NotFoundException('Training course was not found.');
    }

    const course = await this.prisma.trainingCourse.findFirst({
      where: {
        AND: [this.customerCourseWhere(context), { slug }],
      },
      select: { id: true },
    });

    if (!course) {
      throw new NotFoundException('Training course was not found.');
    }

    return { context, courseId: course.id };
  }

  private activeWindow(now: Date) {
    return {
      AND: [
        {
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        },
        {
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      ],
    };
  }
}
