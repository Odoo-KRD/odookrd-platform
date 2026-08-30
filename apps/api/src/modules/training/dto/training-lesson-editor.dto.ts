import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import {
  TrainingContentStatus,
  TrainingLessonContentType,
} from '../../../generated/prisma/enums';
import {
  TrainingLocalizedLongTextDto,
  TrainingLocalizedTitleDto,
} from './training-content.dto';

export class UpdateTrainingLessonGeneralDto {
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
}

export class SetTrainingLessonContentTypeDto {
  @IsDefined()
  @IsEnum(TrainingLessonContentType)
  contentType!: TrainingLessonContentType;

  @IsOptional()
  @IsBoolean()
  confirmDetach?: boolean;
}

export class UpdateTrainingLessonArticleDto {
  @IsObject()
  articleContentTranslations!: Record<string, unknown>;
}

export class AddTrainingLessonResourceDto {
  @IsUUID('4')
  fileAssetId!: string;

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
  @IsBoolean()
  customerVisible?: boolean;
}

export class UpdateTrainingLessonResourceDto {
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
  @IsBoolean()
  customerVisible?: boolean;
}

export class ReorderTrainingLessonResourcesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(250)
  @IsUUID('4', { each: true })
  resourceIds!: string[];
}
