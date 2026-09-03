import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
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
  TrainingCategoryStatus,
  TrainingContentStatus,
  TrainingCourseStatus,
} from '../../../generated/prisma/enums';
import {
  LocalizedDescriptionDto,
  LocalizedNameDto,
} from '../../../i18n/localized-content.dto';

export class TrainingLocalizedTitleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  ku?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  ar?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  en?: string;
}

export class TrainingLocalizedLongTextDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  ku?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  ar?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  en?: string;
}

export class ListTrainingCategoriesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(TrainingCategoryStatus)
  status?: TrainingCategoryStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}

export class CreateTrainingCategoryDto {
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

  @IsOptional()
  @IsEnum(TrainingCategoryStatus)
  status?: TrainingCategoryStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  sortOrder?: number;
}

export class UpdateTrainingCategoryDto {
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
  @IsEnum(TrainingCategoryStatus)
  status?: TrainingCategoryStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  sortOrder?: number;
}

export class ListTrainingCoursesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(TrainingCourseStatus)
  status?: TrainingCourseStatus;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  search?: string;
}

export class CreateTrainingCourseDto {
  @IsUUID()
  categoryId!: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  @MaxLength(150)
  slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(250)
  title!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingLocalizedTitleDto)
  titleTranslations?: TrainingLocalizedTitleDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingLocalizedLongTextDto)
  summaryTranslations?: TrainingLocalizedLongTextDto;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  thumbnailUrl?: string | null;

  @IsOptional()
  @IsUUID()
  coverImageAssetId?: string | null;

  @IsOptional()
  @IsBoolean()
  certificateEnabled?: boolean;

  @IsOptional()
  @IsUUID()
  certificateTemplateId?: string | null;

  @IsOptional()
  @IsEnum(TrainingCourseStatus)
  status?: TrainingCourseStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  sortOrder?: number;
}

export class UpdateTrainingCourseDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  title?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingLocalizedTitleDto)
  titleTranslations?: TrainingLocalizedTitleDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingLocalizedLongTextDto)
  summaryTranslations?: TrainingLocalizedLongTextDto;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  thumbnailUrl?: string | null;

  @IsOptional()
  @IsUUID()
  coverImageAssetId?: string | null;

  @IsOptional()
  @IsBoolean()
  certificateEnabled?: boolean;

  @IsOptional()
  @IsUUID()
  certificateTemplateId?: string | null;

  @IsOptional()
  @IsEnum(TrainingCourseStatus)
  status?: TrainingCourseStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  sortOrder?: number;
}

export class BatchTrainingCategoryStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  ids!: string[];

  @IsEnum(TrainingCategoryStatus)
  status!: TrainingCategoryStatus;
}

export class BatchTrainingCourseStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  ids!: string[];

  @IsEnum(TrainingCourseStatus)
  status!: TrainingCourseStatus;
}

export class CreateTrainingSectionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  title!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingLocalizedTitleDto)
  titleTranslations?: TrainingLocalizedTitleDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingLocalizedLongTextDto)
  descriptionTranslations?: TrainingLocalizedLongTextDto;

  @IsOptional()
  @IsObject()
  richDescriptionTranslations?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(TrainingContentStatus)
  status?: TrainingContentStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  sortOrder?: number;
}

export class UpdateTrainingSectionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  title?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingLocalizedTitleDto)
  titleTranslations?: TrainingLocalizedTitleDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingLocalizedLongTextDto)
  descriptionTranslations?: TrainingLocalizedLongTextDto;

  @IsOptional()
  @IsObject()
  richDescriptionTranslations?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(TrainingContentStatus)
  status?: TrainingContentStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  sortOrder?: number;
}

export class CreateTrainingLessonDto {
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  title!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingLocalizedTitleDto)
  titleTranslations?: TrainingLocalizedTitleDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingLocalizedLongTextDto)
  descriptionTranslations?: TrainingLocalizedLongTextDto;

  @IsOptional()
  @IsObject()
  richDescriptionTranslations?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(TrainingContentStatus)
  status?: TrainingContentStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  sortOrder?: number;
}

export class UpdateTrainingLessonDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  title?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingLocalizedTitleDto)
  titleTranslations?: TrainingLocalizedTitleDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingLocalizedLongTextDto)
  descriptionTranslations?: TrainingLocalizedLongTextDto;

  @IsOptional()
  @IsObject()
  richDescriptionTranslations?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(TrainingContentStatus)
  status?: TrainingContentStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  sortOrder?: number;
}

export class TrainingStructureLessonDto {
  @IsUUID('4')
  id!: string;
}

export class TrainingStructureSectionDto {
  @IsUUID('4')
  id!: string;

  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => TrainingStructureLessonDto)
  lessons!: TrainingStructureLessonDto[];
}

export class UpdateTrainingCourseStructureDto {
  @IsArray()
  @ArrayMaxSize(250)
  @ValidateNested({ each: true })
  @Type(() => TrainingStructureSectionDto)
  sections!: TrainingStructureSectionDto[];
}
