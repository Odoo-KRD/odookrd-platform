import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("customer dashboard base route is authentication scoped and permission-aware", () => {
  const dashboard = read(
    "apps/portal/src/app/(protected)/(customer)/dashboard/page.tsx",
  );
  const authorization = read("apps/portal/src/lib/authorization.ts");

  assert.match(authorization, /getCustomerAccountApiContext/);
  assert.match(dashboard, /getCustomerAccountApiContext\(\)/);
  assert.doesNotMatch(
    dashboard,
    /getCustomerApiContext\(PERMISSIONS\.SERVICES_READ\)/,
  );
  assert.match(dashboard, /hasPermission\(session, PERMISSIONS\.SERVICES_READ\)/);
  assert.match(dashboard, /hasPermission\(session, PERMISSIONS\.TRAINING_READ\)/);
  assert.match(
    dashboard,
    /hasPermission\(\s*session,\s*PERMISSIONS\.NOTIFICATIONS_READ,?\s*\)/,
  );
});

test("customer shell has grouped learning/account navigation, exact dashboard activation and mobile drawer", () => {
  const layout = read(
    "apps/portal/src/app/(protected)/(customer)/layout.tsx",
  );
  const navigation = read("apps/portal/src/components/admin/navigation.tsx");
  const header = read(
    "apps/portal/src/components/customer/customer-shell-header.tsx",
  );

  assert.match(layout, /id: "customer-learning"/);
  assert.match(layout, /id: "customer-company-account"/);
  assert.match(navigation, /href === "\/dashboard"/);
  assert.match(navigation, /pathname === href/);
  assert.match(header, /role="dialog"/);
  assert.match(header, /99\+/);
  assert.match(header, /markNotificationReadAction/);
  assert.match(header, /markAllNotificationsReadAction/);
  assert.match(header, /\/dashboard\/training\/certificates/);
  assert.match(header, /\/admin/);
});

test("customer profile uses self-scoped context and avatar/profile BFF routes", () => {
  const profilePage = read(
    "apps/portal/src/app/(protected)/(customer)/dashboard/profile/page.tsx",
  );
  const editor = read(
    "apps/portal/src/components/customer/customer-profile-editor.tsx",
  );
  const profileRoute = read("apps/portal/src/app/api/workspace/profile/route.ts");
  const avatarRoute = read(
    "apps/portal/src/app/api/workspace/profile/avatar/route.ts",
  );

  assert.match(profilePage, /getCustomerAccountApiContext\(\)/);
  assert.doesNotMatch(profilePage, /COMPANIES_READ\),/);
  assert.match(editor, /ImageUploader/);
  const sharedUploader = read("apps/portal/src/components/files/image-uploader.tsx");
  assert.match(sharedUploader, /image\/jpeg/);
  assert.match(sharedUploader, /image\/png/);
  assert.match(sharedUploader, /image\/webp/);
  assert.match(sharedUploader, /acceptedMimeTypes\.includes\(file\.type\)/);
  assert.match(sharedUploader, /file\.size > maxBytes/);;
  ;
  ;
  assert.match(editor, /LanguageSelect/);
  assert.match(profileRoute, /export async function PATCH/);
  assert.match(avatarRoute, /export async function GET/);
  assert.match(avatarRoute, /export async function PUT/);
  assert.match(avatarRoute, /export async function DELETE/);
});

test("dashboard renders SVG learning progress and rich course cards", () => {
  const dashboard = read(
    "apps/portal/src/app/(protected)/(customer)/dashboard/page.tsx",
  );

  assert.match(dashboard, /<svg\s+viewBox="0 0 120 120"/);
  assert.match(dashboard, /averageProgressPercentage/);
  assert.match(dashboard, /completedLessons/);
  assert.match(dashboard, /resumeLessonId/);
  assert.match(dashboard, /viewCertificate/);
  assert.match(dashboard, /course\.hasCover/);
});
