import { RoleScope } from '../../../generated/prisma/enums';

export interface RoleResponse {
  id: string;
  key: string;
  name: string;
  description: string | null;
  scope: RoleScope;
  permissions: string[];
}
