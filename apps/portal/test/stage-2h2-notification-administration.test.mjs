import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFile(path.join(root, relative), "utf8");

test("admin notification page shows masked provider readiness, test email, and delivery logs", async () => {
  const [page, actions, form] = await Promise.all([
    source("src/app/(protected)/admin/notifications/page.tsx"),
    source("src/app/(protected)/admin/notifications/actions.ts"),
    source("src/components/notifications/provider-test-email-form.tsx"),
  ]);

  assert.match(page, /PERMISSIONS\.NOTIFICATIONS_MANAGE/u);
  assert.match(page, /\/notification-administration\/provider-status/u);
  assert.match(page, /\/notification-administration\/deliveries/u);
  assert.match(page, /ProviderTestEmailForm/u);
  assert.match(actions, /\/notification-administration\/test-email/u);
  assert.match(actions, /session\.user\.accountScope !== "PLATFORM"/u);
  assert.doesNotMatch(
    `${page}\n${actions}\n${form}`,
    /secretAccessKey\s*[:=]\s*["'][A-Za-z0-9/+]/u,
  );
});

test("admin navigation exposes notification administration only by permission", async () => {
  const layout = await source("src/app/(protected)/admin/layout.tsx");

  assert.match(layout, /PERMISSIONS\.NOTIFICATIONS_MANAGE/u);
  assert.match(layout, /href:\s*["']\/admin\/notifications["']/u);
  assert.match(
    layout,
    /notificationAdministrationDictionaries\[locale\]\.navigation/u,
  );
});

test("notification administration copy is typed for Kurdish, Arabic, and English", async () => {
  const dictionary = await source(
    "src/lib/i18n/notification-administration.ts",
  );

  for (const locale of ["ku", "ar", "en"]) {
    assert.match(dictionary, new RegExp(`\\b${locale}:\\s*\\{`, "u"));
  }

  for (const key of [
    "providerStatus",
    "sendTestEmail",
    "deliveryLog",
    "secretNotice",
  ]) {
    assert.match(dictionary, new RegExp(`${key}:`, "u"));
  }
});
