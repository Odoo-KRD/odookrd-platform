import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("login fixes RTL password positioning, removes placeholder O, and uses approved Kurdish copy", () => {
  const form = read("apps/portal/src/components/auth/login-form.tsx");
  const page = read("apps/portal/src/app/(public)/login/page.tsx");
  const dictionary = read(
    "apps/portal/src/lib/i18n/customer-portal-refinement.ts",
  );

  assert.match(form, /absolute right-1 top-1\/2/);
  assert.match(form, /pl-3\.5 pr-11/);
  assert.doesNotMatch(page, /charAt\(0\)\.toUpperCase/);
  assert.match(
    dictionary,
    /پانێڵی تایبەت بە بەشداربوانی ئۆدوو، کە لە ڕێیەوە دەتوانن دەستتان بگات بە خزمەتگوزاریە بەردەستەکانی تایبەت بە پاکێج و بەشداریەکانتان\./,
  );
  assert.match(
    dictionary,
    /بەردەوام بە لە فێربوون و بڕوانامە بە دەست بهێنە\./,
  );
});

test("certificate cards have a corporate seal, metadata block, and clear certificate action", () => {
  const page = read(
    "apps/portal/src/app/(protected)/(customer)/dashboard/training/certificates/page.tsx",
  );

  assert.match(page, /CertificateSealIcon/);
  assert.match(page, /rounded-xl border border-line/);
  assert.match(page, /bg-surface-subtle p-4/);
  assert.match(page, /w-full items-center justify-center/);
  assert.match(page, /downloadCertificate/);
});

test("course navigation is not active on the certificates branch", () => {
  const navigation = read(
    "apps/portal/src/components/admin/navigation.tsx",
  );

  assert.match(
    navigation,
    /href === "\/dashboard\/training"[\s\S]*pathname === "\/dashboard\/training\/certificates"/,
  );
  assert.match(
    navigation,
    /pathname\.startsWith\("\/dashboard\/training\/certificates\/"\)/,
  );
});

test("avatar selection is staged until Save and authenticated raw image delivery survives refresh", () => {
  const editor = read(
    "apps/portal/src/components/customer/customer-profile-editor.tsx",
  );
  const avatarRoute = read(
    "apps/portal/src/app/api/workspace/profile/avatar/route.ts",
  );
  const rawProxy = read("apps/portal/src/lib/raw-api-proxy.ts");
  const header = read(
    "apps/portal/src/components/customer/customer-shell-header.tsx",
  );

  assert.match(editor, /selectedAvatar/);
  assert.match(editor, /ImageUploader/);
  const sharedUploader = read("apps/portal/src/components/files/image-uploader.tsx");
  assert.match(sharedUploader, /URL\.createObjectURL\(file\)/);
  assert.match(sharedUploader, /URL\.revokeObjectURL/);
  assert.match(sharedUploader, /onFileChange\?\.\(file\)/);;
  assert.match(editor, /method: "PUT"/);
  assert.match(editor, /router\.refresh\(\)/);
  assert.match(editor, /avatarFileAssetId/);
  assert.match(avatarRoute, /proxyAuthenticatedImage/);
  assert.match(rawProxy, /Authorization: `Bearer \$\{token\}`/);
  assert.match(rawProxy, /Content-Type/);
  assert.match(rawProxy, /private, no-store/);
  assert.match(header, /avatarFileAssetId/);
  assert.doesNotMatch(header, /data-nimg/);
});

test("company profile V2 exposes contact editing, protected identity suggestions, and completeness", () => {
  const page = read(
    "apps/portal/src/app/(protected)/(customer)/dashboard/company/page.tsx",
  );
  const action = read(
    "apps/portal/src/app/(protected)/(customer)/dashboard/company/actions.ts",
  );

  assert.match(page, /profileCompleteness/);
  assert.match(page, /CustomerCompanyContactEditModal/);
  assert.match(
    read("apps/portal/src/components/customer/company-contact-edit-modal.tsx"),
    /CompanyContactForm/,
  );
  assert.match(page, /CompanyIdentityRequestForm/);
  assert.match(page, /company\.slug/);
  assert.match(page, /company\.websiteUrl/);
  assert.match(page, /company\.addressLine1/);
  assert.match(action, /\/workspace\/company\/contact/);
  assert.match(action, /\/workspace\/company\/identity-requests/);
});

test("company-admin settings hide video and progress tabs", () => {
  const form = read(
    "apps/portal/src/components/settings/settings-form.tsx",
  );
  const page = read(
    "apps/portal/src/app/(protected)/admin/settings/page.tsx",
  );

  assert.match(form, /hideRestrictedTrainingTabs/);
  assert.match(form, /key !== "video" && key !== "progress"/);
  assert.match(page, /hideRestrictedTrainingTabs=\{!isPlatform\}/);
});
