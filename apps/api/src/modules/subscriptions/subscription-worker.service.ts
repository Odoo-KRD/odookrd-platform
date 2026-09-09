import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { SubscriptionSweepService } from './subscription-sweep.service';

const SWEEP_INTERVAL_MS = 300_000;

/**
 * Runs the subscription sweep periodically.
 *
 * Follows the same shape as NotificationWorkerService: an unref'd interval so
 * it never holds the process open, and a re-entry flag so a slow sweep is not
 * overlapped by the next tick. Cross-instance safety is handled by the advisory
 * lock inside the sweep itself.
 */
@Injectable()
export class SubscriptionWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(SubscriptionWorkerService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private readonly sweep: SubscriptionSweepService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.tick();
    }, SWEEP_INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    try {
      const outcome = await this.sweep.sweep();

      if (
        !outcome.skipped &&
        (outcome.renewed || outcome.statusChanged || outcome.remindersSent)
      ) {
        this.logger.log(
          `Subscription sweep renewed ${outcome.renewed}, updated ${outcome.statusChanged} of ${outcome.examined}, sent ${outcome.remindersSent} reminders.`,
        );
      }
    } catch {
      this.logger.error('Subscription sweep failed.');
    } finally {
      this.running = false;
    }
  }
}
