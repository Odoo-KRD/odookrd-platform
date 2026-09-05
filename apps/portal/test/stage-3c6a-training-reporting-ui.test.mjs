import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../../..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const page = read(
  "apps/portal/src/app/(protected)/admin/training/reports/page.tsx",
);
const navigation = read("apps/portal/src/lib/admin-navigation.ts");
const authorization = read("apps/portal/src/lib/authorization.ts");
const layout = read("apps/portal/src/app/(protected)/admin/layout.tsx");
const dictionary = read("apps/portal/src/lib/i18n/training-reports.ts");
const exportRoute = read(
  "apps/portal/src/app/api/training/reports/export/route.ts",
);

test("3C.6A exposes the reports workspace through the dedicated permission", () => {
  assert.match(page, /PERMISSIONS\.TRAINING_REPORTS_READ/);
  assert.match(navigation, /PERMISSIONS\.TRAINING_REPORTS_READ/);
  assert.match(navigation, /\/admin\/training\/reports/);
  assert.match(authorization, /PERMISSIONS\.TRAINING_REPORTS_READ/);
  assert.match(layout, /trainingReportsDictionaries/);
});

test("3C.6A reuses AdminDataTable and exposes all approved report views and filters", () => {
  assert.match(page, /AdminDataTable/);
  for (const view of [
    "overview",
    "courses",
    "learners",
    "quizzes",
    "certificates",
  ]) {
    assert.match(page, new RegExp(`"${view}"`));
  }
  for (const filter of [
    "companyId",
    "courseId",
    "categoryId",
    "dateFrom",
    "dateTo",
  ]) {
    assert.match(page, new RegExp(filter));
  }
});

test("3C.6A provides KU, AR and EN reporting dictionaries", () => {
  assert.match(dictionary, /ku: \{/);
  assert.match(dictionary, /ar: \{/);
  assert.match(dictionary, /en: \{/);
});

test("3C.6A CSV BFF is fixed-path, authenticated and parameter allow-listed", () => {
  assert.match(exportRoute, /SESSION_COOKIE_NAME/);
  assert.match(exportRoute, /datasets = new Set/);
  assert.match(exportRoute, /\/v1\/training\/reports\/export/);
  assert.match(exportRoute, /companyId/);
  assert.match(exportRoute, /courseId/);
  assert.match(exportRoute, /categoryId/);
  assert.match(exportRoute, /dateFrom/);
  assert.match(exportRoute, /dateTo/);
});
