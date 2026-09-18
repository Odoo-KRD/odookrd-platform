import {
  Controller,
  Get,
  Headers,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import { resolveApiLocale } from '../../i18n';
import {
  ListKnowledgeArticlesQueryDto,
  SearchKnowledgeQueryDto,
} from './dto/knowledge.dto';
import { KnowledgeSearchService } from './knowledge-search.service';
import { KnowledgeService } from './knowledge.service';

/**
 * The knowledge base is open to every authenticated user, so there is no
 * @RequirePermissions here and no AuthorizationGuard -- unlike training, which
 * gates on training.read. Admin authoring in 5C gets its own controller behind
 * knowledge.manage.
 */
@Controller('knowledge')
@UseGuards(AuthenticatedGuard)
export class KnowledgeController {
  constructor(
    private readonly knowledge: KnowledgeService,
    private readonly search: KnowledgeSearchService,
  ) {}

  @Get('categories')
  listCategories() {
    return this.knowledge.listCategories();
  }

  @Get('search')
  searchArticles(
    @Query() query: SearchKnowledgeQueryDto,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.search.search(query, resolveApiLocale(acceptLanguage));
  }

  @Get('articles')
  listArticles(
    @Query() query: ListKnowledgeArticlesQueryDto,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.knowledge.listArticles(query, resolveApiLocale(acceptLanguage));
  }

  @Get('articles/:slug')
  getArticle(
    @Param('slug') slug: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.knowledge.getArticle(slug, resolveApiLocale(acceptLanguage));
  }
}
