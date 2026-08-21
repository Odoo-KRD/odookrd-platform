import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { configureApplication } from '../../src/app.setup';
import { AccountScope } from '../../src/generated/prisma/enums';
import { AuthorizationService } from '../../src/modules/authorization/authorization.service';
import { AuthController } from '../../src/modules/auth/auth.controller';
import {
  AuthenticationResult,
  AuthService,
} from '../../src/modules/auth/auth.service';
import { AuthenticatedGuard } from '../../src/modules/auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../../src/modules/auth/interfaces/authenticated-principal.interface';
import { LoginThrottleService } from '../../src/modules/auth/login-throttle.service';

describe('Authentication API (e2e)', () => {
  let app: INestApplication<App>;

  let loginShouldFail: boolean;
  let sessionShouldFail: boolean;

  let capturedEmail: string | undefined;
  let capturedPassword: string | undefined;
  let capturedSessionToken: string | undefined;
  let capturedLogoutSessionId: string | undefined;
  let capturedLogoutAllUserId: string | undefined;

  const authenticationResult: AuthenticationResult = {
    token: 'raw-session-token',
    session: {
      id: 'session-id',
      idleExpiresAt: new Date('2026-08-20T12:30:00.000Z'),
      absoluteExpiresAt: new Date('2026-08-21T12:00:00.000Z'),
    },
    user: {
      id: 'user-id',
      email: 'user@example.com',
      accountScope: AccountScope.PLATFORM,
      companyId: null,
    },
  };

  const principal: AuthenticatedPrincipal = {
    sessionId: 'session-id',
    userId: 'user-id',
    email: 'user@example.com',
    accountScope: AccountScope.PLATFORM,
    companyId: null,
  };

  const authService = {
    authenticate(
      email: string,
      password: string,
    ): Promise<AuthenticationResult> {
      capturedEmail = email;
      capturedPassword = password;

      if (loginShouldFail) {
        return Promise.reject(
          new UnauthorizedException('Invalid email or password.'),
        );
      }

      return Promise.resolve(authenticationResult);
    },

    authenticateSession(token: string): Promise<AuthenticatedPrincipal> {
      capturedSessionToken = token;

      if (sessionShouldFail) {
        return Promise.reject(
          new UnauthorizedException('Authentication required.'),
        );
      }

      return Promise.resolve(principal);
    },

    logout(sessionId: string): Promise<void> {
      capturedLogoutSessionId = sessionId;

      return Promise.resolve();
    },

    logoutAll(userId: string): Promise<void> {
      capturedLogoutAllUserId = userId;

      return Promise.resolve();
    },
  };

  const configService = {
    getOrThrow(key: string): number {
      switch (key) {
        case 'AUTH_LOGIN_MAX_ATTEMPTS':
          return 5;

        case 'AUTH_LOGIN_WINDOW_SECONDS':
          return 900;

        default:
          throw new Error(`Unexpected configuration key: ${key}`);
      }
    },
  } as unknown as ConfigService;

  beforeEach(async () => {
    loginShouldFail = false;
    sessionShouldFail = false;

    capturedEmail = undefined;
    capturedPassword = undefined;
    capturedSessionToken = undefined;
    capturedLogoutSessionId = undefined;
    capturedLogoutAllUserId = undefined;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthorizationService,
          useValue: {
            resolveContext: jest.fn().mockResolvedValue({
              roleKeys: ['platform_admin'],
              permissions: ['users.read', 'companies.read'],
            }),
          },
        },
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        AuthenticatedGuard,
        LoginThrottleService,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    configureApplication(app);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('authenticates through POST /v1/auth/login', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'correct-password',
      })
      .expect(200)
      .expect({
        token: 'raw-session-token',
        session: {
          id: 'session-id',
          idleExpiresAt: '2026-08-20T12:30:00.000Z',
          absoluteExpiresAt: '2026-08-21T12:00:00.000Z',
        },
        user: {
          id: 'user-id',
          email: 'user@example.com',
          accountScope: 'PLATFORM',
          companyId: null,
        },
      });

    expect(capturedEmail).toBe('user@example.com');
    expect(capturedPassword).toBe('correct-password');
  });

  it('rejects invalid login credentials', async () => {
    loginShouldFail = true;

    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'wrong-password',
      })
      .expect(401);
  });

  it('throttles login after the configured failure limit', async () => {
    loginShouldFail = true;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({
          email: 'target@example.com',
          password: 'wrong-password',
        })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'target@example.com',
        password: 'wrong-password',
      })
      .expect(429);
  });

  it('rejects an invalid email', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'not-an-email',
        password: 'password',
      })
      .expect(400);
  });

  it('rejects a missing password', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'user@example.com',
      })
      .expect(400);
  });

  it('rejects unknown login properties', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'password',
        unexpected: 'not-allowed',
      })
      .expect(400);
  });

  it('returns the authenticated user through GET /v1/auth/me', async () => {
    await request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', 'Bearer valid-session-token')
      .expect(200)
      .expect({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          accountScope: 'PLATFORM',
          companyId: null,
        },
        authorization: {
          roles: ['platform_admin'],
          permissions: ['companies.read', 'users.read'],
        },
      });

    expect(capturedSessionToken).toBe('valid-session-token');
  });

  it('rejects /me without authentication', async () => {
    await request(app.getHttpServer()).get('/v1/auth/me').expect(401);
  });

  it('rejects /me with an invalid session', async () => {
    sessionShouldFail = true;

    await request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('logs out the current session', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/logout')
      .set('Authorization', 'Bearer valid-session-token')
      .expect(204);

    expect(capturedLogoutSessionId).toBe('session-id');
  });

  it('logs out all sessions belonging to the current user', async () => {
    await request(app.getHttpServer())
      .post('/v1/auth/logout-all')
      .set('Authorization', 'Bearer valid-session-token')
      .expect(204);

    expect(capturedLogoutAllUserId).toBe('user-id');
  });

  it('rejects authenticated routes without the v1 prefix', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer valid-session-token')
      .expect(404);
  });
});
