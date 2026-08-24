import { BadRequestException, Injectable } from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { UpdateUserUiPreferencesDto } from './dto/update-user-ui-preferences.dto';
import type {
  DashboardPreferencesResponse,
  UserUiPreferencesResponse,
} from './interfaces/user-ui-preferences-response.interface';

const DASHBOARD_SECTION_KEYS = [
  'companies',
  'users',
  'roles',
  'services',
  'notifications',
  'settings',
] as const;

const dashboardSectionSet = new Set<string>(DASHBOARD_SECTION_KEYS);

const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferencesResponse = {
  order: [...DASHBOARD_SECTION_KEYS],
  hidden: [],
  collapsed: [],
};

const UI_PREFERENCE_SELECT = {
  sidebarCollapsed: true,
  dashboardPreferences: true,
  updatedAt: true,
} as const;

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const result: string[] = [];

  for (const item of value) {
    if (
      typeof item === 'string' &&
      dashboardSectionSet.has(item) &&
      !result.includes(item)
    ) {
      result.push(item);
    }
  }

  return result;
}

function normalizeDashboardPreferences(
  value: unknown,
): DashboardPreferencesResponse {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ...DEFAULT_DASHBOARD_PREFERENCES };
  }

  const record = value as Record<string, unknown>;
  const requestedOrder = normalizeList(record.order);
  const order = [...requestedOrder];

  for (const section of DASHBOARD_SECTION_KEYS) {
    if (!order.includes(section)) {
      order.push(section);
    }
  }

  return {
    order,
    hidden: normalizeList(record.hidden),
    collapsed: normalizeList(record.collapsed),
  };
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
        dashboardPreferences: { ...DEFAULT_DASHBOARD_PREFERENCES },
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
    if (
      dto.sidebarCollapsed === undefined &&
      dto.dashboardPreferences === undefined
    ) {
      throw new BadRequestException(
        'At least one UI preference must be provided.',
      );
    }

    const dashboardPreferences = dto.dashboardPreferences
      ? normalizeDashboardPreferences(dto.dashboardPreferences)
      : undefined;

    const preference = await this.prisma.userUiPreference.upsert({
      where: {
        userId: principal.userId,
      },
      create: {
        userId: principal.userId,
        sidebarCollapsed: dto.sidebarCollapsed ?? false,
        ...(dashboardPreferences
          ? {
              dashboardPreferences:
                dashboardPreferences as unknown as Prisma.InputJsonValue,
            }
          : {}),
      },
      update: {
        ...(dto.sidebarCollapsed !== undefined
          ? {
              sidebarCollapsed: dto.sidebarCollapsed,
            }
          : {}),
        ...(dashboardPreferences
          ? {
              dashboardPreferences:
                dashboardPreferences as unknown as Prisma.InputJsonValue,
            }
          : {}),
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
