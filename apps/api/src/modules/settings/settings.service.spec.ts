import { ForbiddenException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import { AccountScope, SettingScope } from '../../generated/prisma/enums';
import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { AuthorizationService } from '../authorization/authorization.service';
import { SettingsCryptoService } from './settings-crypto.service';
import type { SettingPrimitive } from './settings.registry';
import { SettingsService } from './settings.service';

const COMPANY_ID = '7f28dd10-86d3-4286-81ff-f2f58bb8bd21';
const OTHER_COMPANY_ID = '8a7ea523-ea89-487d-84b3-98fe6bde9a62';

interface StoredSetting {
  id: string;
  key: string;
  category: string;
  valueType: string;
  scope: SettingScope;
  scopeKey: string;
  companyId: string | null;
  value: SettingPrimitive | null;
  encryptedValue: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FindSettingArguments {
  where: {
    scopeKey: { in: string[] };
    key: string | { in: string[] };
  };
}

interface UpsertSettingArguments {
  where: {
    scopeKey_key: {
      scopeKey: string;
      key: string;
    };
  };
  create: {
    key: string;
    category: string;
    valueType: string;
    scope: SettingScope;
    scopeKey: string;
    companyId: string | null;
    value?: SettingPrimitive;
    encryptedValue?: string | null;
  };
  update: {
    category: string;
    valueType: string;
    value?: SettingPrimitive;
    encryptedValue?: string | null;
  };
}

interface MockTransaction {
  setting: {
    upsert: (arguments_: UpsertSettingArguments) => StoredSetting;
    deleteMany: (arguments_: { where: { scopeKey: string; key: string } }) => {
      count: number;
    };
  };
  auditLog: {
    create: (arguments_: {
      data: Record<string, unknown>;
    }) => Record<string, unknown>;
  };
}

describe('SettingsService', () => {
  let service: SettingsService;
  let records: Map<string, StoredSetting>;
  let auditEntries: Array<Record<string, unknown>>;

  const platformPrincipal: AuthenticatedPrincipal = {
    sessionId: 'platform-session',
    userId: 'platform-user',
    email: 'platform@example.com',
    accountScope: AccountScope.PLATFORM,
    companyId: null,
  };

  const companyPrincipal: AuthenticatedPrincipal = {
    sessionId: 'company-session',
    userId: 'company-user',
    email: 'company@example.com',
    accountScope: AccountScope.COMPANY,
    companyId: COMPANY_ID,
  };

  beforeEach(() => {
    records = new Map();
    auditEntries = [];

    const transaction: MockTransaction = {
      setting: {
        upsert: jest.fn((arguments_: UpsertSettingArguments) => {
          const identity =
            arguments_.where.scopeKey_key.scopeKey +
            ':' +
            arguments_.where.scopeKey_key.key;
          const previous = records.get(identity);
          const now = new Date();
          const record: StoredSetting = previous
            ? {
                ...previous,
                ...arguments_.update,
                updatedAt: now,
              }
            : {
                id: 'setting-' + String(records.size + 1),
                value: null,
                encryptedValue: null,
                createdAt: now,
                updatedAt: now,
                ...arguments_.create,
              };
          records.set(identity, record);
          return record;
        }),
        deleteMany: jest.fn(
          (arguments_: { where: { scopeKey: string; key: string } }) => {
            const identity =
              arguments_.where.scopeKey + ':' + arguments_.where.key;
            return {
              count: records.delete(identity) ? 1 : 0,
            };
          },
        ),
      },
      auditLog: {
        create: jest.fn((arguments_: { data: Record<string, unknown> }) => {
          auditEntries.push(arguments_.data);
          return arguments_.data;
        }),
      },
    };

    const prisma = {
      setting: {
        findMany: jest.fn((arguments_: FindSettingArguments) =>
          [...records.values()].filter((record) => {
            const matchingScope = arguments_.where.scopeKey.in.includes(
              record.scopeKey,
            );
            const matchingKey =
              typeof arguments_.where.key === 'string'
                ? arguments_.where.key === record.key
                : arguments_.where.key.in.includes(record.key);
            return matchingScope && matchingKey;
          }),
        ),
      },
      company: {
        findUnique: jest.fn((arguments_: { where: { id: string } }) =>
          [COMPANY_ID, OTHER_COMPANY_ID].includes(arguments_.where.id)
            ? { id: arguments_.where.id }
            : null,
        ),
      },
      $transaction: jest.fn(
        async (callback: (client: MockTransaction) => Promise<void>) =>
          callback(transaction),
      ),
    } as unknown as PrismaService;

    const authorization = {
      assertCompanyAccess: jest.fn(
        (principal: AuthenticatedPrincipal, targetCompanyId: string) => {
          if (
            principal.accountScope === AccountScope.COMPANY &&
            principal.companyId !== targetCompanyId
          ) {
            throw new ForbiddenException(
              'Access outside company scope is forbidden.',
            );
          }
        },
      ),
    } as unknown as AuthorizationService;

    const configService = {
      getOrThrow: jest
        .fn()
        .mockReturnValue(Buffer.alloc(32, 41).toString('base64')),
    } as unknown as ConfigService;

    service = new SettingsService(
      prisma,
      new SettingsCryptoService(configService),
      authorization,
    );
  });

  it('inherits platform values and accepts platform-managed company overrides', async () => {
    await service.updatePlatform(platformPrincipal, [
      { key: 'companies.max_users_per_company', value: 50 },
    ]);

    let collection = await service.listCompany(companyPrincipal, COMPANY_ID);
    let limit = collection.settings.find(
      (setting) => setting.key === 'companies.max_users_per_company',
    );
    expect(limit).toMatchObject({
      value: 50,
      source: 'PLATFORM',
      editable: false,
    });

    await service.updateCompany(platformPrincipal, COMPANY_ID, [
      { key: 'companies.max_users_per_company', value: 12 },
    ]);

    collection = await service.listCompany(companyPrincipal, COMPANY_ID);
    limit = collection.settings.find(
      (setting) => setting.key === 'companies.max_users_per_company',
    );
    expect(limit).toMatchObject({
      value: 12,
      source: 'COMPANY',
      editable: false,
    });
    await expect(
      service.resolveValue('companies.max_users_per_company', COMPANY_ID),
    ).resolves.toBe(12);
  });

  it('prevents company administrators from increasing their own user limits', async () => {
    await expect(
      service.updateCompany(companyPrincipal, COMPANY_ID, [
        { key: 'companies.max_users_per_company', value: 1000 },
      ]),
    ).rejects.toThrow(
      'This setting can be changed only by a platform administrator.',
    );
  });

  it('rejects attempts to access another company', async () => {
    await expect(
      service.listCompany(companyPrincipal, OTHER_COMPANY_ID),
    ).rejects.toThrow('Access outside company scope is forbidden.');
  });

  it('allows only approved company-level preference overrides', async () => {
    const collection = await service.updateCompany(
      companyPrincipal,
      COMPANY_ID,
      [
        { key: 'general.default_locale', value: 'ar' },
        { key: 'theme.default_font', value: 'Noto Sans Arabic' },
      ],
    );

    expect(
      collection.settings.find(
        (setting) => setting.key === 'general.default_locale',
      ),
    ).toMatchObject({
      value: 'ar',
      source: 'COMPANY',
      editable: true,
    });

    await expect(
      service.updateCompany(companyPrincipal, COMPANY_ID, [
        { key: 'general.site_title', value: 'Unauthorized title' },
      ]),
    ).rejects.toThrow('This setting cannot be overridden for a company.');
  });

  it('hides platform-only Amazon SES and WhatsApp credentials from companies', async () => {
    const collection = await service.listCompany(companyPrincipal, COMPANY_ID);
    const visibleKeys = collection.settings.map((setting) => setting.key);

    expect(visibleKeys).not.toContain(
      'notifications.email.amazon_ses.secret_access_key',
    );
    expect(visibleKeys).not.toContain('notifications.whatsapp.access_token');
    expect(visibleKeys).toContain('notifications.email.enabled');
    expect(visibleKeys).toContain('notifications.whatsapp.enabled');
  });

  it('encrypts provider secrets and omits their values from responses and audit logs', async () => {
    const secret = 'production-secret-that-must-never-leak';
    const collection = await service.updatePlatform(platformPrincipal, [
      {
        key: 'notifications.email.amazon_ses.secret_access_key',
        value: secret,
      },
    ]);
    const setting = collection.settings.find(
      (entry) =>
        entry.key === 'notifications.email.amazon_ses.secret_access_key',
    );
    const stored = records.get(
      'platform:notifications.email.amazon_ses.secret_access_key',
    );

    expect(setting).toMatchObject({
      value: null,
      configured: true,
      isSecret: true,
    });
    expect(stored?.value).toBeNull();
    expect(stored?.encryptedValue).not.toContain(secret);
    expect(JSON.stringify(collection)).not.toContain(secret);
    expect(JSON.stringify(auditEntries)).not.toContain(secret);
    await expect(
      service.resolveSecret('notifications.email.amazon_ses.secret_access_key'),
    ).resolves.toBe(secret);
  });

  it('clears configured provider secrets without storing an empty plaintext', async () => {
    const key = 'notifications.whatsapp.access_token';

    await service.updatePlatform(platformPrincipal, [
      { key, value: 'temporary-token' },
    ]);
    const collection = await service.updatePlatform(platformPrincipal, [
      { key, value: '' },
    ]);

    expect(
      collection.settings.find((setting) => setting.key === key),
    ).toMatchObject({
      value: null,
      configured: false,
    });
    await expect(service.resolveSecret(key)).resolves.toBeNull();
  });
});
