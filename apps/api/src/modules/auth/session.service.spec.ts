import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { SessionService } from './session.service';

interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  lastSeenAt: Date;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

interface SessionCreateArgs {
  data: {
    userId: string;
    tokenHash: string;
    lastSeenAt: Date;
    idleExpiresAt: Date;
    absoluteExpiresAt: Date;
  };
}

interface SessionFindUniqueArgs {
  where: {
    tokenHash: string;
  };
}

interface SessionUpdateManyArgs {
  where: {
    id?: string;
    tokenHash?: string;
    userId?: string;
    revokedAt: null;
    idleExpiresAt?: {
      gt: Date;
    };
    absoluteExpiresAt?: {
      gt: Date;
    };
  };
  data: {
    lastSeenAt?: Date;
    idleExpiresAt?: Date;
    revokedAt?: Date;
  };
}

describe('SessionService', () => {
  let service: SessionService;

  let capturedCreateArgs: SessionCreateArgs | undefined;
  let capturedFindUniqueArgs: SessionFindUniqueArgs | undefined;
  let capturedUpdateManyArgs: SessionUpdateManyArgs | undefined;

  let createResult: { id: string };
  let findUniqueResult: SessionRecord | null;
  let updateManyResult: { count: number };

  const createMock = jest.fn(
    (args: SessionCreateArgs): Promise<{ id: string }> => {
      capturedCreateArgs = args;

      return Promise.resolve(createResult);
    },
  );

  const findUniqueMock = jest.fn(
    (args: SessionFindUniqueArgs): Promise<SessionRecord | null> => {
      capturedFindUniqueArgs = args;

      return Promise.resolve(findUniqueResult);
    },
  );

  const updateManyMock = jest.fn(
    (args: SessionUpdateManyArgs): Promise<{ count: number }> => {
      capturedUpdateManyArgs = args;

      return Promise.resolve(updateManyResult);
    },
  );

  const prisma = {
    session: {
      create: createMock,
      findUnique: findUniqueMock,
      updateMany: updateManyMock,
    },
  } as unknown as PrismaService;

  const configService = {
    getOrThrow(key: string): number {
      switch (key) {
        case 'AUTH_SESSION_IDLE_TTL_SECONDS':
          return 1800;

        case 'AUTH_SESSION_ABSOLUTE_TTL_SECONDS':
          return 86400;

        default:
          throw new Error(`Unexpected configuration key: ${key}`);
      }
    },
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();

    capturedCreateArgs = undefined;
    capturedFindUniqueArgs = undefined;
    capturedUpdateManyArgs = undefined;

    createResult = {
      id: 'session-id',
    };

    findUniqueResult = null;

    updateManyResult = {
      count: 0,
    };

    service = new SessionService(prisma, configService);
  });

  it('creates a session while storing only the token hash', async () => {
    const result = await service.createSession('user-id');

    const expectedHash = createHash('sha256')
      .update(result.token)
      .digest('hex');

    expect(result.token).toBeTruthy();
    expect(result.token).not.toBe(expectedHash);

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(capturedCreateArgs).toBeDefined();

    if (!capturedCreateArgs) {
      throw new Error('Expected session create arguments');
    }

    expect(capturedCreateArgs.data.userId).toBe('user-id');
    expect(capturedCreateArgs.data.tokenHash).toBe(expectedHash);
    expect(capturedCreateArgs.data.lastSeenAt).toBeInstanceOf(Date);
    expect(capturedCreateArgs.data.idleExpiresAt).toBeInstanceOf(Date);
    expect(capturedCreateArgs.data.absoluteExpiresAt).toBeInstanceOf(Date);

    expect(result.idleExpiresAt).toEqual(capturedCreateArgs.data.idleExpiresAt);

    expect(result.absoluteExpiresAt).toEqual(
      capturedCreateArgs.data.absoluteExpiresAt,
    );
  });

  it('uses a SHA-256 hash for session lookup', async () => {
    const token = 'valid-session-token';

    findUniqueResult = null;

    await service.validateSession(token);

    const expectedHash = createHash('sha256').update(token).digest('hex');

    expect(findUniqueMock).toHaveBeenCalledTimes(1);
    expect(capturedFindUniqueArgs).toBeDefined();

    if (!capturedFindUniqueArgs) {
      throw new Error('Expected session lookup arguments');
    }

    expect(capturedFindUniqueArgs.where.tokenHash).toBe(expectedHash);
  });

  it('validates an active session and refreshes its idle expiry', async () => {
    const token = 'valid-session-token';
    const absoluteExpiresAt = new Date(Date.now() + 3_600_000);

    findUniqueResult = {
      id: 'session-id',
      userId: 'user-id',
      tokenHash: createHash('sha256').update(token).digest('hex'),
      lastSeenAt: new Date(),
      idleExpiresAt: new Date(Date.now() + 60_000),
      absoluteExpiresAt,
      revokedAt: null,
      createdAt: new Date(),
    };

    updateManyResult = {
      count: 1,
    };

    const result = await service.validateSession(token);

    expect(result).not.toBeNull();

    if (!result) {
      throw new Error('Expected a validated session');
    }

    expect(result.id).toBe('session-id');
    expect(result.userId).toBe('user-id');
    expect(result.lastSeenAt).toBeInstanceOf(Date);
    expect(result.idleExpiresAt).toBeInstanceOf(Date);
    expect(result.absoluteExpiresAt).toEqual(absoluteExpiresAt);

    expect(updateManyMock).toHaveBeenCalledTimes(1);
    expect(capturedUpdateManyArgs).toBeDefined();

    if (!capturedUpdateManyArgs) {
      throw new Error('Expected session update arguments');
    }

    expect(capturedUpdateManyArgs.where.id).toBe('session-id');
    expect(capturedUpdateManyArgs.where.revokedAt).toBeNull();

    expect(capturedUpdateManyArgs.where.idleExpiresAt?.gt).toBeInstanceOf(Date);

    expect(capturedUpdateManyArgs.where.absoluteExpiresAt?.gt).toBeInstanceOf(
      Date,
    );

    expect(capturedUpdateManyArgs.data.lastSeenAt).toBeInstanceOf(Date);
    expect(capturedUpdateManyArgs.data.idleExpiresAt).toBeInstanceOf(Date);
  });

  it('never extends idle expiry beyond absolute expiry', async () => {
    const absoluteExpiresAt = new Date(Date.now() + 10_000);

    findUniqueResult = {
      id: 'session-id',
      userId: 'user-id',
      tokenHash: 'hash',
      lastSeenAt: new Date(),
      idleExpiresAt: new Date(Date.now() + 5_000),
      absoluteExpiresAt,
      revokedAt: null,
      createdAt: new Date(),
    };

    updateManyResult = {
      count: 1,
    };

    const result = await service.validateSession('session-token');

    expect(result).not.toBeNull();

    if (!result) {
      throw new Error('Expected a validated session');
    }

    expect(result.idleExpiresAt.getTime()).toBeLessThanOrEqual(
      absoluteExpiresAt.getTime(),
    );
  });

  it('rejects an idle-expired session', async () => {
    findUniqueResult = {
      id: 'session-id',
      userId: 'user-id',
      tokenHash: 'hash',
      lastSeenAt: new Date(),
      idleExpiresAt: new Date(Date.now() - 1_000),
      absoluteExpiresAt: new Date(Date.now() + 3_600_000),
      revokedAt: null,
      createdAt: new Date(),
    };

    await expect(service.validateSession('expired-token')).resolves.toBeNull();

    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it('rejects an absolute-expired session', async () => {
    findUniqueResult = {
      id: 'session-id',
      userId: 'user-id',
      tokenHash: 'hash',
      lastSeenAt: new Date(),
      idleExpiresAt: new Date(Date.now() + 60_000),
      absoluteExpiresAt: new Date(Date.now() - 1_000),
      revokedAt: null,
      createdAt: new Date(),
    };

    await expect(service.validateSession('expired-token')).resolves.toBeNull();

    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it('rejects a revoked session', async () => {
    findUniqueResult = {
      id: 'session-id',
      userId: 'user-id',
      tokenHash: 'hash',
      lastSeenAt: new Date(),
      idleExpiresAt: new Date(Date.now() + 60_000),
      absoluteExpiresAt: new Date(Date.now() + 3_600_000),
      revokedAt: new Date(),
      createdAt: new Date(),
    };

    await expect(service.validateSession('revoked-token')).resolves.toBeNull();

    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it('returns null for an unknown session token', async () => {
    findUniqueResult = null;

    await expect(service.validateSession('unknown-token')).resolves.toBeNull();

    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it('returns null when session validation loses a concurrent race', async () => {
    findUniqueResult = {
      id: 'session-id',
      userId: 'user-id',
      tokenHash: 'hash',
      lastSeenAt: new Date(),
      idleExpiresAt: new Date(Date.now() + 60_000),
      absoluteExpiresAt: new Date(Date.now() + 3_600_000),
      revokedAt: null,
      createdAt: new Date(),
    };

    updateManyResult = {
      count: 0,
    };

    await expect(service.validateSession('session-token')).resolves.toBeNull();
  });

  it('revokes a specific session using its token hash', async () => {
    updateManyResult = {
      count: 1,
    };

    const token = 'session-token';

    await expect(service.revokeSession(token)).resolves.toBe(true);

    const expectedHash = createHash('sha256').update(token).digest('hex');

    expect(updateManyMock).toHaveBeenCalledTimes(1);
    expect(capturedUpdateManyArgs).toBeDefined();

    if (!capturedUpdateManyArgs) {
      throw new Error('Expected session revoke arguments');
    }

    expect(capturedUpdateManyArgs.where.tokenHash).toBe(expectedHash);
    expect(capturedUpdateManyArgs.where.revokedAt).toBeNull();
    expect(capturedUpdateManyArgs.data.revokedAt).toBeInstanceOf(Date);
  });

  it('returns false when no session is revoked', async () => {
    updateManyResult = {
      count: 0,
    };

    await expect(service.revokeSession('unknown-token')).resolves.toBe(false);
  });

  it('revokes all active sessions for a user', async () => {
    updateManyResult = {
      count: 3,
    };

    await expect(service.revokeAllUserSessions('user-id')).resolves.toBe(3);

    expect(updateManyMock).toHaveBeenCalledTimes(1);
    expect(capturedUpdateManyArgs).toBeDefined();

    if (!capturedUpdateManyArgs) {
      throw new Error('Expected user session revoke arguments');
    }

    expect(capturedUpdateManyArgs.where.userId).toBe('user-id');
    expect(capturedUpdateManyArgs.where.revokedAt).toBeNull();
    expect(capturedUpdateManyArgs.data.revokedAt).toBeInstanceOf(Date);
  });

  it('rejects an empty token without querying the database', async () => {
    await expect(service.validateSession('')).resolves.toBeNull();

    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it('does not attempt to revoke an empty token', async () => {
    await expect(service.revokeSession('')).resolves.toBe(false);

    expect(updateManyMock).not.toHaveBeenCalled();
  });
});
