# Stage 5 — Knowledge Base

A three-level documentation tree for Odoo guidance, authored by platform staff and readable by every authenticated user. Search runs in the reader's own locale. Readers can say whether an article helped, and an unhelpful answer with a comment notifies platform administrators.

This document records the decisions that are not recoverable from the code, and the database objects Prisma does not manage.

## Structure and depth

Categories nest three levels deep — section, subsection, topic — matching how Odoo's own documentation is organised. Articles attach to a category at any level.

Nothing in the database enforces the depth. The self-referencing foreign key allows any nesting, and the only database constraint is `knowledge_categories_not_self_parent`, which catches a one-node loop and nothing longer. The limit lives in `MAX_CATEGORY_DEPTH` in `knowledge.rules.ts` and is enforced in `KnowledgeAdminService`:

- creating under a parent already at the limit is rejected;
- moving a category checks the deepest leaf beneath it, not just the category itself, so a two-level subtree cannot be dropped under a level-2 parent;
- moving a category inside its own subtree is rejected, since the database cannot detect that cycle.

Raising the limit means revisiting three places that hardcode the number of ancestor hops: `ACTIVE_ANCESTRY_WHERE` in `knowledge.rules.ts`, the category tree select in `knowledge.service.ts`, and the ancestor joins in `knowledge-search.service.ts`. Past a fixed depth all three become recursive CTEs, which is why the limit is a small number rather than "unlimited".

## Visibility

An article is visible to customers when it is `PUBLISHED` **and** every category above it is `ACTIVE`. An inactive category hides its whole subtree, however deep.

This rule exists twice and cannot be shared, because one form is Prisma and the other is SQL:

- `VISIBLE_ARTICLE_WHERE` in `knowledge.rules.ts`, used by listing and article fetch;
- the `WHERE` clause in `knowledge-search.service.ts`, with one `LEFT JOIN` per ancestor level.

Change both together.

## Search

Search runs in the request locale only: an English search reads `search_text_en` with the `english` text-search configuration and never touches the other two columns.

`search_text_<locale>` holds **title + excerpt + tags + flattened body** for that locale, script-normalized. It is built by `buildSearchText` and must be recomputed on every article write, unconditionally — never gated on "did the body change". `KnowledgeAdminService` does this on both create and update.

Two matchers run together: full-text search for stemmed word matches, and a trigram `ILIKE` for prefixes and typos. Both have GIN indexes. Terms under `MIN_TRIGRAM_TERM_LENGTH` (3) skip the trigram half, because a trigram index cannot serve them and the `LIKE` would degrade to a sequential scan.

### Script normalization

`normalizeSearchInput` is applied when search text is built **and** to the incoming search term. Normalizing only one side silently loses matches; a unit test asserts the two agree.

Arabic folds diacritics, tatweel, hamza carriers, alef maqsura and ta marbuta. Kurdish folds diacritics, tatweel, and the Arabic-keyboard letters people type instead of their Kurdish counterparts. English is untouched.

The `unaccent` extension was created in migration 039 and dropped in 040 without ever being used: `unaccent()` is `STABLE`, so it cannot appear in an index expression without a custom `IMMUTABLE` wrapper. Normalizing at write time avoids the problem entirely.

### Cross-locale fallback

An article authored only in Kurdish still has its text written into `search_text_en`, so it remains findable while browsing in English. The alternative — empty columns for unauthored locales — makes articles invisible until fully translated. The same fallback governs display: `normalizeLocalizedText` seeds `ku` from the base string, so an English-only title renders as English for a Kurdish reader rather than as a blank.

A consequence worth knowing: "has a Kurdish translation" and "fell back to the base string" are indistinguishable in the data, so no report can list what still needs translating. Reconstructing it by comparing `titleTranslations.ku` against `title` is approximate — an author may legitimately type the same string.

## Slugs

Auto-derived from the name or title, overridable by passing `slug` explicitly, unique globally per table with a `-2`, `-3` suffix on collision. Kurdish and Arabic are transliterated letter by letter to Latin, Eastern Arabic digits map to ASCII, spaces become hyphens.

Customer URLs are `/kb/:categorySlug/:articleSlug`. Article slugs are globally unique, so the category segment is display context — a stale one still resolves the right article. There is **no redirect table**: editing a published article's slug breaks every link anyone has shared.

## Manually managed database objects

Prisma does not model these. They were created by hand-written SQL and will not be regenerated. A future migration that touches them, or a generated migration that proposes dropping them, must be corrected by hand.

| Object | Created in | Why Prisma cannot model it |
| --- | --- | --- |
| `knowledge_articles_fts_ku_idx`, `_ar_idx`, `_en_idx` | 039 | Expression indexes on `to_tsvector(config, column)` |
| `enforce_notification_recipient_scope()` | 009, replaced in 042 | Trigger function |

**If `prisma migrate dev` ever generates `DROP INDEX` for the three FTS indexes, delete those lines before applying.** Losing them breaks nothing visibly; search simply stops using its indexes.

Migrations 041 and 042 both ran without proposing the drops, so the risk is lower than feared, but it has not been ruled out across future schema changes.

## Migration history

- **039** — schema: categories, articles, search columns, indexes, `pg_trgm` and `unaccent`.
- **040** — `body` → `body_translations`, `tags_translations` added, `unaccent` dropped. Written by hand and registered with `prisma migrate resolve --applied`; every later migration went through Prisma.
- **041** — `knowledge_article_feedback`.
- **042** — recipient-scope trigger relaxed (see below).

## Feedback and notifications

One row per reader per article, upserted on `(article_id, user_id)`: answering again corrects the tally instead of inflating it. The comment is collected only alongside an unhelpful answer and is optional even then — the answer posts immediately, and the comment follows as a second request if the reader writes one.

`onDelete: Cascade` on the article, unlike the `Restrict` used elsewhere in the knowledge base: feedback on a deleted article is noise.

Every unhelpful answer carrying a comment notifies platform administrators. The idempotency key includes the feedback row's `updatedAt`, so a retried request does not double-notify but an edited comment notifies again.

### Migration 042, and why it was needed

`AdminEventNotificationService` sends operational alerts to platform administrators with `allowPlatformRecipients: true`. The trigger from migration 009 required **every** recipient to be a `COMPANY` user of the notification's own company — so the application layer permitted platform recipients and the database forbade them.

Nothing had exercised this: `admin.broadcast` uses a different path, and no renewal, certificate or course completion had occurred in the log retention window. Knowledge feedback was the first event to hit it, and it failed silently because `publish()` catches and logs its own errors.

042 relaxes the trigger: a `COMPANY` recipient must still belong to the notification's company, and the notification must still name a company, but a `PLATFORM`-scoped recipient is now allowed. This fixed **all four** admin event types, not only knowledge feedback.

### Related fix outside this stage

`FilesService` allowed a company user to read only files whose `companyId` matched theirs. Knowledge base images are uploaded by platform staff and are `PLATFORM`-scoped with a null `companyId`, so every embedded image returned 404 for customers. Platform-scoped assets — knowledge base images, certificate artwork, branding — are now readable by any authenticated user. Company-scoped assets are unchanged.

## Permissions

The knowledge base is readable by **every authenticated user**; the customer endpoints carry no permission key and sit behind `AuthenticatedGuard` alone. This is deliberate and differs from training, which gates on `training.read`. The trade-off: there is no way to revoke knowledge base access from a role without adding a key and redeploying.

Authoring requires `knowledge.manage`, seeded in `prisma/seed.ts` and granted to `platform_admin`. The key exists in **two** places that must agree — `PERMISSIONS` in `apps/api/src/modules/authorization/permissions.ts` and in `packages/types`, which is what the portal imports.

## Known gaps

- **No redirect table for changed slugs.** Editing a published article's slug breaks shared links.
- **The sidebar loads every published article** on each knowledge base page, in pages of 100, bounded at ten. Past roughly a thousand articles it wants a dedicated endpoint returning only id, slug, title and category.
- **The category page fetches up to 100 articles** with no pagination control.
- **Reordering is not atomic.** Each sibling group saves in its own request.
- **`.catch(() => [])` fallbacks** in the knowledge base pages turn any API error into empty content. Good for resilience, bad for diagnosis — an oversized `limit` once emptied the sidebar silently. First place to look when something renders blank.
- **Silent skips in the notification hook.** No notification is sent when the reader has no company or the comment is empty. Both are correct, but from outside they are indistinguishable from a bug.
- **No moderation** on feedback comments.
