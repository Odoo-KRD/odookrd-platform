import { IsIn } from 'class-validator';

import { BatchMutationIdsDto } from '../../../common/batch/batch-mutation.dto';
import { UserStatus } from '../../../generated/prisma/enums';

export class BatchUserStatusDto extends BatchMutationIdsDto {
  @IsIn([UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.ARCHIVED])
  status!: UserStatus;
}
