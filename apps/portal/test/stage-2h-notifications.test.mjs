import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const portalRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function source(relativePath) {
  return readFile(path.join(portalRoot, relativePath), "utf8");
}

test("notification pages use only server-side authenticated customer API context", async () => {
  const [page, actions] = await Promise.all([
    source("src/app/(protected)/(customer)/dashboard/notifications/page.tsx"),
    source("src/app/(protected)/(customer)/dashboard/notifications/actions.ts"),
  ]);

  assert.match(
    page,
    /getCustomerApiContext\(PERMISSIONS\.NOTIFICATIONS_READ\)/u,
  );
  assert.match(page, /\/notifications\?limit=/u);
  assert.match(page, /\/notifications\/unread-count/u);
  assert.doesNotMatch(page, /companyId\s*=/u);
  assert.match(actions, /^['"]use server['"];/u);
  assert.match(
    actions,
    /getCustomerApiContext\(PERMISSIONS\.NOTIFICATIONS_READ\)/u,
  );
  assert.doesNotMatch(
    `${page}\n${actions}`,
    /localStorage|sessionStorage|Authorization:\s*Bearer/iu,
  );
});

test("customer notification interface supports read state, mark-all, and pagination", async () => {
  const page = await source(
    "src/app/(protected)/(customer)/dashboard/notifications/page.tsx",
  );

  assert.match(page, /count\.unread/u);
  assert.match(page, /markNotificationReadAction/u);
  assert.match(page, /markAllNotificationsReadAction/u);
  assert.match(page, /previousOffset/u);
  assert.match(page, /nextOffset/u);
});

test("customer navigation and every supported locale include notification copy", async () => {
  const layout = await source("src/app/(protected)/(customer)/layout.tsx");
  assert.match(layout, /href: ["']\/dashboard\/notifications["']/u);
  assert.match(layout, /PERMISSIONS\.NOTIFICATIONS_READ/u);

  for (const locale of ["ku", "ar", "en"]) {
    const dictionary = await source(`src/lib/i18n/frontend/${locale}.ts`);
    assert.match(dictionary, /^\s{2}notifications:\s*\{/mu);
    assert.match(dictionary, /markAllRead/u);
    assert.match(dictionary, /WHATSAPP/u);
  }
});
