import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import {
  ServiceCatalogStatus,
  ServiceCategory,
} from '../../../generated/prisma/enums';

export class ListServicesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;

  @IsOptional()
  @IsEnum(ServiceCatalogStatus)
  status?: ServiceCatalogStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

export class CreateServiceDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{1,99}$/)
  key!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsEnum(ServiceCategory)
  category!: ServiceCategory;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @IsEnum(ServiceCatalogStatus)
  status?: ServiceCatalogStatus;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @IsEnum(ServiceCatalogStatus)
  status?: ServiceCatalogStatus;
}
