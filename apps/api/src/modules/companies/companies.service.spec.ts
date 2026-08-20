import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { AccountScope } from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { AuditService } from '../audit/audit.service';
import { CompaniesService } from './companies.service';

describe('CompaniesService security', () => {
  let service: CompaniesService;
  let capturedCompanyId: string | undefined;

  const prisma = {
    company: {
      findUnique(args: {
        where: {
          id: string;
        };
      }): Promise<null> {
        capturedCompanyId = args.where.id;
        return Promise.resolve(null);
      },
    },
  } as unknown as PrismaService;

  const auditService = {} as AuditService;

  const companyPrincipal: AuthenticatedPrincipal = {
    sessionId: 'company-session',
    userId: 'company-admin',
    email: 'admin@company-a.test',
    accountScope: AccountScope.COMPANY,
    companyId: 'company-a',
  };

  beforeEach(() => {
    capturedCompanyId = undefined;
    service = new CompaniesService(prisma, auditService);
  });

  it('conceals another company from a company-scoped user', async () => {
    await expect(
      service.getById(companyPrincipal, 'company-b'),
    ).rejects.toThrow(NotFoundException);

    expect(capturedCompanyId).toBeUndefined();
  });

  it('does not allow a company-scoped user to create companies', async () => {
    await expect(
      service.create(companyPrincipal, {
        name: 'Unauthorized Company',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('does not allow a company-scoped user to change another company status', async () => {
    await expect(
      service.updateStatus(companyPrincipal, 'company-b', {
        status: 'SUSPENDED',
      } as never),
    ).rejects.toThrow(ForbiddenException);
  });
});
