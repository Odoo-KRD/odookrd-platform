import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const workspaceRoot = new URL("../../../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, workspaceRoot), "utf8");

test("3B.2R.2A uses the supplied SVG editor icon pack", () => {
  const icons = read("packages/ui/src/editor-icon-assets.ts");
  const editor = read("packages/ui/src/rich-text-editor.tsx");

  assert.equal((icons.match(/data:image\/svg\+xml;base64,/g) ?? []).length, 29);
  assert.match(icons, /paragraph:/);
  assert.match(icons, /fullscreen:/);
  assert.match(icons, /exitFullscreen:/);
  assert.match(icons, /link:/);
  assert.match(icons, /unlink:/);
  assert.match(editor, /editorIconAssets/);
  assert.match(editor, /icon="paragraph"/);
  assert.match(editor, /icon="image"/);
  assert.match(editor, /icon="attachment"/);
  assert.match(editor, /icon="link"/);
  assert.match(editor, /icon="unlink"/);
});

test("3B.2R.2A refines image sizing selection and drag preview", () => {
  const editor = read("packages/ui/src/rich-text-editor.tsx");

  assert.match(editor, /naturalWidth/);
  assert.match(editor, /Actual size \(100%\)/);
  assert.match(editor, /"top-left"/);
  assert.match(editor, /"top-right"/);
  assert.match(editor, /"bottom-left"/);
  assert.match(editor, /"bottom-right"/);
  assert.match(editor, /rounded-none/);
  assert.match(editor, /cursor-nwse-resize/);
  assert.match(editor, /cursor-nesw-resize/);
  assert.match(editor, /scale\(0\.18\)/);
  assert.match(editor, /opacity = "0\.42"/);
});

test("3B.2R.2A provides one RTL toggle, true fullscreen, placeholder and full editor hit area", () => {
  const editor = read("packages/ui/src/rich-text-editor.tsx");
  const localized = read(
    "apps/portal/src/components/training/localized-rich-text-editor.tsx",
  );

  assert.match(editor, /function toggleRtl/);
  assert.doesNotMatch(editor, /label=\{labels\.directionLtr\}/);
  assert.match(editor, /label=\{labels\.directionRtl\}/);
  assert.match(localized, /dir="ltr"/);
  assert.doesNotMatch(localized, /getTextDirection/);

  assert.match(editor, /fixed inset-0 z-\[100\] h-\[100dvh\] w-screen/);
  assert.doesNotMatch(editor, /sm:p-4/);
  assert.doesNotMatch(editor, /sm:rounded-xl/);
  assert.match(editor, /labels\.placeholder/);
  assert.match(editor, /editor\.commands\.focus\("end"\)/);
});

test("3B.2R.2A adds URL link and unlink commands", () => {
  const editor = read("packages/ui/src/rich-text-editor.tsx");
  const training = read("apps/portal/src/lib/i18n/training.ts");

  assert.match(editor, /insertOrUpdateLink/);
  assert.match(editor, /setLink\(\{ href \}\)/);
  assert.match(editor, /unsetLink\(\)/);
  assert.match(editor, /labels\.linkPrompt/);
  assert.match(editor, /labels\.linkInvalid/);
  assert.match(training, /placeholder: "Start writing\.\.\."/);
  assert.match(training, /link: "Insert link"/);
  assert.match(training, /unlink: "Remove link"/);
});

test("3B.2R.2A makes stored AWS IAM keys discoverable in Settings", () => {
  const settings = read(
    "apps/portal/src/components/settings/settings-form.tsx",
  );
  const navigation = read("apps/portal/src/lib/i18n/settings-navigation.ts");

  assert.match(settings, /setCredentialSource\("stored"\)/);
  assert.match(settings, /navigationLabels\.s3\.storedCredentialsTitle/);
  assert.match(settings, /navigationLabels\.s3\.storedCredentialsHint/);
  assert.match(settings, /files\.aws_s3\.credential_source/);
  assert.match(navigation, /Stored IAM credentials/);
  assert.match(navigation, /Access Key ID and Secret Access Key/);
});
