# OdooKRD Stage 2H.4F.1–F.4 Technical Specification

Status: Approved architecture; normative implementation specification
Last reviewed: 2026-08-25
Canonical repository: Odoo-KRD/odookrd-platform
Implementation branch at review time: stage/2h4-admin-ux-rbac
Owners: OdooKRD platform team

## 1. Purpose

This document formalizes the approved architecture for Stage 2H.4F.1–F.4. It is the implementation contract for:

- activating safe, reusable AdminDataTable batch actions;
- adding service features to the platform service catalog;
- improving platform administration of services assigned to companies;
- enforcing an explicit company-service lifecycle and preserving lifecycle history; and
- keeping the service domain structurally ready for future commercial plans without implementing pricing or other Stage 9 commerce behavior.

The specification is additive to the completed Stage 2 service foundation. Existing authentication, permissions, multilingual content, audit logging, settings, notifications, customer workspace, Service, and CompanyService behavior remain authoritative unless this document explicitly extends them.

## 2. Scope boundary

### 2.1 In scope

- A hardened AdminDataTable selection and batch-action contract.
- Server-authoritative filters, pagination, authorization, validation, and batch mutation results.
- Safe batch status actions for Companies, Users, Services, and Company Services.
- Catalog-level ServiceFeature definitions with multilingual labels and typed values.
- Reusable category-specific ServiceFeatureDefinition records managed under Services → Features.
- Assignment-level CompanyServiceFeature values copied from the catalog and safely overridable by platform operators.
- Company Service list, create, edit, feature, status, and history administration.
- An explicit CompanyService transition state machine.
- Append-only CompanyServiceLifecycleEvent records.
- Typed shared contracts in packages/types.
- Additive Prisma migrations, database constraints, audit actions, tests, and multilingual admin UX.
- Structural extension points for a later ServicePlan/commercial layer.

### 2.2 Explicitly out of scope

Stage 2H.4F must not add or simulate any of the following:

- prices, price lists, currencies, billing intervals, discounts, taxes, or price calculations;
- packages or paid plans presented for purchase;
- carts, quotes, checkout, orders, invoices, subscriptions, renewals, refunds, or payments;
- payment-gateway or payment-provider integration;
- automatic commercial provisioning based on an order or payment;
- WHMCS price caching, checkout validation, or order creation;
- public website sales pages; or
- Stage 9 database tables, APIs, or UI hidden behind feature flags.

Company Services remain operational entitlements managed by OdooKRD. They are not invoices, subscriptions, or order lines. When Stage 9 begins, WHMCS remains the commercial authority under the previously approved platform architecture; OdooKRD must not become a second billing system.

## 3. Current implementation baseline

The stage branch already contains:

- Service and CompanyService Prisma models;
- service category, catalog status, and company-service status enums;
- multilingual service name/description and assignment display-name fields;
- platform-only catalog and assignment mutations protected by services.manage;
- company-scoped assignment reads protected by services.read;
- removal of internalNotes from company-account responses;
- HTTPS URL and start/expiration date validation;
- audit records for service and assignment create/update operations;
- the first AdminDataTable implementation with client-side current-page search, row selection, and a server-action hook; and
- Companies, Users, Roles, and notification delivery pages already using AdminDataTable, while service pages still use the older shared DataTable.

F.1 must evolve this baseline rather than replace stable components. Existing routes remain compatible. In particular, PATCH /service-assignments/:id may continue accepting status during migration, but every status change must pass through the same lifecycle transition service used by the new transition endpoints.

## 4. Approved substage sequence

| Substage | Objective | Database impact |
| --- | --- | --- |
| F.1 | Harden AdminDataTable and activate real batch actions | None expected |
| F.2 | Add catalog Service Features | Add ServiceFeature and supporting enums/constraints |
| F.3 | Add Company Service management and assignment feature values | Add CompanyServiceFeature and indexes/constraints |
| F.4 | Add lifecycle transition enforcement, append-only history, and future-pricing boundary | Add CompanyServiceLifecycleEvent and history backfill |

Each substage must be independently deployable. A later substage may consume an earlier one, but no substage may require Stage 9 commerce code.

## 5. Domain architecture

### 5.1 Aggregate responsibilities

| Aggregate | Responsibility | Must not own |
| --- | --- | --- |
| Service | Stable platform catalog identity and descriptive metadata | Customer ownership, price, order, payment |
| ServiceFeatureDefinition | Reusable category-scoped feature template, parameter label, type, unit, and future-service default | Company entitlement, monetary value, customer visibility |
| ServiceFeature | A typed capability/attribute defined for one Service | Monetary value or purchasability |
| CompanyService | Operational assignment/entitlement belonging to one Company | Billing authority or payment state |
| CompanyServiceFeature | Effective feature value for one CompanyService | Price calculation |
| CompanyServiceLifecycleEvent | Immutable domain history of CompanyService status transitions | General audit-log replacement |
| AuditLog | Security/administration evidence for mutations | Customer-facing lifecycle truth |

Service and CompanyService remain separate. A Service describes what OdooKRD can provide; a CompanyService records a concrete service assigned to a customer company. Multiple CompanyService records may reference the same Service.

### 5.2 Feature value types

The supported feature value types are:

- BOOLEAN: a JSON boolean;
- NUMBER: a finite JSON number, with an optional non-monetary unit; and
- STORAGE: a finite JSON number, with an optional MB, GB, or TB unit; and
- TEXT: a non-empty string with optional ku/ar/en translations.

Units describe capacity or measurement only, such as users, GB, domains, hours, or instances. Currency codes and monetary units are rejected in this stage.

### 5.3 Feature inheritance

When a CompanyService is created, all ACTIVE ServiceFeature records are copied into CompanyServiceFeature rows in the same transaction. This is a catalog snapshot, so later catalog edits do not silently change an existing customer's entitlement.

Platform operators may:

- override an assignment feature value;
- reset a value to the ServiceFeature's current catalog default; or
- sync newly added active catalog features into an assignment without overwriting existing assignment values.

There is no automatic destructive synchronization. Inactivating a catalog feature prevents it from being copied to new assignments, but it does not erase existing CompanyServiceFeature rows.

## 6. Database specification

All identifiers are UUIDs, timestamps are TIMESTAMPTZ(6), and table/column names use the existing snake_case mapping convention.

### 6.1 Existing models retained

Service retains its stable unique key, multilingual content, category, catalog status, assignment relation, and timestamps.

CompanyService retains companyId, serviceId, multilingual display name, status, HTTPS serviceUrl, startsAt, expiresAt, customer-visible notes, platform-only internalNotes, and timestamps. Existing foreign keys remain ON DELETE RESTRICT.

### 6.2 New enums

| Enum | Values |
| --- | --- |
| ServiceFeatureValueType | BOOLEAN, NUMBER, STORAGE, TEXT |
| ServiceFeatureStatus | ACTIVE, INACTIVE |
| CompanyServiceFeatureSource | CATALOG_DEFAULT, ADMIN_OVERRIDE |
| CompanyServiceLifecycleSource | ADMIN, SYSTEM, INTEGRATION |

No enum in this stage may contain pricing, billing, payment, order, or checkout states.

### 6.3 ServiceFeature

| Field | Contract |
| --- | --- |
| id | UUID primary key |
| serviceId | Required UUID FK to services; ON DELETE RESTRICT |
| key | Required varchar(100); regex ^[a-z][a-z0-9_-]{1,99}$ |
| name | Required fallback varchar(200) |
| nameTranslations | JSONB localized text; default {} |
| description | Nullable varchar(1000) |
| descriptionTranslations | JSONB localized text; default {} |
| valueType | ServiceFeatureValueType |
| defaultValue | Required JSONB validated against valueType |
| valueTranslations | JSONB localized text; used only for TEXT; default {} |
| unit | Nullable varchar(32); NUMBER only; explicitly non-monetary |
| status | ServiceFeatureStatus; default ACTIVE |
| customerVisible | Boolean; default true |
| sortOrder | Integer; 0..10000; default 0 |
| createdAt / updatedAt | Standard timestamps |

Constraints and indexes:

- unique(service_id, key);
- index(service_id, status, sort_order, id);
- localized-text constraints equivalent to the existing odookrd_valid_localized_text function;
- a database check validating defaultValue JSON type against valueType;
- TEXT requires a non-empty fallback value no longer than 500 characters;
- BOOLEAN forbids unit and value translations;
- NUMBER permits an optional unit but forbids value translations; and
- no hard-delete API. Features are retired by setting status to INACTIVE.

### 6.4 CompanyServiceFeature

| Field | Contract |
| --- | --- |
| id | UUID primary key |
| companyServiceId | Required UUID FK to company_services; ON DELETE CASCADE |
| serviceFeatureId | Required UUID FK to service_features; ON DELETE RESTRICT |
| value | Required JSONB validated against the referenced feature valueType |
| valueTranslations | JSONB localized text for TEXT values; default {} |
| source | CATALOG_DEFAULT or ADMIN_OVERRIDE |
| customerVisibleOverride | Nullable Boolean; null inherits ServiceFeature.customerVisible |
| sortOrderOverride | Nullable Integer; 0..10000 |
| createdAt / updatedAt | Standard timestamps |

Constraints and indexes:

- unique(company_service_id, service_feature_id);
- index(company_service_id, sort_order_override, id);
- the referenced ServiceFeature must belong to CompanyService.serviceId; this invariant is checked in the service layer inside the transaction and covered by integration tests;
- value type validation is performed by DTO/service validation and a database check/helper where practicable; and
- company feature values are never returned until the parent CompanyService has passed company-scope authorization.

### 6.5 CompanyServiceLifecycleEvent

| Field | Contract |
| --- | --- |
| id | UUID primary key |
| companyServiceId | Required UUID FK to company_services; ON DELETE RESTRICT |
| companyId | Required UUID FK to companies; denormalized for scoped history queries |
| fromStatus | Nullable CompanyServiceStatus; null only for creation/backfill event |
| toStatus | Required CompanyServiceStatus |
| source | ADMIN, SYSTEM, or INTEGRATION |
| reasonCode | Nullable varchar(80) machine-readable code |
| reason | Nullable varchar(1000) operator/internal explanation |
| actorUserId | Nullable UUID FK to users; ON DELETE SET NULL |
| actorEmailSnapshot | Nullable varchar(320) |
| effectiveAt | Required TIMESTAMPTZ(6) |
| metadata | Nullable JSONB; allow-listed keys only |
| createdAt | Immutable creation timestamp |

Indexes:

- index(company_service_id, effective_at DESC, id DESC);
- index(company_id, effective_at DESC, id DESC); and
- index(to_status, effective_at) for operational reporting.

Lifecycle events are append-only. Prisma services expose create/read only; no update or delete method/endpoint is permitted. Audit records remain separate and are written in the same transaction as the domain change.

## 7. Company Service lifecycle

### 7.1 Allowed transitions

| From | Allowed targets |
| --- | --- |
| PROVISIONING | ACTIVE, SUSPENDED, CANCELLED |
| ACTIVE | SUSPENDED, EXPIRED, CANCELLED |
| SUSPENDED | ACTIVE, EXPIRED, CANCELLED |
| EXPIRED | ACTIVE, CANCELLED |
| CANCELLED | None; terminal |

Rules:

- A request whose target equals the current status is idempotent: return UNCHANGED and create no lifecycle event.
- Transitions to SUSPENDED or CANCELLED require a reason.
- CANCELLED is terminal. A renewed/restarted service is represented by a new CompanyService, except EXPIRED may return to ACTIVE for an operator-confirmed renewal.
- effectiveAt may be omitted and defaults to the API transaction time. Future scheduling is not implemented; a supplied value must not be materially in the future.
- expiresAt does not silently change status in this stage. A future worker may perform an EXPIRED transition with source SYSTEM, but it must use the same transition service and write history.
- Creation writes an initial event with fromStatus null and toStatus equal to the initial CompanyService status.
- PATCH /service-assignments/:id remains backward compatible. If status is present, it delegates to the transition service and cannot bypass transition validation/history.

## 8. AdminDataTable F.1 contract

### 8.1 Component boundary

AdminDataTable remains under apps/portal/src/components/admin while it is admin-specific. It should move to packages/ui only if a second application needs the same behavior and the admin-specific permissions/server-action assumptions have been removed.

### 8.2 Required behavior

- selectable defaults to false; checkboxes appear only when the current user has at least one permitted batch action;
- selection is restricted to rows loaded on the current page;
- Select all means all currently visible rows on the current page, not all rows matching the query across every page;
- the header checkbox supports checked, unchecked, and indeterminate states;
- selected IDs are intersected with the current rows after filtering, navigation, revalidation, or mutation;
- selection clears after a successful batch action;
- hidden/stale IDs cannot be submitted after the row set changes;
- actions are disabled while pending and duplicate submission is prevented;
- disruptive actions require an explicit confirmation that names the action and selected count;
- success reports changed and unchanged counts; errors remain visible and preserve selection when safe;
- keyboard navigation, labels, focus states, and screen-reader text are required;
- ku/ar RTL and en LTR layouts must remain correct; and
- client-side search may remain for small in-memory data sets, but paginated administration uses server-authoritative search/filter query parameters. The UI must not imply that searching one loaded page searches the entire database.

The filter bar is supplied as a reusable toolbar/slot. AdminDataTable owns visual layout and selection; each page owns its validated URL search parameters and API filters.

### 8.3 Initial action matrix

| Table | Batch actions | Permission/scope | Explicit exclusions |
| --- | --- | --- | --- |
| Companies | Set ACTIVE, SUSPENDED, ARCHIVED | companies.manage; PLATFORM account | No delete; no cascade |
| Users | Set ACTIVE or SUSPENDED for eligible existing accounts | users.manage; API company scope enforced | No activation of INVITED account; no self-suspension; no last-admin removal |
| Service catalog | Set ACTIVE or INACTIVE | services.manage; PLATFORM account | No delete |
| Company Services | Valid lifecycle transition | services.manage; PLATFORM account | No transition bypass; no delete |
| Roles | None in F.1 | N/A | System/custom role safeguards make generic delete unsafe |
| Notification delivery log | None in F.1 | N/A | Read-only evidence; no generic retry/delete |

Every batch API re-fetches all target records and re-authorizes them. Client-hidden actions are a usability measure, never an authorization boundary.

### 8.4 Batch mutation semantics

- 1..100 unique UUIDs per request; empty, duplicate, malformed, or oversized sets are rejected.
- Mutations are atomic: validate existence, scope, status transition, and safeguards for every target before writing any target.
- A validation failure returns no partial changes and identifies the invalid IDs with stable error codes.
- Same-state targets are UNCHANGED and do not create duplicate audit/lifecycle records.
- One database transaction performs records, history events, and audit logs.
- Responses use a shared BatchMutationResult with requested, changed, unchanged, and item outcomes.

## 9. API contracts

All endpoints use the existing session authentication, AuthenticatedGuard, AuthorizationGuard, DTO validation, UUID parsing, and typed @odookrd/types contracts. Limit remains 1..100 and offset remains non-negative.

### 9.1 Shared batch contracts

BatchStatusRequest:

- ids: unique UUID[]; 1..100;
- status: endpoint-specific enum value.

BatchMutationResult:

- requested: number;
- changed: number;
- unchanged: number;
- items: ordered array of { id, outcome: CHANGED | UNCHANGED, updatedAt }.

Stable errors include INVALID_BATCH, NOT_FOUND, FORBIDDEN_SCOPE, INVALID_TRANSITION, SELF_PROTECTION, LAST_ADMIN_PROTECTION, and CONFLICT.

### 9.2 F.1 endpoints

| Method and route | Request | Authorization |
| --- | --- | --- |
| POST /companies/batch-status | { ids, status } | companies.manage + PLATFORM |
| POST /users/batch-status | { ids, status: ACTIVE or SUSPENDED } | users.manage + resolved company scope |
| POST /services/batch-status | { ids, status: ACTIVE or INACTIVE } | services.manage + PLATFORM |
| POST /service-assignments/batch-transition | { ids, toStatus, reason?, effectiveAt? } | services.manage + PLATFORM |

### 9.3 Service Feature endpoints

| Method and route | Purpose | Authorization |
| --- | --- | --- |
| GET /services/:serviceId/features | Paginated ordered catalog features; filters status/search | services.manage + PLATFORM |
| POST /services/:serviceId/features | Create a feature | services.manage + PLATFORM |
| PATCH /services/:serviceId/features/:featureId | Edit/inactivate a feature | services.manage + PLATFORM |
| POST /services/:serviceId/features/reorder | Atomically reorder IDs belonging to the service | services.manage + PLATFORM |

Create/update DTOs validate key, localized fields, valueType/defaultValue agreement, unit, visibility, status, and sort order. valueType cannot change after a CompanyServiceFeature references the feature; create a new feature and inactivate the old definition instead.

### 9.4 Company Service endpoints

Existing routes remain:

- GET /service-assignments with companyId, serviceId, status, limit, and offset;
- GET /service-assignments/:id;
- POST /service-assignments; and
- PATCH /service-assignments/:id.

The list query is extended additively with search, startsFrom, startsTo, expiresFrom, and expiresTo. Search covers company name, service name/key, and assignment display name. Platform accounts may filter any company; company accounts are forcibly scoped to principal.companyId regardless of omitted filters.

New routes:

| Method and route | Purpose | Authorization |
| --- | --- | --- |
| POST /service-assignments/:id/transitions | Perform one validated status transition | services.manage + PLATFORM |
| GET /service-assignments/:id/history | Read ordered lifecycle history | services.read + company scope |
| GET /service-assignments/:id/features | Read effective assignment features | services.read + company scope |
| PATCH /service-assignments/:id/features/:featureId | Override/reset one assignment value | services.manage + PLATFORM |
| POST /service-assignments/:id/features/sync | Add missing active catalog features without overwriting existing values | services.manage + PLATFORM |

Company-account history responses expose only id, fromStatus, toStatus, source, effectiveAt, and createdAt. reason, reasonCode, actor identity, metadata, internalNotes, inactive non-customer-visible features, and platform-only fields are removed server-side.

### 9.5 Audit actions

Add named constants and use them consistently:

- service.batch_status_changed;
- service.feature.created;
- service.feature.updated;
- service.feature.reordered;
- service.assignment.feature.updated;
- service.assignment.features_synced;
- service.assignment.status_transitioned; and
- service.assignment.batch_transitioned.

Per-target lifecycle events are required. A batch may use one summary audit log plus target IDs only when metadata stays within the audit payload limit; otherwise write one audit record per target with a shared requestId.

## 10. Admin UX specification

### 10.1 Services information architecture

The Services administration area uses two primary views:

- Catalog: Service records and feature definitions; and
- Company Services: operational assignments across companies.

These may be horizontal tabs within the Services section or separate routes with consistent navigation. They must not be presented as pricing plans.

### 10.2 Catalog list and detail

Catalog list:

- AdminDataTable with server search, category/status filters, assignment count, feature count, and activate/inactivate batch actions;
- Add Service primary action;
- no hard-delete action.

Service detail:

- Overview section for existing multilingual fields/category/status;
- Features section with ordered rows, add/edit/inactivate/reorder controls;
- Company Services section showing assignments for this service; and
- Assign to Company action with service preselected.

### 10.3 Company Services list and detail

Company Services list:

- full-width AdminDataTable;
- server search and company/service/status/date filters;
- columns for company, effective display name, catalog service, status, starts, expires, HTTPS URL, and actions;
- batch transition actions limited to valid target choices; and
- Add Company Service action.

Company Service detail:

- Overview: company, service, display name, URL, dates, customer notes, internal notes;
- Features: effective values, source, visibility, override/reset, and sync-missing action;
- History: newest-first append-only lifecycle timeline with actor/source/reason for platform operators; and
- status transition control separate from general descriptive editing.

Status is not edited through an unguarded generic select. The transition control shows only allowed targets and requires a reason when applicable.

### 10.4 Company detail integration

The platform-admin Company detail page includes a Services section that:

- lists only CompanyService rows whose companyId equals the route company;
- supports status/date filters and links to assignment detail;
- provides Add Service with companyId preselected and server-locked; and
- never trusts a posted companyId merely because it came from this page.

Company admins and company users continue using customer workspace pages for read-only service visibility according to services.read. Platform administration controls are not rendered for company accounts.

### 10.5 Internationalization and visual rules

- All new labels, confirmations, statuses, errors, empty states, filter options, feature value labels, and history copy are provided in Kurdish, Arabic, and English.
- Kurdish remains the default locale; Kurdish and Arabic are RTL, English is LTR.
- IDs, URLs, feature keys, and machine codes render LTR.
- Use the existing corporate minimal design, small radii, restrained borders, and no heavy shadows.
- Admin content remains full width beside the sidebar and tables scroll horizontally only when genuinely necessary.

## 11. RBAC and company isolation

### 11.1 Permission model

No new permission keys are required. Reuse:

- services.read for authorized service-assignment, history, and visible feature reads; and
- services.manage for catalog, feature, assignment, transition, and batch mutations.

services.manage remains platform-only and must be marked unavailable to COMPANY-scoped custom roles. A PLATFORM-scoped custom role may receive it. Role key names are not the authorization boundary; permission plus account scope is.

### 11.2 Authorization matrix

| Operation | PLATFORM + services.manage | COMPANY + services.read | COMPANY without services.read |
| --- | --- | --- | --- |
| Catalog list/detail | Allowed | Forbidden | Forbidden |
| Catalog feature mutation | Allowed | Forbidden | Forbidden |
| Company Service list/detail | Any company, optional filter | Own company only | Forbidden |
| Company Service create/update/transition | Allowed | Forbidden | Forbidden |
| Assignment features/history read | Any company | Own company, sanitized | Forbidden |
| Internal notes/history reason/actor/metadata | Allowed | Redacted | Forbidden |
| Batch mutation | Allowed where endpoint permission matches | Users batch only when separately authorized and scoped; no service mutation | Forbidden |

### 11.3 Isolation invariants

- The API derives company scope from AuthenticatedPrincipal for COMPANY accounts.
- A COMPANY account cannot broaden scope by omitting companyId or submitting another companyId.
- Nested feature/history endpoints load the parent CompanyService and authorize parent.companyId before returning child records.
- Query filters and counts use the same scoped where clause.
- Batch endpoints reject the entire request if any ID is outside the authorized scope.
- internalNotes and internal lifecycle fields are removed in presentation code, not merely hidden by the portal.
- Every mutation records actorUserId and the affected companyId where applicable.

## 12. Migration and deployment plan

### 12.1 Migration sequence

Migration names use the repository's timestamped Prisma convention. Expected logical suffixes are:

1. service_features;
2. company_service_features; and
3. company_service_lifecycle.

F.1 should not require a schema migration.

### 12.2 Additive migration rules

- Create new enums/tables/indexes/constraints only; do not rename or drop stable Stage 2 columns.
- Reuse the existing localized-text validation function.
- Backfill one SYSTEM lifecycle event for every existing CompanyService using fromStatus null, toStatus current status, effectiveAt createdAt, and metadata { backfilled: true }.
- Do not create CompanyServiceFeature snapshots for historical assignments without an explicit catalog mapping. Operators may use sync after deployment.
- Validate row counts, foreign-key integrity, lifecycle backfill counts, and JSON constraints before API deployment.
- Prisma format, validate, generate, API build, and portal build must use the migrated schema.
- Deploy API before portal when new routes are additive.
- Database changes are forward-only in production. Roll back the application first; do not use destructive down migrations on production data.

### 12.3 Seed behavior

The RBAC seed continues to upsert services.read and services.manage. No pricing permissions or commerce roles are added. services.manage must remain excluded from company-scoped role permission choices.

## 13. Test strategy

The project uses the approved compressed safe-development workflow: focused tests per substage and one full lint/typecheck/build/regression pass at the end of F.4.

### 13.1 Unit tests

- Feature DTO/value validator for BOOLEAN, NUMBER, STORAGE, TEXT, translations, units, and length limits.
- ServiceFeature service create/update/reorder/inactivate behavior.
- CompanyService feature snapshot, override, reset, and non-destructive sync.
- Every allowed and forbidden lifecycle transition.
- Same-state idempotency creates no duplicate history.
- Required reasons for SUSPENDED/CANCELLED.
- Batch size/duplicate ID validation and atomic safeguard handling.
- Self/last-admin protection in user batches.
- Presentation redaction for company accounts.

### 13.2 Database/integration tests

- unique service feature key per service;
- valueType/defaultValue constraints;
- cross-service CompanyServiceFeature association rejection by service layer transaction;
- feature snapshot and assignment creation are atomic;
- CompanyService update, lifecycle event, and audit log are atomic;
- lifecycle backfill count equals pre-migration CompanyService count;
- lifecycle rows cannot be modified through application services;
- FK delete restrictions/cascades match this specification; and
- start/expiration and HTTPS constraints remain intact.

### 13.3 API/e2e security tests

- unauthenticated requests return 401;
- missing permissions return 403;
- company accounts cannot enumerate catalog/features;
- company accounts cannot read another company's assignments, features, counts, or history;
- foreign companyId filters are rejected or forced to own scope according to the existing authorization convention;
- platform reads include internal fields; company reads do not;
- every batch request is re-authorized server-side and is all-or-nothing;
- malformed UUIDs, oversized batches, invalid transitions, and feature type mismatches are rejected; and
- backward-compatible PATCH status changes still create lifecycle history.

### 13.4 Portal/contract tests

- AdminDataTable select-all, indeterminate, current-page scope, selection reset, pending state, confirmation, and error state.
- Checkboxes are absent when no usable batch actions exist.
- Services pages use AdminDataTable and server-authoritative filters.
- Company detail preselects/locks company without weakening API validation.
- Feature and history sections respect permissions.
- ku/ar/en copy completeness and RTL/LTR rendering.
- Mobile and full-width admin layout regression.
- No pricing, checkout, payment, order, invoice, or subscription route/component/type/schema is introduced.

### 13.5 Final validation

At F.4 completion run once:

- Prisma format/validate/generate;
- focused API unit/integration/e2e tests;
- portal contract/security tests;
- monorepo lint;
- monorepo typecheck;
- production builds; and
- production smoke checks after migration/deployment.

## 14. Acceptance criteria

### F.1 — AdminDataTable batch actions

- Real authorized batch actions execute for the approved tables.
- Selection is current-page only, accessible, RTL-safe, and cleared after success.
- Read-only tables do not show meaningless selection controls.
- Server APIs validate up to 100 unique IDs, protect scope/safeguards, and mutate atomically.
- No batch delete exists.

### F.2 — Service Features

- Platform operators can create, edit, order, activate/inactivate, and view typed multilingual ServiceFeature records.
- Company accounts cannot enumerate or mutate the platform catalog.
- Value type, unit, translation, key, length, visibility, and ordering constraints are enforced in the API and database where applicable.
- Existing Service behavior remains compatible.

### F.3 — Company Service management

- Platform operators can manage Company Services from the global list, Service detail, and Company detail.
- Creating an assignment atomically snapshots active catalog features.
- Operators can override/reset/sync assignment features without destructive propagation.
- Company accounts may read only their own visible assignment data and never receive internal fields.
- Admin pages are full-width, reusable, multilingual, and use AdminDataTable.

### F.4 — Lifecycle/history and future readiness

- All CompanyService status changes obey the approved transition table.
- Every actual transition writes one immutable lifecycle event and corresponding audit evidence in the same transaction.
- Single and batch transition behavior is idempotent and protected by services.manage plus PLATFORM scope.
- Existing assignments receive a correct SYSTEM backfill event.
- The schema can later relate ServiceFeature definitions to ServicePlan without rewriting Service or CompanyService identity.
- No Stage 9 price, checkout, order, invoice, subscription, or payment implementation exists.

## 15. Future pricing readiness without Stage 9 implementation

The readiness decision is structural, not commercial:

- Service keeps a stable catalog UUID and key.
- ServiceFeature keeps a stable UUID and service-scoped key.
- CompanyService remains the operational entitlement.
- CompanyServiceFeature preserves the effective non-monetary configuration of that entitlement.
- A future Stage 9 may add ServicePlan and ServicePlanFeature that reference existing Service and ServiceFeature IDs.
- A future commercial subscription/order relation may reference CompanyService without changing its current company-isolation or lifecycle history.
- WHMCS pricing must be validated by WHMCS at order time; any future display cache is non-authoritative.

No placeholder money columns, zero prices, fake plan tables, or disabled checkout routes are allowed in F.1–F.4. This prevents temporary Stage 2 assumptions from becoming a second billing model.

## 16. Documentation, implementation, and version control rules

- This file is normative for F.1–F.4 and must be updated in the same commit/PR as any approved architecture change.
- Implementation code, Prisma migrations, shared types, API contracts, portal UX, and tests must remain traceable to the acceptance criteria above.
- Odoo-KRD/odookrd-platform is the canonical source; server copies and installer scripts are deployment artifacts, not architectural authority.
- Work remains on the Stage 2H.4 branch until validation and user approval.
- Do not tag or publish a stable release merely for this specification. After F.1–F.4 implementation is completed, validated, deployed, and approved, create the agreed Git tag/release checkpoint before starting the next stage.
- Any later Stage 9 proposal must reference this boundary and explicitly describe how it preserves CompanyService as the operational entitlement while keeping commercial authority separate.

## 17. Definition of done

Stage 2H.4F.1–F.4 is complete only when:

1. all four substage acceptance sections pass;
2. migrations are additive and verified against a production-like database;
3. API and portal contracts are typed and multilingual;
4. RBAC and cross-company isolation tests pass;
5. lifecycle history and audit evidence agree;
6. the final compressed full validation passes;
7. production smoke checks pass after deployment;
8. this specification matches the delivered implementation; and
9. the user approves the stable checkpoint for GitHub tagging/release.

## 18. Approved reusable-feature and compact-toolbar refinement

### 18.1 Feature definition ownership

The Services administration menu contains two platform-only entries:

- Services → Manage Services; and
- Services → Features.

Services → Features owns reusable `ServiceFeatureDefinition` records. A definition
has a globally unique stable key, multilingual name and description, exactly one
existing Service category, a multilingual parameter label, a BOOLEAN/NUMBER/STORAGE/TEXT
value type, a typed non-monetary default value, an optional NUMBER-only unit,
ACTIVE/INACTIVE status, and display order.

For example, `storage-odoo` may define Storage for category ODOO, parameter
Capacity, NUMBER default 50, and unit GB. A category-specific definition is never
attachable to a Service in another category.

### 18.2 Service configuration and entitlement safety

An administrator selects an active predefined feature inside an individual Service
detail page and edits only its typed parameter value plus customer visibility. The
key, category, parameter label, type, and unit remain owned by the definition.
Duplicate definitions or duplicate keys on one Service are rejected.

The attachment creates a normal `ServiceFeature` linked to the definition through
an optional, restrictive foreign key. Existing legacy ServiceFeature rows remain
valid with a null definition reference. Definition names, descriptions, and
parameter labels may propagate to attached ServiceFeature metadata, but changing
a definition's default never overwrites existing service defaults or existing
CompanyServiceFeature snapshots/overrides. Once a definition is attached, its
category, value type, and unit cannot change.

The active editor language is sufficient for a multilingual name, parameter, or
text value; the server fills the Kurdish fallback without requiring an operator
working in English or Arabic to open the translations dialog.

### 18.3 Additive API and migration contract

All endpoints below require an authenticated PLATFORM account and
`services.manage`:

- `GET /service-feature-definitions`
- `GET /service-feature-definitions/:id`
- `POST /service-feature-definitions`
- `PATCH /service-feature-definitions/:id`
- `POST /services/:serviceId/features/attach`

Migration `20260825120000_017_service_feature_definitions` creates the typed,
multilingual `service_feature_definitions` table and adds nullable `definition_id`,
nullable `parameter_label`, and localized parameter metadata to the existing
`service_features` table. Existing service assignments, feature snapshots,
lifecycle history, and audit records remain untouched.

### 18.4 Compact AdminDataTable behavior

Search, status/category/company filters, selected-record count, batch action,
Apply, and Clear selection share one compact responsive toolbar. Batch controls
appear only after at least one visible authorized row is selected. Toolbar inputs
use a consistent compact height; filter labels remain accessible to screen readers
without creating a second visual row. Wrapping is permitted on narrow screens,
and Kurdish/Arabic RTL plus English LTR layouts remain supported.

### 18.5 Commercial boundary

This refinement does not create prices, plans for purchase, billing, checkout,
orders, subscriptions, invoices, or payments. ServiceFeatureDefinition is a
non-monetary capability template; CompanyService remains the operational customer
entitlement.

### 18.6 Storage type and predefined units

The feature editor exposes Yes/No, Number, Storage, and Text. Storage is numeric
but semantically distinct from a general Number. Its unit is selected from MB,
GB, or TB; the unit may also be null. General Number units are selected from a
predefined non-monetary list and may be null. Empty translation DTO properties
do not count as translated values, so numeric definitions are accepted when the
localized value object contains no actual text.
