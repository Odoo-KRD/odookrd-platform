import { ConflictException, NotFoundException } from '@nestjs/common';

import {
  AccountScope,
  AuthTokenType,
  UserStatus,
} from '../../generated/prisma/enums';
import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuditService } from '../audit/audit.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { UserInvitationService } from './user-invitation.service';
import { UsersService } from './users.service';

const platformAdmin: AuthenticatedPrincipal = {
  sessionId: 'platform-session',
  userId: 'platform-admin',
  email: 'admin@odoo.krd',
  accountScope: AccountScope.PLATFORM,
  companyId: null,
};

function userRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'akar@bigpower.co',
    displayName: null,
    whatsappNumber: null,
    certificateName: null,
    accountScope: AccountScope.COMPANY,
    companyId: 'company-a',
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date('2026-09-17T00:00:00Z'),
    createdAt: new Date('2026-09-17T00:00:00Z'),
    updatedAt: new Date('2026-09-17T00:00:00Z'),
    userRoles: [{ role: { key: 'company_user' } }],
    ...overrides,
  };
}

function createService(existing: unknown, taken: unknown = null) {
  const tx = {
    user: {
      findFirst: jest.fn().mockResolvedValue(existing),
      findUnique: jest.fn().mockResolvedValue(taken),
      update: jest.fn(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ ...(existing as object), ...data }),
      ),
    },
    authToken: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const prisma = {
    $transaction: <T>(callback: (client: typeof tx) => Promise<T>) =>
      callback(tx),
  } as unknown as PrismaService;
  const audit = { write: jest.fn().mockResolvedValue(undefined) };
  const service = new UsersService(
    prisma,
    audit as unknown as AuditService,
    {} as UserInvitationService,
  );
  return { service, tx, audit };
}

describe('UsersService.updateProfile', () => {
  it('updates the details a platform admin edits and audits them', async () => {
    const { service, tx, audit } = createService(userRecord());

    const result = await service.updateProfile(platformAdmin, 'user-1', {
      displayName: '  Akar Omar ',
      whatsappNumber: '+9647701234567',
      certificateName: '',
    });

    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { displayName: 'Akar Omar', whatsappNumber: '+9647701234567' },
      }),
    );
    expect(result.displayName).toBe('Akar Omar');
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: 'user-1',
        companyId: 'company-a',
        metadata: expect.objectContaining({
          fields: ['displayName', 'whatsappNumber'],
        }) as unknown,
      }),
      tx,
    );
  });

  it('refuses an email address another account already uses', async () => {
    const { service, tx } = createService(userRecord(), { id: 'someone-else' });

    await expect(
      service.updateProfile(platformAdmin, 'user-1', {
        email: 'Taken@Example.com',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { normalizedEmail: 'taken@example.com' },
      }),
    );
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('cancels invitation links sent to the old address of an invited user', async () => {
    const { service, tx } = createService(
      userRecord({ status: UserStatus.INVITED, emailVerifiedAt: null }),
    );

    await service.updateProfile(platformAdmin, 'user-1', {
      email: 'akar.omar@bigpower.co',
    });

    expect(tx.authToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          type: AuthTokenType.INVITATION,
          usedAt: null,
        },
      }),
    );
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          email: 'akar.omar@bigpower.co',
          normalizedEmail: 'akar.omar@bigpower.co',
          emailVerifiedAt: null,
        },
      }),
    );
  });

  it('keeps company administrators inside their own company', async () => {
    const { service, tx } = createService(null);

    await expect(
      service.updateProfile(
        {
          sessionId: 'company-session',
          userId: 'company-admin',
          email: 'admin@company-a.test',
          accountScope: AccountScope.COMPANY,
          companyId: 'company-a',
        },
        'user-in-company-b',
        { displayName: 'X' },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-in-company-b', companyId: 'company-a' },
      }),
    );
  });
});
