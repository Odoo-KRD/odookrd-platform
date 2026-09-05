import { ForbiddenException } from '@nestjs/common';

import { AccountScope } from '../../generated/prisma/enums';
import type { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { TrainingReportingService } from './training-reporting.service';

const companyA = '11111111-1111-4111-8111-111111111111';
const companyB = '22222222-2222-4222-8222-222222222222';

interface ScopedInput {
  where?: { companyId?: string };
}

interface GroupByInput extends ScopedInput {
  by: string[];
}

interface GroupRow {
  userId?: string;
  courseId?: string;
  status?: string;
  _count?: { _all: number };
}

type GroupByFunction = (input: GroupByInput) => Promise<GroupRow[]>;
type CountFunction = (input: ScopedInput) => Promise<number>;
type AggregateFunction = (input: ScopedInput) => Promise<{
  _count: { _all: number };
  _avg: { percentage: number | null };
}>;

function principal(
  accountScope: AccountScope,
  companyId: string | null,
  userId = 'admin-user',
): AuthenticatedPrincipal {
  return {
    sessionId: 'session-id',
    userId,
    email: `${userId}@example.com`,
    accountScope,
    companyId,
  };
}

describe('TrainingReportingService hardening', () => {
  let service: TrainingReportingService;
  let progressGroupBy: jest.MockedFunction<GroupByFunction>;
  let completionGroupBy: jest.MockedFunction<GroupByFunction>;
  let completionCount: jest.MockedFunction<CountFunction>;
  let quizGroupBy: jest.MockedFunction<GroupByFunction>;
  let quizAggregate: jest.MockedFunction<AggregateFunction>;
  let quizCount: jest.MockedFunction<CountFunction>;
  let certificateGroupBy: jest.MockedFunction<GroupByFunction>;
  let observedProgressCompanyIds: Array<string | null>;
  let observedCompletionCountCompanyIds: Array<string | null>;
  let observedQuizAggregateCompanyIds: Array<string | null>;

  beforeEach(() => {
    observedProgressCompanyIds = [];
    observedCompletionCountCompanyIds = [];
    observedQuizAggregateCompanyIds = [];

    progressGroupBy = jest.fn((input: GroupByInput) => {
      observedProgressCompanyIds.push(input.where?.companyId ?? null);
      return Promise.resolve([]);
    });
    completionGroupBy = jest.fn((input: GroupByInput) => {
      void input;
      return Promise.resolve([]);
    });
    completionCount = jest.fn((input: ScopedInput) => {
      observedCompletionCountCompanyIds.push(input.where?.companyId ?? null);
      return Promise.resolve(0);
    });
    quizGroupBy = jest.fn((input: GroupByInput) => {
      void input;
      return Promise.resolve([]);
    });
    quizAggregate = jest.fn((input: ScopedInput) => {
      observedQuizAggregateCompanyIds.push(input.where?.companyId ?? null);
      return Promise.resolve({
        _count: { _all: 0 },
        _avg: { percentage: null },
      });
    });
    quizCount = jest.fn((input: ScopedInput) => {
      void input;
      return Promise.resolve(0);
    });
    certificateGroupBy = jest.fn((input: GroupByInput) => {
      void input;
      return Promise.resolve([]);
    });

    const prisma = {
      trainingCourseProgress: { groupBy: progressGroupBy },
      trainingCourseCompletion: {
        groupBy: completionGroupBy,
        count: completionCount,
      },
      trainingQuizAttempt: {
        groupBy: quizGroupBy,
        aggregate: quizAggregate,
        count: quizCount,
      },
      trainingCertificate: { groupBy: certificateGroupBy },
    } as unknown as PrismaService;

    service = new TrainingReportingService(prisma);
  });

  it('counts active learners from the complete activity union without duplicates', async () => {
    progressGroupBy.mockImplementation((input: GroupByInput) =>
      Promise.resolve(
        input.by.includes('userId') ? [{ userId: 'user-1' }] : [],
      ),
    );
    completionGroupBy.mockResolvedValue([{ userId: 'user-2' }]);
    quizGroupBy.mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-3' }]);
    certificateGroupBy.mockImplementation((input: GroupByInput) =>
      Promise.resolve(
        input.by.includes('userId') ? [{ userId: 'user-4' }] : [],
      ),
    );

    const result = await service.overview(
      principal(AccountScope.PLATFORM, null),
      {},
    );

    expect(result.activeLearners).toBe(4);
  });

  it('forces company administrators to their own company scope', async () => {
    await service.overview(principal(AccountScope.COMPANY, companyA), {});

    expect(observedProgressCompanyIds).toEqual([companyA, companyA]);
    expect(observedCompletionCountCompanyIds).toEqual([companyA]);
    expect(observedQuizAggregateCompanyIds).toEqual([companyA]);
  });

  it('rejects a company administrator requesting another company', async () => {
    await expect(
      service.overview(principal(AccountScope.COMPANY, companyA), {
        companyId: companyB,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(progressGroupBy).not.toHaveBeenCalled();
    expect(completionCount).not.toHaveBeenCalled();
    expect(quizAggregate).not.toHaveBeenCalled();
  });

  it('rejects malformed platform principals carrying a company scope', async () => {
    await expect(
      service.overview(principal(AccountScope.PLATFORM, companyA), {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
