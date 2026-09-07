import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("admin company page is read-first and edits through compact modal controls", () => {
  const page = read(
    "apps/portal/src/app/(protected)/admin/companies/[id]/page.tsx",
  );

  assert.match(page, /CompanyIdentityEditModal/);
  assert.match(page, /CompanyContactEditModal/);
  assert.match(page, /CompanyLogoActions/);
  assert.match(page, /CompanyStatusBadge/);
  assert.doesNotMatch(page, /CompanyStatusForm/);
  assert.doesNotMatch(page, /<CompanyProfileAdminForm/);
});

test("company logo actions reuse ImageUploader and expose upload/delete menu behavior", () => {
  const logo = read(
    "apps/portal/src/components/companies/company-logo-actions.tsx",
  );

  assert.match(logo, /ImageUploader/);
  assert.match(logo, /uploadAction/);
  assert.match(logo, /deleteAction/);
  assert.match(logo, /confirmRemoveLogo/);
  assert.match(logo, /group-hover\/logo:opacity-100/);
});

test("company identity modal includes status so no dedicated status section is required", () => {
  const modal = read(
    "apps/portal/src/components/companies/company-profile-admin-form.tsx",
  );
  const dto = read(
    "apps/api/src/modules/companies/dto/company-profile.dto.ts",
  );
  const service = read(
    "apps/api/src/modules/companies/company-profile.service.ts",
  );

  assert.match(modal, /name="status"/);
  assert.match(dto, /status\?: CompanyStatus/);
  assert.match(service, /data\.status = input\.status/);
});

test("company contact editing has its own modal", () => {
  const contact = read(
    "apps/portal/src/components/companies/company-contact-admin-modal.tsx",
  );

  assert.match(contact, /ModalDialog/);
  assert.match(contact, /name="contactEmail"/);
  assert.match(contact, /name="websiteUrl"/);
  assert.match(contact, /name="phone"/);
  assert.match(contact, /name="addressLine1"/);
});
