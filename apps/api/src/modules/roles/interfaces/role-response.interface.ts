import { RoleScope } from '../../../generated/prisma/enums';

export interface RoleResponse {
  id: string;
  key: string;
  name: string;
  description: string | null;
  scope: RoleScope;
  isSystem: boolean;
  archivedAt: Date | null;
  assignmentCount: number;
  permissions: string[];
}
