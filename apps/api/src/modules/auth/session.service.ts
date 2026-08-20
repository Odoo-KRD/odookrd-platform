import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';

import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface CreatedSession {
  token: string;
  sessionId: string;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
}

export interface ValidatedSession {
  id: string;
  userId: string;
  lastSeenAt: Date;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
}

@Injectable()
export class SessionService {
  private readonly idleTtlSeconds: number;
  private readonly absoluteTtlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.idleTtlSeconds = configService.getOrThrow<number>(
      'AUTH_SESSION_IDLE_TTL_SECONDS',
    );

    this.absoluteTtlSeconds = configService.getOrThrow<number>(
      'AUTH_SESSION_ABSOLUTE_TTL_SECONDS',
    );
  }

  async createSession(userId: string): Promise<CreatedSession> {
    const token = this.generateToken();
    const tokenHash = this.hashToken(token);

    const now = new Date();
    const absoluteExpiresAt = new Date(
      now.getTime() + this.absoluteTtlSeconds * 1000,
    );

    const idleExpiresAt = new Date(
      Math.min(
        now.getTime() + this.idleTtlSeconds * 1000,
        absoluteExpiresAt.getTime(),
      ),
    );

    const session = await this.prisma.session.create({
      data: {
        userId,
        tokenHash,
        lastSeenAt: now,
        idleExpiresAt,
        absoluteExpiresAt,
      },
    });

    return {
      token,
      sessionId: session.id,
      idleExpiresAt,
      absoluteExpiresAt,
    };
  }

  async validateSession(token: string): Promise<ValidatedSession | null> {
    if (!token) {
      return null;
    }

    const tokenHash = this.hashToken(token);
    const now = new Date();

    const session = await this.prisma.session.findUnique({
      where: {
        tokenHash,
      },
    });

    if (!session || session.revokedAt) {
      return null;
    }

    if (
      session.idleExpiresAt.getTime() <= now.getTime() ||
      session.absoluteExpiresAt.getTime() <= now.getTime()
    ) {
      return null;
    }

    const idleExpiresAt = new Date(
      Math.min(
        now.getTime() + this.idleTtlSeconds * 1000,
        session.absoluteExpiresAt.getTime(),
      ),
    );

    const updateResult = await this.prisma.session.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
        idleExpiresAt: {
          gt: now,
        },
        absoluteExpiresAt: {
          gt: now,
        },
      },
      data: {
        lastSeenAt: now,
        idleExpiresAt,
      },
    });

    if (updateResult.count !== 1) {
      return null;
    }

    return {
      id: session.id,
      userId: session.userId,
      lastSeenAt: now,
      idleExpiresAt,
      absoluteExpiresAt: session.absoluteExpiresAt,
    };
  }

  async revokeSession(token: string): Promise<boolean> {
    if (!token) {
      return false;
    }

    const tokenHash = this.hashToken(token);

    const result = await this.prisma.session.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return result.count > 0;
  }

  async revokeSessionById(sessionId: string): Promise<boolean> {
    if (!sessionId) {
      return false;
    }

    const result = await this.prisma.session.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return result.count > 0;
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return result.count;
  }

  private generateToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
