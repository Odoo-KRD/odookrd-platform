import type { HealthIndicatorService } from '@nestjs/terminus';

import type { PrismaService } from '../../infrastructure/database/prisma.service';
import { DatabaseHealthIndicator } from './database-health.indicator';

function indicatorFor(queryRaw: () => Promise<unknown>) {
  const up = jest.fn().mockReturnValue({ database: { status: 'up' } });
  const down = jest.fn().mockReturnValue({ database: { status: 'down' } });

  const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;
  const service = {
    check: jest.fn().mockReturnValue({ up, down }),
  } as unknown as HealthIndicatorService;

  return {
    indicator: new DatabaseHealthIndicator(prisma, service),
    up,
    down,
  };
}

describe('DatabaseHealthIndicator', () => {
  it('reports up when the database answers', async () => {
    const { indicator, up, down } = indicatorFor(() => Promise.resolve([{}]));

    await indicator.isHealthy('database');

    expect(up).toHaveBeenCalled();
    expect(down).not.toHaveBeenCalled();
  });

  it('reports down when the database refuses', async () => {
    const { indicator, up, down } = indicatorFor(() =>
      Promise.reject(new Error('ECONNREFUSED')),
    );

    await indicator.isHealthy('database');

    expect(down).toHaveBeenCalled();
    expect(up).not.toHaveBeenCalled();
  });

  it('reports down rather than hanging when the database never answers', async () => {
    jest.useFakeTimers();

    // A query that never settles is the case a plain await cannot survive: the
    // endpoint would never respond and a monitor would record a timeout rather
    // than a clean failure.
    const { indicator, up, down } = indicatorFor(() => new Promise(() => {}));

    const result = indicator.isHealthy('database');
    await jest.advanceTimersByTimeAsync(3_500);
    await result;

    expect(down).toHaveBeenCalled();
    expect(up).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('surfaces no failure detail to the caller', async () => {
    const { indicator, down } = indicatorFor(() =>
      Promise.reject(
        new Error('connect ECONNREFUSED 10.0.0.5:5432 user=odookrd_app'),
      ),
    );

    await indicator.isHealthy('database');

    // down() is called with nothing: the reason a database is unavailable is
    // not published on an endpoint polled from the public internet.
    expect(down).toHaveBeenCalledWith();
  });
});
