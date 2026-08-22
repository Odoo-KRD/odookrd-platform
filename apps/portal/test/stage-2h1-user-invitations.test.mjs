import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFile(path.join(root, relative), "utf8");

test("new invitations create the user then immediately use the protected delivery endpoint", async () => {
  const [actions, page, form] = await Promise.all([
    source("src/app/(protected)/admin/users/invitation-actions.ts"),
    source("src/app/(protected)/admin/users/invite/page.tsx"),
    source("src/components/users/invite-and-deliver-user-form.tsx"),
  ]);

  assert.match(actions, /getAdminApiContext\(PERMISSIONS\.USERS_MANAGE\)/u);
  assert.match(
    actions,
    /apiRequest<UserInvitation>\(["']\/users\/invitations["']/u,
  );
  assert.match(actions, /\/invitations\/deliver/u);
  assert.match(actions, /whatsappNumber/u);
  assert.match(page, /InviteAndDeliverUserForm/u);
  assert.match(form, /\/invitation\/accept#/u);
  assert.doesNotMatch(form, /\/invitation\/accept\?[^"'`]*token/u);
});

test("invited-user administration supports resend and one-time link regeneration", async () => {
  const [page, panel, actions] = await Promise.all([
    source("src/app/(protected)/admin/users/[id]/page.tsx"),
    source("src/components/users/invitation-administration-panel.tsx"),
    source("src/app/(protected)/admin/users/invitation-actions.ts"),
  ]);

  assert.match(page, /\/administration/u);
  assert.match(page, /InvitationAdministrationPanel/u);
  assert.match(panel, /resendInvitation/u);
  assert.match(panel, /generateNewLink/u);
  assert.match(panel, /\/invitation\/accept#/u);
  assert.match(actions, /\/invitations\/resend/u);
  assert.match(actions, /\/invitations\/regenerate/u);
});

test("role administration uses the corrected endpoint and locks only the final admin in UI", async () => {
  const [actions, page, roles] = await Promise.all([
    source("src/app/(protected)/admin/users/actions.ts"),
    source("src/app/(protected)/admin/users/[id]/page.tsx"),
    source("src/components/users/user-roles-form.tsx"),
  ]);

  assert.match(actions, /\/administration\/roles/u);
  assert.match(page, /canRemoveAdminRole/u);
  assert.match(page, /lockedRoleKeys/u);
  assert.match(roles, /disabled=\{locked\}/u);
  assert.match(roles, /type="hidden" name="roleKeys"/u);
});

test("invitation administration copy exists in all supported locales", async () => {
  const dictionary = await source("src/lib/i18n/user-invitations.ts");

  for (const locale of ["ku", "ar", "en"]) {
    assert.match(dictionary, new RegExp(`\\b${locale}:\\s*\\{`, "u"));
  }

  for (const key of [
    "sendInvitation",
    "resendInvitation",
    "generateNewLink",
    "finalAdminDescription",
  ]) {
    assert.match(dictionary, new RegExp(`${key}:`, "u"));
  }
});
