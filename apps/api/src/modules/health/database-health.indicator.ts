import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorService,
  type HealthIndicatorResult,
} from '@nestjs/terminus';

import { PrismaService } from '../../infrastructure/database/prisma.service';

/**
 * A hung database is worse than a refused one: without a deadline the query
 * never settles, the health endpoint never responds, and an uptime monitor
 * records a timeout rather than a clean failure. Bounding the check means
 * readiness always answers, one way or the other.
 */
const PROBE_TIMEOUT_MS = 3_000;

@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error('Database probe timed out.')),
            PROBE_TIMEOUT_MS,
          );

          // Do not hold the event loop open for the sake of a probe.
          timer.unref();
        }),
      ]);

      return indicator.up();
    } catch {
      // Deliberately no detail: this endpoint is polled from outside, and the
      // reason a database is unavailable is not something to publish.
      return indicator.down();
    }
  }
}
