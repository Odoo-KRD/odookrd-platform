import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { UpdateUserUiPreferencesDto } from './dto/update-user-ui-preferences.dto';
import type { UserUiPreferencesResponse } from './interfaces/user-ui-preferences-response.interface';

const UI_PREFERENCE_SELECT = {
  sidebarCollapsed: true,
  dashboardPreferences: true,
  updatedAt: true,
} as const;

function normalizeDashboardPreferences(
  value: unknown,
): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

@Injectable()
export class UserUiPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async get(
    principal: AuthenticatedPrincipal,
  ): Promise<UserUiPreferencesResponse> {
    const preference = await this.prisma.userUiPreference.findUnique({
      where: {
        userId: principal.userId,
      },
      select: UI_PREFERENCE_SELECT,
    });

    if (!preference) {
      return {
        sidebarCollapsed: false,
        dashboardPreferences: {},
        updatedAt: null,
      };
    }

    return {
      sidebarCollapsed: preference.sidebarCollapsed,
      dashboardPreferences: normalizeDashboardPreferences(
        preference.dashboardPreferences,
      ),
      updatedAt: preference.updatedAt.toISOString(),
    };
  }

  async update(
    principal: AuthenticatedPrincipal,
    dto: UpdateUserUiPreferencesDto,
  ): Promise<UserUiPreferencesResponse> {
    const preference = await this.prisma.userUiPreference.upsert({
      where: {
        userId: principal.userId,
      },
      create: {
        userId: principal.userId,
        sidebarCollapsed: dto.sidebarCollapsed,
      },
      update: {
        sidebarCollapsed: dto.sidebarCollapsed,
      },
      select: UI_PREFERENCE_SELECT,
    });

    return {
      sidebarCollapsed: preference.sidebarCollapsed,
      dashboardPreferences: normalizeDashboardPreferences(
        preference.dashboardPreferences,
      ),
      updatedAt: preference.updatedAt.toISOString(),
    };
  }
}
