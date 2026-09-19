import { Injectable, NotFoundException } from '@nestjs/common';

import { AdminEventNotificationService } from '../notifications/admin-event-notification.service';

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
    },
  },
} satisfies Prisma.KnowledgeArticleSelect;

const categoryOrder = [
  { sortOrder: 'asc' },
  { name: 'asc' },
] satisfies Prisma.KnowledgeCategoryOrderByWithRelationInput[];

const categoryFields = {
  id: true,
  slug: true,
  name: true,
  nameTranslations: true,
  description: true,
  descriptionTranslations: true,
  _count: { select: { articles: { where: { ...VISIBLE_ARTICLE_WHERE } } } },
} satisfies Prisma.KnowledgeCategorySelect;

/**
 * Three levels, written out rather than recursed: Prisma selects are static,
 * and the depth is fixed by MAX_CATEGORY_DEPTH.
 */
const categoryTreeSelect = {
  ...categoryFields,
  children: {
    where: VISIBLE_CATEGORY_WHERE,
    orderBy: categoryOrder,
    select: {
      ...categoryFields,
      children: {
        where: VISIBLE_CATEGORY_WHERE,
        orderBy: categoryOrder,
        select: categoryFields,
      },
    },
  },
} satisfies Prisma.KnowledgeCategorySelect;

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminEvents: AdminEventNotificationService,
  ) {}

  /**
   * The category tree, MAX_CATEGORY_DEPTH levels deep. An inactive category is
   * not returned at all, which drops its descendants with it.
   */
  async listCategories() {
    const categories = await this.prisma.knowledgeCategory.findMany({
      where: { ...VISIBLE_CATEGORY_WHERE, parentId: null },
      orderBy: categoryOrder,
      select: categoryTreeSelect,
    });

    return categories.map((category) => ({
      ...this.withArticleCount(category),
      children: category.children.map((child) => ({
        ...this.withArticleCount(child),
        children: child.children.map((grandchild) =>
          this.withArticleCount(grandchild),
        ),
      })),
    }));
  }

  async listArticles(
    query: ListKnowledgeArticlesQueryDto,
    locale: ApiLocale,
  ): Promise<PaginatedResult<unknown>> {
    const where: Prisma.KnowledgeArticleWhereInput = {
      ...VISIBLE_ARTICLE_WHERE,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.categorySlug
        ? {
            category: {
              ...VISIBLE_ARTICLE_WHERE.category,
              slug: query.categorySlug,
            },
          }
        : {}),
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

  async getArticle(slug: string, locale: ApiLocale, viewerUserId?: string) {
    const article = await this.prisma.knowledgeArticle.findFirst({
      where: { ...VISIBLE_ARTICLE_WHERE, slug },
      select: {
        ...articleDetailSelect,
        feedback: viewerUserId
          ? {
              where: { userId: viewerUserId },
              select: { helpful: true, comment: true },
              take: 1,
            }
          : false,
      },
    });

    if (!article) {
      throw new NotFoundException('Knowledge article not found.');
    }

    const { bodyTranslations, tagsTranslations, feedback, ...rest } = article;

    return {
      ...rest,
      tags: resolveLocalizedTags(tagsTranslations, locale),
      body: resolveLocalizedRichText(bodyTranslations, locale),
      breadcrumb: this.toBreadcrumb(article.category),
      viewerFeedback: Array.isArray(feedback) ? (feedback[0] ?? null) : null,
    };
  }

  /**
   * Records or replaces this reader's answer.
   *
   * Upsert on (articleId, userId): answering again corrects the tally instead
   * of inflating it. A comment sent with a helpful answer is dropped, since the
   * question is only asked when the answer is no.
   */
  async submitFeedback(
    slug: string,
    userId: string,
    input: { helpful: boolean; comment?: string },
  ) {
    const article = await this.prisma.knowledgeArticle.findFirst({
      where: { ...VISIBLE_ARTICLE_WHERE, slug },
      select: { id: true, title: true },
    });

    if (!article) {
      throw new NotFoundException('Knowledge article not found.');
    }

    const comment = input.helpful ? null : (input.comment?.trim() ?? null);

    const saved = await this.prisma.knowledgeArticleFeedback.upsert({
      where: {
        articleId_userId: { articleId: article.id, userId },
      },
      create: {
        articleId: article.id,
        userId,
        helpful: input.helpful,
        comment: comment || null,
      },
      update: { helpful: input.helpful, comment: comment || null },
      select: { id: true, helpful: true, comment: true, updatedAt: true },
    });

    // Every unhelpful answer that carries a comment raises an admin
    // notification. The event service swallows its own failures, so a
    // notification problem never costs us the feedback itself.
    if (!saved.helpful && saved.comment) {
      const reader = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true, company: { select: { name: true } } },
      });

      if (reader?.companyId) {
        await this.adminEvents.knowledgeArticleMarkedUnhelpful({
          companyId: reader.companyId,
          feedbackId: saved.id,
          revision: saved.updatedAt.getTime(),
          articleId: article.id,
          articleTitle: article.title,
          comment: saved.comment,
          companyName: reader.company?.name ?? null,
        });
      }
    }

    return { helpful: saved.helpful, comment: saved.comment };
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
      parent: {
        id: string;
        slug: string;
        name: string;
        nameTranslations: unknown;
      } | null;
    } | null;
  }) {
    const trail = [
      category.parent?.parent,
      category.parent
        ? {
            id: category.parent.id,
            slug: category.parent.slug,
            name: category.parent.name,
            nameTranslations: category.parent.nameTranslations,
          }
        : null,
      {
        id: category.id,
        slug: category.slug,
        name: category.name,
        nameTranslations: category.nameTranslations,
      },
    ];

    return trail.filter((entry): entry is NonNullable<typeof entry> =>
      Boolean(entry),
    );
  }
}
