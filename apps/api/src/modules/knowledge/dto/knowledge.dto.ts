import {
  IsBoolean,
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

export class SubmitKnowledgeFeedbackDto {
  @IsBoolean()
  helpful!: boolean;

  /**
   * Only collected alongside an unhelpful answer, and optional even then. A
   * comment sent with helpful: true is ignored rather than rejected -- the
   * answer is what matters, and failing the request would lose it.
   */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
