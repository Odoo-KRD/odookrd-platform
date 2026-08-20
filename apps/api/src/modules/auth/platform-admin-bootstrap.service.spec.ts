import { ConfigService } from '@nestjs/config';

import {
  AccountScope,
  RoleScope,
  UserStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PasswordService } from './password.service';
import { PlatformAdminBootstrapService } from './platform-admin-bootstrap.service';

interface RoleRecord {
  id: string;
  scope: RoleScope;
}

interface ExistingPlatformAdmin {
  userId: string;
}

interface ExistingUser {
  id: string;
}

interface RoleFindUniqueArgs {
  where: {
    key: string;
  };
  select: {
    id: true;
    scope: true;
  };
}

interface UserRoleFindFirstArgs {
  where: {
    roleId: string;
    user: {
      accountScope: AccountScope;
    };
  };
  select: {
    userId: true;
  };
}

interface UserFindUniqueArgs {
  where: {
    normalizedEmail: string;
  };
  select: {
    id: true;
  };
}

interface UserCreateArgs {
  data: {
    accountScope: AccountScope;
    companyId: null;
    email: string;
    normalizedEmail: string;
    passwordHash: string;
    status: UserStatus;
    emailVerifiedAt: Date;
    userRoles: {
      create: {
        roleId: string;
      };
    };
  };
  select: {
    id: true;
    email: true;
  };
}

interface TransactionClient {
  role: {
    findUnique(args: RoleFindUniqueArgs): Promise<RoleRecord | null>;
  };
  userRole: {
    findFirst(
      args: UserRoleFindFirstArgs,
    ): Promise<ExistingPlatformAdmin | null>;
  };
  user: {
    findUnique(args: UserFindUniqueArgs): Promise<ExistingUser | null>;
    create(args: UserCreateArgs): Promise<{
      id: string;
      email: string;
    }>;
  };
}

describe('PlatformAdminBootstrapService', () => {
  let service: PlatformAdminBootstrapService;

  let roleResult: RoleRecord | null;
  let existingPlatformAdminResult: ExistingPlatformAdmin | null;
  let existingUserResult: ExistingUser | null;

  let capturedRoleArgs: RoleFindUniqueArgs | undefined;
  let capturedUserRoleArgs: UserRoleFindFirstArgs | undefined;
  let capturedUserLookupArgs: UserFindUniqueArgs | undefined;
  let capturedUserCreateArgs: UserCreateArgs | undefined;

  let capturedPassword: string | undefined;
  let passwordHashCount: number;
  let transactionCount: number;

  const transactionClient: TransactionClient = {
    role: {
      findUnique(args: RoleFindUniqueArgs): Promise<RoleRecord | null> {
        capturedRoleArgs = args;

        return Promise.resolve(roleResult);
      },
    },

    userRole: {
      findFirst(
        args: UserRoleFindFirstArgs,
      ): Promise<ExistingPlatformAdmin | null> {
        capturedUserRoleArgs = args;

        return Promise.resolve(existingPlatformAdminResult);
      },
    },

    user: {
      findUnique(args: UserFindUniqueArgs): Promise<ExistingUser | null> {
        capturedUserLookupArgs = args;

        return Promise.resolve(existingUserResult);
      },

      create(args: UserCreateArgs): Promise<{ id: string; email: string }> {
        capturedUserCreateArgs = args;

        return Promise.resolve({
          id: 'new-platform-admin-id',
          email: args.data.email,
        });
      },
    },
  };

  const prisma = {
    $transaction<T>(
      callback: (tx: TransactionClient) => Promise<T>,
    ): Promise<T> {
      transactionCount += 1;

      return callback(transactionClient);
    },
  } as unknown as PrismaService;

  const passwordService = {
    hashPassword(password: string): Promise<string> {
      capturedPassword = password;
      passwordHashCount += 1;

      return Promise.resolve('argon2id-password-hash');
    },
  } as unknown as PasswordService;

  const configService = {
    getOrThrow(key: string): number {
      switch (key) {
        case 'AUTH_PASSWORD_MIN_LENGTH':
          return 12;

        case 'AUTH_PASSWORD_MAX_LENGTH':
          return 128;

        default:
          throw new Error(`Unexpected configuration key: ${key}`);
      }
    },
  } as unknown as ConfigService;

  beforeEach(() => {
    roleResult = {
      id: 'platform-admin-role-id',
      scope: RoleScope.PLATFORM,
    };

    existingPlatformAdminResult = null;
    existingUserResult = null;

    capturedRoleArgs = undefined;
    capturedUserRoleArgs = undefined;
    capturedUserLookupArgs = undefined;
    capturedUserCreateArgs = undefined;
    capturedPassword = undefined;

    passwordHashCount = 0;
    transactionCount = 0;

    service = new PlatformAdminBootstrapService(
      prisma,
      passwordService,
      configService,
    );
  });

  it('creates the first platform administrator', async () => {
    const result = await service.createFirstPlatformAdmin(
      'admin@odoo.krd',
      'StrongPassword123!',
    );

    expect(result).toEqual({
      id: 'new-platform-admin-id',
      email: 'admin@odoo.krd',
    });

    expect(transactionCount).toBe(1);
    expect(passwordHashCount).toBe(1);
    expect(capturedPassword).toBe('StrongPassword123!');

    expect(capturedUserCreateArgs).toBeDefined();

    if (!capturedUserCreateArgs) {
      throw new Error('Expected platform administrator creation arguments');
    }

    expect(capturedUserCreateArgs.data.accountScope).toBe(
      AccountScope.PLATFORM,
    );
    expect(capturedUserCreateArgs.data.companyId).toBeNull();
    expect(capturedUserCreateArgs.data.email).toBe('admin@odoo.krd');
    expect(capturedUserCreateArgs.data.normalizedEmail).toBe('admin@odoo.krd');
    expect(capturedUserCreateArgs.data.passwordHash).toBe(
      'argon2id-password-hash',
    );
    expect(capturedUserCreateArgs.data.status).toBe(UserStatus.ACTIVE);
    expect(capturedUserCreateArgs.data.emailVerifiedAt).toBeInstanceOf(Date);
    expect(capturedUserCreateArgs.data.userRoles.create.roleId).toBe(
      'platform-admin-role-id',
    );
  });

  it('trims and normalizes the email address', async () => {
    await service.createFirstPlatformAdmin(
      '  Admin@Odoo.KRD  ',
      'StrongPassword123!',
    );

    expect(capturedUserLookupArgs).toBeDefined();
    expect(capturedUserCreateArgs).toBeDefined();

    if (!capturedUserLookupArgs || !capturedUserCreateArgs) {
      throw new Error('Expected user lookup and creation arguments');
    }

    expect(capturedUserLookupArgs.where.normalizedEmail).toBe('admin@odoo.krd');

    expect(capturedUserCreateArgs.data.email).toBe('Admin@Odoo.KRD');
    expect(capturedUserCreateArgs.data.normalizedEmail).toBe('admin@odoo.krd');
  });

  it('requires the seeded platform_admin role', async () => {
    roleResult = null;

    await expect(
      service.createFirstPlatformAdmin('admin@odoo.krd', 'StrongPassword123!'),
    ).rejects.toThrow(
      'The platform_admin role does not exist. Run the RBAC seed first.',
    );
  });

  it('requires platform_admin to have PLATFORM scope', async () => {
    roleResult = {
      id: 'platform-admin-role-id',
      scope: RoleScope.COMPANY,
    };

    await expect(
      service.createFirstPlatformAdmin('admin@odoo.krd', 'StrongPassword123!'),
    ).rejects.toThrow(
      'The platform_admin role is not configured with PLATFORM scope.',
    );
  });

  it('refuses to bootstrap when a platform administrator already exists', async () => {
    existingPlatformAdminResult = {
      userId: 'existing-admin-id',
    };

    await expect(
      service.createFirstPlatformAdmin('admin@odoo.krd', 'StrongPassword123!'),
    ).rejects.toThrow(
      'A platform administrator already exists. Bootstrap is only for the first platform administrator.',
    );
  });

  it('refuses an email already assigned to another user', async () => {
    existingUserResult = {
      id: 'existing-user-id',
    };

    await expect(
      service.createFirstPlatformAdmin('admin@odoo.krd', 'StrongPassword123!'),
    ).rejects.toThrow('A user with this email address already exists.');
  });

  it('rejects an invalid email address before database access', async () => {
    await expect(
      service.createFirstPlatformAdmin('not-an-email', 'StrongPassword123!'),
    ).rejects.toThrow('A valid email address is required.');

    expect(passwordHashCount).toBe(0);
    expect(transactionCount).toBe(0);
  });

  it('rejects a password shorter than the configured minimum', async () => {
    await expect(
      service.createFirstPlatformAdmin('admin@odoo.krd', 'short'),
    ).rejects.toThrow('Password must contain at least 12 characters.');

    expect(passwordHashCount).toBe(0);
    expect(transactionCount).toBe(0);
  });

  it('rejects a password longer than the configured maximum', async () => {
    const password = 'x'.repeat(129);

    await expect(
      service.createFirstPlatformAdmin('admin@odoo.krd', password),
    ).rejects.toThrow('Password must contain no more than 128 characters.');

    expect(passwordHashCount).toBe(0);
    expect(transactionCount).toBe(0);
  });

  it('checks specifically for a PLATFORM platform_admin assignment', async () => {
    await service.createFirstPlatformAdmin(
      'admin@odoo.krd',
      'StrongPassword123!',
    );

    expect(capturedRoleArgs).toBeDefined();
    expect(capturedUserRoleArgs).toBeDefined();

    if (!capturedRoleArgs || !capturedUserRoleArgs) {
      throw new Error('Expected role lookup arguments');
    }

    expect(capturedRoleArgs.where.key).toBe('platform_admin');

    expect(capturedUserRoleArgs.where.roleId).toBe('platform-admin-role-id');

    expect(capturedUserRoleArgs.where.user.accountScope).toBe(
      AccountScope.PLATFORM,
    );
  });
});
