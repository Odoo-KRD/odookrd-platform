import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const languageCodePattern = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;

export class UpdateTrainingCaptionDto {
  @IsOptional()
  @IsString()
  @Matches(languageCodePattern)
  @MaxLength(35)
  languageCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;
}

export class CreateTrainingVideoChapterDto {
  @IsString()
  @MaxLength(250)
  title!: string;

  @IsObject()
  titleTranslations!: Record<string, string>;

  @IsInt()
  @Min(0)
  @Max(86400)
  startSeconds!: number;
}

export class UpdateTrainingVideoChapterDto {
  @IsOptional()
  @IsString()
  @MaxLength(250)
  title?: string;

  @IsOptional()
  @IsObject()
  titleTranslations?: Record<string, string>;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86400)
  startSeconds?: number;
}
