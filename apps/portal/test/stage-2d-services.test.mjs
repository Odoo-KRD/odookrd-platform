import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const portalRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function read(path) {
  return readFileSync(join(portalRoot, path), "utf8");
}

const authorization = read("src/lib/authorization.ts");
const adminLayout = read("src/app/(protected)/admin/layout.tsx");
const customerLayout = read("src/app/(protected)/(customer)/layout.tsx");
const actions = read("src/app/(protected)/admin/services/actions.ts");
const customerPage = read(
  "src/app/(protected)/(customer)/dashboard/services/page.tsx",
);
const customerDetails = read(
  "src/app/(protected)/(customer)/dashboard/services/[id]/page.tsx",
);
const assignmentForm = read(
  "src/components/services/service-assignment-form.tsx",
);
const dictionaries = read("src/lib/i18n/services.ts");

test("platform service administration navigation requires management permission", () => {
  assert.match(
    adminLayout,
    /session\.user\.accountScope\s*===\s*['"]PLATFORM['"][\s\S]*?hasPermission\(session,\s*PERMISSIONS\.SERVICES_MANAGE\)/,
  );
  assert.match(adminLayout, /href:\s*['"]\/admin\/services['"]/);
  assert.match(authorization, /PERMISSIONS\.SERVICES_MANAGE/);
});

test("company service navigation requires explicit read permission", () => {
  assert.match(
    customerLayout,
    /hasPermission\(session,\s*PERMISSIONS\.SERVICES_READ\)/,
  );
  assert.match(customerLayout, /href:\s*['"]\/dashboard\/services['"]/);
  assert.match(
    authorization,
    /export\s+async\s+function\s+getCustomerApiContext/,
  );
  assert.match(
    authorization,
    /session\.user\.accountScope\s*!==\s*['"]COMPANY['"]/,
  );
});

test("customer service requests remain server-side and do not select foreign companies", () => {
  assert.match(
    customerPage,
    /getCustomerApiContext\(PERMISSIONS\.SERVICES_READ\)/,
  );
  assert.match(customerPage, /\/service-assignments\?limit=20&offset=/);
  assert.doesNotMatch(customerPage, /companyId\s*=/);
  assert.doesNotMatch(customerPage, /internalNotes/);
});

test("customer details defend against cross-company responses and hide internal notes", () => {
  assert.match(
    customerDetails,
    /assignment\.companyId\s*!==\s*session\.user\.companyId/,
  );
  assert.doesNotMatch(customerDetails, /internalNotes/);
  assert.match(customerDetails, /rel=['"]noopener noreferrer['"]/);
});

test("service write actions stay server-side and validate HTTPS plus company identifiers", () => {
  assert.match(actions, /^['"]use server['"];/);
  assert.match(
    actions,
    /getAdminApiContext\(\s*PERMISSIONS\.SERVICES_MANAGE\s*,?\s*\)/,
  );
  assert.match(actions, /selected\.protocol\s*===\s*['"]https:['"]/);
  assert.match(actions, /uuidPattern\.test\(companyId\)/);
  assert.match(actions, /uuidPattern\.test\(serviceId\)/);
  assert.match(assignmentForm, /name=['"]internalNotes['"]/);
});

test("Kurdish, Arabic, and English service labels include all supported categories", () => {
  for (const locale of ["ku", "ar", "en"]) {
    assert.match(dictionaries, new RegExp("\\b" + locale + ":\\s*\\{"));
  }

  for (const category of [
    "ODOO",
    "HOSTING",
    "DOMAIN",
    "SUPPORT",
    "TRAINING",
    "OTHER",
  ]) {
    assert.match(dictionaries, new RegExp("\\b" + category + ":"));
  }

  assert.match(dictionaries, /internalNotesHint/);
});
