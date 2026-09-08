import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import type { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { normalizeLocalizedText } from '../../i18n/localized-content';
import {
  AccountScope,
  CompanyServiceFeatureSource,
  CompanyServiceLifecycleSource,
  CompanyServiceStatus,
  CompanyStatus,
  ServiceCatalogStatus,
  ServiceFeatureStatus,
  ServiceFeatureValueType,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { AuthorizationService } from '../authorization/authorization.service';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import type {
  CreateServiceAssignmentDto,
  ListServiceAssignmentsQueryDto,
  UpdateServiceAssignmentDto,
} from './dto/service-assignment.dto';
import type { UpdateCompanyServiceFeatureDto } from './dto/service-feature.dto';
import {
  type AssignmentFeatureRecord,
  assignmentFeatureSelect,
  assignmentSelect,
  type VisibleAssignment,
} from './services.selectors';
import {
  assertAllowedTransition,
  assertPlatformAdministrator,
  assertValidDates,
  assertValidFeatureValue,
  jsonInputObject,
  optionalDate,
  optionalText,
  requireFeaturePrimitive,
} from './services.rules';
import {
  presentAssignment,
  presentAssignmentFeature,
} from './services.presenters';
import { recordLifecycleTransition } from './services.lifecycle-events';

@Injectable()
export class ServiceAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorization: AuthorizationService,
  ) {}

  async listAssignments(
    principal: AuthenticatedPrincipal,
    query: ListServiceAssignmentsQueryDto,
  ) {
    const companyId = this.resolveCompanyScope(principal, query.companyId);
    const search = query.search?.trim();
    const where: Prisma.CompanyServiceWhereInput = {
      ...(companyId ? { companyId } : {}),
      ...(query.serviceId ? { serviceId: query.serviceId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.startsFrom || query.startsTo
        ? {
            startsAt: {
              ...(query.startsFrom ? { gte: new Date(query.startsFrom) } : {}),
              ...(query.startsTo ? { lte: new Date(query.startsTo) } : {}),
            },
          }
        : {}),
      ...(query.expiresFrom || query.expiresTo
        ? {
            expiresAt: {
              ...(query.expiresFrom
                ? { gte: new Date(query.expiresFrom) }
                : {}),
              ...(query.expiresTo ? { lte: new Date(query.expiresTo) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { displayName: { contains: search, mode: 'insensitive' } },
              { company: { name: { contains: search, mode: 'insensitive' } } },
              { service: { name: { contains: search, mode: 'insensitive' } } },
              { service: { key: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
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

    const featureRecords =
      principal.accountScope === AccountScope.COMPANY && records.length > 0
        ? await this.prisma.companyServiceFeature.findMany({
            where: {
              companyServiceId: { in: records.map((record) => record.id) },
              serviceFeature: {
                status: ServiceFeatureStatus.ACTIVE,
              },
            },
            select: assignmentFeatureSelect,
          })
        : [];

    const featuresByAssignment = new Map<string, AssignmentFeatureRecord[]>();

    for (const feature of featureRecords) {
      const customerVisible =
        feature.customerVisibleOverride ??
        feature.serviceFeature.customerVisible;

      if (!customerVisible) {
        continue;
      }

      const current = featuresByAssignment.get(feature.companyServiceId) ?? [];
      current.push(feature);
      featuresByAssignment.set(feature.companyServiceId, current);
    }

    for (const features of featuresByAssignment.values()) {
      features.sort((left, right) => {
        const leftOrder =
          left.sortOrderOverride ?? left.serviceFeature.sortOrder;
        const rightOrder =
          right.sortOrderOverride ?? right.serviceFeature.sortOrder;

        return leftOrder - rightOrder || left.id.localeCompare(right.id);
      });
    }

    return {
      items: records.map((record) => {
        const assignment = presentAssignment(record, principal);

        if (principal.accountScope !== AccountScope.COMPANY) {
          return assignment;
        }

        const visibleFeatures = (featuresByAssignment.get(record.id) ?? []).map(
          (feature) => presentAssignmentFeature(feature, principal),
        );

        return {
          ...assignment,
          featurePreview: visibleFeatures.slice(0, 5),
          visibleFeatureCount: visibleFeatures.length,
        };
      }),
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

    return presentAssignment(assignment, principal);
  }

  async createAssignment(
    principal: AuthenticatedPrincipal,
    input: CreateServiceAssignmentDto,
  ): Promise<VisibleAssignment> {
    assertPlatformAdministrator(principal);

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

    const startsAt = optionalDate(input.startsAt);
    const expiresAt = optionalDate(input.expiresAt);
    assertValidDates(startsAt, expiresAt);

    const assignment = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.companyService.create({
        data: {
          companyId: input.companyId,
          serviceId: input.serviceId,
          displayName: optionalText(input.displayName),
          displayNameTranslations: normalizeLocalizedText(
            input.displayNameTranslations,
            input.displayName,
          ),
          status: input.status ?? CompanyServiceStatus.PROVISIONING,
          serviceUrl: optionalText(input.serviceUrl),
          startsAt,
          expiresAt,
          notes: optionalText(input.notes),
          internalNotes: optionalText(input.internalNotes),
        },
        select: assignmentSelect,
      });

      const activeFeatures = await transaction.serviceFeature.findMany({
        where: {
          serviceId: created.serviceId,
          status: ServiceFeatureStatus.ACTIVE,
        },
        select: {
          id: true,
          defaultValue: true,
          valueTranslations: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      });

      if (activeFeatures.length > 0) {
        await transaction.companyServiceFeature.createMany({
          data: activeFeatures.map((feature) => ({
            companyServiceId: created.id,
            serviceFeatureId: feature.id,
            value: requireFeaturePrimitive(feature.defaultValue),
            valueTranslations: jsonInputObject(feature.valueTranslations),
            source: CompanyServiceFeatureSource.CATALOG_DEFAULT,
          })),
        });
      }

      await transaction.companyServiceLifecycleEvent.create({
        data: {
          companyServiceId: created.id,
          companyId: created.companyId,
          fromStatus: null,
          toStatus: created.status,
          source: CompanyServiceLifecycleSource.ADMIN,
          actorUserId: principal.userId,
          actorEmailSnapshot: principal.email,
          effectiveAt: created.createdAt,
        },
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

    return presentAssignment(assignment, principal);
  }

  async updateAssignment(
    principal: AuthenticatedPrincipal,
    assignmentId: string,
    input: UpdateServiceAssignmentDto,
  ): Promise<VisibleAssignment> {
    assertPlatformAdministrator(principal);

    const previous = await this.prisma.companyService.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        companyId: true,
        status: true,
        startsAt: true,
        expiresAt: true,
      },
    });

    if (!previous) {
      throw new NotFoundException('Assigned service was not found.');
    }

    const startsAt =
      input.startsAt === undefined
        ? previous.startsAt
        : optionalDate(input.startsAt);
    const expiresAt =
      input.expiresAt === undefined
        ? previous.expiresAt
        : optionalDate(input.expiresAt);

    assertValidDates(startsAt, expiresAt);

    if (input.status !== undefined && input.status !== previous.status) {
      assertAllowedTransition(previous.status, input.status, input.reason);
    }

    const assignment = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.companyService.update({
        where: { id: assignmentId },
        data: {
          ...(input.displayName !== undefined
            ? { displayName: optionalText(input.displayName) }
            : {}),
          ...(input.displayNameTranslations !== undefined
            ? {
                displayNameTranslations: normalizeLocalizedText(
                  input.displayNameTranslations,
                  input.displayName,
                ),
              }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.serviceUrl !== undefined
            ? { serviceUrl: optionalText(input.serviceUrl) }
            : {}),
          ...(input.startsAt !== undefined ? { startsAt } : {}),
          ...(input.expiresAt !== undefined ? { expiresAt } : {}),
          ...(input.notes !== undefined
            ? { notes: optionalText(input.notes) }
            : {}),
          ...(input.internalNotes !== undefined
            ? { internalNotes: optionalText(input.internalNotes) }
            : {}),
        },
        select: assignmentSelect,
      });

      if (input.status !== undefined && input.status !== previous.status) {
        await recordLifecycleTransition(transaction, principal, {
          assignmentId: updated.id,
          companyId: updated.companyId,
          fromStatus: previous.status,
          toStatus: updated.status,
          reason: input.reason,
          effectiveAt: new Date(),
        });
      }

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

    return presentAssignment(assignment, principal);
  }

  async listAssignmentFeatures(
    principal: AuthenticatedPrincipal,
    assignmentId: string,
    query: PaginationQueryDto,
  ) {
    await this.getAssignment(principal, assignmentId);

    const where: Prisma.CompanyServiceFeatureWhereInput = {
      companyServiceId: assignmentId,
      ...(principal.accountScope === AccountScope.COMPANY
        ? {
            OR: [
              { customerVisibleOverride: true },
              {
                customerVisibleOverride: null,
                serviceFeature: { customerVisible: true },
              },
            ],
          }
        : {}),
    };

    const [features, total] = await this.prisma.$transaction([
      this.prisma.companyServiceFeature.findMany({
        where,
        select: assignmentFeatureSelect,
        orderBy: [
          { sortOrderOverride: 'asc' },
          { serviceFeature: { sortOrder: 'asc' } },
          { id: 'asc' },
        ],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.companyServiceFeature.count({ where }),
    ]);

    return {
      items: features.map((feature) =>
        presentAssignmentFeature(feature, principal),
      ),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async updateAssignmentFeature(
    principal: AuthenticatedPrincipal,
    assignmentId: string,
    featureId: string,
    input: UpdateCompanyServiceFeatureDto,
  ) {
    assertPlatformAdministrator(principal);

    return this.prisma.$transaction(async (transaction) => {
      const assignment = await transaction.companyService.findUnique({
        where: { id: assignmentId },
        select: { id: true, companyId: true, serviceId: true },
      });

      if (!assignment) {
        throw new NotFoundException('Assigned service was not found.');
      }

      const existing = await transaction.companyServiceFeature.findFirst({
        where: { id: featureId, companyServiceId: assignment.id },
        select: assignmentFeatureSelect,
      });

      if (!existing) {
        throw new NotFoundException('Assigned service feature was not found.');
      }

      if (existing.serviceFeature.serviceId !== assignment.serviceId) {
        throw new ConflictException(
          'The selected feature does not belong to the assigned catalog service.',
        );
      }

      if (input.reset && input.value !== undefined) {
        throw new BadRequestException(
          'A feature reset cannot also provide an override value.',
        );
      }

      const value = input.reset
        ? requireFeaturePrimitive(existing.serviceFeature.defaultValue)
        : (input.value ?? requireFeaturePrimitive(existing.value));
      const translations = input.reset
        ? existing.serviceFeature.valueTranslations
        : (input.valueTranslations ?? existing.valueTranslations);

      assertValidFeatureValue(
        existing.serviceFeature.valueType,
        value,
        existing.serviceFeature.unit,
        translations,
      );

      const updated = await transaction.companyServiceFeature.update({
        where: { id: existing.id },
        data: {
          ...(input.reset || input.value !== undefined ? { value } : {}),
          ...(input.reset
            ? {
                valueTranslations: jsonInputObject(
                  existing.serviceFeature.valueTranslations,
                ),
                source: CompanyServiceFeatureSource.CATALOG_DEFAULT,
              }
            : input.value !== undefined || input.valueTranslations !== undefined
              ? {
                  source: CompanyServiceFeatureSource.ADMIN_OVERRIDE,
                  ...(input.valueTranslations === undefined
                    ? {}
                    : {
                        valueTranslations:
                          existing.serviceFeature.valueType ===
                          ServiceFeatureValueType.TEXT
                            ? normalizeLocalizedText(
                                input.valueTranslations,
                                typeof value === 'string' ? value : undefined,
                              )
                            : {},
                      }),
                }
              : {}),
          ...(input.customerVisibleOverride === undefined
            ? {}
            : { customerVisibleOverride: input.customerVisibleOverride }),
          ...(input.sortOrderOverride === undefined
            ? {}
            : { sortOrderOverride: input.sortOrderOverride }),
        },
        select: assignmentFeatureSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId: assignment.companyId,
          action: AUDIT_ACTIONS.SERVICE_ASSIGNMENT_FEATURE_UPDATED,
          targetType: 'company_service_feature',
          targetId: updated.id,
          metadata: {
            companyServiceId: assignment.id,
            serviceFeatureId: updated.serviceFeatureId,
            source: updated.source,
          },
        },
      });

      return presentAssignmentFeature(updated, principal);
    });
  }

  async syncAssignmentFeatures(
    principal: AuthenticatedPrincipal,
    assignmentId: string,
  ) {
    assertPlatformAdministrator(principal);

    return this.prisma.$transaction(async (transaction) => {
      const assignment = await transaction.companyService.findUnique({
        where: { id: assignmentId },
        select: { id: true, companyId: true, serviceId: true },
      });

      if (!assignment) {
        throw new NotFoundException('Assigned service was not found.');
      }

      const [catalog, current] = await Promise.all([
        transaction.serviceFeature.findMany({
          where: {
            serviceId: assignment.serviceId,
            status: ServiceFeatureStatus.ACTIVE,
          },
          select: { id: true, defaultValue: true, valueTranslations: true },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        }),
        transaction.companyServiceFeature.findMany({
          where: { companyServiceId: assignment.id },
          select: { serviceFeatureId: true },
        }),
      ]);

      const existing = new Set(
        current.map((feature) => feature.serviceFeatureId),
      );
      const missing = catalog.filter((feature) => !existing.has(feature.id));

      if (missing.length > 0) {
        await transaction.companyServiceFeature.createMany({
          data: missing.map((feature) => ({
            companyServiceId: assignment.id,
            serviceFeatureId: feature.id,
            value: requireFeaturePrimitive(feature.defaultValue),
            valueTranslations: jsonInputObject(feature.valueTranslations),
            source: CompanyServiceFeatureSource.CATALOG_DEFAULT,
          })),
        });

        await transaction.auditLog.create({
          data: {
            actorUserId: principal.userId,
            companyId: assignment.companyId,
            action: AUDIT_ACTIONS.SERVICE_ASSIGNMENT_FEATURES_SYNCED,
            targetType: 'company_service',
            targetId: assignment.id,
            metadata: { added: missing.length },
          },
        });
      }

      return { added: missing.length, unchanged: current.length };
    });
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
}
