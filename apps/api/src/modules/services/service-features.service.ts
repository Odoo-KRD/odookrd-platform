import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { normalizeLocalizedText } from '../../i18n/localized-content';
import {
  ServiceFeatureStatus,
  ServiceFeatureValueType,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import type {
  CreateServiceFeatureDto,
  ListServiceFeaturesQueryDto,
  ReorderServiceFeaturesDto,
  UpdateServiceFeatureDto,
} from './dto/service-feature.dto';
import { serviceFeatureSelect } from './services.selectors';
import {
  assertPlatformAdministrator,
  assertValidFeatureValue,
  optionalText,
  requireFeaturePrimitive,
} from './services.rules';

@Injectable()
export class ServiceFeaturesService {
  constructor(private readonly prisma: PrismaService) {}

  async listServiceFeatures(
    principal: AuthenticatedPrincipal,
    serviceId: string,
    query: ListServiceFeaturesQueryDto,
  ) {
    assertPlatformAdministrator(principal);
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
    assertPlatformAdministrator(principal);
    const name = input.name.trim();

    if (!name) {
      throw new BadRequestException('Feature name cannot be blank.');
    }

    const unit = optionalText(input.unit);
    assertValidFeatureValue(
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
          description: optionalText(input.description),
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
    assertPlatformAdministrator(principal);

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
        input.defaultValue ?? requireFeaturePrimitive(existing.defaultValue);
      const unit =
        input.unit === undefined ? existing.unit : optionalText(input.unit);
      const translations =
        input.valueTranslations ?? existing.valueTranslations;

      assertValidFeatureValue(valueType, value, unit, translations);

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
            : { description: optionalText(input.description) }),
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
    assertPlatformAdministrator(principal);

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

  private async requireCatalogService(serviceId: string): Promise<void> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true },
    });

    if (!service) {
      throw new NotFoundException('Service was not found.');
    }
  }
}
