import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import { CompanyServiceStatus } from '../../../generated/prisma/enums';

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
