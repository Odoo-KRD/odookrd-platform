import { AccountScope, UserStatus } from '../../../generated/prisma/enums';

export interface UserResponse {
  id: string;
  email: string;
  displayName: string | null;
  whatsappNumber: string | null;
  certificateName: string | null;
  accountScope: AccountScope;
  companyId: string | null;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: string[];
}

export interface UserInvitationResult {
  token: string;
  expiresAt: Date;
  user: UserResponse;
}
