import { AccountScope } from '../../../generated/prisma/enums';

export interface AuthorizationContext {
  userId: string;
  accountScope: AccountScope;
  companyId: string | null;
  roleKeys: string[];
  permissions: string[];
}
