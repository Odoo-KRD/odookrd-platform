import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { createHash, randomUUID } from 'node:crypto';

import {
  AccountScope,
  CompanyStatus,
  PrismaClient,
  UserStatus,
} from '../../src/generated/prisma/client';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { AuthService } from '../../src/modules/auth/auth.service';
import { PasswordService } from '../../src/modules/auth/password.service';
import { SessionService } from '../../src/modules/auth/session.service';

config({
  path: '.env.test',
  override: true,
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is required for authentication integration tests.',
  );
}

const databaseName = decodeURIComponent(
  new URL(databaseUrl).pathname.replace(/^\//, ''),
);

if (databaseName !== 'odookrd_test') {
  throw new Error(
    `Refusing to run authentication integration tests against "${databaseName}". Expected "odookrd_test".`,
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

const configService = {
  getOrThrow(key: string): number {
    switch (key) {
      case 'AUTH_SESSION_IDLE_TTL_SECONDS':
        return 1800;

      case 'AUTH_SESSION_ABSOLUTE_TTL_SECONDS':
        return 86400;

      case 'AUTH_PASSWORD_MIN_LENGTH':
        return 12;

      case 'AUTH_PASSWORD_MAX_LENGTH':
        return 128;

      case 'AUTH_LOGIN_MAX_ATTEMPTS':
        return 5;

      case 'AUTH_LOGIN_WINDOW_SECONDS':
        return 900;

      default:
        throw new Error(`Unexpected configuration key: ${key}`);
    }
  },
} as unknown as ConfigService;

const prismaService = prisma as unknown as PrismaService;

const passwordService = new PasswordService();

const sessionService = new SessionService(prismaService, configService);

const authService = new AuthService(
  prismaService,
  passwordService,
  sessionService,
);

function createEmail(prefix: string): string {
  return `${prefix}.${randomUUID()}@example.test`;
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

async function createPlatformUser(
  password: string,
  status: UserStatus = UserStatus.ACTIVE,
): Promise<{
  id: string;
  email: string;
}> {
  const email = createEmail('platform-user');
  const passwordHash = await passwordService.hashPassword(password);

  return prisma.user.create({
    data: {
      accountScope: AccountScope.PLATFORM,
      companyId: null,
      email,
      normalizedEmail: email.toLowerCase(),
      passwordHash,
      status,
      emailVerifiedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
    },
  });
}

async function createCompanyUser(
  password: string,
  companyStatus: CompanyStatus = CompanyStatus.ACTIVE,
): Promise<{
  userId: string;
  email: string;
  companyId: string;
}> {
  const company = await prisma.company.create({
    data: {
      name: `Authentication Test Company ${randomUUID()}`,
      status: companyStatus,
    },
    select: {
      id: true,
    },
  });

  const email = createEmail('company-user');
  const passwordHash = await passwordService.hashPassword(password);

  const user = await prisma.user.create({
    data: {
      accountScope: AccountScope.COMPANY,
      companyId: company.id,
      email,
      normalizedEmail: email.toLowerCase(),
      passwordHash,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
    select: {
      id: true,
    },
  });

  return {
    userId: user.id,
    email,
    companyId: company.id,
  };
}

describe('authentication integration', () => {
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

  it('authenticates a real PLATFORM user and creates a real session', async () => {
    const password = 'IntegrationPassword123!';
    const user = await createPlatformUser(password);

    const result = await authService.authenticate(user.email, password);

    expect(result.user).toEqual({
      id: user.id,
      email: user.email,
      accountScope: AccountScope.PLATFORM,
      companyId: null,
    });

    expect(result.token).toBeTruthy();
    expect(result.session.id).toBeTruthy();

    const storedSession = await prisma.session.findUnique({
      where: {
        id: result.session.id,
      },
    });

    expect(storedSession).not.toBeNull();

    if (!storedSession) {
      throw new Error('Expected a persisted session');
    }

    const expectedTokenHash = createHash('sha256')
      .update(result.token)
      .digest('hex');

    expect(storedSession.tokenHash).toBe(expectedTokenHash);
    expect(storedSession.tokenHash).not.toBe(result.token);
    expect(storedSession.userId).toBe(user.id);
    expect(storedSession.revokedAt).toBeNull();
  });

  it('authenticates the persisted session and returns the PLATFORM principal', async () => {
    const password = 'IntegrationPassword123!';
    const user = await createPlatformUser(password);

    const login = await authService.authenticate(user.email, password);

    const principal = await authService.authenticateSession(login.token);

    expect(principal).toEqual({
      sessionId: login.session.id,
      userId: user.id,
      email: user.email,
      accountScope: AccountScope.PLATFORM,
      companyId: null,
    });
  });

  it('authenticates a COMPANY user belonging to an ACTIVE company', async () => {
    const password = 'CompanyPassword123!';

    const companyUser = await createCompanyUser(password, CompanyStatus.ACTIVE);

    const result = await authService.authenticate(companyUser.email, password);

    expect(result.user).toEqual({
      id: companyUser.userId,
      email: companyUser.email,
      accountScope: AccountScope.COMPANY,
      companyId: companyUser.companyId,
    });

    const principal = await authService.authenticateSession(result.token);

    expect(principal.companyId).toBe(companyUser.companyId);
    expect(principal.accountScope).toBe(AccountScope.COMPANY);
  });

  it('rejects a wrong password without creating a session', async () => {
    const user = await createPlatformUser('CorrectIntegrationPassword123!');

    await expect(
      authService.authenticate(user.email, 'WrongIntegrationPassword123!'),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password.',
    });

    const sessionCount = await prisma.session.count({
      where: {
        userId: user.id,
      },
    });

    expect(sessionCount).toBe(0);
  });

  it('rejects a suspended user', async () => {
    const password = 'SuspendedPassword123!';

    const user = await createPlatformUser(password, UserStatus.SUSPENDED);

    await expect(
      authService.authenticate(user.email, password),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password.',
    });
  });

  it('rejects a COMPANY user whose company is suspended', async () => {
    const password = 'CompanyPassword123!';

    const companyUser = await createCompanyUser(
      password,
      CompanyStatus.SUSPENDED,
    );

    await expect(
      authService.authenticate(companyUser.email, password),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password.',
    });
  });

  it('rejects a session after logout', async () => {
    const password = 'LogoutPassword123!';
    const user = await createPlatformUser(password);

    const login = await authService.authenticate(user.email, password);

    await authService.logout(login.session.id);

    const storedSession = await prisma.session.findUnique({
      where: {
        id: login.session.id,
      },
    });

    expect(storedSession?.revokedAt).toBeInstanceOf(Date);

    await expect(
      authService.authenticateSession(login.token),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Authentication required.',
    });
  });

  it('rejects an expired persisted session', async () => {
    const password = 'ExpiredSessionPassword123!';
    const user = await createPlatformUser(password);

    const login = await authService.authenticate(user.email, password);

    await prisma.session.update({
      where: {
        id: login.session.id,
      },
      data: {
        idleExpiresAt: new Date(Date.now() - 60_000),
      },
    });

    await expect(
      authService.authenticateSession(login.token),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Authentication required.',
    });
  });

  it('invalidates an existing COMPANY session after the company is suspended', async () => {
    const password = 'CompanyPassword123!';

    const companyUser = await createCompanyUser(password, CompanyStatus.ACTIVE);

    const login = await authService.authenticate(companyUser.email, password);

    await prisma.company.update({
      where: {
        id: companyUser.companyId,
      },
      data: {
        status: CompanyStatus.SUSPENDED,
      },
    });

    await expect(
      authService.authenticateSession(login.token),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Authentication required.',
    });
  });

  it('logout-all revokes every persisted session for the user', async () => {
    const password = 'LogoutAllPassword123!';
    const user = await createPlatformUser(password);

    const firstLogin = await authService.authenticate(user.email, password);

    const secondLogin = await authService.authenticate(user.email, password);

    await authService.logoutAll(user.id);

    const sessions = await prisma.session.findMany({
      where: {
        userId: user.id,
      },
    });

    expect(sessions).toHaveLength(2);
    expect(sessions.every((session) => session.revokedAt !== null)).toBe(true);

    await expect(
      authService.authenticateSession(firstLogin.token),
    ).rejects.toMatchObject({
      status: 401,
    });

    await expect(
      authService.authenticateSession(secondLogin.token),
    ).rejects.toMatchObject({
      status: 401,
    });
  });
});
