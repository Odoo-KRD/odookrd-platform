import type { Prisma } from '../../generated/prisma/client';
import {
  KnowledgeArticleStatus,
  KnowledgeCategoryStatus,
} from '../../generated/prisma/enums';
import { resolveLocalizedText } from '../../i18n/localized-content';
import { API_SUPPORTED_LOCALES, type ApiLocale } from '../../i18n/types';

/**
 * Pure helpers for the knowledge base. No Nest, no Prisma client, no I/O, so
 * every rule here is testable without a database. 5C authoring depends on
 * buildSearchTexts, so it lives here rather than inside a service.
 */

export interface KnowledgeRichTextNode {
  type?: string;
  text?: string;
  content?: KnowledgeRichTextNode[];
}

/**
 * Flattens a rich text document to searchable plain text. Block boundaries
 * become a space so words never fuse across paragraphs ("...end.Start...").
 */
export function richTextToPlainText(value: unknown): string {
  const parts: string[] = [];

  collectRichText(value, parts);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function collectRichText(value: unknown, parts: string[]): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectRichText(item, parts);
    }

    return;
  }

  if (typeof value !== 'object' || value === null) {
    return;
  }

  const node = value as KnowledgeRichTextNode;

  if (typeof node.text === 'string' && node.text.trim()) {
    parts.push(node.text.trim());
  }

  if (Array.isArray(node.content)) {
    collectRichText(node.content, parts);
  }
}

const ARABIC_MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL = /\u0640/g;

/**
 * Script-level normalization, applied identically when search text is built
 * and when a search term is parsed. The two MUST stay in step: normalizing
 * only one side silently loses matches.
 *
 * `ar` folds hamza carriers, alef maqsura and ta marbuta, which is the usual
 * Arabic search normalization. `ku` folds the Arabic-keyboard letters people
 * type instead of their Kurdish counterparts. `en` is untouched.
 */
export function normalizeSearchInput(value: string, locale: ApiLocale): string {
  const stripped = value.replace(ARABIC_MARKS, '').replace(TATWEEL, '');

  if (locale === 'ar') {
    return stripped
      .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
      .replace(/\u0649/g, '\u064A')
      .replace(/\u0629/g, '\u0647');
  }

  if (locale === 'ku') {
    return stripped.replace(/\u064A/g, '\u06CC').replace(/\u0643/g, '\u06A9');
  }

  return stripped;
}

/**
 * Picks one locale's value out of a translations map, falling back through the
 * remaining locales in the same order resolveLocalizedText uses. An article
 * authored only in Kurdish stays findable while browsing in English.
 */
export function resolveLocalizedValue<T>(
  translations: unknown,
  locale: ApiLocale,
  isValid: (candidate: unknown) => candidate is T,
): T | null {
  if (
    typeof translations !== 'object' ||
    translations === null ||
    Array.isArray(translations)
  ) {
    return null;
  }

  const available: Record<string, unknown> = Object.fromEntries(
    Object.entries(translations),
  );

  for (const candidate of [locale, ...API_SUPPORTED_LOCALES]) {
    const selected: unknown = available[candidate];

    if (isValid(selected)) {
      return selected;
    }
  }

  return null;
}

function isRichTextDocument(value: unknown): value is KnowledgeRichTextNode {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTagArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((tag) => typeof tag === 'string');
}

export function resolveLocalizedRichText(
  translations: unknown,
  locale: ApiLocale,
): KnowledgeRichTextNode | null {
  return resolveLocalizedValue(translations, locale, isRichTextDocument);
}

export function resolveLocalizedTags(
  translations: unknown,
  locale: ApiLocale,
): string[] {
  const tags = resolveLocalizedValue(translations, locale, isTagArray);

  if (!tags) {
    return [];
  }

  return dedupeTags(tags);
}

/**
 * Write-side counterpart: trims, drops empties, de-duplicates case-insensitively
 * and seeds `ku` from the fallback list, mirroring normalizeLocalizedText.
 */
export function normalizeLocalizedTags(
  translations: Partial<Record<ApiLocale, string[]>> | undefined,
  fallback: string[] | undefined,
): Prisma.InputJsonObject {
  const normalized: Record<string, string[]> = {};

  for (const locale of API_SUPPORTED_LOCALES) {
    const tags = dedupeTags(translations?.[locale] ?? []);

    if (tags.length > 0) {
      normalized[locale] = tags;
    }
  }

  const defaultTags = dedupeTags(fallback ?? []);

  if (defaultTags.length > 0 && !Array.isArray(normalized.ku)) {
    normalized.ku = defaultTags;
  }

  return normalized;
}

function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of tags) {
    const trimmed = tag.trim();

    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLocaleLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export interface KnowledgeSearchTextSource {
  title: string;
  titleTranslations: unknown;
  excerpt: string | null;
  excerptTranslations: unknown;
  bodyTranslations: unknown;
  tagsTranslations: unknown;
}

export interface KnowledgeSearchTexts {
  searchTextKu: string;
  searchTextAr: string;
  searchTextEn: string;
}

/**
 * The search_text_<locale> contract, in one place: title, excerpt, tags and
 * flattened body, script-normalized for the locale. 5C must call this on every
 * write, unconditionally -- not only when the body changed.
 */
export function buildSearchText(
  source: KnowledgeSearchTextSource,
  locale: ApiLocale,
): string {
  const parts = [
    resolveLocalizedText(source.titleTranslations, locale, source.title) ?? '',
    resolveLocalizedText(source.excerptTranslations, locale, source.excerpt) ??
      '',
    resolveLocalizedTags(source.tagsTranslations, locale).join(' '),
    richTextToPlainText(
      resolveLocalizedRichText(source.bodyTranslations, locale),
    ),
  ];

  return normalizeSearchInput(
    parts
      .map((part) => part.trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim(),
    locale,
  );
}

export function buildSearchTexts(
  source: KnowledgeSearchTextSource,
): KnowledgeSearchTexts {
  return {
    searchTextKu: buildSearchText(source, 'ku'),
    searchTextAr: buildSearchText(source, 'ar'),
    searchTextEn: buildSearchText(source, 'en'),
  };
}

/**
 * The category tree is three levels deep, matching how Odoo's own
 * documentation is organised (section > subsection > topic, articles at the
 * leaf). Nothing in the database enforces this -- the self-referencing FK
 * allows any depth -- so every depth check reads this constant, and the
 * queries below hardcode exactly this many ancestor hops.
 *
 * Raising it means revisiting activeAncestryWhere, the category tree select in
 * knowledge.service.ts, and the ancestor joins in knowledge-search.service.ts.
 * Past a fixed depth those all become recursive CTEs, which is the reason this
 * is a small number rather than "unlimited".
 */
export const MAX_CATEGORY_DEPTH = 3;

/**
 * A category is reachable when it is ACTIVE and so is every ancestor above it.
 * An inactive category hides its whole subtree, however deep.
 *
 * Expressed as nested OR branches -- one per level -- because Prisma has no
 * recursive relation filter. The nesting depth here IS MAX_CATEGORY_DEPTH.
 */
const ACTIVE_ANCESTRY_WHERE = {
  status: KnowledgeCategoryStatus.ACTIVE,
  OR: [
    { parentId: null },
    {
      parent: {
        status: KnowledgeCategoryStatus.ACTIVE,
        OR: [
          { parentId: null },
          { parent: { status: KnowledgeCategoryStatus.ACTIVE } },
        ],
      },
    },
  ],
} satisfies Prisma.KnowledgeCategoryWhereInput;

/**
 * Customer visibility, agreed for stage 5: an article is visible when it is
 * PUBLISHED and its category's whole ancestry is ACTIVE.
 *
 * Kept as a constant so listing, article fetch and search cannot drift apart.
 * The search service repeats it in raw SQL; change both together.
 */
export const VISIBLE_ARTICLE_WHERE = {
  status: KnowledgeArticleStatus.PUBLISHED,
  category: ACTIVE_ANCESTRY_WHERE,
} satisfies Prisma.KnowledgeArticleWhereInput;

export const VISIBLE_CATEGORY_WHERE = {
  status: KnowledgeCategoryStatus.ACTIVE,
} satisfies Prisma.KnowledgeCategoryWhereInput;

/**
 * Trigram matching needs at least three characters to use the GIN index; below
 * that Postgres falls back to a sequential scan. Two-character terms still run
 * (full text search handles them), they just skip the ILIKE branch.
 */
export const MIN_TRIGRAM_TERM_LENGTH = 3;

export interface KnowledgeSearchColumn {
  column: string;
  config: string;
}

/**
 * Locale to column and text search configuration. Neither value can be a bound
 * parameter in Postgres, so both are interpolated into the query -- which is
 * safe only because they come from this closed map and never from user input.
 */
export function searchColumnFor(locale: ApiLocale): KnowledgeSearchColumn {
  switch (locale) {
    case 'ar':
      return { column: 'search_text_ar', config: 'arabic' };
    case 'en':
      return { column: 'search_text_en', config: 'english' };
    case 'ku':
    default:
      return { column: 'search_text_ku', config: 'simple' };
  }
}

/**
 * Transliteration for slug generation. Kurdish and Arabic titles have to reach
 * a URL as ASCII, so each letter maps to its nearest Latin equivalent.
 *
 * Multi-character sequences are listed first and applied first: without that,
 * "وو" would become "ww" instead of "u", and "ch" would never survive "چ".
 * This is deliberately lossy -- two different titles can transliterate to the
 * same slug, which is what the uniqueness suffix in the admin service is for.
 */
const SLUG_DIGRAPHS: ReadonlyArray<readonly [string, string]> = [
  ['\u0648\u0648', 'u'],
  ['\u06CE', 'e'],
];

const SLUG_LETTERS: Readonly<Record<string, string>> = {
  // Shared Arabic-script letters
  '\u0627': 'a',
  '\u0628': 'b',
  '\u062A': 't',
  '\u062B': 'th',
  '\u062C': 'j',
  '\u062D': 'h',
  '\u062E': 'kh',
  '\u062F': 'd',
  '\u0630': 'dh',
  '\u0631': 'r',
  '\u0632': 'z',
  '\u0633': 's',
  '\u0634': 'sh',
  '\u0635': 's',
  '\u0636': 'd',
  '\u0637': 't',
  '\u0638': 'z',
  '\u0639': 'a',
  '\u063A': 'gh',
  '\u0641': 'f',
  '\u0642': 'q',
  '\u0643': 'k',
  '\u0644': 'l',
  '\u0645': 'm',
  '\u0646': 'n',
  '\u0647': 'h',
  '\u0648': 'w',
  '\u064A': 'y',
  '\u0629': 'h',
  '\u0649': 'y',
  // Kurdish and Persian additions
  '\u067E': 'p',
  '\u0686': 'ch',
  '\u0698': 'zh',
  '\u06A9': 'k',
  '\u06AF': 'g',
  '\u06B5': 'll',
  '\u0695': 'rr',
  '\u06A4': 'v',
  '\u06CC': 'y',
  '\u06C6': 'o',
  '\u06D5': 'e',
  // Eastern Arabic digits
  '\u0660': '0',
  '\u0661': '1',
  '\u0662': '2',
  '\u0663': '3',
  '\u0664': '4',
  '\u0665': '5',
  '\u0666': '6',
  '\u0667': '7',
  '\u0668': '8',
  '\u0669': '9',
  '\u06F0': '0',
  '\u06F1': '1',
  '\u06F2': '2',
  '\u06F3': '3',
  '\u06F4': '4',
  '\u06F5': '5',
  '\u06F6': '6',
  '\u06F7': '7',
  '\u06F8': '8',
  '\u06F9': '9',
};

/**
 * Room for a "-123" uniqueness suffix inside the column's 200 characters.
 */
export const MAX_SLUG_LENGTH = 190;

/**
 * Title to URL slug: transliterated to ASCII, lowercased, spaces and
 * punctuation collapsed to single hyphens.
 *
 * Returns an empty string when nothing survives (a title of only punctuation,
 * say); callers decide what to do about that rather than getting a slug of
 * hyphens.
 */
export function slugify(value: string): string {
  let text = value.normalize('NFKD').replace(/[\u0300-\u036F]/g, '');

  for (const [sequence, replacement] of SLUG_DIGRAPHS) {
    text = text.split(sequence).join(replacement);
  }

  text = Array.from(text)
    .map((character) => SLUG_LETTERS[character] ?? character)
    .join('');

  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');
}

/**
 * Appends -2, -3 ... until the slug is not in `taken`. The caller supplies the
 * set; the database unique index remains the real guarantee.
 */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) {
    return base;
  }

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${base.slice(0, MAX_SLUG_LENGTH - 5)}-${suffix}`;

    if (!taken.has(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Unable to derive a unique slug from "${base}".`);
}
