import { IsEnum } from 'class-validator';

import { BatchMutationIdsDto } from '../../../common/batch/batch-mutation.dto';
import { CompanyStatus } from '../../../generated/prisma/enums';

export class BatchCompanyStatusDto extends BatchMutationIdsDto {
  @IsEnum(CompanyStatus)
  status!: CompanyStatus;
}
