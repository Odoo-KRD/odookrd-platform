import { IsEnum, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import { CompanyStatus } from '../../../generated/prisma/enums';

export class ListCompaniesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;
}
