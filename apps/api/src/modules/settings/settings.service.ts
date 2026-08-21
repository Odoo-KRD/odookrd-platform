import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { AccountScope, SettingScope } from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { AuthorizationService } from '../authorization/authorization.service';
import type { UpdateSettingItemDto } from './dto/update-settings.dto';
import { SettingsCryptoService } from './settings-crypto.service';
import {
  SETTINGS_BY_KEY,
  SETTINGS_REGISTRY,
  type SettingDefinition,
  type SettingPrimitive,
  type SettingValueType,
} from './settings.registry';

export type SettingSource = 'DEFAULT' | 'PLATFORM' | 'COMPANY';

export interface ManagedSetting {
  key: string;
  category: SettingDefinition['category'];
  valueType: SettingValueType;
  value: SettingPrimitive | null;
  source: SettingSource;
  isSecret: boolean;
  configured: boolean;
  editable: boolean;
}

export interface SettingsCollection {
  scope: SettingScope;
  companyId: string | null;
  settings: ManagedSetting[];
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: SettingsCryptoService,
    private readonly authorization: AuthorizationService,
  ) {}

  async listPlatform(
    principal: AuthenticatedPrincipal,
  ): Promise<SettingsCollection> {
    this.assertPlatformAdministrator(principal);
    return this.list(principal, SettingScope.PLATFORM, null);
  }

  async listCompany(
    principal: AuthenticatedPrincipal,
    companyId: string,
  ): Promise<SettingsCollection> {
    this.authorization.assertCompanyAccess(principal, companyId);
    await this.assertCompanyExists(companyId);
    return this.list(principal, SettingScope.COMPANY, companyId);
  }

  async updatePlatform(
    principal: AuthenticatedPrincipal,
    items: readonly UpdateSettingItemDto[],
  ): Promise<SettingsCollection> {
    this.assertPlatformAdministrator(principal);
    await this.update(principal, SettingScope.PLATFORM, null, items);
    return this.list(principal, SettingScope.PLATFORM, null);
  }

  async updateCompany(
    principal: AuthenticatedPrincipal,
    companyId: string,
    items: readonly UpdateSettingItemDto[],
  ): Promise<SettingsCollection> {
    this.authorization.assertCompanyAccess(principal, companyId);
    await this.assertCompanyExists(companyId);
    await this.update(principal, SettingScope.COMPANY, companyId, items);
    return this.list(principal, SettingScope.COMPANY, companyId);
  }

  async resolveValue(
    key: string,
    companyId: string | null = null,
  ): Promise<SettingPrimitive> {
    const definition = this.getDefinition(key);
    if (definition.valueType === 'SECRET') {
      throw new BadRequestException(
        'Secret settings require the internal secret resolver.',
      );
    }

    const record = await this.resolveRecord(definition, companyId);
    return record
      ? this.readStoredPrimitive(record.value, definition)
      : definition.defaultValue;
  }

  async resolveSecret(
    key: string,
    companyId: string | null = null,
  ): Promise<string | null> {
    const definition = this.getDefinition(key);
    if (definition.valueType !== 'SECRET') {
      throw new BadRequestException('The requested setting is not secret.');
    }

    const record = await this.resolveRecord(definition, companyId);
    if (!record?.encryptedValue) {
      return null;
    }

    return this.crypto.decrypt(
      record.encryptedValue,
      record.scopeKey + ':' + definition.key,
    );
  }

  private async list(
    principal: AuthenticatedPrincipal,
    scope: SettingScope,
    companyId: string | null,
  ): Promise<SettingsCollection> {
    const definitions =
      scope === SettingScope.PLATFORM
        ? SETTINGS_REGISTRY
        : SETTINGS_REGISTRY.filter((definition) => definition.companyVisible);
    const companyScopeKey = companyId ? 'company:' + companyId : null;
    const scopeKeys = companyScopeKey
      ? ['platform', companyScopeKey]
      : ['platform'];
    const records = await this.prisma.setting.findMany({
      where: {
        scopeKey: { in: scopeKeys },
        key: { in: definitions.map((definition) => definition.key) },
      },
    });
    const recordsByIdentity = new Map(
      records.map((record) => [record.scopeKey + ':' + record.key, record]),
    );

    return {
      scope,
      companyId,
      settings: definitions.map((definition) => {
        const companyRecord =
          companyScopeKey && definition.companyOverridable
            ? recordsByIdentity.get(companyScopeKey + ':' + definition.key)
            : undefined;
        const platformRecord = recordsByIdentity.get(
          'platform:' + definition.key,
        );
        const record = companyRecord ?? platformRecord;
        const isSecret = definition.valueType === 'SECRET';
        const source: SettingSource = companyRecord
          ? 'COMPANY'
          : platformRecord
            ? 'PLATFORM'
            : 'DEFAULT';

        return {
          key: definition.key,
          category: definition.category,
          valueType: definition.valueType,
          value: isSecret
            ? null
            : record
              ? this.readStoredPrimitive(record.value, definition)
              : definition.defaultValue,
          source,
          isSecret,
          configured: isSecret ? Boolean(record?.encryptedValue) : true,
          editable:
            scope === SettingScope.PLATFORM
              ? true
              : definition.companyOverridable &&
                (principal.accountScope === AccountScope.PLATFORM ||
                  definition.companyWritable),
        };
      }),
    };
  }

  private async update(
    principal: AuthenticatedPrincipal,
    scope: SettingScope,
    companyId: string | null,
    items: readonly UpdateSettingItemDto[],
  ): Promise<void> {
    const keys = items.map((item) => item.key);
    if (new Set(keys).size !== keys.length) {
      throw new BadRequestException(
        'A setting key can be changed only once per request.',
      );
    }

    const normalized = items.map((item) => {
      const definition = this.getDefinition(item.key);

      if (scope === SettingScope.COMPANY && !definition.companyOverridable) {
        throw new ForbiddenException(
          'This setting cannot be overridden for a company.',
        );
      }

      if (
        scope === SettingScope.COMPANY &&
        principal.accountScope === AccountScope.COMPANY &&
        !definition.companyWritable
      ) {
        throw new ForbiddenException(
          'This setting can be changed only by a platform administrator.',
        );
      }

      return {
        definition,
        value: this.validateValue(definition, item.value),
      };
    });

    const scopeKey =
      scope === SettingScope.PLATFORM ? 'platform' : 'company:' + companyId;

    await this.prisma.$transaction(async (transaction) => {
      for (const item of normalized) {
        const { definition, value } = item;

        if (definition.valueType === 'SECRET' && value === '') {
          await transaction.setting.deleteMany({
            where: { scopeKey, key: definition.key },
          });
          continue;
        }

        if (definition.valueType === 'SECRET') {
          const encryptedValue = this.crypto.encrypt(
            value as string,
            scopeKey + ':' + definition.key,
          );
          await transaction.setting.upsert({
            where: {
              scopeKey_key: { scopeKey, key: definition.key },
            },
            create: {
              key: definition.key,
              category: definition.category,
              valueType: definition.valueType,
              scope,
              scopeKey,
              companyId,
              encryptedValue,
            },
            update: {
              category: definition.category,
              valueType: definition.valueType,
              encryptedValue,
            },
          });
          continue;
        }

        await transaction.setting.upsert({
          where: {
            scopeKey_key: { scopeKey, key: definition.key },
          },
          create: {
            key: definition.key,
            category: definition.category,
            valueType: definition.valueType,
            scope,
            scopeKey,
            companyId,
            value,
            encryptedValue: null,
          },
          update: {
            category: definition.category,
            valueType: definition.valueType,
            value,
            encryptedValue: null,
          },
        });
      }

      await transaction.auditLog.create({
        data: {
          actorUserId: principal.userId,
          companyId,
          action: 'settings.updated',
          targetType: 'settings',
          targetId: scopeKey,
          metadata: {
            scope,
            keys,
          },
        },
      });
    });
  }

  private validateValue(
    definition: SettingDefinition,
    value: unknown,
  ): SettingPrimitive {
    if (
      (definition.valueType === 'STRING' ||
        definition.valueType === 'SECRET') &&
      typeof value !== 'string'
    ) {
      throw new BadRequestException(
        definition.key + ' requires a string value.',
      );
    }

    if (
      definition.valueType === 'NUMBER' &&
      (typeof value !== 'number' || !Number.isSafeInteger(value))
    ) {
      throw new BadRequestException(
        definition.key + ' requires a safe integer.',
      );
    }

    if (definition.valueType === 'BOOLEAN' && typeof value !== 'boolean') {
      throw new BadRequestException(
        definition.key + ' requires a boolean value.',
      );
    }

    const normalized = value as SettingPrimitive;

    if (
      typeof normalized === 'string' &&
      definition.allowEmpty === false &&
      normalized.trim().length === 0
    ) {
      throw new BadRequestException(definition.key + ' cannot be empty.');
    }

    if (
      typeof normalized === 'string' &&
      normalized.length > (definition.maxLength ?? 4096)
    ) {
      throw new BadRequestException(
        definition.key + ' exceeds its maximum length.',
      );
    }

    if (
      typeof normalized === 'number' &&
      (normalized < (definition.min ?? Number.MIN_SAFE_INTEGER) ||
        normalized > (definition.max ?? Number.MAX_SAFE_INTEGER))
    ) {
      throw new BadRequestException(
        definition.key + ' is outside its permitted range.',
      );
    }

    if (
      definition.allowedValues &&
      !definition.allowedValues.includes(normalized)
    ) {
      throw new BadRequestException(
        definition.key + ' contains an unsupported value.',
      );
    }

    return normalized;
  }

  private readStoredPrimitive(
    value: unknown,
    definition: SettingDefinition,
  ): SettingPrimitive {
    const valid =
      (definition.valueType === 'STRING' && typeof value === 'string') ||
      (definition.valueType === 'NUMBER' && typeof value === 'number') ||
      (definition.valueType === 'BOOLEAN' && typeof value === 'boolean');

    if (!valid) {
      throw new InternalServerErrorException(
        'A stored setting has an invalid value type.',
      );
    }

    return value;
  }

  private getDefinition(key: string): SettingDefinition {
    const definition = SETTINGS_BY_KEY.get(key);
    if (!definition) {
      throw new BadRequestException('Unknown setting key.');
    }
    return definition;
  }

  private async resolveRecord(
    definition: SettingDefinition,
    companyId: string | null,
  ) {
    const companyScopeKey =
      companyId && definition.companyOverridable
        ? 'company:' + companyId
        : null;
    const scopeKeys = companyScopeKey
      ? [companyScopeKey, 'platform']
      : ['platform'];
    const records = await this.prisma.setting.findMany({
      where: {
        key: definition.key,
        scopeKey: { in: scopeKeys },
      },
    });

    return (
      (companyScopeKey
        ? records.find((record) => record.scopeKey === companyScopeKey)
        : undefined) ??
      records.find((record) => record.scopeKey === 'platform') ??
      null
    );
  }

  private async assertCompanyExists(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('Company not found.');
    }
  }

  private assertPlatformAdministrator(principal: AuthenticatedPrincipal): void {
    if (
      principal.accountScope !== AccountScope.PLATFORM ||
      principal.companyId !== null
    ) {
      throw new ForbiddenException('Platform settings require platform scope.');
    }
  }
}
