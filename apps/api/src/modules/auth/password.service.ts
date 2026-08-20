import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

@Injectable()
export class PasswordService {
  private readonly dummyHashPromise: Promise<string>;

  constructor() {
    const dummyPassword = randomBytes(32).toString('base64url');

    this.dummyHashPromise = argon2.hash(dummyPassword, ARGON2_OPTIONS);
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, ARGON2_OPTIONS);
  }

  async verifyPassword(
    passwordHash: string,
    password: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(passwordHash, password);
    } catch {
      return false;
    }
  }

  async verifyPasswordOrDummy(
    passwordHash: string | null,
    password: string,
  ): Promise<boolean> {
    const effectiveHash = passwordHash ?? (await this.dummyHashPromise);

    const verified = await this.verifyPassword(effectiveHash, password);

    return passwordHash !== null && verified;
  }
}
