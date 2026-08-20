import { ForbiddenException, Injectable } from '@nestjs/common';

import { AccountScope, RoleScope } from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { AuthorizationContext } from './interfaces/authorization-context.interface';
import type { PermissionKey } from './permissions';

@Injectable()
export class AuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveContext(
    principal: AuthenticatedPrincipal,
  ): Promise<AuthorizationContext> {
    this.assertPrincipalScope(principal);

    const assignments = await this.prisma.userRole.findMany({
      where: {
        userId: principal.userId,
      },
      select: {
        role: {
          select: {
            key: true,
            scope: true,
            rolePermissions: {
              select: {
                permission: {
                  select: {
                    key: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const expectedRoleScope =
      principal.accountScope === AccountScope.PLATFORM
        ? RoleScope.PLATFORM
        : RoleScope.COMPANY;

    const invalidScopeAssignment = assignments.some(
      ({ role }) => role.scope !== expectedRoleScope,
    );

    if (invalidScopeAssignment) {
      throw this.invalidAuthorizationContext();
    }

    const roleKeys = assignments.map(({ role }) => role.key);

    const permissions = [
      ...new Set(
        assignments.flatMap(({ role }) =>
          role.rolePermissions.map(({ permission }) => permission.key),
        ),
      ),
    ];

    return {
      userId: principal.userId,
      accountScope: principal.accountScope,
      companyId: principal.companyId,
      roleKeys,
      permissions,
    };
  }

  async assertPermissions(
    principal: AuthenticatedPrincipal,
    requiredPermissions: readonly PermissionKey[],
  ): Promise<AuthorizationContext> {
    const context = await this.resolveContext(principal);

    const authorized = requiredPermissions.every((permission) =>
      context.permissions.includes(permission),
    );

    if (!authorized) {
      throw new ForbiddenException('Insufficient permissions.');
    }

    return context;
  }

  assertCompanyAccess(
    principal: AuthenticatedPrincipal,
    targetCompanyId: string,
  ): void {
    this.assertPrincipalScope(principal);

    if (principal.accountScope === AccountScope.PLATFORM) {
      return;
    }

    if (principal.companyId !== targetCompanyId) {
      throw new ForbiddenException(
        'Access outside company scope is forbidden.',
      );
    }
  }

  async authorizeCompany(
    principal: AuthenticatedPrincipal,
    targetCompanyId: string,
    requiredPermissions: readonly PermissionKey[],
  ): Promise<AuthorizationContext> {
    const context = await this.assertPermissions(
      principal,
      requiredPermissions,
    );

    this.assertCompanyAccess(principal, targetCompanyId);

    return context;
  }

  private assertPrincipalScope(principal: AuthenticatedPrincipal): void {
    if (
      principal.accountScope === AccountScope.PLATFORM &&
      principal.companyId === null
    ) {
      return;
    }

    if (
      principal.accountScope === AccountScope.COMPANY &&
      principal.companyId !== null
    ) {
      return;
    }

    throw this.invalidAuthorizationContext();
  }

  private invalidAuthorizationContext(): ForbiddenException {
    return new ForbiddenException('Authorization context is invalid.');
  }
}
