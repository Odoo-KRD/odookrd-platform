import { AccountScope } from '../../../generated/prisma/enums';

export interface AuthenticatedPrincipal {
  sessionId: string;
  userId: string;
  email: string;
  accountScope: AccountScope;
  companyId: string | null;
}
