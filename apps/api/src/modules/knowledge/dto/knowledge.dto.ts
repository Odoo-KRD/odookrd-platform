import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class ListKnowledgeArticlesQueryDto extends PaginationQueryDto {
  /**
   * Customer-facing routes address categories by slug; categoryId stays for
   * internal callers that already hold one.
   */
  @IsOptional()
  @IsString()
  @MaxLength(160)
  categorySlug?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class SearchKnowledgeQueryDto extends PaginationQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  q!: string;
}
