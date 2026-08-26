import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFile(path.join(root, relative), "utf8");

test("notification administration links to the protected broadcast composer and identifies broadcast logs", async () => {
  const [broadcasts, deliveries] = await Promise.all([
    source("src/app/(protected)/admin/notifications/broadcasts/page.tsx"),
    source("src/app/(protected)/admin/notifications/deliveries/page.tsx"),
  ]);

  assert.equal(
    broadcasts.includes('href="/admin/notifications/broadcasts/new"'),
    true,
  );
  assert.equal(
    deliveries.includes('item.templateKey === "admin.broadcast"'),
    true,
  );
});

test("broadcast composer exposes audience counts, scoped company choice, channels, locale, and explicit confirmation", async () => {
  const [page, form, action] = await Promise.all([
    source("src/app/(protected)/admin/notifications/broadcasts/new/page.tsx"),
    source("src/components/notifications/notification-broadcast-form.tsx"),
    source("src/app/(protected)/admin/notifications/new/actions.ts"),
  ]);

  assert.equal(page.includes("PERMISSIONS.NOTIFICATIONS_MANAGE"), true);
  assert.equal(
    page.includes("/notification-administration/broadcasts/options"),
    true,
  );

  assert.equal(
    page.includes('import { randomUUID } from "node:crypto";'),
    true,
  );
  assert.equal(page.includes("initialRequestId={randomUUID()}"), true);

  for (const marker of [
    "ALL_CUSTOMERS",
    "COMPANY",
    "summary.recipientCount",
    "summary.whatsappCount",
    'name="channels"',
    'name="locale"',
    'name="actionUrl"',
    "required",
    "confirmed",
  ]) {
    assert.equal(
      form.includes(marker),
      true,
      "Missing broadcast-form safeguard: " + marker,
    );
  }

  assert.equal(
    action.includes("/notification-administration/broadcasts"),
    true,
  );
});

test("broadcast UI copy is complete for Kurdish, Arabic, and English with RTL-aware message direction", async () => {
  const [dictionary, form] = await Promise.all([
    source("src/lib/i18n/notification-broadcast.ts"),
    source("src/components/notifications/notification-broadcast-form.tsx"),
  ]);

  for (const locale of ["ku", "ar", "en"]) {
    assert.equal(
      dictionary.includes(locale + ": {"),
      true,
      "Missing broadcast locale: " + locale,
    );
  }

  assert.equal(form.includes('messageLocale === "en" ? "ltr" : "rtl"'), true);
});
