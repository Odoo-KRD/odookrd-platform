import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFile(path.join(root, relative), "utf8");

test("split notification administration pages preserve permission, masked provider, test-email, and delivery contracts", async () => {
  const [deliveries, providers, testEmail, actions, form] = await Promise.all([
    source("src/app/(protected)/admin/notifications/deliveries/page.tsx"),
    source("src/app/(protected)/admin/notifications/providers/page.tsx"),
    source("src/app/(protected)/admin/notifications/test-email/page.tsx"),
    source("src/app/(protected)/admin/notifications/actions.ts"),
    source("src/components/notifications/provider-test-email-form.tsx"),
  ]);

  for (const page of [deliveries, providers, testEmail]) {
    assert.match(page, /PERMISSIONS\.NOTIFICATIONS_MANAGE/u);
  }

  assert.match(deliveries, /\/notification-administration\/deliveries/u);
  assert.match(providers, /\/notification-administration\/provider-status/u);
  assert.match(providers, /providerStatus\.email\.accessKeyId\.masked/u);
  assert.match(testEmail, /ProviderTestEmailForm/u);
  assert.match(actions, /\/notification-administration\/test-email/u);
  assert.match(actions, /session\.user\.accountScope !== "PLATFORM"/u);
  assert.doesNotMatch(
    `${deliveries}\n${providers}\n${testEmail}\n${actions}\n${form}`,
    /secretAccessKey\s*[:=]\s*["'][A-Za-z0-9/+]/u,
  );
});

test("admin navigation exposes split notification administration only by permission", async () => {
  const navigation = await source("src/lib/admin-navigation.ts");

  assert.match(navigation, /PERMISSIONS\.NOTIFICATIONS_MANAGE/u);
  for (const href of [
    "/admin/notifications/deliveries",
    "/admin/notifications/providers",
    "/admin/notifications/test-email",
    "/admin/notifications/broadcasts",
  ]) {
    assert.equal(navigation.includes(`href: "${href}"`), true, href);
  }
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
