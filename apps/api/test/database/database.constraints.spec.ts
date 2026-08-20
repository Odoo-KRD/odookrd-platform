import { randomBytes, randomUUID } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

import {
  AccountScope,
  AuthTokenType,
  PrismaClient,
  RoleScope,
} from '../../src/generated/prisma/client';

config({
  path: '.env.test',
  override: true,
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for database constraint tests.');
}

const databaseName = decodeURIComponent(
  new URL(databaseUrl).pathname.replace(/^\//, ''),
);

if (databaseName !== 'odookrd_test') {
  throw new Error(
    `Refusing to run database constraint tests against "${databaseName}". Expected "odookrd_test".`,
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

function createEmail(prefix: string): string {
  return `${prefix}.${randomUUID()}@example.test`;
}

function createTokenHash(): string {
  return randomBytes(32).toString('hex');
}

async function cleanDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.rolePermission.deleteMany(),
    prisma.userRole.deleteMany(),
    prisma.authToken.deleteMany(),
    prisma.session.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.user.deleteMany(),
    prisma.role.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.company.deleteMany(),
  ]);
}

async function createCompany(): Promise<{ id: string }> {
  return prisma.company.create({
    data: {
      name: `Test Company ${randomUUID()}`,
    },
    select: {
      id: true,
    },
  });
}

async function createUser(
  accountScope: AccountScope,
  companyId: string | null,
  normalizedEmail?: string,
): Promise<{ id: string }> {
  const email = createEmail('user');

  return prisma.user.create({
    data: {
      companyId,
      accountScope,
      email,
      normalizedEmail: normalizedEmail ?? email.toLowerCase(),
    },
    select: {
      id: true,
    },
  });
}

describe('database constraints', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  it('enforces the account scope and company relationship', async () => {
    const company = await createCompany();

    await expect(
      createUser(AccountScope.PLATFORM, null),
    ).resolves.toBeDefined();

    await expect(
      createUser(AccountScope.COMPANY, company.id),
    ).resolves.toBeDefined();

    await expect(
      createUser(AccountScope.PLATFORM, company.id),
    ).rejects.toThrow();

    await expect(createUser(AccountScope.COMPANY, null)).rejects.toThrow();
  });

  it('enforces normalized email uniqueness globally', async () => {
    const companyA = await createCompany();
    const companyB = await createCompany();
    const normalizedEmail = createEmail('shared').toLowerCase();

    await createUser(AccountScope.COMPANY, companyA.id, normalizedEmail);

    await expect(
      createUser(AccountScope.COMPANY, companyB.id, normalizedEmail),
    ).rejects.toThrow();
  });

  it('enforces unique role and permission keys', async () => {
    const roleKey = `test_role_${randomUUID()}`;
    const permissionKey = `test.permission.${randomUUID()}`;

    await prisma.role.create({
      data: {
        key: roleKey,
        name: 'Test Role',
        scope: RoleScope.COMPANY,
      },
    });

    await expect(
      prisma.role.create({
        data: {
          key: roleKey,
          name: 'Duplicate Test Role',
          scope: RoleScope.COMPANY,
        },
      }),
    ).rejects.toThrow();

    await prisma.permission.create({
      data: {
        key: permissionKey,
        name: 'Test Permission',
      },
    });

    await expect(
      prisma.permission.create({
        data: {
          key: permissionKey,
          name: 'Duplicate Test Permission',
        },
      }),
    ).rejects.toThrow();
  });

  it('prevents duplicate user-role and role-permission assignments', async () => {
    const company = await createCompany();
    const user = await createUser(AccountScope.COMPANY, company.id);

    const role = await prisma.role.create({
      data: {
        key: `test_role_${randomUUID()}`,
        name: 'Test Role',
        scope: RoleScope.COMPANY,
      },
    });

    const permission = await prisma.permission.create({
      data: {
        key: `test.permission.${randomUUID()}`,
        name: 'Test Permission',
      },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    });

    await expect(
      prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      }),
    ).rejects.toThrow();

    await prisma.rolePermission.create({
      data: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });

    await expect(
      prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      }),
    ).rejects.toThrow();
  });

  it('enforces unique session and auth token hashes', async () => {
    const user = await createUser(AccountScope.PLATFORM, null);

    const sessionTokenHash = createTokenHash();

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: sessionTokenHash,
        idleExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
        absoluteExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await expect(
      prisma.session.create({
        data: {
          userId: user.id,
          tokenHash: sessionTokenHash,
          idleExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
          absoluteExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      }),
    ).rejects.toThrow();

    const authTokenHash = createTokenHash();

    await prisma.authToken.create({
      data: {
        userId: user.id,
        type: AuthTokenType.INVITATION,
        tokenHash: authTokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await expect(
      prisma.authToken.create({
        data: {
          userId: user.id,
          type: AuthTokenType.PASSWORD_RESET,
          tokenHash: authTokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      }),
    ).rejects.toThrow();
  });

  it('restricts company deletion while users belong to it', async () => {
    const company = await createCompany();

    await createUser(AccountScope.COMPANY, company.id);

    await expect(
      prisma.company.delete({
        where: {
          id: company.id,
        },
      }),
    ).rejects.toThrow();
  });

  it('cascades user-owned authentication and role-assignment records', async () => {
    const company = await createCompany();
    const user = await createUser(AccountScope.COMPANY, company.id);

    const role = await prisma.role.create({
      data: {
        key: `test_role_${randomUUID()}`,
        name: 'Test Role',
        scope: RoleScope.COMPANY,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: createTokenHash(),
        idleExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
        absoluteExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await prisma.authToken.create({
      data: {
        userId: user.id,
        type: AuthTokenType.INVITATION,
        tokenHash: createTokenHash(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await prisma.user.delete({
      where: {
        id: user.id,
      },
    });

    await expect(
      prisma.userRole.count({
        where: {
          userId: user.id,
        },
      }),
    ).resolves.toBe(0);

    await expect(
      prisma.session.count({
        where: {
          userId: user.id,
        },
      }),
    ).resolves.toBe(0);

    await expect(
      prisma.authToken.count({
        where: {
          userId: user.id,
        },
      }),
    ).resolves.toBe(0);

    await expect(
      prisma.role.count({
        where: {
          id: role.id,
        },
      }),
    ).resolves.toBe(1);
  });

  it('keeps audit identifiers independent from current entity rows', async () => {
    const auditLog = await prisma.auditLog.create({
      data: {
        actorUserId: randomUUID(),
        companyId: randomUUID(),
        action: 'test.audit.created',
        targetType: 'test_resource',
        targetId: randomUUID(),
        metadata: {
          source: 'database-constraint-test',
        },
      },
    });

    expect(auditLog.id).toBeDefined();
  });
});
