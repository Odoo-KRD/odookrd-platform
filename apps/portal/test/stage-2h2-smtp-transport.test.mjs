import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFile(path.join(root, relative), "utf8");

test("protected settings UI accepts SMTP transport, port, security, username, and password", async () => {
  const [actions, form] = await Promise.all([
    source("src/app/(protected)/admin/settings/actions.ts"),
    source("src/components/settings/settings-form.tsx"),
  ]);

  for (const key of [
    "notifications.email.amazon_ses.transport",
    "notifications.email.amazon_ses.smtp_port",
    "notifications.email.amazon_ses.smtp_security",
    "notifications.email.amazon_ses.smtp_username",
    "notifications.email.amazon_ses.smtp_password",
  ]) {
    assert.equal(
      actions.includes(key),
      true,
      "Missing settings action key: " + key,
    );
  }

  const numberStart = actions.indexOf("const numberKeys");
  const secretStart = actions.indexOf("const secretKeys");
  const secretEnd = actions.indexOf("function isSettingCategory", secretStart);
  assert.ok(
    numberStart >= 0 && secretStart > numberStart && secretEnd > secretStart,
  );
  assert.equal(
    actions.slice(numberStart, secretStart).includes("smtp_port"),
    true,
  );
  const secretBlock = actions.slice(secretStart, secretEnd);
  assert.equal(secretBlock.includes("smtp_username"), true);
  assert.equal(secretBlock.includes("smtp_password"), true);

  for (const marker of [
    "notifications.email.amazon_ses.transport",
    "SES API",
    "SES SMTP",
    "notifications.email.amazon_ses.smtp_security",
    "STARTTLS",
    "TLS",
  ]) {
    assert.equal(
      form.includes(marker),
      true,
      "Missing settings-form marker: " + marker,
    );
  }
});

test("SMTP field copy remains in the typed Kurdish, Arabic, and English admin dictionaries", async () => {
  for (const locale of ["ku", "ar", "en"]) {
    const settings = await source("src/lib/i18n/admin/" + locale + ".ts");
    assert.equal(settings.includes("settings: {"), true);
    assert.equal(
      settings.includes("notifications.email.amazon_ses.smtp_username"),
      true,
    );
    assert.equal(
      settings.includes("notifications.email.amazon_ses.smtp_password"),
      true,
    );
  }
});

test("notification administration displays the selected transport with masked SMTP credentials", async () => {
  const [administration, page] = await Promise.all([
    source("src/lib/i18n/notification-administration.ts"),
    source("src/app/(protected)/admin/notifications/page.tsx"),
  ]);

  assert.equal(administration.includes("smtpHost: string;"), true);
  assert.equal(administration.includes("smtpPassword: string;"), true);

  for (const marker of [
    'providerStatus.email.transport === "smtp"',
    "providerStatus.email.smtp.host",
    "providerStatus.email.smtp.username.masked",
    "providerStatus.email.smtp.password.masked",
    "providerStatus.email.accessKeyId.masked",
  ]) {
    assert.equal(
      page.includes(marker),
      true,
      "Missing admin-page marker: " + marker,
    );
  }

  assert.equal(page.includes("smtp.password.value"), false);
  assert.equal(page.includes("smtp.password.secret"), false);
  assert.equal(page.includes("smtp.password.raw"), false);
});
