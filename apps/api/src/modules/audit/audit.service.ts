import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { AuditAction } from './audit.actions';

export interface WriteAuditLogInput {
  actorUserId: string | null;
  companyId: string | null;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async write(
    input: WriteAuditLogInput,
    transaction?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = transaction ?? this.prisma;

    await client.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        companyId: input.companyId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        ...(input.metadata !== undefined
          ? {
              metadata: input.metadata,
            }
          : {}),
      },
    });
  }
}
