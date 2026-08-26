import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient, RoleScope } from '../src/generated/prisma/client';

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
    description:
      'Create or update company information within the authorized scope.',
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
  {
    key: 'services.read',
    name: 'Read services',
    description: 'View services assigned within the authorized company scope.',
  },
  {
    key: 'services.manage',
    name: 'Manage services',
    description: 'Manage the platform service catalog and company assignments.',
  },
  {
    key: 'notifications.read',
    name: 'Read own notifications',
    description:
      'View and update only notifications addressed to the authenticated user.',
  },
  {
    key: 'notifications.manage',
    name: 'Manage notification delivery',
    description:
      'Review scoped notification delivery logs; platform administrators can also test platform providers.',
  },
  {
    key: 'settings.read',
    name: 'Read settings',
    description:
      'View settings within the authorized platform or company scope.',
  },
  {
    key: 'settings.manage',
    name: 'Manage settings',
    description:
      'Change permitted settings within the authorized platform or company scope.',
  },
  {
    key: 'training.read',
    name: 'Read training',
    description: 'View training content available within the authorized scope.',
  },
  {
    key: 'training.manage',
    name: 'Manage training',
    description: 'Manage the platform training catalog and learning content.',
  },
  {
    key: 'training.assign',
    name: 'Assign training',
    description: 'Assign training access within the authorized company scope.',
  },
  {
    key: 'training.progress.read',
    name: 'Read training progress',
    description: 'View training progress within the authorized scope.',
  },
] as const;

const roles = [
  {
    key: 'platform_admin',
    name: 'Platform Admin',
    description: 'OdooKRD platform administrator.',
    scope: RoleScope.PLATFORM,
    isSystem: true,
    permissions: [
      'companies.read',
      'companies.manage',
      'users.read',
      'users.manage',
      'roles.read',
      'roles.manage',
      'audit_logs.read',
      'settings.read',
      'settings.manage',
      'services.read',
      'services.manage',
      'notifications.read',

      'notifications.manage',
      'training.read',
      'training.manage',
      'training.assign',
      'training.progress.read',
    ],
  },
  {
    key: 'company_admin',
    name: 'Company Admin',
    description: 'Administrator for a customer company.',
    scope: RoleScope.COMPANY,
    isSystem: true,
    permissions: [
      'companies.read',
      'companies.manage',
      'users.read',
      'users.manage',
      'roles.read',
      'settings.read',
      'settings.manage',
      'services.read',
      'notifications.read',

      'notifications.manage',
      'training.read',
      'training.assign',
      'training.progress.read',
    ],
  },
  {
    key: 'company_user',
    name: 'Company User',
    description: 'Standard user for a customer company.',
    scope: RoleScope.COMPANY,
    isSystem: true,
    permissions: [
      'companies.read',
      'services.read',
      'notifications.read',
      'training.read',
    ],
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
          isSystem: role.isSystem,
        },
        create: {
          key: role.key,
          name: role.name,
          description: role.description,
          scope: role.scope,
          isSystem: role.isSystem,
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
