import { Injectable } from '@nestjs/common';

import { AccountScope, RoleScope } from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { RoleResponse } from './interfaces/role-response.interface';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(principal: AuthenticatedPrincipal): Promise<RoleResponse[]> {
    const roles = await this.prisma.role.findMany({
      where:
        principal.accountScope === AccountScope.COMPANY
          ? {
              scope: RoleScope.COMPANY,
            }
          : undefined,
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
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
    });

    return roles.map((role) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      scope: role.scope,
      permissions: role.rolePermissions
        .map(({ permission }) => permission.key)
        .sort(),
    }));
  }
}
