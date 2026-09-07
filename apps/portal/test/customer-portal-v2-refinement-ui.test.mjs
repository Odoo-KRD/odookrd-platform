import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(path, "utf8");

test("login is corporate, Kurdish-default compatible, and uses reusable language select", () => {
  const page = read("apps/portal/src/app/(public)/login/page.tsx");
  const form = read("apps/portal/src/components/auth/login-form.tsx");
  const select = read(
    "apps/portal/src/components/preferences/language-select.tsx",
  );
  const locale = read("apps/portal/src/lib/i18n/config.ts");

  assert.match(page, /LanguageSelect/);
  assert.match(page, /lg:grid-cols/);
  assert.match(form, /name="rememberMe"/);
  assert.match(form, /showPassword/);
  assert.match(form, /rememberMe:\s*formData\.get\("rememberMe"\)/);
  assert.match(select, /<select/);
  assert.match(select, /SUPPORTED_LOCALES/);
  assert.match(locale, /DEFAULT_LOCALE:\s*Locale\s*=\s*"ku"/);
});

test("customer header uses a dropdown language component and avoids full email as primary identity fallback", () => {
  const header = read(
    "apps/portal/src/components/customer/customer-shell-header.tsx",
  );
  const layout = read(
    "apps/portal/src/app/(protected)/(customer)/layout.tsx",
  );

  assert.match(header, /LanguageSelect/);
  assert.doesNotMatch(header, /LanguageSwitcher/);
  assert.match(header, /email\.split\("@"\)\[0\]/);
  assert.match(
    layout,
    /profile\.displayName\s*\?\?\s*profile\.certificateName/,
  );
});

test("services cards expose icons, visible feature previews, and clear service actions", () => {
  const page = read(
    "apps/portal/src/app/(protected)/(customer)/dashboard/services/page.tsx",
  );

  assert.match(page, /ServiceIcon/);
  assert.match(page, /featurePreview/);
  assert.match(page, /visibleFeatureCount/);
  assert.match(page, /labels\.accessService/);
  assert.match(page, /labels\.viewDetails/);
});

test("training page has a single professional hierarchy with summary, continue learning, and course library", () => {
  const page = read(
    "apps/portal/src/app/(protected)/(customer)/dashboard/training/page.tsx",
  );
  const continueLearning = read(
    "apps/portal/src/components/training/training-continue-learning.tsx",
  );

  assert.match(page, /TrainingDashboardSummary/);
  assert.match(page, /metrics\.entitledCourses/);
  assert.match(page, /metrics\.inProgress/);
  assert.match(page, /metrics\.completed/);
  assert.match(page, /refinement\.libraryTitle/);
  assert.match(page, /TrainingContinueLearning/);
  assert.match(continueLearning, /border-b border-line/);
});
