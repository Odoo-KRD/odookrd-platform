import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import {
  SubscriptionRenewalRequestStatus,
  SubscriptionTerm,
} from '../../../generated/prisma/enums';

export class CreateRenewalRequestDto {
  @IsEnum(SubscriptionTerm)
  requestedTerm!: SubscriptionTerm;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class ReviewRenewalRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNote?: string;
}

export class ListRenewalRequestsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(SubscriptionRenewalRequestStatus)
  status?: SubscriptionRenewalRequestStatus;

  @IsOptional()
  @IsUUID()
  companyId?: string;
}
