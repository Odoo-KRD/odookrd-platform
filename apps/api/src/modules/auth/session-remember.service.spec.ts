import { ConfigService } from '@nestjs/config';

import type { PrismaService } from '../../infrastructure/database/prisma.service';
import { SessionService } from './session.service';

interface CreateArgs {
  data: {
    userId: string;
    tokenHash: string;
    lastSeenAt: Date;
    idleExpiresAt: Date;
    absoluteExpiresAt: Date;
  };
}

describe('SessionService remember me', () => {
  let capturedCreate: CreateArgs | undefined;

  const prisma = {
    session: {
      create: jest.fn((args: CreateArgs) => {
        capturedCreate = args;
        return Promise.resolve({ id: 'remember-session-id' });
      }),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const config = {
    getOrThrow(key: string): number {
      switch (key) {
        case 'AUTH_SESSION_IDLE_TTL_SECONDS':
          return 1800;
        case 'AUTH_SESSION_ABSOLUTE_TTL_SECONDS':
          return 86400;
        case 'AUTH_REMEMBER_SESSION_IDLE_TTL_SECONDS':
          return 604800;
        case 'AUTH_REMEMBER_SESSION_ABSOLUTE_TTL_SECONDS':
          return 2592000;
        default:
          throw new Error(`Unexpected configuration key: ${key}`);
      }
    },
  } as unknown as ConfigService;

  beforeEach(() => {
    capturedCreate = undefined;
    jest.clearAllMocks();
  });

  it('creates a persistent server session with the configured remembered TTLs', async () => {
    const service = new SessionService(prisma, config);
    const result = await service.createSession('user-id', true);

    expect(capturedCreate).toBeDefined();

    if (!capturedCreate) {
      throw new Error('Expected a remembered session create call.');
    }

    const idleSeconds = Math.round(
      (capturedCreate.data.idleExpiresAt.getTime() -
        capturedCreate.data.lastSeenAt.getTime()) /
        1000,
    );
    const absoluteSeconds = Math.round(
      (capturedCreate.data.absoluteExpiresAt.getTime() -
        capturedCreate.data.lastSeenAt.getTime()) /
        1000,
    );

    expect(idleSeconds).toBe(604800);
    expect(absoluteSeconds).toBe(2592000);
    expect(result.sessionId).toBe('remember-session-id');
  });
});
