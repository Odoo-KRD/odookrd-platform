import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import {
  AccountScope,
  CompanyServiceStatus,
  UserStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';

export const CUSTOMER_ACTIVITY_ACTIONS = [
  'company.created',
  'company.updated',
  'company.status.updated',
  'service.assignment.created',
  'service.assignment.updated',
  'user.invited',
  'user.created',
  'user.status.updated',
  'user.roles.updated',
] as const;

const companySelect = {
  id: true,
  name: true,
  nameTranslations: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CompanySelect;

const recentServiceSelect = {
  id: true,
  companyId: true,
  displayName: true,
  displayNameTranslations: true,
  status: true,
  expiresAt: true,
  serviceUrl: true,
  service: {
    select: {
      id: true,
      name: true,
      nameTranslations: true,
      category: true,
    },
  },
} satisfies Prisma.CompanyServiceSelect;

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(principal: AuthenticatedPrincipal) {
    const companyId = this.requireCompany(principal);
    const now = new Date();
    const upcomingExpiration = new Date(now.getTime() + 30 * 86_400_000);

    const [
      company,
      groupedServices,
      expiringSoon,
      recentServices,
      activity,
      teamMembers,
    ] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: companyId },
        select: companySelect,
      }),
      this.prisma.companyService.groupBy({
        by: ['status'],
        where: { companyId },
        _count: { _all: true },
      }),
      this.prisma.companyService.count({
        where: {
          companyId,
          status: CompanyServiceStatus.ACTIVE,
          expiresAt: { gte: now, lte: upcomingExpiration },
        },
      }),
      this.prisma.companyService.findMany({
        where: { companyId },
        select: recentServiceSelect,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        take: 5,
      }),
      this.prisma.auditLog.findMany({
        where: {
          companyId,
          action: { in: [...CUSTOMER_ACTIVITY_ACTIONS] },
        },
        select: {
          id: true,
          action: true,
          targetType: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 8,
      }),
      this.prisma.user.count({
        where: { companyId, status: UserStatus.ACTIVE },
      }),
    ]);

    if (!company) {
      throw new NotFoundException('Company workspace was not found.');
    }

    const counts: Record<CompanyServiceStatus, number> = {
      PROVISIONING: 0,
      ACTIVE: 0,
      SUSPENDED: 0,
      EXPIRED: 0,
      CANCELLED: 0,
    };

    for (const entry of groupedServices) {
      counts[entry.status] = entry._count._all;
    }

    return {
      company,
      summary: {
        total: Object.values(counts).reduce((total, count) => total + count, 0),
        active: counts.ACTIVE,
        provisioning: counts.PROVISIONING,
        suspended: counts.SUSPENDED,
        expired: counts.EXPIRED,
        cancelled: counts.CANCELLED,
        expiringSoon,
      },
      teamMembers,
      recentServices,
      recentActivity: activity,
    };
  }

  async profile(principal: AuthenticatedPrincipal) {
    const companyId = this.requireCompany(principal);

    const [user, session] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: principal.userId, companyId },
        select: {
          id: true,
          email: true,
          companyId: true,
          status: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
          company: { select: companySelect },
          userRoles: { select: { role: { select: { key: true } } } },
        },
      }),
      this.prisma.session.findFirst({
        where: {
          id: principal.sessionId,
          userId: principal.userId,
          revokedAt: null,
        },
        select: { lastSeenAt: true },
      }),
    ]);

    if (!user || !user.company) {
      throw new NotFoundException('Account profile was not found.');
    }

    return {
      id: user.id,
      email: user.email,
      companyId: user.companyId,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      company: user.company,
      roles: user.userRoles.map(({ role }) => role.key).sort(),
      lastSeenAt: session?.lastSeenAt ?? null,
    };
  }

  private requireCompany(principal: AuthenticatedPrincipal): string {
    if (
      principal.accountScope !== AccountScope.COMPANY ||
      !principal.companyId
    ) {
      throw new ForbiddenException('A company account is required.');
    }

    return principal.companyId;
  }
}
