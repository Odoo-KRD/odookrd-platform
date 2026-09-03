import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class TrainingCertificateLocalizedTextDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1500)
  ku?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1500)
  ar?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(1500)
  en?: string;
}

class TrainingCertificateDesignDto {
  @ValidateNested()
  @Type(() => TrainingCertificateLocalizedTextDto)
  titleTranslations!: TrainingCertificateLocalizedTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingCertificateLocalizedTextDto)
  introTranslations?: TrainingCertificateLocalizedTextDto;

  @ValidateNested()
  @Type(() => TrainingCertificateLocalizedTextDto)
  bodyTranslations!: TrainingCertificateLocalizedTextDto;

  @IsOptional()
  @IsUUID()
  logoFileAssetId?: string | null;

  @IsOptional()
  @IsUUID()
  backgroundFileAssetId?: string | null;

  @IsOptional()
  @IsUUID()
  signatureFileAssetId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  signatoryName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  signatoryTitle?: string | null;

  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  backgroundPresetKey?: string | null;

  @IsOptional()
  @IsObject()
  layoutConfig?: Record<string, unknown>;
}

export class CreateTrainingCertificateTemplateDto extends TrainingCertificateDesignDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{1,99}$/)
  key!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'ARCHIVED'])
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  // Backward-compatible during the 3C.5C transition.
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateTrainingCertificateTemplateDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingCertificateLocalizedTextDto)
  titleTranslations?: TrainingCertificateLocalizedTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingCertificateLocalizedTextDto)
  introTranslations?: TrainingCertificateLocalizedTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingCertificateLocalizedTextDto)
  bodyTranslations?: TrainingCertificateLocalizedTextDto;

  @IsOptional()
  @IsUUID()
  logoFileAssetId?: string | null;

  @IsOptional()
  @IsUUID()
  backgroundFileAssetId?: string | null;

  @IsOptional()
  @IsUUID()
  signatureFileAssetId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  signatoryName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  signatoryTitle?: string | null;

  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  backgroundPresetKey?: string | null;

  @IsOptional()
  @IsObject()
  layoutConfig?: Record<string, unknown>;

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'ARCHIVED'])
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  // Backward-compatible during the 3C.5C transition.
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class PreviewTrainingCertificateTemplateDto extends TrainingCertificateDesignDto {
  @IsOptional()
  @IsIn(['ku', 'ar', 'en'])
  locale?: 'ku' | 'ar' | 'en';

  @IsOptional()
  @IsString()
  @MaxLength(250)
  sampleLearnerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  sampleCourseTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  sampleCompanyName?: string;
}

export class ListTrainingCertificateTemplatesQueryDto extends PaginationQueryDto {}

export class IssueTrainingCertificateDto {
  @IsIn(['ku', 'ar', 'en'])
  locale!: 'ku' | 'ar' | 'en';

  @IsString()
  @MinLength(2)
  @MaxLength(250)
  certificateName!: string;
}

export class RevokeTrainingCertificateDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason!: string;
}

export class ListTrainingCertificatesQueryDto extends PaginationQueryDto {}
