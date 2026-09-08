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
  AttachServiceFeatureDefinitionDto,
  CreateServiceFeatureDefinitionDto,
  ListServiceFeatureDefinitionsDto,
  UpdateServiceFeatureDefinitionDto,
} from './dto/service-feature-definition.dto';
import {
  featureDefinitionSelect,
  serviceFeatureSelect,
} from './services.selectors';
import {
  assertPlatformAdministrator,
  assertValidFeatureValue,
  jsonInputObject,
  optionalText,
  requireFeaturePrimitive,
} from './services.rules';
import { presentFeatureDefinition } from './services.presenters';

@Injectable()
export class ServiceFeatureDefinitionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listFeatureDefinitions(
    principal: AuthenticatedPrincipal,
    query: ListServiceFeatureDefinitionsDto,
  ) {
    assertPlatformAdministrator(principal);

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
        presentFeatureDefinition(definition),
      ),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async getFeatureDefinition(
    principal: AuthenticatedPrincipal,
    definitionId: string,
  ) {
    assertPlatformAdministrator(principal);

    const definition = await this.prisma.serviceFeatureDefinition.findUnique({
      where: { id: definitionId },
      select: featureDefinitionSelect,
    });

    if (!definition) {
      throw new NotFoundException('Feature definition was not found.');
    }

    return presentFeatureDefinition(definition);
  }

  async createFeatureDefinition(
    principal: AuthenticatedPrincipal,
    input: CreateServiceFeatureDefinitionDto,
  ) {
    assertPlatformAdministrator(principal);

    const name = input.name.trim();
    const parameterLabel = input.parameterLabel.trim();

    if (!name || !parameterLabel) {
      throw new BadRequestException(
        'Feature name and feature parameter cannot be blank.',
      );
    }

    const unit = optionalText(input.unit);
    assertValidFeatureValue(
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
          description: optionalText(input.description),
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

    return presentFeatureDefinition(definition);
  }

  async updateFeatureDefinition(
    principal: AuthenticatedPrincipal,
    definitionId: string,
    input: UpdateServiceFeatureDefinitionDto,
  ) {
    assertPlatformAdministrator(principal);

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
        input.unit === undefined ? existing.unit : optionalText(input.unit);

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
        input.defaultValue ?? requireFeaturePrimitive(existing.defaultValue);
      const translations =
        input.valueTranslations ?? existing.valueTranslations;
      assertValidFeatureValue(valueType, value, unit, translations);

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
          : { description: optionalText(input.description) }),
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

    return presentFeatureDefinition(definition);
  }

  async deleteFeatureDefinition(
    principal: AuthenticatedPrincipal,
    definitionId: string,
  ): Promise<{ success: true }> {
    assertPlatformAdministrator(principal);

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
    assertPlatformAdministrator(principal);

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
        input.value ?? requireFeaturePrimitive(definition.defaultValue);
      const translations =
        input.valueTranslations ?? definition.valueTranslations;
      assertValidFeatureValue(
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
          nameTranslations: jsonInputObject(definition.nameTranslations),
          description: definition.description,
          descriptionTranslations: jsonInputObject(
            definition.descriptionTranslations,
          ),
          valueType: definition.valueType,
          parameterLabel: definition.parameterLabel,
          parameterLabelTranslations: jsonInputObject(
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
                : jsonInputObject(definition.valueTranslations)
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
}
