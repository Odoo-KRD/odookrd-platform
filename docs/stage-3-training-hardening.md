# Stage 3 Training — Security and Release Hardening

Stage 3C.6B is the final hardening pass for the Training subsystem. It does not add a new customer feature and does not introduce analytics tables or speculative database indexes.

## Authorization matrix

- `training.read`: customer learning catalog and entitled training content.
- `training.manage`: platform-only training catalog, content, media, quiz and certificate-template administration.
- `training.assign`: company-scoped training assignment administration.
- `training.progress.read`: authorized progress administration.
- `training.reports.read`: Platform Admin cross-company reporting and Company Admin own-company reporting.

Standard Company Users do not receive training administration or reporting permissions.

## Tenant isolation

Company-scoped reporting derives the effective company from the authenticated principal. A Company principal cannot switch tenant scope through a `companyId` query parameter. Platform principals must remain platform-scoped (`companyId = null`) and may optionally select a reporting company.

Customer media, progress, quiz attempts, completions and certificates remain subject to the existing backend entitlement/company checks. Frontend filtering is never treated as the tenant authority.

## Reporting semantics

- Active learners are distinct users with course progress activity, a completion, a graded quiz attempt, or a certificate issuance in the selected date window.
- Courses engaged are distinct courses with course-progress activity in the selected date window.
- Quiz metrics include graded `PASSED` and `FAILED` attempts.
- Certificate metrics use certificate `issuedAt` for the report date window.
- CSV export uses the same backend company and filter scope as the interactive reports and neutralizes spreadsheet-formula prefixes.

## Performance decision

No Stage 3C.6B migration is created by default. The hardening batch prints PostgreSQL table estimates, relevant index definitions and representative read-only `EXPLAIN` plans. Reporting indexes should only be introduced later if real production scale/query plans demonstrate a need.

## Historical source-contract tests

Nine early Stage 3 test files assert implementation details that were deliberately superseded by later approved substages. Examples include requiring `StreamableFile` instead of the later exact buffered response, forbidding drag-and-drop before the Course Editor introduced it, requiring an older player style alias, and requiring Kurdish certificate date formatting before 3C.5C standardized certificate dates to English. These files remain useful historical records but are not release gates for the final architecture.

The release gate instead requires the remaining current Stage 3 contracts plus behavior-level unit/E2E tests, authorization and tenant-isolation tests, Prisma validation, typechecks, lint and production builds.

## Release validation

The Stage 3C.6B batch runs current Stage 3 architecture tests, reporting unit tests, NestJS E2E guard/isolation tests, the full API unit suite, the full API E2E suite, Prisma validation and migration status, API/Portal typechecks, lint, production builds, whitespace checks, a read-only database performance audit, production service restart, and local health checks. Historical source-contract tests that assert superseded implementation details are documented and excluded from the release gate; behavior, authorization, tenant isolation and production compilation remain mandatory.

No Git commit, tag, push or GitHub write is performed by the batch.
