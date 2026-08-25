import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import { CompanyServiceStatus } from '../../../generated/prisma/enums';
import { LocalizedNameDto } from '../../../i18n/localized-content.dto';

export class ListServiceAssignmentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsOptional()
  @IsEnum(CompanyServiceStatus)
  status?: CompanyServiceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsDateString()
  startsFrom?: string;

  @IsOptional()
  @IsDateString()
  startsTo?: string;

  @IsOptional()
  @IsDateString()
  expiresFrom?: string;

  @IsOptional()
  @IsDateString()
  expiresTo?: string;
}

export class CreateServiceAssignmentDto {
  @IsUUID()
  companyId!: string;

  @IsUUID()
  serviceId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedNameDto)
  displayNameTranslations?: LocalizedNameDto;

  @IsOptional()
  @IsEnum(CompanyServiceStatus)
  status?: CompanyServiceStatus;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  serviceUrl?: string | null;

  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNotes?: string | null;
}

export class UpdateServiceAssignmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedNameDto)
  displayNameTranslations?: LocalizedNameDto;

  @IsOptional()
  @IsEnum(CompanyServiceStatus)
  status?: CompanyServiceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  serviceUrl?: string | null;

  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNotes?: string | null;
}
