import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class ListKnowledgeArticlesQueryDto extends PaginationQueryDto {
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
