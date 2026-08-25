import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFile(`${root}/${path}`, "utf8");

const [
  navigation,
  activeNavigation,
  definitions,
  definitionForm,
  detail,
  manager,
  attachmentForm,
  actions,
  table,
  companyFilter,
  dictionary,
] = await Promise.all([
  read("src/lib/admin-navigation.ts"),
  read("src/components/admin/navigation.tsx"),
  read("src/app/(protected)/admin/services/features/page.tsx"),
  read("src/components/services/feature-definition-form.tsx"),
  read("src/app/(protected)/admin/services/[id]/page.tsx"),
  read("src/components/services/service-features-manager.tsx"),
  read("src/components/services/service-feature-attachment-form.tsx"),
  read("src/app/(protected)/admin/services/actions.ts"),
  read("src/components/admin/admin-data-table.tsx"),
  read("src/components/users/company-filter.tsx"),
  read("src/lib/i18n/service-features.ts"),
]);

test("Services navigation separates service management from reusable category features", () => {
  assert.match(navigation, /kind:\s*"group",\s*id:\s*"services"/);
  assert.match(navigation, /href:\s*"\/admin\/services"/);
  assert.match(navigation, /href:\s*"\/admin\/services\/features"/);
  assert.match(
    activeNavigation,
    /pathname\.startsWith\("\/admin\/services\/features\/"\)/,
  );
  assert.match(definitions, /\/service-feature-definitions\?/);
  assert.match(definitions, /serviceFeatures\.applicableCategory/);
});

test("feature definitions own category, parameter, type, defaults, unit, and ordering", () => {
  assert.match(definitionForm, /name="featureKey"/);
  assert.match(definitionForm, /name="category"/);
  assert.match(definitionForm, /field="parameterLabel"/);
  assert.match(definitionForm, /name="valueType"/);
  assert.match(definitionForm, /name="defaultValue"/);
  assert.match(definitionForm, /name="unit"/);
  assert.match(definitionForm, /name="featureStatus"/);
  assert.match(definitionForm, /name="sortOrder"/);
  assert.match(definitionForm, /structuralFieldsLocked/);
});

test("service details attach only compatible active definitions and edit value plus visibility", () => {
  assert.match(detail, /status=ACTIVE&limit=100&offset=0/);
  assert.match(detail, /definition\.category === service\.category/);
  assert.match(detail, /!attachedDefinitions\.has\(definition\.id\)/);
  assert.match(detail, /<ServiceFeaturesManager/);
  assert.match(manager, /<ServiceFeatureAttachmentForm/);
  assert.match(attachmentForm, /name="definitionId"/);
  assert.match(attachmentForm, /name="value"/);
  assert.match(attachmentForm, /name="customerVisible"/);
  assert.doesNotMatch(
    attachmentForm,
    /name="featureKey"|name="unit"|name="category"/,
  );
});

test("feature forms accept the current language and supply a Kurdish fallback", () => {
  assert.match(
    actions,
    /translations\.ku\s*\? translations\s*:\s*\{ \.\.\.translations, ku: value \}/,
  );
  assert.match(
    actions,
    /nameTranslations\.ku\s*\? nameTranslations\s*:\s*\{ \.\.\.nameTranslations, ku: name \}/,
  );
  assert.match(actions, /parameterLabelTranslations\.ku/);
  assert.match(dictionary, /ku:\s*\{/);
  assert.match(dictionary, /ar:\s*\{/);
  assert.match(dictionary, /en:\s*\{/);
});

test("batch actions and company filters share a compact single toolbar row", () => {
  assert.match(table, /canSelect && selectedIds\.size > 0 \? \(\s*<form/);
  assert.match(table, /className="h-9 w-full rounded-md border border-line/);
  assert.doesNotMatch(table, /pointer-events-none opacity-50/);
  assert.doesNotMatch(table, /border-b border-line bg-surface-subtle/);
  assert.match(companyFilter, /<span className="sr-only">\{label\}<\/span>/);
  assert.match(companyFilter, /className="h-9 w-full rounded-md/);
  assert.doesNotMatch(companyFilter, /className="grid min-w-52/);
});
