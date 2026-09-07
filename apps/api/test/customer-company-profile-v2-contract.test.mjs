import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("migration 035 adds company profile and reviewed identity requests", () => {
  const schema = read("apps/api/prisma/schema.prisma");
  const migration = read(
    "apps/api/prisma/migrations/20260906220000_035_company_profile_v2/migration.sql",
  );

  assert.match(schema, /enum CompanyIdentityChangeRequestStatus/);
  assert.match(schema, /slug\s+String\?\s+@unique/);
  assert.match(schema, /contactEmail\s+String\?/);
  assert.match(schema, /logoFileAssetId\s+String\?/);
  assert.match(schema, /model CompanyIdentityChangeRequest/);
  assert.match(
    migration,
    /company_identity_change_requests_one_pending_idx/,
  );
  assert.match(migration, /WHERE "status" = 'PENDING'/);
});

test("company self-service and platform company management remain separated", () => {
  const workspace = read(
    "apps/api/src/modules/companies/workspace-company.controller.ts",
  );
  const admin = read(
    "apps/api/src/modules/companies/company-profile-admin.controller.ts",
  );
  const service = read(
    "apps/api/src/modules/companies/company-profile.service.ts",
  );
  const legacy = read(
    "apps/api/src/modules/companies/companies.service.ts",
  );

  assert.match(workspace, /@Controller\('workspace\/company'\)/);
  assert.match(
    workspace,
    /@Patch\('contact'\)[\s\S]*COMPANIES_MANAGE/,
  );
  assert.match(workspace, /@Post\('identity-requests'\)/);
  assert.match(admin, /@Patch\(':id\/profile'\)/);
  assert.match(admin, /@Post\(':id\/identity-requests\/:requestId\/review'\)/);
  assert.match(service, /private requireCompany\(/);
  assert.match(service, /private assertPlatform\(/);
  assert.match(legacy, /async update\([\s\S]*this\.assertPlatformScope\(principal\)/);
});

test("company logos use the existing scoped FileAsset service", () => {
  const service = read(
    "apps/api/src/modules/companies/company-profile.service.ts",
  );

  assert.match(service, /FilesService/);
  assert.match(service, /this\.files\.upload\(/);
  assert.match(service, /FileAssetKind\.IMAGE/);
  assert.match(service, /COMPANY_LOGO_MIME_TYPES/);
  assert.match(service, /detectSupportedFile/);
  assert.match(service, /limitInputPixels:\s*25_000_000/);
});

test("company administrators cannot write video/player/progress settings", () => {
  const settings = read(
    "apps/api/src/modules/settings/settings.service.ts",
  );

  assert.match(settings, /principal\.accountScope === AccountScope\.COMPANY/);
  assert.match(settings, /item\.key\.startsWith\('trainings\.video\.'\)/);
  assert.match(settings, /item\.key\.startsWith\('trainings\.player\.'\)/);
  assert.match(settings, /item\.key\.startsWith\('trainings\.progress\.'\)/);
  assert.match(settings, /platform administrator/);
});
