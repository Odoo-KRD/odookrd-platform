import { IsIn } from 'class-validator';

import { UserStatus } from '../../../generated/prisma/enums';

export class UpdateUserStatusDto {
  @IsIn([UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.ARCHIVED])
  status!: UserStatus;
}
