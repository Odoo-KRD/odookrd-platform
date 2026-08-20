import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import {
  PrismaClient,
  RoleScope,
} from '../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the RBAC seed.');
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

const permissions = [
  {
    key: 'companies.read',
    name: 'Read companies',
    description: 'View company information within the authorized scope.',
  },
  {
    key: 'companies.manage',
    name: 'Manage companies',
    description: 'Create or update company information within the authorized scope.',
  },
  {
    key: 'users.read',
    name: 'Read users',
    description: 'View users within the authorized scope.',
  },
  {
    key: 'users.manage',
    name: 'Manage users',
    description: 'Create or update users within the authorized scope.',
  },
  {
    key: 'roles.read',
    name: 'Read roles',
    description: 'View role definitions available within the authorized scope.',
  },
  {
    key: 'roles.manage',
    name: 'Manage roles',
    description: 'Manage global system role definitions and permissions.',
  },
  {
    key: 'audit_logs.read',
    name: 'Read audit logs',
    description: 'View audit records within the authorized scope.',
  },
] as const;

const roles = [
  {
    key: 'platform_admin',
    name: 'Platform Admin',
    description: 'OdooKRD platform administrator.',
    scope: RoleScope.PLATFORM,
    permissions: [
      'companies.read',
      'companies.manage',
      'users.read',
      'users.manage',
      'roles.read',
      'roles.manage',
      'audit_logs.read',
    ],
  },
  {
    key: 'company_admin',
    name: 'Company Admin',
    description: 'Administrator for a customer company.',
    scope: RoleScope.COMPANY,
    permissions: [
      'companies.read',
      'companies.manage',
      'users.read',
      'users.manage',
      'roles.read',
    ],
  },
  {
    key: 'company_user',
    name: 'Company User',
    description: 'Standard user for a customer company.',
    scope: RoleScope.COMPANY,
    permissions: ['companies.read'],
  },
] as const;

async function main(): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const permissionIds = new Map<string, string>();

    for (const permission of permissions) {
      const record = await tx.permission.upsert({
        where: {
          key: permission.key,
        },
        update: {
          name: permission.name,
          description: permission.description,
        },
        create: permission,
      });

      permissionIds.set(record.key, record.id);
    }

    for (const role of roles) {
      const roleRecord = await tx.role.upsert({
        where: {
          key: role.key,
        },
        update: {
          name: role.name,
          description: role.description,
          scope: role.scope,
        },
        create: {
          key: role.key,
          name: role.name,
          description: role.description,
          scope: role.scope,
        },
      });

      await tx.rolePermission.deleteMany({
        where: {
          roleId: roleRecord.id,
        },
      });

      await tx.rolePermission.createMany({
        data: role.permissions.map((permissionKey) => {
          const permissionId = permissionIds.get(permissionKey);

          if (!permissionId) {
            throw new Error(
              `Permission "${permissionKey}" was not created before role assignment.`,
            );
          }

          return {
            roleId: roleRecord.id,
            permissionId,
          };
        }),
      });
    }
  });

  console.log(
    `RBAC seed completed: ${roles.length} roles, ${permissions.length} permissions.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('RBAC seed failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
