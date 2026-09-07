import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import {
  batchMutationResult,
  type BatchMutationItem,
  type BatchMutationResult,
} from '../../common/batch/batch-mutation.dto';
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
  BatchAssignmentTransitionDto,
  BatchServiceStatusDto,
} from './dto/service-batch.dto';
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
import type {
  CreateServiceFeatureDto,
  ListServiceFeaturesQueryDto,
  ReorderServiceFeaturesDto,
  ServiceFeaturePrimitive,
  UpdateCompanyServiceFeatureDto,
  UpdateServiceFeatureDto,
} from './dto/service-feature.dto';
import type {
  AttachServiceFeatureDefinitionDto,
  CreateServiceFeatureDefinitionDto,
  ListServiceFeatureDefinitionsDto,
  UpdateServiceFeatureDefinitionDto,
} from './dto/service-feature-definition.dto';
import type { CreateServiceTransitionDto } from './dto/service-lifecycle.dto';

const serviceSelect = {
  id: true,
  key: true,
  name: true,
  nameTranslations: true,
  category: true,
  description: true,
  descriptionTranslations: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { assignments: true, features: true } },
} satisfies Prisma.ServiceSelect;

const featureDefinitionSelect = {
  id: true,
  key: true,
  name: true,
  nameTranslations: true,
  description: true,
  descriptionTranslations: true,
  category: true,
  valueType: true,
  parameterLabel: true,
  parameterLabelTranslations: true,
  defaultValue: true,
  valueTranslations: true,
  unit: true,
  status: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { serviceFeatures: true } },
} satisfies Prisma.ServiceFeatureDefinitionSelect;

const serviceFeatureSelect = {
  id: true,
  serviceId: true,
  definitionId: true,
  key: true,
  name: true,
  nameTranslations: true,
  description: true,
  descriptionTranslations: true,
  valueType: true,
  parameterLabel: true,
  parameterLabelTranslations: true,
  defaultValue: true,
  valueTranslations: true,
  unit: true,
  status: true,
  customerVisible: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ServiceFeatureSelect;

const assignmentFeatureSelect = {
  id: true,
  companyServiceId: true,
  serviceFeatureId: true,
  value: true,
  valueTranslations: true,
  source: true,
  customerVisibleOverride: true,
  sortOrderOverride: true,
  createdAt: true,
  updatedAt: true,
  serviceFeature: {
    select: {
      id: true,
      serviceId: true,
      key: true,
      name: true,
      nameTranslations: true,
      description: true,
      descriptionTranslations: true,
      valueType: true,
      parameterLabel: true,
      parameterLabelTranslations: true,
      defaultValue: true,
      valueTranslations: true,
      unit: true,
      status: true,
      customerVisible: true,
      sortOrder: true,
    },
  },
} satisfies Prisma.CompanyServiceFeatureSelect;

const lifecycleSelect = {
  id: true,
  companyServiceId: true,
  companyId: true,
  fromStatus: true,
  toStatus: true,
  source: true,
  reasonCode: true,
  reason: true,
  actorUserId: true,
  actorEmailSnapshot: true,
  effectiveAt: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.CompanyServiceLifecycleEventSelect;

const allowedLifecycleTransitions: Record<
  CompanyServiceStatus,
  readonly CompanyServiceStatus[]
> = {
  [CompanyServiceStatus.PROVISIONING]: [
    CompanyServiceStatus.ACTIVE,
    CompanyServiceStatus.SUSPENDED,
    CompanyServiceStatus.CANCELLED,
  ],
  [CompanyServiceStatus.ACTIVE]: [
    CompanyServiceStatus.SUSPENDED,
    CompanyServiceStatus.EXPIRED,
    CompanyServiceStatus.CANCELLED,
  ],
  [CompanyServiceStatus.SUSPENDED]: [
    CompanyServiceStatus.ACTIVE,
    CompanyServiceStatus.EXPIRED,
    CompanyServiceStatus.CANCELLED,
  ],
  [CompanyServiceStatus.EXPIRED]: [
    CompanyServiceStatus.ACTIVE,
    CompanyServiceStatus.CANCELLED,
  ],
  [CompanyServiceStatus.CANCELLED]: [],
};

const prohibitedMonetaryUnit =
  /(?:[$€£]|\b(?:USD|IQD|EUR|GBP|AED|SAR|DOLLARS?|DINARS?|EUROS?)\b)/i;
const storageUnits = new Set(['MB', 'GB', 'TB']);

const assignmentSelect = {
  id: true,
  companyId: true,
  serviceId: true,
  displayName: true,
  displayNameTranslations: true,
  status: true,
  serviceUrl: true,
  startsAt: true,
  expiresAt: true,
  notes: true,
  internalNotes: true,
  createdAt: true,
  updatedAt: true,
  company: {
    select: { id: true, name: true, nameTranslations: true, status: true },
  },
  service: {
    select: {
      id: true,
      key: true,
      name: true,
      nameTranslations: true,
      description: true,
      descriptionTranslations: true,
      category: true,
      status: true,
    },
  },
} satisfies Prisma.CompanyServiceSelect;

type ServiceRecord = Prisma.ServiceGetPayload<{
  select: typeof serviceSelect;
}>;

type FeatureDefinitionRecord = Prisma.ServiceFeatureDefinitionGetPayload<{
  select: typeof featureDefinitionSelect;
}>;

type AssignmentRecord = Prisma.CompanyServiceGetPayload<{
  select: typeof assignmentSelect;
}>;

type AssignmentFeatureRecord = Prisma.CompanyServiceFeatureGetPayload<{
  select: typeof assignmentFeatureSelect;
}>;

type LifecycleRecord = Prisma.CompanyServiceLifecycleEventGetPayload<{
  select: typeof lifecycleSelect;
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
          nameTranslations: normalizeLocalizedText(
            input.nameTranslations,
            name,
          ),
          category: input.category,
          description: this.optionalText(input.description),
          descriptionTranslations: normalizeLocalizedText(
            input.descriptionTranslations,
            input.description,
          ),
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
      select: { id: true, key: true, category: true },
    });

    if (!existing) {
      throw new NotFoundException('Service was not found.');
    }

    const name = input.name?.trim();

    if (input.name !== undefined && !name) {
      throw new BadRequestException('Service name cannot be blank.');
    }

    const service = await this.prisma.$transaction(async (transaction) => {
      if (input.category && input.category !== existing.category) {
        const incompatibleFeature = await transaction.serviceFeature.findFirst({
          where: {
            serviceId,
            definitionId: { not: null },
            definition: { category: { not: input.category } },
          },
          select: { id: true },
        });

        if (incompatibleFeature) {
          throw new ConflictException(
            'Remove incompatible predefined features before changing the service category.',
          );
        }
      }

      const updated = await transaction.service.update({
        where: { id: serviceId },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(input.nameTranslations !== undefined
            ? {
                nameTranslations: normalizeLocalizedText(
                  input.nameTranslations,
                  name,
                ),
              }
            : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.description !== undefined
            ? { description: this.optionalText(input.description) }
            : {}),
          ...(input.descriptionTranslations !== undefined
            ? {
                descriptionTranslations: normalizeLocalizedText(
                  input.descriptionTranslations,
                  input.description,
                ),
              }
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

  async updateServiceStatuses(
    principal: AuthenticatedPrincipal,
    input: BatchServiceStatusDto,
  ): Promise<BatchMutationResult> {
    this.assertPlatformAdministrator(principal);

    return this.prisma.$transaction(async (transaction) => {
      const services = await transaction.service.findMany({
        where: { id: { in: input.ids } },
        select: { id: true, status: true, updatedAt: true },
      });

      if (services.length !== input.ids.length) {
        throw new NotFoundException(
          'One or more selected services could not be found.',
        );
      }

      const selected = new Map(
        services.map((service) => [service.id, service]),
      );
      const items: BatchMutationItem[] = [];

      for (const serviceId of input.ids) {
        const service = selected.get(serviceId);

        if (!service) {
          throw new NotFoundException('A selected service could not be found.');
        }

        if (service.status === input.status) {
          items.push({
            id: service.id,
            outcome: 'UNCHANGED',
            updatedAt: service.updatedAt,
          });
          continue;
        }

        const updated = await transaction.service.update({
          where: { id: service.id },
          data: { status: input.status },
          select: { id: true, updatedAt: true },
        });

        await transaction.auditLog.create({
          data: {
            actorUserId: principal.userId,
            action: AUDIT_ACTIONS.SERVICE_BATCH_STATUS_CHANGED,
            targetType: 'service',
            targetId: service.id,
            metadata: {
              previousStatus: service.status,
              status: input.status,
            },
          },
        });

        items.push({
          id: updated.id,
          outcome: 'CHANGED',
          updatedAt: updated.updatedAt,
        });
      }

      return batchMutationResult(items);
    });
  }

  async deleteService(
    principal: AuthenticatedPrincipal,
    serviceId: string,
  ): Promise<{ success: true }> {
    this.assertPlatformAdministrator(principal);

    await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.service.findUnique({
        where: { id: serviceId },
        select: {
          id: true,
          key: true,
          status: true,
          _count: {
            select: {
              assignments: true,
              features: true,
              trainingCourseAccess: true,
            },
          },
        },
      });

      if (!existing) {
        throw new NotFoundException('Service was not found.');
      }

      if (existing.status !== ServiceCatalogStatus.INACTIVE) {
        throw new ConflictException('Archive the service before deleting it.');
      }

      if (
        existing._count.assignments > 0 ||
        existing._count.features > 0 ||
        existing._count.trainingCourseAccess > 0
      ) {
        throw new ConflictException(
          'This service has assignments, features, or training access and cannot be deleted. Keep it archived instead.',
        );
      }

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.SERVICE_DELETED,
          targetType: 'service',
          targetId: existing.id,
          metadata: { key: existing.key },
        },
      });

      await transaction.service.delete({ where: { id: existing.id } });
    });

    return { success: true };
  }

  async listFeatureDefinitions(
    principal: AuthenticatedPrincipal,
    query: ListServiceFeatureDefinitionsDto,
  ) {
    this.assertPlatformAdministrator(principal);

    const search = query.search?.trim();
    const where: Prisma.ServiceFeatureDefinitionWhereInput = {
      ...(query.category ? { category: query.category } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { key: { contains: search, mode: 'insensitive' } },
              { parameterLabel: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [definitions, total] = await this.prisma.$transaction([
      this.prisma.serviceFeatureDefinition.findMany({
        where,
        select: featureDefinitionSelect,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.serviceFeatureDefinition.count({ where }),
    ]);

    return {
      items: definitions.map((definition) =>
        this.presentFeatureDefinition(definition),
      ),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async getFeatureDefinition(
    principal: AuthenticatedPrincipal,
    definitionId: string,
  ) {
    this.assertPlatformAdministrator(principal);

    const definition = await this.prisma.serviceFeatureDefinition.findUnique({
      where: { id: definitionId },
      select: featureDefinitionSelect,
    });

    if (!definition) {
      throw new NotFoundException('Feature definition was not found.');
    }

    return this.presentFeatureDefinition(definition);
  }

  async createFeatureDefinition(
    principal: AuthenticatedPrincipal,
    input: CreateServiceFeatureDefinitionDto,
  ) {
    this.assertPlatformAdministrator(principal);

    const name = input.name.trim();
    const parameterLabel = input.parameterLabel.trim();

    if (!name || !parameterLabel) {
      throw new BadRequestException(
        'Feature name and feature parameter cannot be blank.',
      );
    }

    const unit = this.optionalText(input.unit);
    this.assertValidFeatureValue(
      input.valueType,
      input.defaultValue,
      unit,
      input.valueTranslations,
    );

    const definition = await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.serviceFeatureDefinition.findUnique({
        where: { key: input.key },
        select: { id: true },
      });

      if (existing) {
        throw new ConflictException(
          'A predefined feature with this key already exists.',
        );
      }

      const created = await transaction.serviceFeatureDefinition.create({
        data: {
          key: input.key,
          name,
          nameTranslations: normalizeLocalizedText(
            input.nameTranslations,
            name,
          ),
          description: this.optionalText(input.description),
          descriptionTranslations: normalizeLocalizedText(
            input.descriptionTranslations,
            input.description,
          ),
          category: input.category,
          valueType: input.valueType,
          parameterLabel,
          parameterLabelTranslations: normalizeLocalizedText(
            input.parameterLabelTranslations,
            parameterLabel,
          ),
          defaultValue: input.defaultValue,
          valueTranslations:
            input.valueType === ServiceFeatureValueType.TEXT
              ? normalizeLocalizedText(
                  input.valueTranslations,
                  typeof input.defaultValue === 'string'
                    ? input.defaultValue
                    : undefined,
                )
              : {},
          unit,
          status: input.status ?? ServiceFeatureStatus.ACTIVE,
          sortOrder: input.sortOrder ?? 0,
        },
        select: featureDefinitionSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.SERVICE_FEATURE_DEFINITION_CREATED,
          targetType: 'service_feature_definition',
          targetId: created.id,
          metadata: {
            key: created.key,
            category: created.category,
            valueType: created.valueType,
          },
        },
      });

      return created;
    });

    return this.presentFeatureDefinition(definition);
  }

  async updateFeatureDefinition(
    principal: AuthenticatedPrincipal,
    definitionId: string,
    input: UpdateServiceFeatureDefinitionDto,
  ) {
    this.assertPlatformAdministrator(principal);

    const definition = await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.serviceFeatureDefinition.findUnique({
        where: { id: definitionId },
        select: featureDefinitionSelect,
      });

      if (!existing) {
        throw new NotFoundException('Feature definition was not found.');
      }

      const category = input.category ?? existing.category;
      const valueType = input.valueType ?? existing.valueType;
      const unit =
        input.unit === undefined
          ? existing.unit
          : this.optionalText(input.unit);

      if (
        existing._count.serviceFeatures > 0 &&
        (category !== existing.category ||
          valueType !== existing.valueType ||
          unit !== existing.unit)
      ) {
        throw new ConflictException(
          'Category, value type, and unit cannot change while this feature is attached to a service.',
        );
      }

      const value =
        input.defaultValue ??
        this.requireFeaturePrimitive(existing.defaultValue);
      const translations =
        input.valueTranslations ?? existing.valueTranslations;
      this.assertValidFeatureValue(valueType, value, unit, translations);

      const name = input.name?.trim();
      const parameterLabel = input.parameterLabel?.trim();

      if (
        (input.name !== undefined && !name) ||
        (input.parameterLabel !== undefined && !parameterLabel)
      ) {
        throw new BadRequestException(
          'Feature name and feature parameter cannot be blank.',
        );
      }

      const metadata = {
        ...(name === undefined ? {} : { name }),
        ...(input.nameTranslations === undefined
          ? {}
          : {
              nameTranslations: normalizeLocalizedText(
                input.nameTranslations,
                name ?? existing.name,
              ),
            }),
        ...(input.description === undefined
          ? {}
          : { description: this.optionalText(input.description) }),
        ...(input.descriptionTranslations === undefined
          ? {}
          : {
              descriptionTranslations: normalizeLocalizedText(
                input.descriptionTranslations,
                input.description ?? existing.description,
              ),
            }),
        ...(parameterLabel === undefined ? {} : { parameterLabel }),
        ...(input.parameterLabelTranslations === undefined
          ? {}
          : {
              parameterLabelTranslations: normalizeLocalizedText(
                input.parameterLabelTranslations,
                parameterLabel ?? existing.parameterLabel,
              ),
            }),
      };

      const updated = await transaction.serviceFeatureDefinition.update({
        where: { id: definitionId },
        data: {
          ...metadata,
          ...(input.category === undefined ? {} : { category }),
          ...(input.valueType === undefined ? {} : { valueType }),
          ...(input.defaultValue === undefined ? {} : { defaultValue: value }),
          ...(input.valueTranslations === undefined
            ? {}
            : {
                valueTranslations:
                  valueType === ServiceFeatureValueType.TEXT
                    ? normalizeLocalizedText(
                        input.valueTranslations,
                        typeof value === 'string' ? value : undefined,
                      )
                    : {},
              }),
          ...(input.unit === undefined ? {} : { unit }),
          ...(input.status === undefined ? {} : { status: input.status }),
          ...(input.sortOrder === undefined
            ? {}
            : { sortOrder: input.sortOrder }),
        },
        select: featureDefinitionSelect,
      });

      if (existing._count.serviceFeatures > 0 && Object.keys(metadata).length) {
        await transaction.serviceFeature.updateMany({
          where: { definitionId },
          data: metadata,
        });
      }

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.SERVICE_FEATURE_DEFINITION_UPDATED,
          targetType: 'service_feature_definition',
          targetId: updated.id,
          metadata: {
            key: updated.key,
            category: updated.category,
            status: updated.status,
          },
        },
      });

      return updated;
    });

    return this.presentFeatureDefinition(definition);
  }

  async deleteFeatureDefinition(
    principal: AuthenticatedPrincipal,
    definitionId: string,
  ): Promise<{ success: true }> {
    this.assertPlatformAdministrator(principal);

    await this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.serviceFeatureDefinition.findUnique({
        where: { id: definitionId },
        select: featureDefinitionSelect,
      });

      if (!existing) {
        throw new NotFoundException('Feature definition was not found.');
      }

      if (existing.status !== ServiceFeatureStatus.INACTIVE) {
        throw new ConflictException(
          'Archive the predefined feature before deleting it.',
        );
      }

      if (existing._count.serviceFeatures > 0) {
        throw new ConflictException(
          'This predefined feature is attached to services and cannot be deleted. Keep it archived instead.',
        );
      }

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.SERVICE_FEATURE_DEFINITION_DELETED,
          targetType: 'service_feature_definition',
          targetId: existing.id,
          metadata: { key: existing.key },
        },
      });

      await transaction.serviceFeatureDefinition.delete({
        where: { id: existing.id },
      });
    });

    return { success: true };
  }

  async attachFeatureDefinition(
    principal: AuthenticatedPrincipal,
    serviceId: string,
    input: AttachServiceFeatureDefinitionDto,
  ) {
    this.assertPlatformAdministrator(principal);

    return this.prisma.$transaction(async (transaction) => {
      const [service, definition] = await Promise.all([
        transaction.service.findUnique({
          where: { id: serviceId },
          select: { id: true, category: true },
        }),
        transaction.serviceFeatureDefinition.findUnique({
          where: { id: input.definitionId },
          select: featureDefinitionSelect,
        }),
      ]);

      if (!service) {
        throw new NotFoundException('Service was not found.');
      }

      if (!definition) {
        throw new NotFoundException('Feature definition was not found.');
      }

      if (definition.status !== ServiceFeatureStatus.ACTIVE) {
        throw new ConflictException(
          'Only active predefined features can be added.',
        );
      }

      if (definition.category !== service.category) {
        throw new BadRequestException(
          'The predefined feature category must match the service category.',
        );
      }

      const existing = await transaction.serviceFeature.findFirst({
        where: {
          serviceId,
          OR: [{ definitionId: definition.id }, { key: definition.key }],
        },
        select: { id: true },
      });

      if (existing) {
        throw new ConflictException(
          'This predefined feature has already been added to the service.',
        );
      }

      const value =
        input.value ?? this.requireFeaturePrimitive(definition.defaultValue);
      const translations =
        input.valueTranslations ?? definition.valueTranslations;
      this.assertValidFeatureValue(
        definition.valueType,
        value,
        definition.unit,
        translations,
      );

      const feature = await transaction.serviceFeature.create({
        data: {
          serviceId,
          definitionId: definition.id,
          key: definition.key,
          name: definition.name,
          nameTranslations: this.jsonInputObject(definition.nameTranslations),
          description: definition.description,
          descriptionTranslations: this.jsonInputObject(
            definition.descriptionTranslations,
          ),
          valueType: definition.valueType,
          parameterLabel: definition.parameterLabel,
          parameterLabelTranslations: this.jsonInputObject(
            definition.parameterLabelTranslations,
          ),
          defaultValue: value,
          valueTranslations:
            definition.valueType === ServiceFeatureValueType.TEXT
              ? input.valueTranslations
                ? normalizeLocalizedText(
                    input.valueTranslations,
                    typeof value === 'string' ? value : undefined,
                  )
                : this.jsonInputObject(definition.valueTranslations)
              : {},
          unit: definition.unit,
          status: ServiceFeatureStatus.ACTIVE,
          customerVisible: input.customerVisible ?? true,
          sortOrder: definition.sortOrder,
        },
        select: serviceFeatureSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.SERVICE_FEATURE_DEFINITION_ATTACHED,
          targetType: 'service_feature',
          targetId: feature.id,
          metadata: {
            serviceId,
            definitionId: definition.id,
            key: definition.key,
          },
        },
      });

      return feature;
    });
  }

  async listServiceFeatures(
    principal: AuthenticatedPrincipal,
    serviceId: string,
    query: ListServiceFeaturesQueryDto,
  ) {
    this.assertPlatformAdministrator(principal);
    await this.requireCatalogService(serviceId);

    const search = query.search?.trim();
    const where: Prisma.ServiceFeatureWhereInput = {
      serviceId,
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

    const [items, total] = await this.prisma.$transaction([
      this.prisma.serviceFeature.findMany({
        where,
        select: serviceFeatureSelect,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.serviceFeature.count({ where }),
    ]);

    return {
      items,
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async createServiceFeature(
    principal: AuthenticatedPrincipal,
    serviceId: string,
    input: CreateServiceFeatureDto,
  ) {
    this.assertPlatformAdministrator(principal);
    const name = input.name.trim();

    if (!name) {
      throw new BadRequestException('Feature name cannot be blank.');
    }

    const unit = this.optionalText(input.unit);
    this.assertValidFeatureValue(
      input.valueType,
      input.defaultValue,
      unit,
      input.valueTranslations,
    );

    return this.prisma.$transaction(async (transaction) => {
      const [service, existing] = await Promise.all([
        transaction.service.findUnique({
          where: { id: serviceId },
          select: { id: true },
        }),
        transaction.serviceFeature.findUnique({
          where: { serviceId_key: { serviceId, key: input.key } },
          select: { id: true },
        }),
      ]);

      if (!service) {
        throw new NotFoundException('Service was not found.');
      }

      if (existing) {
        throw new ConflictException(
          'A feature with this key already exists for the selected service.',
        );
      }

      const feature = await transaction.serviceFeature.create({
        data: {
          serviceId,
          key: input.key,
          name,
          nameTranslations: normalizeLocalizedText(
            input.nameTranslations,
            name,
          ),
          description: this.optionalText(input.description),
          descriptionTranslations: normalizeLocalizedText(
            input.descriptionTranslations,
            input.description,
          ),
          valueType: input.valueType,
          defaultValue: input.defaultValue,
          valueTranslations:
            input.valueType === ServiceFeatureValueType.TEXT
              ? normalizeLocalizedText(
                  input.valueTranslations,
                  typeof input.defaultValue === 'string'
                    ? input.defaultValue
                    : undefined,
                )
              : {},
          unit,
          status: input.status ?? ServiceFeatureStatus.ACTIVE,
          customerVisible: input.customerVisible ?? true,
          sortOrder: input.sortOrder ?? 0,
        },
        select: serviceFeatureSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.SERVICE_FEATURE_CREATED,
          targetType: 'service_feature',
          targetId: feature.id,
          metadata: {
            serviceId,
            key: feature.key,
            valueType: feature.valueType,
          },
        },
      });

      return feature;
    });
  }

  async updateServiceFeature(
    principal: AuthenticatedPrincipal,
    serviceId: string,
    featureId: string,
    input: UpdateServiceFeatureDto,
  ) {
    this.assertPlatformAdministrator(principal);

    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.serviceFeature.findFirst({
        where: { id: featureId, serviceId },
        select: {
          ...serviceFeatureSelect,
          _count: { select: { assignmentFeatures: true } },
        },
      });

      if (!existing) {
        throw new NotFoundException('Service feature was not found.');
      }

      const valueType = input.valueType ?? existing.valueType;

      if (
        valueType !== existing.valueType &&
        existing._count.assignmentFeatures > 0
      ) {
        throw new ConflictException(
          'The value type cannot change after a feature has been assigned.',
        );
      }

      const value =
        input.defaultValue ??
        this.requireFeaturePrimitive(existing.defaultValue);
      const unit =
        input.unit === undefined
          ? existing.unit
          : this.optionalText(input.unit);
      const translations =
        input.valueTranslations ?? existing.valueTranslations;

      this.assertValidFeatureValue(valueType, value, unit, translations);

      const name = input.name?.trim();

      if (input.name !== undefined && !name) {
        throw new BadRequestException('Feature name cannot be blank.');
      }

      const feature = await transaction.serviceFeature.update({
        where: { id: featureId },
        data: {
          ...(name === undefined ? {} : { name }),
          ...(input.nameTranslations === undefined
            ? {}
            : {
                nameTranslations: normalizeLocalizedText(
                  input.nameTranslations,
                  name ?? existing.name,
                ),
              }),
          ...(input.description === undefined
            ? {}
            : { description: this.optionalText(input.description) }),
          ...(input.descriptionTranslations === undefined
            ? {}
            : {
                descriptionTranslations: normalizeLocalizedText(
                  input.descriptionTranslations,
                  input.description ?? existing.description,
                ),
              }),
          ...(input.valueType === undefined ? {} : { valueType }),
          ...(input.defaultValue === undefined ? {} : { defaultValue: value }),
          ...(input.valueTranslations === undefined
            ? {}
            : {
                valueTranslations:
                  valueType === ServiceFeatureValueType.TEXT
                    ? normalizeLocalizedText(
                        input.valueTranslations,
                        typeof value === 'string' ? value : undefined,
                      )
                    : {},
              }),
          ...(input.unit === undefined ? {} : { unit }),
          ...(input.status === undefined ? {} : { status: input.status }),
          ...(input.customerVisible === undefined
            ? {}
            : { customerVisible: input.customerVisible }),
          ...(input.sortOrder === undefined
            ? {}
            : { sortOrder: input.sortOrder }),
        },
        select: serviceFeatureSelect,
      });

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.SERVICE_FEATURE_UPDATED,
          targetType: 'service_feature',
          targetId: feature.id,
          metadata: { serviceId, key: feature.key, status: feature.status },
        },
      });

      return feature;
    });
  }

  async reorderServiceFeatures(
    principal: AuthenticatedPrincipal,
    serviceId: string,
    input: ReorderServiceFeaturesDto,
  ) {
    this.assertPlatformAdministrator(principal);

    return this.prisma.$transaction(async (transaction) => {
      const features = await transaction.serviceFeature.findMany({
        where: { serviceId, id: { in: input.ids } },
        select: { id: true },
      });

      if (features.length !== input.ids.length) {
        throw new BadRequestException(
          'Every reordered feature must belong to the selected service.',
        );
      }

      for (const [sortOrder, featureId] of input.ids.entries()) {
        await transaction.serviceFeature.update({
          where: { id: featureId },
          data: { sortOrder },
        });
      }

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          action: AUDIT_ACTIONS.SERVICE_FEATURE_REORDERED,
          targetType: 'service',
          targetId: serviceId,
          metadata: { featureIds: input.ids },
        },
      });

      return { reordered: input.ids.length };
    });
  }

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
        const assignment = this.presentAssignment(record, principal);

        if (principal.accountScope !== AccountScope.COMPANY) {
          return assignment;
        }

        const visibleFeatures = (featuresByAssignment.get(record.id) ?? []).map(
          (feature) => this.presentAssignmentFeature(feature, principal),
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
          displayNameTranslations: normalizeLocalizedText(
            input.displayNameTranslations,
            input.displayName,
          ),
          status: input.status ?? CompanyServiceStatus.PROVISIONING,
          serviceUrl: this.optionalText(input.serviceUrl),
          startsAt,
          expiresAt,
          notes: this.optionalText(input.notes),
          internalNotes: this.optionalText(input.internalNotes),
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
            value: this.requireFeaturePrimitive(feature.defaultValue),
            valueTranslations: this.jsonInputObject(feature.valueTranslations),
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
        : this.optionalDate(input.startsAt);
    const expiresAt =
      input.expiresAt === undefined
        ? previous.expiresAt
        : this.optionalDate(input.expiresAt);

    this.assertValidDates(startsAt, expiresAt);

    if (input.status !== undefined && input.status !== previous.status) {
      this.assertAllowedTransition(previous.status, input.status, input.reason);
    }

    const assignment = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.companyService.update({
        where: { id: assignmentId },
        data: {
          ...(input.displayName !== undefined
            ? { displayName: this.optionalText(input.displayName) }
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

      if (input.status !== undefined && input.status !== previous.status) {
        await this.recordLifecycleTransition(transaction, principal, {
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

    return this.presentAssignment(assignment, principal);
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
        this.presentAssignmentFeature(feature, principal),
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
    this.assertPlatformAdministrator(principal);

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
        ? this.requireFeaturePrimitive(existing.serviceFeature.defaultValue)
        : (input.value ?? this.requireFeaturePrimitive(existing.value));
      const translations = input.reset
        ? existing.serviceFeature.valueTranslations
        : (input.valueTranslations ?? existing.valueTranslations);

      this.assertValidFeatureValue(
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
                valueTranslations: this.jsonInputObject(
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

      return this.presentAssignmentFeature(updated, principal);
    });
  }

  async syncAssignmentFeatures(
    principal: AuthenticatedPrincipal,
    assignmentId: string,
  ) {
    this.assertPlatformAdministrator(principal);

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
            value: this.requireFeaturePrimitive(feature.defaultValue),
            valueTranslations: this.jsonInputObject(feature.valueTranslations),
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

  async listAssignmentHistory(
    principal: AuthenticatedPrincipal,
    assignmentId: string,
    query: PaginationQueryDto,
  ) {
    const assignment = await this.getAssignment(principal, assignmentId);
    const where: Prisma.CompanyServiceLifecycleEventWhereInput = {
      companyServiceId: assignment.id,
      companyId: assignment.companyId,
    };

    const [events, total] = await this.prisma.$transaction([
      this.prisma.companyServiceLifecycleEvent.findMany({
        where,
        select: lifecycleSelect,
        orderBy: [{ effectiveAt: 'desc' }, { id: 'desc' }],
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.companyServiceLifecycleEvent.count({ where }),
    ]);

    return {
      items: events.map((event) =>
        this.presentLifecycleEvent(event, principal),
      ),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async transitionAssignment(
    principal: AuthenticatedPrincipal,
    assignmentId: string,
    input: CreateServiceTransitionDto,
  ): Promise<VisibleAssignment> {
    this.assertPlatformAdministrator(principal);
    const effectiveAt = this.resolveTransitionDate(input.effectiveAt);

    const updated = await this.prisma.$transaction(async (transaction) => {
      const assignment = await transaction.companyService.findUnique({
        where: { id: assignmentId },
        select: assignmentSelect,
      });

      if (!assignment) {
        throw new NotFoundException('Assigned service was not found.');
      }

      if (assignment.status === input.toStatus) {
        return assignment;
      }

      this.assertAllowedTransition(
        assignment.status,
        input.toStatus,
        input.reason,
      );

      const record = await transaction.companyService.update({
        where: { id: assignment.id },
        data: { status: input.toStatus },
        select: assignmentSelect,
      });

      await this.recordLifecycleTransition(transaction, principal, {
        assignmentId: assignment.id,
        companyId: assignment.companyId,
        fromStatus: assignment.status,
        toStatus: input.toStatus,
        reasonCode: input.reasonCode,
        reason: input.reason,
        effectiveAt,
      });

      return record;
    });

    return this.presentAssignment(updated, principal);
  }

  async transitionAssignments(
    principal: AuthenticatedPrincipal,
    input: BatchAssignmentTransitionDto,
  ): Promise<BatchMutationResult> {
    this.assertPlatformAdministrator(principal);
    const effectiveAt = this.resolveTransitionDate(input.effectiveAt);

    return this.prisma.$transaction(async (transaction) => {
      const assignments = await transaction.companyService.findMany({
        where: { id: { in: input.ids } },
        select: { id: true, companyId: true, status: true, updatedAt: true },
      });

      if (assignments.length !== input.ids.length) {
        throw new NotFoundException(
          'One or more selected service assignments could not be found.',
        );
      }

      for (const assignment of assignments) {
        if (assignment.status !== input.toStatus) {
          this.assertAllowedTransition(
            assignment.status,
            input.toStatus,
            input.reason,
          );
        }
      }

      const selected = new Map(
        assignments.map((assignment) => [assignment.id, assignment]),
      );
      const items: BatchMutationItem[] = [];

      for (const assignmentId of input.ids) {
        const assignment = selected.get(assignmentId);

        if (!assignment) {
          throw new NotFoundException('Assigned service was not found.');
        }

        if (assignment.status === input.toStatus) {
          items.push({
            id: assignment.id,
            outcome: 'UNCHANGED',
            updatedAt: assignment.updatedAt,
          });
          continue;
        }

        const updated = await transaction.companyService.update({
          where: { id: assignment.id },
          data: { status: input.toStatus },
          select: { id: true, updatedAt: true },
        });

        await this.recordLifecycleTransition(transaction, principal, {
          assignmentId: assignment.id,
          companyId: assignment.companyId,
          fromStatus: assignment.status,
          toStatus: input.toStatus,
          reason: input.reason,
          effectiveAt,
        });

        items.push({
          id: updated.id,
          outcome: 'CHANGED',
          updatedAt: updated.updatedAt,
        });
      }

      const result = batchMutationResult(items);

      if (result.changed > 0) {
        await transaction.auditLog.create({
          data: {
            actorUserId: principal.userId,
            action: AUDIT_ACTIONS.SERVICE_ASSIGNMENT_BATCH_TRANSITIONED,
            targetType: 'company_service',
            metadata: {
              status: input.toStatus,
              requested: result.requested,
              changed: result.changed,
            },
          },
        });
      }

      return result;
    });
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
    return {
      ...service,
      assignmentCount: _count.assignments,
      featureCount: _count.features,
    };
  }

  private presentFeatureDefinition(record: FeatureDefinitionRecord) {
    const { _count, ...definition } = record;

    return {
      ...definition,
      serviceCount: _count.serviceFeatures,
    };
  }

  private presentAssignmentFeature(
    record: AssignmentFeatureRecord,
    principal: AuthenticatedPrincipal,
  ) {
    const { serviceFeature, ...assignment } = record;
    const {
      defaultValue,
      valueTranslations: catalogValueTranslations,
      serviceId,
      ...feature
    } = serviceFeature;
    void defaultValue;
    void catalogValueTranslations;
    void serviceId;

    const customerVisible =
      record.customerVisibleOverride ?? serviceFeature.customerVisible;
    const sortOrder = record.sortOrderOverride ?? serviceFeature.sortOrder;

    if (principal.accountScope === AccountScope.PLATFORM) {
      return { ...assignment, customerVisible, sortOrder, feature };
    }

    const {
      source,
      customerVisibleOverride,
      sortOrderOverride,
      ...visibleAssignment
    } = assignment;
    void source;
    void customerVisibleOverride;
    void sortOrderOverride;

    return { ...visibleAssignment, customerVisible, sortOrder, feature };
  }

  private presentLifecycleEvent(
    record: LifecycleRecord,
    principal: AuthenticatedPrincipal,
  ) {
    if (principal.accountScope === AccountScope.PLATFORM) {
      return record;
    }

    return {
      id: record.id,
      fromStatus: record.fromStatus,
      toStatus: record.toStatus,
      source: record.source,
      effectiveAt: record.effectiveAt,
      createdAt: record.createdAt,
    };
  }

  private async requireCatalogService(serviceId: string): Promise<void> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true },
    });

    if (!service) {
      throw new NotFoundException('Service was not found.');
    }
  }

  private assertValidFeatureValue(
    valueType: ServiceFeatureValueType,
    value: unknown,
    unit: string | null | undefined,
    translations: unknown,
  ): asserts value is ServiceFeaturePrimitive {
    const hasTranslations =
      typeof translations === 'object' &&
      translations !== null &&
      Object.values(translations).some(
        (translation) =>
          typeof translation === 'string' && translation.trim().length > 0,
      );

    if (valueType === ServiceFeatureValueType.BOOLEAN) {
      if (typeof value !== 'boolean' || unit || hasTranslations) {
        throw new BadRequestException(
          'Boolean features require true or false and cannot use units or translated values.',
        );
      }

      return;
    }

    if (
      valueType === ServiceFeatureValueType.NUMBER ||
      valueType === ServiceFeatureValueType.STORAGE
    ) {
      if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        hasTranslations
      ) {
        throw new BadRequestException(
          'Number and storage features require a finite number and cannot use translated values.',
        );
      }

      if (unit && prohibitedMonetaryUnit.test(unit)) {
        throw new BadRequestException(
          'Service feature units cannot represent currencies or pricing.',
        );
      }

      if (
        valueType === ServiceFeatureValueType.STORAGE &&
        unit &&
        !storageUnits.has(unit)
      ) {
        throw new BadRequestException(
          'Storage feature units must be MB, GB, TB, or empty.',
        );
      }

      return;
    }

    if (
      valueType !== ServiceFeatureValueType.TEXT ||
      typeof value !== 'string' ||
      value.trim().length === 0 ||
      value.length > 500 ||
      unit
    ) {
      throw new BadRequestException(
        'Text features require a non-empty value of at most 500 characters and cannot use units.',
      );
    }
  }

  private requireFeaturePrimitive(
    value: Prisma.JsonValue,
  ): ServiceFeaturePrimitive {
    if (
      typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value)) ||
      typeof value === 'string'
    ) {
      return value;
    }

    throw new ConflictException(
      'An existing service feature value is invalid.',
    );
  }

  private jsonInputObject(value: Prisma.JsonValue): Prisma.InputJsonObject {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(value).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  }

  private assertAllowedTransition(
    fromStatus: CompanyServiceStatus,
    toStatus: CompanyServiceStatus,
    reason?: string,
  ): void {
    if (!allowedLifecycleTransitions[fromStatus].includes(toStatus)) {
      throw new ConflictException(
        `Service status cannot transition from ${fromStatus} to ${toStatus}.`,
      );
    }

    if (
      (toStatus === CompanyServiceStatus.SUSPENDED ||
        toStatus === CompanyServiceStatus.CANCELLED) &&
      !reason?.trim()
    ) {
      throw new BadRequestException(
        'Suspending or cancelling a service requires an operator reason.',
      );
    }
  }

  private resolveTransitionDate(value?: string): Date {
    const date = value ? new Date(value) : new Date();

    if (Number.isNaN(date.getTime()) || date.getTime() > Date.now() + 60_000) {
      throw new BadRequestException(
        'The service transition effective date must not be in the future.',
      );
    }

    return date;
  }

  private async recordLifecycleTransition(
    transaction: Prisma.TransactionClient,
    principal: AuthenticatedPrincipal,
    input: {
      assignmentId: string;
      companyId: string;
      fromStatus: CompanyServiceStatus;
      toStatus: CompanyServiceStatus;
      reasonCode?: string;
      reason?: string;
      effectiveAt: Date;
    },
  ): Promise<void> {
    await transaction.companyServiceLifecycleEvent.create({
      data: {
        companyServiceId: input.assignmentId,
        companyId: input.companyId,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        source: CompanyServiceLifecycleSource.ADMIN,
        reasonCode: this.optionalText(input.reasonCode),
        reason: this.optionalText(input.reason),
        actorUserId: principal.userId,
        actorEmailSnapshot: principal.email,
        effectiveAt: input.effectiveAt,
      },
    });

    await transaction.auditLog.create({
      data: {
        actorUserId: principal.userId,
        companyId: input.companyId,
        action: AUDIT_ACTIONS.SERVICE_ASSIGNMENT_STATUS_TRANSITIONED,
        targetType: 'company_service',
        targetId: input.assignmentId,
        metadata: {
          previousStatus: input.fromStatus,
          status: input.toStatus,
        },
      },
    });
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
