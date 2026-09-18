import { Injectable } from '@nestjs/common';

import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { ApiLocale } from '../../i18n/types';
import type { PaginatedResult } from '../../common/pagination/paginated-result.interface';
import type { SearchKnowledgeQueryDto } from './dto/knowledge.dto';
import { KnowledgeService } from './knowledge.service';
import {
  MIN_TRIGRAM_TERM_LENGTH,
  normalizeSearchInput,
  searchColumnFor,
} from './knowledge.rules';

interface SearchIdRow {
  id: string;
}

interface SearchCountRow {
  total: bigint;
}

/**
 * Search runs in the request locale only: an English search reads
 * search_text_en with the english configuration and never touches the other
 * two columns.
 *
 * Raw SQL because Prisma cannot express tsvector matching. Two matchers run
 * together: full text search for stemmed word matches, and trigram ILIKE for
 * prefixes, typos and partial words. Both have GIN indexes from migration 039
 * and the OR lets Postgres use either.
 *
 * The visibility rule below duplicates VISIBLE_ARTICLE_WHERE in knowledge.rules.ts.
 * It cannot be shared -- one is Prisma, one is SQL -- so change both together.
 * One ancestor join per level above the article's own category, so the join
 * count here is MAX_CATEGORY_DEPTH - 1.
 */
@Injectable()
export class KnowledgeSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledge: KnowledgeService,
  ) {}

  async search(
    query: SearchKnowledgeQueryDto,
    locale: ApiLocale,
  ): Promise<PaginatedResult<unknown>> {
    const term = normalizeSearchInput(query.q.trim(), locale);

    if (!term) {
      return {
        items: [],
        pagination: { limit: query.limit, offset: query.offset, total: 0 },
      };
    }

    const { column, config } = searchColumnFor(locale);
    const searchColumn = Prisma.raw(`a."${column}"`);
    const searchConfig = Prisma.raw(`'${config}'`);

    // Short terms skip the ILIKE branch: below three characters a trigram index
    // cannot be used and the LIKE would degrade into a sequential scan.
    const useTrigram = term.length >= MIN_TRIGRAM_TERM_LENGTH;
    const trigramPattern = `%${escapeLikePattern(term)}%`;

    const matches = Prisma.sql`
      FROM "knowledge_articles" a
      JOIN "knowledge_categories" c ON c."id" = a."category_id"
      LEFT JOIN "knowledge_categories" p ON p."id" = c."parent_id"
      LEFT JOIN "knowledge_categories" g ON g."id" = p."parent_id"
      WHERE a."status" = 'PUBLISHED'
        AND c."status" = 'ACTIVE'
        AND (c."parent_id" IS NULL OR p."status" = 'ACTIVE')
        AND (p."parent_id" IS NULL OR g."status" = 'ACTIVE')
        AND (
          to_tsvector(${searchConfig}, ${searchColumn})
            @@ websearch_to_tsquery(${searchConfig}, ${term})
          ${
            useTrigram
              ? Prisma.sql`OR ${searchColumn} ILIKE ${trigramPattern} ESCAPE '\\'`
              : Prisma.empty
          }
        )
    `;

    const [rows, countRows] = await this.prisma.$transaction([
      this.prisma.$queryRaw<SearchIdRow[]>`
        SELECT a."id"
        ${matches}
        ORDER BY
          ts_rank(
            to_tsvector(${searchConfig}, ${searchColumn}),
            websearch_to_tsquery(${searchConfig}, ${term})
          ) DESC,
          similarity(${searchColumn}, ${term}) DESC,
          a."published_at" DESC NULLS LAST,
          a."id" ASC
        LIMIT ${query.limit} OFFSET ${query.offset}
      `,
      this.prisma.$queryRaw<SearchCountRow[]>`
        SELECT COUNT(*)::bigint AS total
        ${matches}
      `,
    ]);

    const total = Number(countRows[0]?.total ?? 0n);

    if (rows.length === 0) {
      return {
        items: [],
        pagination: { limit: query.limit, offset: query.offset, total },
      };
    }

    // Hydrate through Prisma so search results carry exactly the same shape as
    // the listing endpoint, then restore the ranked order the database returned.
    const ids = rows.map((row) => row.id);
    const articles = await this.prisma.knowledgeArticle.findMany({
      where: { id: { in: ids } },
      select: {
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
      },
    });

    const byId = new Map(articles.map((article) => [article.id, article]));

    return {
      items: ids
        .map((id) => byId.get(id))
        .filter((article): article is NonNullable<typeof article> =>
          Boolean(article),
        )
        .map((article) => this.knowledge.toListItem(article, locale)),
      pagination: { limit: query.limit, offset: query.offset, total },
    };
  }
}

/**
 * A user searching for "50%" must not have the % read as a LIKE wildcard.
 */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}
