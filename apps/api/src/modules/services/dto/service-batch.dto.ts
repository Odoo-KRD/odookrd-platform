import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { BatchMutationIdsDto } from '../../../common/batch/batch-mutation.dto';
import {
  CompanyServiceStatus,
  ServiceCatalogStatus,
} from '../../../generated/prisma/enums';

export class BatchServiceStatusDto extends BatchMutationIdsDto {
  @IsEnum(ServiceCatalogStatus)
  status!: ServiceCatalogStatus;
}

export class BatchAssignmentTransitionDto extends BatchMutationIdsDto {
  @IsEnum(CompanyServiceStatus)
  toStatus!: CompanyServiceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  @IsDateString()
  effectiveAt?: string;
}
