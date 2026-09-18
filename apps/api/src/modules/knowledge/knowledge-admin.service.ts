import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import {
  KnowledgeArticleStatus,
  KnowledgeCategoryStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { normalizeLocalizedText } from '../../i18n/localized-content';
import type { AuthenticatedPrincipal } from '../auth/interfaces/authenticated-principal.interface';
import type { PaginatedResult } from '../../common/pagination/paginated-result.interface';
import type {
  CreateKnowledgeArticleDto,
  CreateKnowledgeCategoryDto,
  ListKnowledgeAdminArticlesQueryDto,
  ReorderKnowledgeCategoriesDto,
  UpdateKnowledgeArticleDto,
  UpdateKnowledgeCategoryDto,
} from './dto/knowledge-admin.dto';
import {
  buildSearchTexts,
  MAX_CATEGORY_DEPTH,
  normalizeLocalizedTags,
  slugify,
  uniqueSlug,
} from './knowledge.rules';

const adminCategorySelect = {
  id: true,
  slug: true,
  parentId: true,
  name: true,
  nameTranslations: true,
  description: true,
  descriptionTranslations: true,
  status: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { articles: true, children: true } },
} satisfies Prisma.KnowledgeCategorySelect;

const adminArticleSelect = {
  id: true,
  slug: true,
  categoryId: true,
  title: true,
  titleTranslations: true,
  excerpt: true,
  excerptTranslations: true,
  bodyTranslations: true,
  tagsTranslations: true,
  status: true,
  publishedAt: true,
  sortOrder: true,
  authorUserId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.KnowledgeArticleSelect;

/**
 * Authoring side of the knowledge base. Unlike KnowledgeService this sees
 * drafts, archived articles and inactive categories -- it is behind
 * knowledge.manage.
 *
 * Two invariants live here because the database cannot express them:
 *   - category depth never exceeds MAX_CATEGORY_DEPTH
 *   - every article write recomputes all three search_text_* columns
 */
@Injectable()
export class KnowledgeAdminService {
  constructor(private readonly prisma: PrismaService) {}

  listCategories() {
    return this.prisma.knowledgeCategory.findMany({
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      select: adminCategorySelect,
    });
  }

  async createCategory(input: CreateKnowledgeCategoryDto) {
    await this.assertDepthAllows(input.parentId ?? null);

    return this.prisma.knowledgeCategory.create({
      data: {
        parentId: input.parentId ?? null,
        slug: await this.resolveCategorySlug(input.slug ?? input.name),
        name: input.name,
        nameTranslations: normalizeLocalizedText(
          input.nameTranslations,
          input.name,
        ),
        description: input.description?.trim() || null,
        descriptionTranslations: normalizeLocalizedText(
          input.descriptionTranslations,
          input.description,
        ),
        status: input.status ?? KnowledgeCategoryStatus.ACTIVE,
        sortOrder: input.sortOrder ?? 0,
      },
      select: adminCategorySelect,
    });
  }

  async updateCategory(categoryId: string, input: UpdateKnowledgeCategoryDto) {
    const existing = await this.prisma.knowledgeCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, description: true, parentId: true },
    });

    if (!existing) {
      throw new NotFoundException('Knowledge category not found.');
    }

    if (input.parentId !== undefined) {
      await this.assertMoveAllowed(categoryId, input.parentId);
    }

    const name = input.name ?? existing.name;

    return this.prisma.knowledgeCategory.update({
      where: { id: categoryId },
      data: {
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
        ...(input.slug !== undefined
          ? { slug: await this.resolveCategorySlug(input.slug, categoryId) }
          : {}),
        ...(input.name !== undefined ? { name } : {}),
        ...(input.nameTranslations !== undefined
          ? {
              nameTranslations: normalizeLocalizedText(
                input.nameTranslations,
                name,
              ),
            }
          : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() || null }
          : {}),
        ...(input.descriptionTranslations !== undefined
          ? {
              descriptionTranslations: normalizeLocalizedText(
                input.descriptionTranslations,
                input.description ?? existing.description,
              ),
            }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.sortOrder !== undefined
          ? { sortOrder: input.sortOrder }
          : {}),
      },
      select: adminCategorySelect,
    });
  }

  /**
   * Position within one parent. The list is the new order; index becomes
   * sortOrder.
   */
  async reorderCategories(input: ReorderKnowledgeCategoriesDto) {
    const found = await this.prisma.knowledgeCategory.count({
      where: { id: { in: input.orderedIds } },
    });

    if (found !== input.orderedIds.length) {
      throw new BadRequestException(
        'One or more categories in the ordering do not exist.',
      );
    }

    await this.prisma.$transaction(
      input.orderedIds.map((id, index) =>
        this.prisma.knowledgeCategory.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.listCategories();
  }

  /**
   * Both foreign keys are ON DELETE RESTRICT, so the database would reject this
   * anyway -- checking first turns a constraint violation into a message that
   * says which of the two reasons applies.
   */
  async deleteCategory(categoryId: string) {
    const category = await this.prisma.knowledgeCategory.findUnique({
      where: { id: categoryId },
      select: { _count: { select: { articles: true, children: true } } },
    });

    if (!category) {
      throw new NotFoundException('Knowledge category not found.');
    }

    if (category._count.children > 0) {
      throw new ConflictException(
        'Move or delete the subcategories before deleting this category.',
      );
    }

    if (category._count.articles > 0) {
      throw new ConflictException(
        'Move or delete the articles in this category before deleting it.',
      );
    }

    await this.prisma.knowledgeCategory.delete({ where: { id: categoryId } });

    return { id: categoryId, deleted: true };
  }

  async listArticles(
    query: ListKnowledgeAdminArticlesQueryDto,
  ): Promise<PaginatedResult<unknown>> {
    const where: Prisma.KnowledgeArticleWhereInput = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? { title: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.knowledgeArticle.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: adminArticleSelect,
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.knowledgeArticle.count({ where }),
    ]);

    return {
      items,
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }

  async getArticle(articleId: string) {
    const article = await this.prisma.knowledgeArticle.findUnique({
      where: { id: articleId },
      select: adminArticleSelect,
    });

    if (!article) {
      throw new NotFoundException('Knowledge article not found.');
    }

    return article;
  }

  async createArticle(
    principal: AuthenticatedPrincipal,
    input: CreateKnowledgeArticleDto,
  ) {
    await this.assertCategoryExists(input.categoryId);

    const titleTranslations = normalizeLocalizedText(
      input.titleTranslations,
      input.title,
    );
    const excerptTranslations = normalizeLocalizedText(
      input.excerptTranslations,
      input.excerpt,
    );
    const bodyTranslations = (input.bodyTranslations ??
      {}) as Prisma.InputJsonObject;
    const tagsTranslations = normalizeLocalizedTags(
      input.tagsTranslations,
      undefined,
    );

    return this.prisma.knowledgeArticle.create({
      data: {
        categoryId: input.categoryId,
        slug: await this.resolveArticleSlug(input.slug ?? input.title),
        title: input.title,
        titleTranslations,
        excerpt: input.excerpt?.trim() || null,
        excerptTranslations,
        bodyTranslations,
        tagsTranslations,
        status: KnowledgeArticleStatus.DRAFT,
        sortOrder: input.sortOrder ?? 0,
        authorUserId: principal.userId,
        ...buildSearchTexts({
          title: input.title,
          titleTranslations,
          excerpt: input.excerpt ?? null,
          excerptTranslations,
          bodyTranslations,
          tagsTranslations,
        }),
      },
      select: adminArticleSelect,
    });
  }

  /**
   * Merges the patch over the stored record, then recomputes all three search
   * columns from the merged result -- unconditionally, not only when the body
   * changed. 5B's search reads those columns and nothing else keeps them
   * honest.
   */
  async updateArticle(articleId: string, input: UpdateKnowledgeArticleDto) {
    const existing = await this.getArticle(articleId);

    if (input.categoryId) {
      await this.assertCategoryExists(input.categoryId);
    }

    const title = input.title ?? existing.title;
    const excerpt =
      input.excerpt === undefined
        ? existing.excerpt
        : input.excerpt?.trim() || null;

    const titleTranslations =
      input.titleTranslations !== undefined || input.title !== undefined
        ? normalizeLocalizedText(input.titleTranslations, title)
        : (existing.titleTranslations as Prisma.InputJsonObject);

    const excerptTranslations =
      input.excerptTranslations !== undefined || input.excerpt !== undefined
        ? normalizeLocalizedText(input.excerptTranslations, excerpt)
        : (existing.excerptTranslations as Prisma.InputJsonObject);

    const bodyTranslations =
      input.bodyTranslations !== undefined
        ? (input.bodyTranslations as Prisma.InputJsonObject)
        : (existing.bodyTranslations as Prisma.InputJsonObject);

    const tagsTranslations =
      input.tagsTranslations !== undefined
        ? normalizeLocalizedTags(input.tagsTranslations, undefined)
        : (existing.tagsTranslations as Prisma.InputJsonObject);

    return this.prisma.knowledgeArticle.update({
      where: { id: articleId },
      data: {
        ...(input.categoryId ? { categoryId: input.categoryId } : {}),
        ...(input.slug !== undefined
          ? { slug: await this.resolveArticleSlug(input.slug, articleId) }
          : {}),
        title,
        titleTranslations,
        excerpt,
        excerptTranslations,
        bodyTranslations,
        tagsTranslations,
        ...(input.sortOrder !== undefined
          ? { sortOrder: input.sortOrder }
          : {}),
        ...buildSearchTexts({
          title,
          titleTranslations,
          excerpt,
          excerptTranslations,
          bodyTranslations,
          tagsTranslations,
        }),
      },
      select: adminArticleSelect,
    });
  }

  /**
   * published_at is set once and kept: the check constraint requires it while
   * PUBLISHED, and preserving it through an unpublish keeps the original
   * publication date rather than resetting it on every republish.
   */
  async publishArticle(articleId: string) {
    const existing = await this.getArticle(articleId);

    return this.prisma.knowledgeArticle.update({
      where: { id: articleId },
      data: {
        status: KnowledgeArticleStatus.PUBLISHED,
        publishedAt: existing.publishedAt ?? new Date(),
      },
      select: adminArticleSelect,
    });
  }

  async setArticleStatus(
    articleId: string,
    status: Extract<KnowledgeArticleStatus, 'DRAFT' | 'ARCHIVED'>,
  ) {
    await this.getArticle(articleId);

    return this.prisma.knowledgeArticle.update({
      where: { id: articleId },
      data: { status },
      select: adminArticleSelect,
    });
  }

  async deleteArticle(articleId: string) {
    await this.getArticle(articleId);

    await this.prisma.knowledgeArticle.delete({ where: { id: articleId } });

    return { id: articleId, deleted: true };
  }

  private async assertCategoryExists(categoryId: string) {
    const exists = await this.prisma.knowledgeCategory.count({
      where: { id: categoryId },
    });

    if (exists === 0) {
      throw new NotFoundException('Knowledge category not found.');
    }
  }

  /**
   * Depth of a prospective child of `parentId`. Root is depth 1.
   */
  private async assertDepthAllows(parentId: string | null) {
    if (!parentId) {
      return;
    }

    const depth = await this.depthOf(parentId);

    if (depth + 1 > MAX_CATEGORY_DEPTH) {
      throw new BadRequestException(
        `Knowledge categories are limited to ${MAX_CATEGORY_DEPTH} levels.`,
      );
    }
  }

  /**
   * Moving a category carries its descendants with it, so the check is on the
   * deepest leaf below it, not just the category itself. Also rejects a move
   * into its own subtree, which would create a cycle the database cannot see.
   */
  private async assertMoveAllowed(categoryId: string, parentId: string | null) {
    if (!parentId) {
      return;
    }

    if (parentId === categoryId) {
      throw new BadRequestException('A category cannot be its own parent.');
    }

    const ancestors = await this.ancestorIdsOf(parentId);

    if (ancestors.includes(categoryId)) {
      throw new BadRequestException(
        'A category cannot be moved inside its own subtree.',
      );
    }

    const parentDepth = await this.depthOf(parentId);
    const height = await this.heightOf(categoryId);

    if (parentDepth + height > MAX_CATEGORY_DEPTH) {
      throw new BadRequestException(
        `Moving this category would exceed the ${MAX_CATEGORY_DEPTH} level limit.`,
      );
    }
  }

  private async depthOf(categoryId: string): Promise<number> {
    return (await this.ancestorIdsOf(categoryId)).length + 1;
  }

  /**
   * Walks upward, bounded by MAX_CATEGORY_DEPTH so bad data cannot spin here.
   */
  private async ancestorIdsOf(categoryId: string): Promise<string[]> {
    const ancestors: string[] = [];
    let current = await this.prisma.knowledgeCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, parentId: true },
    });

    if (!current) {
      throw new NotFoundException('Knowledge category not found.');
    }

    while (current?.parentId && ancestors.length <= MAX_CATEGORY_DEPTH) {
      ancestors.push(current.parentId);
      current = await this.prisma.knowledgeCategory.findUnique({
        where: { id: current.parentId },
        select: { id: true, parentId: true },
      });
    }

    return ancestors;
  }

  /**
   * Levels occupied by this category and its descendants: a leaf is 1.
   */
  private async heightOf(categoryId: string): Promise<number> {
    const category = await this.prisma.knowledgeCategory.findUnique({
      where: { id: categoryId },
      select: {
        children: {
          select: { children: { select: { id: true } } },
        },
      },
    });

    if (!category || category.children.length === 0) {
      return 1;
    }

    const hasGrandchildren = category.children.some(
      (child) => child.children.length > 0,
    );

    return hasGrandchildren ? 3 : 2;
  }

  private async resolveCategorySlug(source: string, excludeId?: string) {
    const base = slugify(source);

    if (!base) {
      throw new BadRequestException(
        'Could not derive a slug from that name; set one explicitly.',
      );
    }

    const taken = await this.prisma.knowledgeCategory.findMany({
      where: {
        slug: { startsWith: base },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { slug: true },
    });

    return uniqueSlug(base, new Set(taken.map((row) => row.slug)));
  }

  private async resolveArticleSlug(source: string, excludeId?: string) {
    const base = slugify(source);

    if (!base) {
      throw new BadRequestException(
        'Could not derive a slug from that title; set one explicitly.',
      );
    }

    const taken = await this.prisma.knowledgeArticle.findMany({
      where: {
        slug: { startsWith: base },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { slug: true },
    });

    return uniqueSlug(base, new Set(taken.map((row) => row.slug)));
  }
}
