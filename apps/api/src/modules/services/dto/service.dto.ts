import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import {
  ServiceBillingModel,
  ServiceCatalogStatus,
  ServiceCategory,
} from '../../../generated/prisma/enums';
import {
  LocalizedDescriptionDto,
  LocalizedNameDto,
} from '../../../i18n/localized-content.dto';

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

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedNameDto)
  nameTranslations?: LocalizedNameDto;

  @IsEnum(ServiceCategory)
  category!: ServiceCategory;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedDescriptionDto)
  descriptionTranslations?: LocalizedDescriptionDto;

  @IsOptional()
  @IsEnum(ServiceCatalogStatus)
  status?: ServiceCatalogStatus;

  @IsOptional()
  @IsEnum(ServiceBillingModel)
  billingModel?: ServiceBillingModel;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedNameDto)
  nameTranslations?: LocalizedNameDto;

  @IsOptional()
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedDescriptionDto)
  descriptionTranslations?: LocalizedDescriptionDto;

  @IsOptional()
  @IsEnum(ServiceCatalogStatus)
  status?: ServiceCatalogStatus;

  @IsOptional()
  @IsEnum(ServiceBillingModel)
  billingModel?: ServiceBillingModel;
}
