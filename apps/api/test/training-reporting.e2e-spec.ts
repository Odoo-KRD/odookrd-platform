import {
  ForbiddenException,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { configureApplication } from '../src/app.setup';
import { AccountScope } from '../src/generated/prisma/enums';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { AuthenticatedGuard } from '../src/modules/auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../src/modules/auth/interfaces/authenticated-principal.interface';
import { AuthorizationService } from '../src/modules/authorization/authorization.service';
import { AuthorizationGuard } from '../src/modules/authorization/guards/authorization.guard';
import { PERMISSIONS } from '../src/modules/authorization/permissions';
import { TrainingReportingController } from '../src/modules/training/training-reporting.controller';
import { TrainingReportingService } from '../src/modules/training/training-reporting.service';

const companyA = '11111111-1111-4111-8111-111111111111';
const companyB = '22222222-2222-4222-8222-222222222222';

interface GroupByInput {
  where?: { companyId?: string };
}

const principals: Record<string, AuthenticatedPrincipal> = {
  'platform-token': {
    sessionId: 'platform-session',
    userId: 'platform-admin',
    email: 'platform@example.com',
    accountScope: AccountScope.PLATFORM,
    companyId: null,
  },
  'company-admin-token': {
    sessionId: 'company-session',
    userId: 'company-admin',
    email: 'admin@example.com',
    accountScope: AccountScope.COMPANY,
    companyId: companyA,
  },
  'company-user-token': {
    sessionId: 'user-session',
    userId: 'company-user',
    email: 'user@example.com',
    accountScope: AccountScope.COMPANY,
    companyId: companyA,
  },
  'malformed-platform-token': {
    sessionId: 'bad-platform-session',
    userId: 'bad-platform',
    email: 'bad-platform@example.com',
    accountScope: AccountScope.PLATFORM,
    companyId: companyA,
  },
};

describe('Training reporting security API (e2e)', () => {
  let app: INestApplication<App>;
  let assertPermissions: jest.Mock;
  let observedProgressCompanyIds: Array<string | null>;

  beforeEach(async () => {
    observedProgressCompanyIds = [];

    const progressGroupBy = jest.fn((input: GroupByInput) => {
      observedProgressCompanyIds.push(input.where?.companyId ?? null);
      return Promise.resolve([]);
    });

    const prisma = {
      trainingCourseProgress: {
        groupBy: progressGroupBy,
      },
      trainingCourseCompletion: {
        groupBy: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      trainingQuizAttempt: {
        groupBy: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({
          _count: { _all: 0 },
          _avg: { percentage: null },
        }),
        count: jest.fn().mockResolvedValue(0),
      },
      trainingCertificate: {
        groupBy: jest.fn().mockResolvedValue([]),
      },
    } as unknown as PrismaService;

    const authService = {
      authenticateSession(token: string): Promise<AuthenticatedPrincipal> {
        const authenticatedPrincipal = principals[token];
        if (!authenticatedPrincipal) {
          return Promise.reject(
            new UnauthorizedException('Authentication required.'),
          );
        }
        return Promise.resolve(authenticatedPrincipal);
      },
    };

    assertPermissions = jest.fn(
      (principal: AuthenticatedPrincipal, required: readonly string[]) => {
        expect(required).toEqual([PERMISSIONS.TRAINING_REPORTS_READ]);
        if (principal.userId === 'company-user') {
          return Promise.reject(
            new ForbiddenException('Required permission is missing.'),
          );
        }
        return Promise.resolve();
      },
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TrainingReportingController],
      providers: [
        Reflector,
        AuthenticatedGuard,
        AuthorizationGuard,
        TrainingReportingService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: authService },
        {
          provide: AuthorizationService,
          useValue: { assertPermissions },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('rejects unauthenticated reporting requests', async () => {
    await request(app.getHttpServer())
      .get('/v1/training/reports/overview')
      .expect(401);
  });

  it('rejects a standard company user without the reporting permission', async () => {
    await request(app.getHttpServer())
      .get('/v1/training/reports/overview')
      .set('Authorization', 'Bearer company-user-token')
      .expect(403);
  });

  it('allows a company administrator only within their own company', async () => {
    await request(app.getHttpServer())
      .get(`/v1/training/reports/overview?companyId=${companyA}`)
      .set('Authorization', 'Bearer company-admin-token')
      .expect(200)
      .expect({
        activeLearners: 0,
        coursesEngaged: 0,
        completions: 0,
        quizAttempts: 0,
        quizPassRate: null,
        quizAverageScore: null,
        certificatesIssued: 0,
        activeCertificates: 0,
        revokedCertificates: 0,
      });

    expect(observedProgressCompanyIds).toEqual([companyA, companyA]);
  });

  it('rejects cross-company report access for a company administrator', async () => {
    await request(app.getHttpServer())
      .get(`/v1/training/reports/overview?companyId=${companyB}`)
      .set('Authorization', 'Bearer company-admin-token')
      .expect(403);
  });

  it('allows platform administration to select a company scope', async () => {
    await request(app.getHttpServer())
      .get(`/v1/training/reports/overview?companyId=${companyB}`)
      .set('Authorization', 'Bearer platform-token')
      .expect(200);

    expect(observedProgressCompanyIds).toEqual([companyB, companyB]);
  });

  it('rejects malformed platform principals carrying a company id', async () => {
    await request(app.getHttpServer())
      .get('/v1/training/reports/overview')
      .set('Authorization', 'Bearer malformed-platform-token')
      .expect(403);
  });

  it('rejects invalid UUID filters and unknown query properties', async () => {
    await request(app.getHttpServer())
      .get('/v1/training/reports/overview?companyId=not-a-uuid')
      .set('Authorization', 'Bearer platform-token')
      .expect(400);

    await request(app.getHttpServer())
      .get('/v1/training/reports/overview?unexpected=true')
      .set('Authorization', 'Bearer platform-token')
      .expect(400);
  });

  it('rejects reversed date ranges', async () => {
    await request(app.getHttpServer())
      .get(
        '/v1/training/reports/overview?dateFrom=2026-09-05&dateTo=2026-09-04',
      )
      .set('Authorization', 'Bearer platform-token')
      .expect(400);
  });

  it('enforces company isolation on CSV export before querying data', async () => {
    await request(app.getHttpServer())
      .get(`/v1/training/reports/export?dataset=courses&companyId=${companyB}`)
      .set('Authorization', 'Bearer company-admin-token')
      .expect(403);

    expect(observedProgressCompanyIds).toHaveLength(0);
  });

  it('validates the export dataset', async () => {
    await request(app.getHttpServer())
      .get('/v1/training/reports/export?dataset=unknown')
      .set('Authorization', 'Bearer platform-token')
      .expect(400);
  });
});
