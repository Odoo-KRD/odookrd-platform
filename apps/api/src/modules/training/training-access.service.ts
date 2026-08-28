import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AccountScope,
  CompanyStatus,
  ServiceCategory,
  TrainingAudienceMode,
  TrainingCategoryStatus,
  TrainingCourseStatus,
  TrainingUserAccessSource,
  UserStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type {
  CreateTrainingCompanyAccessDto,
  CreateTrainingServiceAccessDto,
  CreateTrainingUserAccessDto,
  ListTrainingAccessOptionsQueryDto,
  UpdateTrainingCompanyAccessDto,
  UpdateTrainingServiceAccessDto,
  UpdateTrainingUserAccessDto,
} from './dto/training-access.dto';
import {
  TrainingEntitlementService,
  type CompanyTrainingEligibility,
} from './training-entitlement.service';

@Injectable()
export class TrainingAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: TrainingEntitlementService,
  ) {}

  async getSummary(principal: AuthenticatedPrincipal, courseId: string) {
    if (principal.accountScope === AccountScope.PLATFORM) {
      this.assertPlatform(principal);
      const course = await this.requireCourse(courseId);

      const [companyAccess, serviceAccess, userAccess] = await Promise.all([
        this.prisma.trainingCourseCompanyAccess.findMany({
          where: { courseId },
          select: {
            id: true,
            companyId: true,
            mode: true,
            startsAt: true,
            expiresAt: true,
            createdAt: true,
            updatedAt: true,
            company: {
              select: { id: true, name: true, nameTranslations: true },
            },
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        }),
        this.prisma.trainingCourseServiceAccess.findMany({
          where: { courseId },
          select: {
            id: true,
            serviceId: true,
            mode: true,
            startsAt: true,
            expiresAt: true,
            createdAt: true,
            updatedAt: true,
            service: {
              select: { id: true, name: true, nameTranslations: true },
            },
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        }),
        this.prisma.trainingCourseUserAccess.findMany({
          where: { courseId },
          select: {
            id: true,
            companyId: true,
            userId: true,
            source: true,
            startsAt: true,
            expiresAt: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                email: true,
                companyId: true,
                status: true,
              },
            },
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        }),
      ]);

      return {
        scope: 'PLATFORM' as const,
        course,
        eligibility: null,
        companyAccess,
        serviceAccess,
        userAccess,
      };
    }

    const managed = await this.requireCompanyManageableCourse(
      principal,
      courseId,
    );
    const userAccess = await this.prisma.trainingCourseUserAccess.findMany({
      where: {
        courseId,
        companyId: managed.companyId,
      },
      select: {
        id: true,
        companyId: true,
        userId: true,
        source: true,
        startsAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            companyId: true,
            status: true,
          },
        },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    return {
      scope: 'COMPANY' as const,
      course: managed.course,
      eligibility: managed.eligibility,
      companyAccess: [],
      serviceAccess: [],
      userAccess,
    };
  }

  async getOptions(
    principal: AuthenticatedPrincipal,
    courseId: string,
    query: ListTrainingAccessOptionsQueryDto,
  ) {
    if (principal.accountScope === AccountScope.PLATFORM) {
      this.assertPlatform(principal);
      await this.requireCourse(courseId);

      const [companies, services] = await Promise.all([
        this.prisma.company.findMany({
          where: { status: CompanyStatus.ACTIVE },
          select: { id: true, name: true, nameTranslations: true },
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          take: 500,
        }),
        this.prisma.service.findMany({
          where: {
            category: ServiceCategory.TRAINING,
          },
          select: { id: true, name: true, nameTranslations: true },
          orderBy: [{ name: 'asc' }, { id: 'asc' }],
          take: 500,
        }),
      ]);

      let users: {
        id: string;
        email: string;
        companyId: string | null;
        status: UserStatus;
      }[] = [];

      if (query.companyId) {
        const companyExists = companies.some(
          (company) => company.id === query.companyId,
        );
        if (!companyExists) {
          throw new BadRequestException(
            'Select an active company before choosing a learner.',
          );
        }

        users = await this.prisma.user.findMany({
          where: {
            companyId: query.companyId,
            accountScope: AccountScope.COMPANY,
            status: { in: [UserStatus.ACTIVE, UserStatus.INVITED] },
          },
          select: {
            id: true,
            email: true,
            companyId: true,
            status: true,
          },
          orderBy: [{ email: 'asc' }, { id: 'asc' }],
          take: 500,
        });
      }

      return {
        scope: 'PLATFORM' as const,
        selectedCompanyId: query.companyId ?? null,
        companies,
        services,
        users,
      };
    }

    const managed = await this.requireCompanyManageableCourse(
      principal,
      courseId,
    );
    const users = await this.prisma.user.findMany({
      where: {
        companyId: managed.companyId,
        accountScope: AccountScope.COMPANY,
        status: { in: [UserStatus.ACTIVE, UserStatus.INVITED] },
      },
      select: {
        id: true,
        email: true,
        companyId: true,
        status: true,
      },
      orderBy: [{ email: 'asc' }, { id: 'asc' }],
      take: 500,
    });

    return {
      scope: 'COMPANY' as const,
      selectedCompanyId: managed.companyId,
      companies: [],
      services: [],
      users,
    };
  }

  async listCompanyCourses(principal: AuthenticatedPrincipal) {
    const context = await this.entitlements.resolveCustomerContext(principal);
    if (!context.enabled) return [];

    const where = await this.entitlements.companyEligibleCourseWhere(
      context.companyId,
      context.now,
    );
    const activeWindow = this.activeWindow(context.now);

    const courses = await this.prisma.trainingCourse.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        titleTranslations: true,
        companyAccess: {
          where: {
            companyId: context.companyId,
            ...activeWindow,
          },
          select: { mode: true },
        },
        serviceAccess: {
          where: {
            serviceId: { in: context.activeTrainingServiceIds },
            ...activeWindow,
          },
          select: { mode: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { id: 'asc' }],
      take: 250,
    });

    return courses.map((course) => {
      const modes = [...course.companyAccess, ...course.serviceAccess].map(
        (access) => access.mode,
      );
      const hasAllUsers = modes.includes(TrainingAudienceMode.ALL_USERS);
      const hasAssignedUsers = modes.includes(
        TrainingAudienceMode.ASSIGNED_USERS,
      );

      return {
        id: course.id,
        slug: course.slug,
        title: course.title,
        titleTranslations: course.titleTranslations,
        hasAllUsers,
        hasAssignedUsers,
        requiresAssignment: !hasAllUsers && hasAssignedUsers,
      };
    });
  }

  async createCompanyAccess(
    principal: AuthenticatedPrincipal,
    courseId: string,
    input: CreateTrainingCompanyAccessDto,
  ) {
    this.assertPlatform(principal);
    await this.requireCourse(courseId);

    const company = await this.prisma.company.findFirst({
      where: { id: input.companyId, status: CompanyStatus.ACTIVE },
      select: { id: true },
    });
    if (!company) {
      throw new BadRequestException('Select an active company.');
    }

    const existing = await this.prisma.trainingCourseCompanyAccess.findFirst({
      where: { courseId, companyId: input.companyId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        'This company already has an access rule for the course.',
      );
    }

    const window = this.createWindow(input.startsAt, input.expiresAt);

    return this.prisma.$transaction(async (transaction) => {
      const created = await transaction.trainingCourseCompanyAccess.create({
        data: {
          courseId,
          companyId: input.companyId,
          mode: input.mode,
          ...window,
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: input.companyId,
          action: AUDIT_ACTIONS.TRAINING_ACCESS_ASSIGNED,
          targetType: 'training_course_company_access',
          targetId: created.id,
          metadata: {
            operation: 'create',
            courseId,
            mode: input.mode,
            startsAt: window.startsAt,
            expiresAt: window.expiresAt,
          },
        },
      });
      return created;
    });
  }

  async updateCompanyAccess(
    principal: AuthenticatedPrincipal,
    courseId: string,
    accessId: string,
    input: UpdateTrainingCompanyAccessDto,
  ) {
    this.assertPlatform(principal);
    await this.requireCourse(courseId);

    const existing = await this.prisma.trainingCourseCompanyAccess.findFirst({
      where: { id: accessId, courseId },
    });
    if (!existing) {
      throw new NotFoundException('Training company access was not found.');
    }

    const window = this.updateWindow(existing, input);

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.trainingCourseCompanyAccess.update({
        where: { id: existing.id },
        data: {
          ...(input.mode !== undefined ? { mode: input.mode } : {}),
          ...window,
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: existing.companyId,
          action: AUDIT_ACTIONS.TRAINING_ACCESS_ASSIGNED,
          targetType: 'training_course_company_access',
          targetId: existing.id,
          metadata: {
            operation: 'update',
            courseId,
            mode: updated.mode,
            startsAt: updated.startsAt,
            expiresAt: updated.expiresAt,
          },
        },
      });
      return updated;
    });
  }

  async deleteCompanyAccess(
    principal: AuthenticatedPrincipal,
    courseId: string,
    accessId: string,
  ) {
    this.assertPlatform(principal);
    await this.requireCourse(courseId);

    const existing = await this.prisma.trainingCourseCompanyAccess.findFirst({
      where: { id: accessId, courseId },
    });
    if (!existing) {
      throw new NotFoundException('Training company access was not found.');
    }

    return this.prisma.$transaction(async (transaction) => {
      await transaction.trainingCourseCompanyAccess.delete({
        where: { id: existing.id },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: existing.companyId,
          action: AUDIT_ACTIONS.TRAINING_ACCESS_REVOKED,
          targetType: 'training_course_company_access',
          targetId: existing.id,
          metadata: { courseId, mode: existing.mode },
        },
      });
      return { id: existing.id, deleted: true };
    });
  }

  async createServiceAccess(
    principal: AuthenticatedPrincipal,
    courseId: string,
    input: CreateTrainingServiceAccessDto,
  ) {
    this.assertPlatform(principal);
    await this.requireCourse(courseId);

    const service = await this.prisma.service.findFirst({
      where: {
        id: input.serviceId,
        category: ServiceCategory.TRAINING,
      },
      select: { id: true },
    });
    if (!service) {
      throw new BadRequestException('Select an active TRAINING service.');
    }

    const existing = await this.prisma.trainingCourseServiceAccess.findFirst({
      where: { courseId, serviceId: input.serviceId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        'This TRAINING service already has an access rule for the course.',
      );
    }

    const window = this.createWindow(input.startsAt, input.expiresAt);

    return this.prisma.$transaction(async (transaction) => {
      const created = await transaction.trainingCourseServiceAccess.create({
        data: {
          courseId,
          serviceId: input.serviceId,
          mode: input.mode,
          ...window,
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_ACCESS_ASSIGNED,
          targetType: 'training_course_service_access',
          targetId: created.id,
          metadata: {
            operation: 'create',
            courseId,
            serviceId: input.serviceId,
            mode: input.mode,
            startsAt: window.startsAt,
            expiresAt: window.expiresAt,
          },
        },
      });
      return created;
    });
  }

  async updateServiceAccess(
    principal: AuthenticatedPrincipal,
    courseId: string,
    accessId: string,
    input: UpdateTrainingServiceAccessDto,
  ) {
    this.assertPlatform(principal);
    await this.requireCourse(courseId);

    const existing = await this.prisma.trainingCourseServiceAccess.findFirst({
      where: { id: accessId, courseId },
    });
    if (!existing) {
      throw new NotFoundException('Training service access was not found.');
    }

    const window = this.updateWindow(existing, input);

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.trainingCourseServiceAccess.update({
        where: { id: existing.id },
        data: {
          ...(input.mode !== undefined ? { mode: input.mode } : {}),
          ...window,
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_ACCESS_ASSIGNED,
          targetType: 'training_course_service_access',
          targetId: existing.id,
          metadata: {
            operation: 'update',
            courseId,
            serviceId: existing.serviceId,
            mode: updated.mode,
            startsAt: updated.startsAt,
            expiresAt: updated.expiresAt,
          },
        },
      });
      return updated;
    });
  }

  async deleteServiceAccess(
    principal: AuthenticatedPrincipal,
    courseId: string,
    accessId: string,
  ) {
    this.assertPlatform(principal);
    await this.requireCourse(courseId);

    const existing = await this.prisma.trainingCourseServiceAccess.findFirst({
      where: { id: accessId, courseId },
    });
    if (!existing) {
      throw new NotFoundException('Training service access was not found.');
    }

    return this.prisma.$transaction(async (transaction) => {
      await transaction.trainingCourseServiceAccess.delete({
        where: { id: existing.id },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.TRAINING_ACCESS_REVOKED,
          targetType: 'training_course_service_access',
          targetId: existing.id,
          metadata: {
            courseId,
            serviceId: existing.serviceId,
            mode: existing.mode,
          },
        },
      });
      return { id: existing.id, deleted: true };
    });
  }

  async createUserAccess(
    principal: AuthenticatedPrincipal,
    courseId: string,
    input: CreateTrainingUserAccessDto,
  ) {
    const targetUser = await this.requireAssignableUser(input.userId);
    const window = this.createWindow(input.startsAt, input.expiresAt);

    if (principal.accountScope === AccountScope.PLATFORM) {
      this.assertPlatform(principal);
      await this.requireCourse(courseId);

      const existing = await this.prisma.trainingCourseUserAccess.findFirst({
        where: { courseId, userId: targetUser.id },
      });

      if (existing?.source === TrainingUserAccessSource.PLATFORM) {
        throw new ConflictException(
          'This learner already has a platform-managed direct assignment.',
        );
      }

      return this.prisma.$transaction(async (transaction) => {
        const access = existing
          ? await transaction.trainingCourseUserAccess.update({
              where: { id: existing.id },
              data: {
                companyId: targetUser.companyId,
                source: TrainingUserAccessSource.PLATFORM,
                ...window,
              },
            })
          : await transaction.trainingCourseUserAccess.create({
              data: {
                courseId,
                companyId: targetUser.companyId,
                userId: targetUser.id,
                source: TrainingUserAccessSource.PLATFORM,
                ...window,
              },
            });

        await transaction.auditLog.create({
          data: {
            actorUserId: principal.userId,
            companyId: targetUser.companyId,
            action: AUDIT_ACTIONS.TRAINING_ACCESS_ASSIGNED,
            targetType: 'training_course_user_access',
            targetId: access.id,
            metadata: {
              operation: existing ? 'promote_to_platform' : 'create',
              courseId,
              userId: targetUser.id,
              source: TrainingUserAccessSource.PLATFORM,
              startsAt: access.startsAt,
              expiresAt: access.expiresAt,
            },
          },
        });
        return access;
      });
    }

    const managed = await this.requireCompanyManageableCourse(
      principal,
      courseId,
    );
    if (targetUser.companyId !== managed.companyId) {
      throw new ForbiddenException(
        'A company administrator cannot assign another company learner.',
      );
    }
    this.assertAssignmentRequired(managed.eligibility);

    const existing = await this.prisma.trainingCourseUserAccess.findFirst({
      where: { courseId, userId: targetUser.id },
    });
    if (existing?.source === TrainingUserAccessSource.PLATFORM) {
      throw new ForbiddenException(
        'This learner assignment is managed by the platform.',
      );
    }
    if (existing) {
      throw new ConflictException(
        'This learner already has a company-managed assignment.',
      );
    }

    return this.prisma.$transaction(async (transaction) => {
      const access = await transaction.trainingCourseUserAccess.create({
        data: {
          courseId,
          companyId: managed.companyId,
          userId: targetUser.id,
          source: TrainingUserAccessSource.COMPANY_ADMIN,
          ...window,
        },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: managed.companyId,
          action: AUDIT_ACTIONS.TRAINING_ACCESS_ASSIGNED,
          targetType: 'training_course_user_access',
          targetId: access.id,
          metadata: {
            operation: 'create',
            courseId,
            userId: targetUser.id,
            source: TrainingUserAccessSource.COMPANY_ADMIN,
            startsAt: access.startsAt,
            expiresAt: access.expiresAt,
          },
        },
      });
      return access;
    });
  }

  async updateUserAccess(
    principal: AuthenticatedPrincipal,
    courseId: string,
    accessId: string,
    input: UpdateTrainingUserAccessDto,
  ) {
    let companyId: string | undefined;

    if (principal.accountScope === AccountScope.PLATFORM) {
      this.assertPlatform(principal);
      await this.requireCourse(courseId);
    } else {
      const managed = await this.requireCompanyManageableCourse(
        principal,
        courseId,
      );
      this.assertAssignmentRequired(managed.eligibility);
      companyId = managed.companyId;
    }

    const existing = await this.prisma.trainingCourseUserAccess.findFirst({
      where: {
        id: accessId,
        courseId,
        ...(companyId ? { companyId } : {}),
      },
    });
    if (!existing) {
      throw new NotFoundException('Training learner access was not found.');
    }

    if (
      companyId &&
      existing.source !== TrainingUserAccessSource.COMPANY_ADMIN
    ) {
      throw new ForbiddenException(
        'This learner assignment is managed by the platform.',
      );
    }

    const window = this.updateWindow(existing, input);

    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.trainingCourseUserAccess.update({
        where: { id: existing.id },
        data: window,
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: existing.companyId,
          action: AUDIT_ACTIONS.TRAINING_ACCESS_ASSIGNED,
          targetType: 'training_course_user_access',
          targetId: existing.id,
          metadata: {
            operation: 'update',
            courseId,
            userId: existing.userId,
            source: existing.source,
            startsAt: updated.startsAt,
            expiresAt: updated.expiresAt,
          },
        },
      });
      return updated;
    });
  }

  async deleteUserAccess(
    principal: AuthenticatedPrincipal,
    courseId: string,
    accessId: string,
  ) {
    let companyId: string | undefined;

    if (principal.accountScope === AccountScope.PLATFORM) {
      this.assertPlatform(principal);
      await this.requireCourse(courseId);
    } else {
      const managed = await this.requireCompanyManageableCourse(
        principal,
        courseId,
      );
      companyId = managed.companyId;
    }

    const existing = await this.prisma.trainingCourseUserAccess.findFirst({
      where: {
        id: accessId,
        courseId,
        ...(companyId ? { companyId } : {}),
      },
    });
    if (!existing) {
      throw new NotFoundException('Training learner access was not found.');
    }

    if (
      companyId &&
      existing.source !== TrainingUserAccessSource.COMPANY_ADMIN
    ) {
      throw new ForbiddenException(
        'This learner assignment is managed by the platform.',
      );
    }

    return this.prisma.$transaction(async (transaction) => {
      await transaction.trainingCourseUserAccess.delete({
        where: { id: existing.id },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: existing.companyId,
          action: AUDIT_ACTIONS.TRAINING_ACCESS_REVOKED,
          targetType: 'training_course_user_access',
          targetId: existing.id,
          metadata: {
            courseId,
            userId: existing.userId,
            source: existing.source,
          },
        },
      });
      return { id: existing.id, deleted: true };
    });
  }

  private async requireCompanyManageableCourse(
    principal: AuthenticatedPrincipal,
    courseId: string,
  ): Promise<{
    companyId: string;
    eligibility: CompanyTrainingEligibility;
    course: {
      id: string;
      slug: string;
      title: string;
      titleTranslations: unknown;
    };
  }> {
    const context = await this.entitlements.resolveCustomerContext(principal);
    if (!context.enabled) {
      throw new NotFoundException('Training course was not found.');
    }

    const course = await this.prisma.trainingCourse.findFirst({
      where: {
        id: courseId,
        status: TrainingCourseStatus.PUBLISHED,
        category: { status: TrainingCategoryStatus.ACTIVE },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        titleTranslations: true,
      },
    });
    if (!course) {
      throw new NotFoundException('Training course was not found.');
    }

    const eligibility = await this.entitlements.getCompanyEligibility(
      courseId,
      context.companyId,
      context.now,
    );
    if (!eligibility.hasAny) {
      throw new NotFoundException('Training course was not found.');
    }

    return { companyId: context.companyId, eligibility, course };
  }

  private async requireCourse(courseId: string) {
    const course = await this.prisma.trainingCourse.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        slug: true,
        title: true,
        titleTranslations: true,
      },
    });
    if (!course) {
      throw new NotFoundException('Training course was not found.');
    }
    return course;
  }

  private async requireAssignableUser(userId: string): Promise<{
    id: string;
    companyId: string;
  }> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        accountScope: AccountScope.COMPANY,
        companyId: { not: null },
        status: { in: [UserStatus.ACTIVE, UserStatus.INVITED] },
        company: { status: CompanyStatus.ACTIVE },
      },
      select: { id: true, companyId: true },
    });

    if (!user?.companyId) {
      throw new BadRequestException(
        'Select an active or invited company learner.',
      );
    }

    return { id: user.id, companyId: user.companyId };
  }

  private assertAssignmentRequired(
    eligibility: CompanyTrainingEligibility,
  ): void {
    if (!eligibility.requiresAssignment) {
      throw new ConflictException(
        eligibility.hasAllUsers
          ? 'All company users already receive this course automatically.'
          : 'This company does not currently have assigned-user access to the course.',
      );
    }
  }

  private assertPlatform(principal: AuthenticatedPrincipal): void {
    if (
      principal.accountScope !== AccountScope.PLATFORM ||
      principal.companyId !== null
    ) {
      throw new ForbiddenException(
        'Platform training access administration is required.',
      );
    }
  }

  private createWindow(
    startsAt: string | null | undefined,
    expiresAt: string | null | undefined,
  ): { startsAt: Date | null; expiresAt: Date | null } {
    const window = {
      startsAt: this.parseDate(startsAt),
      expiresAt: this.parseDate(expiresAt),
    };
    this.assertWindow(window.startsAt, window.expiresAt);
    return window;
  }

  private updateWindow(
    existing: { startsAt: Date | null; expiresAt: Date | null },
    input: {
      startsAt?: string | null;
      expiresAt?: string | null;
    },
  ): { startsAt: Date | null; expiresAt: Date | null } {
    const startsAt =
      input.startsAt === undefined
        ? existing.startsAt
        : this.parseDate(input.startsAt);
    const expiresAt =
      input.expiresAt === undefined
        ? existing.expiresAt
        : this.parseDate(input.expiresAt);

    this.assertWindow(startsAt, expiresAt);
    return { startsAt, expiresAt };
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Training access date is invalid.');
    }
    return date;
  }

  private assertWindow(startsAt: Date | null, expiresAt: Date | null): void {
    if (startsAt && expiresAt && startsAt.getTime() >= expiresAt.getTime()) {
      throw new BadRequestException(
        'Training access must expire after its start date.',
      );
    }
  }

  private activeWindow(now: Date) {
    return {
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      ],
    };
  }
}
