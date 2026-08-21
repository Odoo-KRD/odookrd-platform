import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import {
  AccountScope,
  CompanyServiceStatus,
  CompanyStatus,
  ServiceCatalogStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { AuthorizationService } from '../authorization/authorization.service';
import type {
  CreateServiceAssignmentDto,
  ListServiceAssignmentsQueryDto,
  UpdateServiceAssignmentDto,
} from './dto/service-assignment.dto';
import type {
  CreateServiceDto,
  ListServicesQueryDto,
  UpdateServiceDto,
} from './dto/service.dto';

const serviceSelect = {
  id: true,
  key: true,
  name: true,
  category: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { assignments: true } },
} satisfies Prisma.ServiceSelect;

const assignmentSelect = {
  id: true,
  companyId: true,
  serviceId: true,
  displayName: true,
  status: true,
  serviceUrl: true,
  startsAt: true,
  expiresAt: true,
  notes: true,
  internalNotes: true,
  createdAt: true,
  updatedAt: true,
  company: { select: { id: true, name: true, status: true } },
  service: {
    select: { id: true, key: true, name: true, category: true, status: true },
  },
} satisfies Prisma.CompanyServiceSelect;

type ServiceRecord = Prisma.ServiceGetPayload<{
  select: typeof serviceSelect;
}>;

type AssignmentRecord = Prisma.CompanyServiceGetPayload<{
  select: typeof assignmentSelect;
}>;

type VisibleAssignment = Omit<AssignmentRecord, 'internalNotes'> & {
  internalNotes?: string | null;
};

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: AuthorizationService,
  ) {}

  async listServices(
    principal: AuthenticatedPrincipal,
    query: ListServicesQueryDto,
  ) {
    this.assertPlatformAdministrator(principal);

    const search = query.search?.trim();
    const where: Prisma.ServiceWhereInput = {
      ...(query.category ? { category: query.category } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { key: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        select: serviceSelect,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      items: records.map((record) => this.presentService(record)),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async getService(principal: AuthenticatedPrincipal, serviceId: string) {
    this.assertPlatformAdministrator(principal);

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: serviceSelect,
    });

    if (!service) {
      throw new NotFoundException('Service was not found.');
    }

    return this.presentService(service);
  }

  async createService(
    principal: AuthenticatedPrincipal,
    input: CreateServiceDto,
  ) {
    this.assertPlatformAdministrator(principal);

    const existing = await this.prisma.service.findUnique({
      where: { key: input.key },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('A service with this key already exists.');
    }

    const name = input.name.trim();

    if (!name) {
      throw new BadRequestException('Service name cannot be blank.');
    }

    const service = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.service.create({
        data: {
          key: input.key,
          name,
          category: input.category,
          description: this.optionalText(input.description),
          status: input.status ?? ServiceCatalogStatus.ACTIVE,
        },
        select: serviceSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: 'service.created',
          targetType: 'service',
          targetId: created.id,
          metadata: { key: created.key, category: created.category },
        },
      });

      return created;
    });

    return this.presentService(service);
  }

  async updateService(
    principal: AuthenticatedPrincipal,
    serviceId: string,
    input: UpdateServiceDto,
  ) {
    this.assertPlatformAdministrator(principal);

    const existing = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, key: true },
    });

    if (!existing) {
      throw new NotFoundException('Service was not found.');
    }

    const name = input.name?.trim();

    if (input.name !== undefined && !name) {
      throw new BadRequestException('Service name cannot be blank.');
    }

    const service = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.service.update({
        where: { id: serviceId },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.description !== undefined
            ? { description: this.optionalText(input.description) }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
        select: serviceSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: 'service.updated',
          targetType: 'service',
          targetId: updated.id,
          metadata: { key: existing.key, status: updated.status },
        },
      });

      return updated;
    });

    return this.presentService(service);
  }

  async listAssignments(
    principal: AuthenticatedPrincipal,
    query: ListServiceAssignmentsQueryDto,
  ) {
    const companyId = this.resolveCompanyScope(principal, query.companyId);
    const where: Prisma.CompanyServiceWhereInput = {
      ...(companyId ? { companyId } : {}),
      ...(query.serviceId ? { serviceId: query.serviceId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.companyService.findMany({
        where,
        select: assignmentSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.companyService.count({ where }),
    ]);

    return {
      items: records.map((record) => this.presentAssignment(record, principal)),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async getAssignment(
    principal: AuthenticatedPrincipal,
    assignmentId: string,
  ): Promise<VisibleAssignment> {
    const assignment = await this.prisma.companyService.findUnique({
      where: { id: assignmentId },
      select: assignmentSelect,
    });

    if (!assignment) {
      throw new NotFoundException('Assigned service was not found.');
    }

    this.authorization.assertCompanyAccess(principal, assignment.companyId);

    return this.presentAssignment(assignment, principal);
  }

  async createAssignment(
    principal: AuthenticatedPrincipal,
    input: CreateServiceAssignmentDto,
  ): Promise<VisibleAssignment> {
    this.assertPlatformAdministrator(principal);

    const [company, service] = await Promise.all([
      this.prisma.company.findUnique({
        where: { id: input.companyId },
        select: { id: true, status: true },
      }),
      this.prisma.service.findUnique({
        where: { id: input.serviceId },
        select: { id: true, status: true },
      }),
    ]);

    if (!company) {
      throw new NotFoundException('Company was not found.');
    }

    if (company.status !== CompanyStatus.ACTIVE) {
      throw new ConflictException(
        'Services can only be assigned to active companies.',
      );
    }

    if (!service) {
      throw new NotFoundException('Service was not found.');
    }

    if (service.status !== ServiceCatalogStatus.ACTIVE) {
      throw new ConflictException(
        'Only active catalog services can be assigned.',
      );
    }

    const startsAt = this.optionalDate(input.startsAt);
    const expiresAt = this.optionalDate(input.expiresAt);
    this.assertValidDates(startsAt, expiresAt);

    const assignment = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.companyService.create({
        data: {
          companyId: input.companyId,
          serviceId: input.serviceId,
          displayName: this.optionalText(input.displayName),
          status: input.status ?? CompanyServiceStatus.PROVISIONING,
          serviceUrl: this.optionalText(input.serviceUrl),
          startsAt,
          expiresAt,
          notes: this.optionalText(input.notes),
          internalNotes: this.optionalText(input.internalNotes),
        },
        select: assignmentSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: created.companyId,
          action: 'service.assignment.created',
          targetType: 'company_service',
          targetId: created.id,
          metadata: { serviceId: created.serviceId, status: created.status },
        },
      });

      return created;
    });

    return this.presentAssignment(assignment, principal);
  }

  async updateAssignment(
    principal: AuthenticatedPrincipal,
    assignmentId: string,
    input: UpdateServiceAssignmentDto,
  ): Promise<VisibleAssignment> {
    this.assertPlatformAdministrator(principal);

    const previous = await this.prisma.companyService.findUnique({
      where: { id: assignmentId },
      select: { id: true, companyId: true, startsAt: true, expiresAt: true },
    });

    if (!previous) {
      throw new NotFoundException('Assigned service was not found.');
    }

    const startsAt =
      input.startsAt === undefined
        ? previous.startsAt
        : this.optionalDate(input.startsAt);
    const expiresAt =
      input.expiresAt === undefined
        ? previous.expiresAt
        : this.optionalDate(input.expiresAt);

    this.assertValidDates(startsAt, expiresAt);

    const assignment = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.companyService.update({
        where: { id: assignmentId },
        data: {
          ...(input.displayName !== undefined
            ? { displayName: this.optionalText(input.displayName) }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.serviceUrl !== undefined
            ? { serviceUrl: this.optionalText(input.serviceUrl) }
            : {}),
          ...(input.startsAt !== undefined ? { startsAt } : {}),
          ...(input.expiresAt !== undefined ? { expiresAt } : {}),
          ...(input.notes !== undefined
            ? { notes: this.optionalText(input.notes) }
            : {}),
          ...(input.internalNotes !== undefined
            ? { internalNotes: this.optionalText(input.internalNotes) }
            : {}),
        },
        select: assignmentSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: previous.companyId,
          action: 'service.assignment.updated',
          targetType: 'company_service',
          targetId: updated.id,
          metadata: { serviceId: updated.serviceId, status: updated.status },
        },
      });

      return updated;
    });

    return this.presentAssignment(assignment, principal);
  }

  private assertPlatformAdministrator(principal: AuthenticatedPrincipal): void {
    if (
      principal.accountScope !== AccountScope.PLATFORM ||
      principal.companyId !== null
    ) {
      throw new ForbiddenException(
        'Platform service administration is forbidden.',
      );
    }
  }

  private resolveCompanyScope(
    principal: AuthenticatedPrincipal,
    requestedCompanyId?: string,
  ): string | undefined {
    if (principal.accountScope === AccountScope.PLATFORM) {
      if (principal.companyId !== null) {
        throw new ForbiddenException('Authorization context is invalid.');
      }

      return requestedCompanyId;
    }

    if (!principal.companyId) {
      throw new ForbiddenException('Authorization context is invalid.');
    }

    if (requestedCompanyId) {
      this.authorization.assertCompanyAccess(principal, requestedCompanyId);
    }

    return principal.companyId;
  }

  private presentService(record: ServiceRecord) {
    const { _count, ...service } = record;
    return { ...service, assignmentCount: _count.assignments };
  }

  private presentAssignment(
    record: AssignmentRecord,
    principal: AuthenticatedPrincipal,
  ): VisibleAssignment {
    const { internalNotes, ...visible } = record;

    if (principal.accountScope === AccountScope.PLATFORM) {
      return { ...visible, internalNotes };
    }

    return visible;
  }

  private optionalText(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private optionalDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('A service date is invalid.');
    }

    return date;
  }

  private assertValidDates(
    startsAt: Date | null,
    expiresAt: Date | null,
  ): void {
    if (startsAt && expiresAt && startsAt.getTime() > expiresAt.getTime()) {
      throw new BadRequestException(
        'The service expiration date cannot be earlier than its start date.',
      );
    }
  }
}
