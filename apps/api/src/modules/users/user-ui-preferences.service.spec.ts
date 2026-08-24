import { BadRequestException } from '@nestjs/common';

import { AccountScope } from '../../generated/prisma/enums';
import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { UserUiPreferencesService } from './user-ui-preferences.service';

describe('UserUiPreferencesService', () => {
  const prisma = {
    userUiPreference: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const principal: AuthenticatedPrincipal = {
    sessionId: '00000000-0000-4000-8000-000000000001',
    userId: '00000000-0000-4000-8000-000000000002',
    email: 'admin@example.com',
    accountScope: AccountScope.PLATFORM,
    companyId: null,
  };

  const service = new UserUiPreferencesService(
    prisma as unknown as PrismaService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns safe defaults when the user has no stored preferences', async () => {
    prisma.userUiPreference.findUnique.mockResolvedValue(null);

    await expect(service.get(principal)).resolves.toEqual({
      sidebarCollapsed: false,
      dashboardPreferences: {
        order: [
          'companies',
          'users',
          'roles',
          'services',
          'notifications',
          'settings',
        ],
        hidden: [],
        collapsed: [],
      },
      updatedAt: null,
    });
  });

  it('upserts only the authenticated user sidebar preference', async () => {
    const updatedAt = new Date('2026-08-24T07:00:00.000Z');

    prisma.userUiPreference.upsert.mockResolvedValue({
      sidebarCollapsed: true,
      dashboardPreferences: {},
      updatedAt,
    });

    await expect(
      service.update(principal, { sidebarCollapsed: true }),
    ).resolves.toMatchObject({
      sidebarCollapsed: true,
      updatedAt: updatedAt.toISOString(),
    });

    expect(prisma.userUiPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: principal.userId,
        },
        create: {
          userId: principal.userId,
          sidebarCollapsed: true,
        },
        update: {
          sidebarCollapsed: true,
        },
      }),
    );
  });

  it('persists validated dashboard preferences for the authenticated user', async () => {
    const updatedAt = new Date('2026-08-24T07:00:00.000Z');
    const dashboardPreferences = {
      order: [
        'users',
        'companies',
        'roles',
        'services',
        'notifications',
        'settings',
      ],
      hidden: ['roles'],
      collapsed: ['users'],
    };

    prisma.userUiPreference.upsert.mockResolvedValue({
      sidebarCollapsed: false,
      dashboardPreferences,
      updatedAt,
    });

    await expect(
      service.update(principal, { dashboardPreferences }),
    ).resolves.toEqual({
      sidebarCollapsed: false,
      dashboardPreferences,
      updatedAt: updatedAt.toISOString(),
    });

    expect(prisma.userUiPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: principal.userId,
        },
        update: {
          dashboardPreferences,
        },
      }),
    );
  });

  it('rejects an empty preference patch', async () => {
    await expect(service.update(principal, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
