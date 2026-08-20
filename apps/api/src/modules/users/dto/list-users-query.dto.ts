import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import { UserStatus } from '../../../generated/prisma/enums';

export class ListUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
