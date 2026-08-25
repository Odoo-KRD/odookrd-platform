import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFile(`${root}/${path}`, "utf8");

const [page, manager, attachment, actions, dictionaries] = await Promise.all([
  read("src/app/(protected)/admin/services/[id]/page.tsx"),
  read("src/components/services/service-features-manager.tsx"),
  read("src/components/services/service-feature-attachment-form.tsx"),
  read("src/app/(protected)/admin/services/actions.ts"),
  read("src/lib/i18n/service-features.ts"),
]);

test("new predefined features return to the features list after creation", () => {
  const creation = actions.match(
    /export async function createFeatureDefinitionAction\([\s\S]*?(?=export async function updateFeatureDefinitionAction)/,
  )?.[0];

  assert.ok(creation);
  assert.match(creation, /redirect\("\/admin\/services\/features"\)/);
  assert.doesNotMatch(creation, /redirect\(`\/admin\/services\/features\/\$\{/);
});

test("feature management moves into a compact header-led service manager", () => {
  assert.match(page, /<ServiceFeaturesManager/);
  assert.match(
    page,
    /attachAction=\{attachServiceFeatureDefinitionAction\.bind/,
  );
  assert.match(page, /updateAction=\{updateAttachedServiceFeatureAction\.bind/);
  assert.match(page, /moveAction=\{moveServiceFeatureAction\.bind/);
  assert.match(page, /reorderAction=\{reorderServiceFeaturesAction\.bind/);
  assert.doesNotMatch(page, /<details|<summary/);

  const header = manager.match(/<header[\s\S]*?<\/header>/)?.[0];
  assert.ok(header);
  assert.match(header, /labels\.addFeature/);
  assert.match(header, /labels\.manageDefinitions/);
});

test("service features use accessible add and edit modal dialogs", () => {
  assert.match(manager, /setDialog\(\{ mode: "add" \}\)/);
  assert.match(
    manager,
    /setDialog\(\{ mode: "edit", featureId: feature\.id \}\)/,
  );
  assert.match(manager, /role="dialog"/);
  assert.match(manager, /aria-modal="true"/);
  assert.match(manager, /event\.key !== "Escape"/);
  assert.match(manager, /previousFocus\?\.focus\(\)/);
  assert.match(manager, /successAction=\{closeDialog\}/g);
  assert.match(attachment, /result\.message === null/);
  assert.match(attachment, /onClick=\{cancelAction\}/);
});

test("compact feature rows retain translated values, status, visibility, and icon actions", () => {
  assert.match(manager, /formattedValue\(feature, locale, labels\)/);
  assert.match(manager, /feature\.parameterLabel/);
  assert.match(manager, /services\.catalogStatusLabels\[feature\.status\]/);
  assert.match(manager, /labels\.visibleToCustomer/);
  assert.match(manager, /labels\.platformOnly/);
  assert.match(manager, /labels\.editAction/);
  assert.match(manager, /labels\.valueTypes\[feature\.valueType\]/);
  assert.match(manager, /size-8/);
});

test("drag ordering is optimistic, keyboard accessible, and restores failures", () => {
  assert.match(
    manager,
    /draggable=\{!pending && orderedFeatures\.length > 1\}/,
  );
  assert.match(manager, /onDragStart=/);
  assert.match(manager, /onDragOver=/);
  assert.match(manager, /onDrop=/);
  assert.match(manager, /event\.key === "ArrowUp"/);
  assert.match(manager, /event\.key === "ArrowDown"/);
  assert.match(manager, /reorderAction\(next\.map\(\(item\) => item\.id\)\)/);
  assert.match(
    manager,
    /setOptimisticOrder\(previous\.map\(\(feature\) => feature\.id\)\)/,
  );
  assert.match(manager, /role="status"/);
});

test("reordering remains platform-only, bounded, unique, and server-side", () => {
  const reorder = actions.match(
    /export async function reorderServiceFeaturesAction\([\s\S]*?(?=interface AssignmentFormInput)/,
  )?.[0];

  assert.ok(reorder);
  assert.match(reorder, /PERMISSIONS\.SERVICES_MANAGE/);
  assert.match(reorder, /session\.user\.accountScope !== "PLATFORM"/);
  assert.match(reorder, /ids\.length > 100/);
  assert.match(reorder, /new Set\(ids\)\.size !== ids\.length/);
  assert.match(reorder, /uuidPattern\.test\(id\)/);
  assert.match(reorder, /\/features\/reorder/);
  assert.match(reorder, /refreshServiceAdministration\(serviceId\)/);
});

test("new feature manager controls remain translated in Kurdish, Arabic, and English", () => {
  for (const key of [
    "editAction",
    "manageDefinitions",
    "dragToReorder",
    "orderSaved",
    "orderSaveFailed",
    "closeDialog",
  ]) {
    assert.equal(
      (dictionaries.match(new RegExp(`${key}:`, "g")) ?? []).length,
      4,
    );
  }

  assert.match(dictionaries, /editAction: "Edit"/);
  assert.match(dictionaries, /manageDefinitions: "Manage definitions"/);
  assert.match(dictionaries, /dragToReorder: "Drag to reorder"/);
});
