import { Injectable, NotFoundException } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { ApiLocale } from '../../i18n/types';
import type { PaginatedResult } from '../../common/pagination/paginated-result.interface';
import type { ListKnowledgeArticlesQueryDto } from './dto/knowledge.dto';
import {
  resolveLocalizedRichText,
  resolveLocalizedTags,
  VISIBLE_ARTICLE_WHERE,
  VISIBLE_CATEGORY_WHERE,
} from './knowledge.rules';

/**
 * `*Translations` fields stay in the payload on purpose: LocalizedContentInterceptor
 * resolves `title`/`excerpt`/`name`/`description` against them using the request's
 * Accept-Language. Body and tags are not plain strings, so this service resolves
 * those itself.
 */
const articleListSelect = {
  id: true,
  slug: true,
  title: true,
  titleTranslations: true,
  excerpt: true,
  excerptTranslations: true,
  tagsTranslations: true,
  publishedAt: true,
  sortOrder: true,
  category: {
    select: {
      id: true,
      slug: true,
      name: true,
      nameTranslations: true,
      parentId: true,
    },
  },
} satisfies Prisma.KnowledgeArticleSelect;

const articleDetailSelect = {
  ...articleListSelect,
  bodyTranslations: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      slug: true,
      name: true,
      nameTranslations: true,
      parent: {
        select: {
          id: true,
          slug: true,
          name: true,
          nameTranslations: true,
        },
      },
    },
  },
} satisfies Prisma.KnowledgeArticleSelect;

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The category tree, two levels deep. An inactive parent is not returned at
   * all, which drops its children with it -- the agreed subtree rule.
   */
  async listCategories() {
    const categories = await this.prisma.knowledgeCategory.findMany({
      where: { ...VISIBLE_CATEGORY_WHERE, parentId: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        slug: true,
        name: true,
        nameTranslations: true,
        description: true,
        descriptionTranslations: true,
        _count: {
          select: { articles: { where: { ...VISIBLE_ARTICLE_WHERE } } },
        },
        children: {
          where: VISIBLE_CATEGORY_WHERE,
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: {
            id: true,
            slug: true,
            name: true,
            nameTranslations: true,
            description: true,
            descriptionTranslations: true,
            _count: {
              select: { articles: { where: { ...VISIBLE_ARTICLE_WHERE } } },
            },
          },
        },
      },
    });

    return categories.map((category) => ({
      ...this.withArticleCount(category),
      children: category.children.map((child) => this.withArticleCount(child)),
    }));
  }

  async listArticles(
    query: ListKnowledgeArticlesQueryDto,
    locale: ApiLocale,
  ): Promise<PaginatedResult<unknown>> {
    const where: Prisma.KnowledgeArticleWhereInput = {
      ...VISIBLE_ARTICLE_WHERE,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.knowledgeArticle.findMany({
        where,
        select: articleListSelect,
        orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { id: 'asc' }],
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.knowledgeArticle.count({ where }),
    ]);

    return {
      items: items.map((article) => this.toListItem(article, locale)),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async getArticle(slug: string, locale: ApiLocale) {
    const article = await this.prisma.knowledgeArticle.findFirst({
      where: { ...VISIBLE_ARTICLE_WHERE, slug },
      select: articleDetailSelect,
    });

    if (!article) {
      throw new NotFoundException('Knowledge article not found.');
    }

    const { bodyTranslations, tagsTranslations, ...rest } = article;

    return {
      ...rest,
      tags: resolveLocalizedTags(tagsTranslations, locale),
      body: resolveLocalizedRichText(bodyTranslations, locale),
      breadcrumb: this.toBreadcrumb(article.category),
    };
  }

  /**
   * Shared by list and search so both shapes stay identical.
   */
  toListItem(
    article: Prisma.KnowledgeArticleGetPayload<{
      select: typeof articleListSelect;
    }>,
    locale: ApiLocale,
  ) {
    const { tagsTranslations, ...rest } = article;

    return { ...rest, tags: resolveLocalizedTags(tagsTranslations, locale) };
  }

  private withArticleCount<T extends { _count: { articles: number } }>(
    category: T,
  ) {
    const { _count, ...rest } = category;

    return { ...rest, articleCount: _count.articles };
  }

  private toBreadcrumb(category: {
    id: string;
    slug: string;
    name: string;
    nameTranslations: unknown;
    parent: {
      id: string;
      slug: string;
      name: string;
      nameTranslations: unknown;
    } | null;
  }) {
    const self = {
      id: category.id,
      slug: category.slug,
      name: category.name,
      nameTranslations: category.nameTranslations,
    };

    return category.parent ? [category.parent, self] : [self];
  }
}
