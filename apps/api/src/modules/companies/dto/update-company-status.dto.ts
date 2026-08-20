import { IsEnum } from 'class-validator';

import { CompanyStatus } from '../../../generated/prisma/enums';

export class UpdateCompanyStatusDto {
  @IsEnum(CompanyStatus)
  status!: CompanyStatus;
}
