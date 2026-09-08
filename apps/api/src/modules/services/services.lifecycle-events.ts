import type { Prisma } from '../../generated/prisma/client';
import {
  CompanyServiceLifecycleSource,
  CompanyServiceStatus,
} from '../../generated/prisma/enums';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { AUDIT_ACTIONS } from '../audit/audit.actions';
import { optionalText } from './services.rules';

export async function recordLifecycleTransition(
  transaction: Prisma.TransactionClient,
  principal: AuthenticatedPrincipal,
  input: {
    assignmentId: string;
    companyId: string;
    fromStatus: CompanyServiceStatus;
    toStatus: CompanyServiceStatus;
    reasonCode?: string;
    reason?: string;
    effectiveAt: Date;
  },
): Promise<void> {
  await transaction.companyServiceLifecycleEvent.create({
    data: {
      companyServiceId: input.assignmentId,
      companyId: input.companyId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      source: CompanyServiceLifecycleSource.ADMIN,
      reasonCode: optionalText(input.reasonCode),
      reason: optionalText(input.reason),
      actorUserId: principal.userId,
      actorEmailSnapshot: principal.email,
      effectiveAt: input.effectiveAt,
    },
  });

  await transaction.auditLog.create({
    data: {
      actorUserId: principal.userId,
      companyId: input.companyId,
      action: AUDIT_ACTIONS.SERVICE_ASSIGNMENT_STATUS_TRANSITIONED,
      targetType: 'company_service',
      targetId: input.assignmentId,
      metadata: {
        previousStatus: input.fromStatus,
        status: input.toStatus,
      },
    },
  });
}
