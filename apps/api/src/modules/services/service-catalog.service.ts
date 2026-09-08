import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import {
  batchMutationResult,
  type BatchMutationItem,
  type BatchMutationResult,
} from '../../common/batch/batch-mutation.dto';
import { normalizeLocalizedText } from '../../i18n/localized-content';
import {
  ServiceBillingModel,
  ServiceCatalogStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import type { BatchServiceStatusDto } from './dto/service-batch.dto';
import type {
  CreateServiceDto,
  ListServicesQueryDto,
  UpdateServiceDto,
} from './dto/service.dto';
import { serviceSelect } from './services.selectors';
import { assertPlatformAdministrator, optionalText } from './services.rules';
import { presentService } from './services.presenters';

@Injectable()
export class ServiceCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listServices(
    principal: AuthenticatedPrincipal,
    query: ListServicesQueryDto,
  ) {
    assertPlatformAdministrator(principal);

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
      items: records.map((record) => presentService(record)),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async getService(principal: AuthenticatedPrincipal, serviceId: string) {
    assertPlatformAdministrator(principal);

    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: serviceSelect,
    });

    if (!service) {
      throw new NotFoundException('Service was not found.');
    }

    return presentService(service);
  }

  async createService(
    principal: AuthenticatedPrincipal,
    input: CreateServiceDto,
  ) {
    assertPlatformAdministrator(principal);

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
          description: optionalText(input.description),
          descriptionTranslations: normalizeLocalizedText(
            input.descriptionTranslations,
            input.description,
          ),
          status: input.status ?? ServiceCatalogStatus.ACTIVE,
          billingModel: input.billingModel ?? ServiceBillingModel.PERPETUAL,
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

    return presentService(service);
  }

  async updateService(
    principal: AuthenticatedPrincipal,
    serviceId: string,
    input: UpdateServiceDto,
  ) {
    assertPlatformAdministrator(principal);

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
            ? { description: optionalText(input.description) }
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
          ...(input.billingModel !== undefined
            ? { billingModel: input.billingModel }
            : {}),
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

    return presentService(service);
  }

  async updateServiceStatuses(
    principal: AuthenticatedPrincipal,
    input: BatchServiceStatusDto,
  ): Promise<BatchMutationResult> {
    assertPlatformAdministrator(principal);

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
    assertPlatformAdministrator(principal);

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
}
