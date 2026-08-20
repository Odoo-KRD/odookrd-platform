import { CompanyStatus } from '../../../generated/prisma/enums';

export interface CompanyResponse {
  id: string;
  name: string;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
}
