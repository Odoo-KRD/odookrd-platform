import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { NotificationDispatcherService } from './notification-dispatcher.service';

@Injectable()
export class NotificationWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationWorkerService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private readonly dispatcher: NotificationDispatcherService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.tick();
    }, 60_000);
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
      await this.dispatcher.dispatchDue();
    } catch {
      this.logger.error('Notification delivery sweep failed.');
    } finally {
      this.running = false;
    }
  }
}
