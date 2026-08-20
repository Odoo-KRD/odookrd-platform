import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface AttemptBucket {
  failures: number;
  windowStartedAt: number;
}

@Injectable()
export class LoginThrottleService {
  private static readonly MAX_TRACKED_BUCKETS = 50_000;
  private static readonly PRUNE_INTERVAL = 100;

  private readonly maxAttempts: number;
  private readonly windowMilliseconds: number;

  private readonly buckets = new Map<string, AttemptBucket>();

  private writesSincePrune = 0;

  constructor(configService: ConfigService) {
    this.maxAttempts = configService.getOrThrow<number>(
      'AUTH_LOGIN_MAX_ATTEMPTS',
    );

    this.windowMilliseconds =
      configService.getOrThrow<number>('AUTH_LOGIN_WINDOW_SECONDS') * 1000;
  }

  assertAllowed(clientAddress: string, email: string): void {
    const now = Date.now();

    const blockedByIp = this.isBlocked(this.ipKey(clientAddress), now);

    const blockedByEmail = this.isBlocked(this.emailKey(email), now);

    if (blockedByIp || blockedByEmail) {
      throw new HttpException(
        'Too many login attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordFailure(clientAddress: string, email: string): void {
    const now = Date.now();

    this.increment(this.ipKey(clientAddress), now);
    this.increment(this.emailKey(email), now);

    this.writesSincePrune += 1;

    if (
      this.writesSincePrune >= LoginThrottleService.PRUNE_INTERVAL ||
      this.buckets.size > LoginThrottleService.MAX_TRACKED_BUCKETS
    ) {
      this.pruneExpired(now);
      this.writesSincePrune = 0;
    }
  }

  recordSuccess(email: string): void {
    this.buckets.delete(this.emailKey(email));
  }

  private increment(key: string, now: number): void {
    const bucket = this.buckets.get(key);

    if (!bucket || now - bucket.windowStartedAt >= this.windowMilliseconds) {
      this.buckets.set(key, {
        failures: 1,
        windowStartedAt: now,
      });

      return;
    }

    bucket.failures += 1;
  }

  private isBlocked(key: string, now: number): boolean {
    const bucket = this.buckets.get(key);

    if (!bucket) {
      return false;
    }

    if (now - bucket.windowStartedAt >= this.windowMilliseconds) {
      this.buckets.delete(key);

      return false;
    }

    return bucket.failures >= this.maxAttempts;
  }

  private pruneExpired(now: number): void {
    for (const [key, bucket] of this.buckets) {
      if (now - bucket.windowStartedAt >= this.windowMilliseconds) {
        this.buckets.delete(key);
      }
    }
  }

  private ipKey(clientAddress: string): string {
    return `ip:${clientAddress}`;
  }

  private emailKey(email: string): string {
    return `email:${email.trim().toLowerCase()}`;
  }
}
