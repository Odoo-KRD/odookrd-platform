import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { AccountScope } from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import { AuditService } from '../audit/audit.service';
import type { CreateCompanyDto } from './dto/create-company.dto';
import type { ListCompaniesQueryDto } from './dto/list-companies-query.dto';
import type { UpdateCompanyStatusDto } from './dto/update-company-status.dto';
import type { UpdateCompanyDto } from './dto/update-company.dto';
import type { CompanyResponse } from './interfaces/company-response.interface';
import { normalizeLocalizedText } from '../../i18n/localized-content';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(
    principal: AuthenticatedPrincipal,
    query: ListCompaniesQueryDto,
  ): Promise<PaginatedResult<CompanyResponse>> {
    const where =
      principal.accountScope === AccountScope.COMPANY
        ? {
            id: this.requireCompanyId(principal),
            ...(query.status
              ? {
                  status: query.status,
                }
              : {}),
          }
        : query.status
          ? {
              status: query.status,
            }
          : {};

    const [total, companies] = await this.prisma.$transaction([
      this.prisma.company.count({
        where,
      }),
      this.prisma.company.findMany({
        where,
        orderBy: {
          name: 'asc',
        },
        skip: query.offset,
        take: query.limit,
        select: {
          id: true,
          name: true,
          nameTranslations: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      items: companies,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        total,
      },
    };
  }

  async getById(
    principal: AuthenticatedPrincipal,
    companyId: string,
  ): Promise<CompanyResponse> {
    if (
      principal.accountScope === AccountScope.COMPANY &&
      principal.companyId !== companyId
    ) {
      throw this.notFound();
    }

    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
      select: {
        id: true,
        name: true,
        nameTranslations: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      throw this.notFound();
    }

    return company;
  }

  async create(
    principal: AuthenticatedPrincipal,
    dto: CreateCompanyDto,
  ): Promise<CompanyResponse> {
    this.assertPlatformScope(principal);

    const name = this.normalizeName(dto.name);

    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          ...(dto.nameTranslations === undefined
            ? {}
            : {
                nameTranslations: normalizeLocalizedText(
                  dto.nameTranslations,
                  dto.name,
                ),
              }),
          name,
        },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await this.auditService.write(
        {
          actorUserId: principal.userId,
          companyId: company.id,
          action: AUDIT_ACTIONS.COMPANY_CREATED,
          targetType: 'company',
          targetId: company.id,
          metadata: {
            name: company.name,
          },
        },
        tx,
      );

      return company;
    });
  }

  async update(
    principal: AuthenticatedPrincipal,
    companyId: string,
    dto: UpdateCompanyDto,
  ): Promise<CompanyResponse> {
    if (
      principal.accountScope === AccountScope.COMPANY &&
      principal.companyId !== companyId
    ) {
      throw this.notFound();
    }

    if (dto.name === undefined) {
      throw new BadRequestException(
        'At least one company field must be provided.',
      );
    }

    const name = this.normalizeName(dto.name);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.company.findUnique({
        where: {
          id: companyId,
        },
        select: {
          id: true,
        },
      });

      if (!existing) {
        throw this.notFound();
      }

      const company = await tx.company.update({
        where: {
          id: companyId,
        },
        data: {
          ...(dto.nameTranslations === undefined
            ? {}
            : {
                nameTranslations: normalizeLocalizedText(
                  dto.nameTranslations,
                  dto.name,
                ),
              }),
          name,
        },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await this.auditService.write(
        {
          actorUserId: principal.userId,
          companyId: company.id,
          action: AUDIT_ACTIONS.COMPANY_UPDATED,
          targetType: 'company',
          targetId: company.id,
          metadata: {
            changedFields: ['name'],
          },
        },
        tx,
      );

      return company;
    });
  }

  async updateStatus(
    principal: AuthenticatedPrincipal,
    companyId: string,
    dto: UpdateCompanyStatusDto,
  ): Promise<CompanyResponse> {
    this.assertPlatformScope(principal);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.company.findUnique({
        where: {
          id: companyId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!existing) {
        throw this.notFound();
      }

      if (existing.status === dto.status) {
        return tx.company.findUniqueOrThrow({
          where: {
            id: companyId,
          },
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });
      }

      const company = await tx.company.update({
        where: {
          id: companyId,
        },
        data: {
          status: dto.status,
        },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await this.auditService.write(
        {
          actorUserId: principal.userId,
          companyId: company.id,
          action: AUDIT_ACTIONS.COMPANY_STATUS_CHANGED,
          targetType: 'company',
          targetId: company.id,
          metadata: {
            previousStatus: existing.status,
            status: company.status,
          },
        },
        tx,
      );

      return company;
    });
  }

  private assertPlatformScope(principal: AuthenticatedPrincipal): void {
    if (
      principal.accountScope !== AccountScope.PLATFORM ||
      principal.companyId !== null
    ) {
      throw new ForbiddenException(
        'Platform scope is required for this operation.',
      );
    }
  }

  private normalizeName(name: string): string {
    const normalized = name.trim();

    if (!normalized) {
      throw new BadRequestException('Company name must not be empty.');
    }

    return normalized;
  }

  private notFound(): NotFoundException {
    return new NotFoundException('Company not found.');
  }

  private requireCompanyId(principal: AuthenticatedPrincipal): string {
    if (
      principal.accountScope !== AccountScope.COMPANY ||
      !principal.companyId
    ) {
      throw new ForbiddenException('Valid company scope is required.');
    }

    return principal.companyId;
  }
}
