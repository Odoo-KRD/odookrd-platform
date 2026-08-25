import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import {
  ServiceFeatureStatus,
  ServiceFeatureValueType,
} from '../../../generated/prisma/enums';
import {
  LocalizedDescriptionDto,
  LocalizedNameDto,
} from '../../../i18n/localized-content.dto';

export type ServiceFeaturePrimitive = boolean | number | string;

export class LocalizedFeatureValueDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  ku?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  ar?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  en?: string;
}

export class ListServiceFeaturesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ServiceFeatureStatus)
  status?: ServiceFeatureStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

export class CreateServiceFeatureDto {
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

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedDescriptionDto)
  descriptionTranslations?: LocalizedDescriptionDto;

  @IsEnum(ServiceFeatureValueType)
  valueType!: ServiceFeatureValueType;

  @IsDefined()
  defaultValue!: ServiceFeaturePrimitive;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedFeatureValueDto)
  valueTranslations?: LocalizedFeatureValueDto;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  unit?: string | null;

  @IsOptional()
  @IsEnum(ServiceFeatureStatus)
  status?: ServiceFeatureStatus;

  @IsOptional()
  @IsBoolean()
  customerVisible?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;
}

export class UpdateServiceFeatureDto {
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
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedDescriptionDto)
  descriptionTranslations?: LocalizedDescriptionDto;

  @IsOptional()
  @IsEnum(ServiceFeatureValueType)
  valueType?: ServiceFeatureValueType;

  @IsOptional()
  defaultValue?: ServiceFeaturePrimitive;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedFeatureValueDto)
  valueTranslations?: LocalizedFeatureValueDto;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  unit?: string | null;

  @IsOptional()
  @IsEnum(ServiceFeatureStatus)
  status?: ServiceFeatureStatus;

  @IsOptional()
  @IsBoolean()
  customerVisible?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;
}

export class ReorderServiceFeaturesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  ids!: string[];
}

export class UpdateCompanyServiceFeatureDto {
  @IsOptional()
  value?: ServiceFeaturePrimitive;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedFeatureValueDto)
  valueTranslations?: LocalizedFeatureValueDto;

  @IsOptional()
  @IsBoolean()
  reset?: boolean;

  @IsOptional()
  @IsBoolean()
  customerVisibleOverride?: boolean | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrderOverride?: number | null;
}
