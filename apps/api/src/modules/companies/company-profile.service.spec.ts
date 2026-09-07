import { ForbiddenException } from '@nestjs/common';

import { AccountScope } from '../../generated/prisma/enums';
import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuditService } from '../audit/audit.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { FilesService } from '../files/files.service';
import { CompanyProfileService } from './company-profile.service';
import { CompaniesService } from './companies.service';

describe('Company Profile V2 security boundaries', () => {
  const platformPrincipal: AuthenticatedPrincipal = {
    sessionId: 'platform-session',
    userId: 'platform-admin',
    email: 'platform@example.test',
    accountScope: AccountScope.PLATFORM,
    companyId: null,
  };

  const companyPrincipal: AuthenticatedPrincipal = {
    sessionId: 'company-session',
    userId: 'company-admin',
    email: 'company@example.test',
    accountScope: AccountScope.COMPANY,
    companyId: '11111111-1111-4111-8111-111111111111',
  };

  const profileService = new CompanyProfileService(
    {} as PrismaService,
    {} as FilesService,
    {} as AuditService,
  );

  const companiesService = new CompaniesService(
    {} as PrismaService,
    {} as AuditService,
  );

  it('does not let a company account use platform company profile operations', async () => {
    await expect(
      profileService.getPlatformProfile(
        companyPrincipal,
        companyPrincipal.companyId!,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('does not let a platform account use company self-contact operations', async () => {
    await expect(
      profileService.updateOwnContact(platformPrincipal, {
        contactEmail: 'company@example.test',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('blocks the legacy generic company update route for company accounts', async () => {
    await expect(
      companiesService.update(companyPrincipal, companyPrincipal.companyId!, {
        name: 'Unauthorized direct rename',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
