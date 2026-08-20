import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';

import { LoginThrottleService } from './login-throttle.service';

describe('LoginThrottleService', () => {
  let service: LoginThrottleService;

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

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

    service = new LoginThrottleService(configService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows login attempts before the configured failure limit', () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(() =>
        service.assertAllowed('192.0.2.10', 'user@example.com'),
      ).not.toThrow();

      service.recordFailure('192.0.2.10', 'user@example.com');
    }
  });

  it('blocks the next attempt after reaching the failure limit', () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      service.recordFailure('192.0.2.10', 'user@example.com');
    }

    expect(() =>
      service.assertAllowed('192.0.2.10', 'user@example.com'),
    ).toThrow(HttpException);

    try {
      service.assertAllowed('192.0.2.10', 'user@example.com');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(HttpException);

      if (!(error instanceof HttpException)) {
        throw new Error('Expected HttpException');
      }

      expect(error.getStatus()).toBe(429);
    }
  });

  it('blocks repeated failures from the same IP across different emails', () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      service.recordFailure('192.0.2.10', `user${attempt}@example.com`);
    }

    expect(() =>
      service.assertAllowed('192.0.2.10', 'another@example.com'),
    ).toThrow(HttpException);
  });

  it('blocks repeated failures against the same email across different IPs', () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      service.recordFailure(`192.0.2.${attempt + 1}`, 'target@example.com');
    }

    expect(() =>
      service.assertAllowed('198.51.100.10', 'target@example.com'),
    ).toThrow(HttpException);
  });

  it('normalizes email addresses when tracking failures', () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      service.recordFailure(`192.0.2.${attempt + 1}`, '  User@Example.COM  ');
    }

    expect(() =>
      service.assertAllowed('198.51.100.10', 'user@example.com'),
    ).toThrow(HttpException);
  });

  it('clears the email failure bucket after a successful login', () => {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      service.recordFailure(`192.0.2.${attempt + 1}`, 'user@example.com');
    }

    service.recordSuccess('USER@example.com');

    expect(() =>
      service.assertAllowed('198.51.100.10', 'user@example.com'),
    ).not.toThrow();
  });

  it('does not clear the IP failure bucket after a successful login', () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      service.recordFailure('192.0.2.10', `user${attempt}@example.com`);
    }

    service.recordSuccess('user0@example.com');

    expect(() =>
      service.assertAllowed('192.0.2.10', 'new@example.com'),
    ).toThrow(HttpException);
  });

  it('allows attempts again after the throttle window expires', () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      service.recordFailure('192.0.2.10', 'user@example.com');
    }

    expect(() =>
      service.assertAllowed('192.0.2.10', 'user@example.com'),
    ).toThrow(HttpException);

    jest.spyOn(Date, 'now').mockReturnValue(1_000_000 + 901_000);

    expect(() =>
      service.assertAllowed('192.0.2.10', 'user@example.com'),
    ).not.toThrow();
  });
});
