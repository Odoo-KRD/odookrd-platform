import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("modal uses the native top layer and bounded vertical scrolling", () => {
  const modal = read("apps/portal/src/components/ui/modal-dialog.tsx");
  assert.match(modal, /<dialog\b/);
  assert.match(modal, /dialog\.showModal\(\)/);
  assert.match(modal, /onCancel=/);
  assert.match(modal, /onClose=/);
  assert.match(modal, /open:flex/);
  assert.match(modal, /min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto/);
  assert.doesNotMatch(modal, /role="dialog"[\s\S]*fixed inset-0 z-\[100\]/);
});

test("company logo menu is tightly anchored and kept inside the viewport", () => {
  const logo = read("apps/portal/src/components/companies/company-logo-actions.tsx");
  assert.match(logo, /group\/logo relative size-28 shrink-0/);
  assert.match(logo, /absolute bottom-2 right-2/);
  assert.match(logo, /createPortal\(/);
  assert.match(logo, /getBoundingClientRect\(\)/);
  assert.match(logo, /window\.innerWidth/);
  assert.match(logo, /window\.innerHeight/);
  assert.match(logo, /window\.addEventListener\("scroll", updatePosition, true\)/);
  assert.match(logo, /aria-haspopup="menu"/);
  assert.match(logo, /setUploadOpen\(true\)/);
  assert.match(logo, /open=\{uploadOpen\}/);
  assert.match(logo, /ImageUploader/);
  assert.match(logo, /confirmRemoveLogo/);
});

test("contact forms retain all fields and use container-sized safe grids", () => {
  const expected = [
    "contactEmail", "websiteUrl", "phone", "countryCode",
    "addressLine1", "addressLine2", "city", "region", "postalCode",
  ];
  for (const path of [
    "apps/portal/src/components/companies/company-contact-admin-modal.tsx",
    "apps/portal/src/components/customer/company-contact-form.tsx",
  ]) {
    const source = read(path);
    for (const name of expected) assert.match(source, new RegExp(`name="${name}"`));
    assert.match(source, /repeat\(auto-fit, minmax\(min\(100%, 17rem\), 1fr\)\)/);
    assert.match(source, /min-w-0 w-full/);
    assert.match(source, /col-span-full/);
  }
});

test("customer Company contact editing is permission-gated and modal-only", () => {
  const page = read("apps/portal/src/app/(protected)/(customer)/dashboard/company/page.tsx");
  const modal = read("apps/portal/src/components/customer/company-contact-edit-modal.tsx");
  assert.match(page, /CustomerCompanyContactEditModal/);
  assert.match(page, /canManage\s*\?\s*\(/);
  assert.match(page, /action=\{updateCompanyContactAction\}/);
  assert.doesNotMatch(page, /<CompanyContactForm/);
  assert.match(modal, /CompanyContactForm/);
  assert.match(modal, /ModalDialog/);
});

test("company identity editor preserves protected name, slug, and status fields", () => {
  const source = read("apps/portal/src/components/companies/company-profile-admin-form.tsx");
  assert.match(source, /CompanyIdentityEditModal/);
  assert.match(source, /LocalizedTextFields/);
  assert.match(source, /name="slug"/);
  assert.match(source, /name="status"/);
});
