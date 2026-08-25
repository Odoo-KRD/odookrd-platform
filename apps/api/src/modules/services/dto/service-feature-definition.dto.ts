import { Type } from 'class-transformer';
import {
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
  ServiceCategory,
  ServiceFeatureStatus,
  ServiceFeatureValueType,
} from '../../../generated/prisma/enums';
import {
  LocalizedDescriptionDto,
  LocalizedNameDto,
} from '../../../i18n/localized-content.dto';
import {
  LocalizedFeatureValueDto,
  type ServiceFeaturePrimitive,
} from './service-feature.dto';

export class LocalizedFeatureParameterDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  ku?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  ar?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  en?: string;
}

export class ListServiceFeatureDefinitionsDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;

  @IsOptional()
  @IsEnum(ServiceFeatureStatus)
  status?: ServiceFeatureStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

export class CreateServiceFeatureDefinitionDto {
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

  @IsEnum(ServiceCategory)
  category!: ServiceCategory;

  @IsEnum(ServiceFeatureValueType)
  valueType!: ServiceFeatureValueType;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  parameterLabel!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedFeatureParameterDto)
  parameterLabelTranslations?: LocalizedFeatureParameterDto;

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
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;
}

export class UpdateServiceFeatureDefinitionDto {
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
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;

  @IsOptional()
  @IsEnum(ServiceFeatureValueType)
  valueType?: ServiceFeatureValueType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  parameterLabel?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedFeatureParameterDto)
  parameterLabelTranslations?: LocalizedFeatureParameterDto;

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
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;
}

export class AttachServiceFeatureDefinitionDto {
  @IsUUID()
  definitionId!: string;

  @IsOptional()
  value?: ServiceFeaturePrimitive;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedFeatureValueDto)
  valueTranslations?: LocalizedFeatureValueDto;

  @IsOptional()
  @IsBoolean()
  customerVisible?: boolean;
}
