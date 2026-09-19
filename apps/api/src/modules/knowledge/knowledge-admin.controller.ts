import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { AuthorizationGuard } from '../authorization/guards/authorization.guard';
import { PERMISSIONS } from '../authorization/permissions';
import { KnowledgeArticleStatus } from '../../generated/prisma/enums';
import {
  CreateKnowledgeArticleDto,
  CreateKnowledgeCategoryDto,
  ListKnowledgeAdminArticlesQueryDto,
  ReorderKnowledgeCategoriesDto,
  UpdateKnowledgeArticleDto,
  UpdateKnowledgeCategoryDto,
} from './dto/knowledge-admin.dto';
import { KnowledgeAdminService } from './knowledge-admin.service';

@Controller('knowledge/admin')
@UseGuards(AuthenticatedGuard, AuthorizationGuard)
@RequirePermissions(PERMISSIONS.KNOWLEDGE_MANAGE)
export class KnowledgeAdminController {
  constructor(private readonly admin: KnowledgeAdminService) {}

  @Get('categories')
  listCategories() {
    return this.admin.listCategories();
  }

  @Post('categories')
  createCategory(@Body() input: CreateKnowledgeCategoryDto) {
    return this.admin.createCategory(input);
  }

  @Patch('categories/reorder')
  reorderCategories(@Body() input: ReorderKnowledgeCategoriesDto) {
    return this.admin.reorderCategories(input);
  }

  @Patch('categories/:categoryId')
  updateCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() input: UpdateKnowledgeCategoryDto,
  ) {
    return this.admin.updateCategory(categoryId, input);
  }

  @Delete('categories/:categoryId')
  deleteCategory(@Param('categoryId', ParseUUIDPipe) categoryId: string) {
    return this.admin.deleteCategory(categoryId);
  }

  @Get('articles')
  listArticles(@Query() query: ListKnowledgeAdminArticlesQueryDto) {
    return this.admin.listArticles(query);
  }

  @Post('articles')
  createArticle(
    @CurrentUser() principal: AuthenticatedPrincipal,
    @Body() input: CreateKnowledgeArticleDto,
  ) {
    return this.admin.createArticle(principal, input);
  }

  @Get('articles/:articleId')
  getArticle(@Param('articleId', ParseUUIDPipe) articleId: string) {
    return this.admin.getArticle(articleId);
  }

  @Get('articles/:articleId/feedback')
  listArticleComments(@Param('articleId', ParseUUIDPipe) articleId: string) {
    return this.admin.listArticleComments(articleId);
  }

  @Patch('articles/:articleId')
  updateArticle(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() input: UpdateKnowledgeArticleDto,
  ) {
    return this.admin.updateArticle(articleId, input);
  }

  @Post('articles/:articleId/publish')
  publishArticle(@Param('articleId', ParseUUIDPipe) articleId: string) {
    return this.admin.publishArticle(articleId);
  }

  @Post('articles/:articleId/unpublish')
  unpublishArticle(@Param('articleId', ParseUUIDPipe) articleId: string) {
    return this.admin.setArticleStatus(articleId, KnowledgeArticleStatus.DRAFT);
  }

  @Post('articles/:articleId/archive')
  archiveArticle(@Param('articleId', ParseUUIDPipe) articleId: string) {
    return this.admin.setArticleStatus(
      articleId,
      KnowledgeArticleStatus.ARCHIVED,
    );
  }

  @Delete('articles/:articleId')
  deleteArticle(@Param('articleId', ParseUUIDPipe) articleId: string) {
    return this.admin.deleteArticle(articleId);
  }
}
