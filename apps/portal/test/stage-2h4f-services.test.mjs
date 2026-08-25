import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFile(`${root}/${path}`, "utf8");

const [
  table,
  list,
  detail,
  manager,
  assignment,
  company,
  customer,
  actions,
  editor,
  dictionaries,
] = await Promise.all([
  read("src/components/admin/admin-data-table.tsx"),
  read("src/app/(protected)/admin/services/page.tsx"),
  read("src/app/(protected)/admin/services/[id]/page.tsx"),
  read("src/components/services/service-features-manager.tsx"),
  read("src/app/(protected)/admin/services/assignments/[id]/page.tsx"),
  read("src/app/(protected)/admin/companies/[id]/page.tsx"),
  read("src/app/(protected)/(customer)/dashboard/services/[id]/page.tsx"),
  read("src/app/(protected)/admin/services/actions.ts"),
  read("src/components/services/service-feature-attachment-form.tsx"),
  read("src/lib/i18n/service-features.ts"),
]);

test("admin batch actions retain only visible selections and require confirmation", () => {
  assert.match(table, /currentIds\.has\(id\)/);
  assert.doesNotMatch(table, /const selectedIds\s*=\s*useMemo\(/);
  assert.match(table, /selectAllRef\.current\.indeterminate/);
  assert.match(table, /window\.confirm\(confirmation\)/);
  assert.match(table, /if \(response\.ok\) \{\s+clearSelection\(\)/);
  assert.match(list, /batchServiceStatusAction/);
  assert.match(list, /batchAssignmentTransitionAction/);
});

test("service features are managed inside their parent service details", () => {
  assert.match(detail, /<ServiceFeaturesManager/);
  assert.match(manager, /<ServiceFeatureAttachmentForm/);
  assert.match(detail, /attachServiceFeatureDefinitionAction\.bind/);
  assert.match(detail, /updateAttachedServiceFeatureAction\.bind/);
  assert.match(detail, /moveServiceFeatureAction\.bind/);
  assert.doesNotMatch(detail, /href=["']\/admin\/service-features/);
  assert.match(editor, /valueType === "BOOLEAN"/);
  assert.match(editor, /type="number"/);
  assert.match(editor, /LocalizedTextFields/);
});

test("company assignments support scoped overrides, lifecycle transitions, and history", () => {
  assert.match(company, /companyId=\$\{encodeURIComponent\(company\.id\)\}/);
  assert.match(assignment, /AssignmentFeatureForm/);
  assert.match(assignment, /ServiceLifecycleForm/);
  assert.match(assignment, /\/history\?limit=/);
  assert.match(assignment, /syncAssignmentFeaturesAction/);
  assert.match(actions, /createCompanyAssignmentAction/);
  assert.match(actions, /transitionAssignmentAction/);
  assert.doesNotMatch(actions, /_formData:\s*FormData/);
});

test("customers receive feature values through their company-scoped assignment only", () => {
  assert.match(customer, /assignment\.companyId !== session\.user\.companyId/);
  assert.match(customer, /\/features\?limit=100&offset=0/);
  assert.doesNotMatch(
    customer,
    /internalNotes|actorEmailSnapshot|customerVisibleOverride/,
  );
});

test("service feature administration remains available in Kurdish, Arabic, and English", () => {
  assert.match(dictionaries, /ku:\s*\{/);
  assert.match(dictionaries, /ar:\s*\{/);
  assert.match(dictionaries, /en:\s*\{/);
  assert.match(dictionaries, /BOOLEAN:/);
  assert.match(dictionaries, /NUMBER:/);
  assert.match(dictionaries, /TEXT:/);
});
