import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { TrainingQuizQuestionType } from '../../../generated/prisma/enums';
import {
  TrainingLocalizedLongTextDto,
  TrainingLocalizedTitleDto,
} from './training-content.dto';

export class TrainingQuizLocalizedOptionDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(1000) ku?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(1000) ar?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(1000) en?: string;
}

export class UpsertTrainingQuizDto {
  @IsString() @MinLength(1) @MaxLength(250) title!: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingLocalizedTitleDto)
  titleTranslations?: TrainingLocalizedTitleDto;
  @IsOptional() @IsString() @MaxLength(2000) instructions?: string | null;
  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingLocalizedLongTextDto)
  instructionTranslations?: TrainingLocalizedLongTextDto;
  @IsBoolean() requiredForCompletion!: boolean;
  @IsBoolean() requiredToContinue!: boolean;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) passPercentage!: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  maxAttempts?: number | null;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(86400)
  timeLimitSeconds?: number | null;
  @IsBoolean() shuffleQuestions!: boolean;
  @IsBoolean() shuffleOptions!: boolean;
  @IsBoolean() revealAnswers!: boolean;
}

export class TrainingQuizQuestionOptionDto {
  @IsString() @MinLength(1) @MaxLength(1000) text!: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingQuizLocalizedOptionDto)
  textTranslations?: TrainingQuizLocalizedOptionDto;
  @IsBoolean() isCorrect!: boolean;
}

export class UpsertTrainingQuizQuestionDto {
  @IsEnum(TrainingQuizQuestionType) type!: TrainingQuizQuestionType;
  @IsString() @MinLength(1) @MaxLength(2000) prompt!: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingLocalizedLongTextDto)
  promptTranslations?: TrainingLocalizedLongTextDto;
  @IsOptional() @IsString() @MaxLength(2000) explanation?: string | null;
  @IsOptional()
  @ValidateNested()
  @Type(() => TrainingLocalizedLongTextDto)
  explanationTranslations?: TrainingLocalizedLongTextDto;
  @Type(() => Number) @IsInt() @Min(1) @Max(1000) points!: number;
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => TrainingQuizQuestionOptionDto)
  options!: TrainingQuizQuestionOptionDto[];
}

export class ReorderTrainingQuizQuestionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  questionIds!: string[];
}
