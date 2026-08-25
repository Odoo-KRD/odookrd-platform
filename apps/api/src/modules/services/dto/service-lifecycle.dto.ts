import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { CompanyServiceStatus } from '../../../generated/prisma/enums';

export class CreateServiceTransitionDto {
  @IsEnum(CompanyServiceStatus)
  toStatus!: CompanyServiceStatus;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z][a-z0-9_.-]{1,79}$/)
  reasonCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  @IsDateString()
  effectiveAt?: string;
}
