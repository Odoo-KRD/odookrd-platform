import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import {
  KnowledgeArticleStatus,
  KnowledgeCategoryStatus,
} from '../../../generated/prisma/enums';
import {
  LocalizedDescriptionDto,
  LocalizedNameDto,
} from '../../../i18n/localized-content.dto';

export class LocalizedExcerptDto {
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

/**
 * Rich text arrives as the editor's document object. Its internal shape is the
 * editor's business, so it is validated as an object and nothing more --
 * richTextToPlainText walks whatever it gets defensively.
 */
export class LocalizedRichTextDto {
  @IsOptional()
  @IsObject()
  ku?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  ar?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  en?: Record<string, unknown>;
}

class TagListDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(25)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  ku?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(25)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  ar?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(25)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  en?: string[];
}

export class CreateKnowledgeCategoryDto {
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
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedDescriptionDto)
  descriptionTranslations?: LocalizedDescriptionDto;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  /** Omit to derive it from the name. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  slug?: string;

  @IsOptional()
  @IsEnum(KnowledgeCategoryStatus)
  status?: KnowledgeCategoryStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateKnowledgeCategoryDto {
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

  /** Null moves the category to the root. */
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  slug?: string;

  @IsOptional()
  @IsEnum(KnowledgeCategoryStatus)
  status?: KnowledgeCategoryStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ReorderKnowledgeCategoriesDto {
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  orderedIds!: string[];
}

export class CreateKnowledgeArticleDto {
  @IsUUID()
  categoryId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(250)
  title!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedNameDto)
  titleTranslations?: LocalizedNameDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedExcerptDto)
  excerptTranslations?: LocalizedExcerptDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedRichTextDto)
  bodyTranslations?: LocalizedRichTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TagListDto)
  tagsTranslations?: TagListDto;

  /** Omit to derive it from the title. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  slug?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateKnowledgeArticleDto {
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
  @Type(() => LocalizedNameDto)
  titleTranslations?: LocalizedNameDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedExcerptDto)
  excerptTranslations?: LocalizedExcerptDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedRichTextDto)
  bodyTranslations?: LocalizedRichTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TagListDto)
  tagsTranslations?: TagListDto;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  slug?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class ListKnowledgeAdminArticlesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsEnum(KnowledgeArticleStatus)
  status?: KnowledgeArticleStatus;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  search?: string;
}
