import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(path, "utf8");
}

test("R1 initializes the company lifecycle dictionary before row mapping", () => {
  const source = read(
    "apps/portal/src/app/(protected)/admin/companies/page.tsx",
  );

  const lifecycle = source.indexOf(
    "const lifecycle = adminLifecycleDictionaries[locale]",
  );
  const rows = source.indexOf(
    "const rows: AdminDataTableRow[] = result.items.map",
  );

  assert.ok(lifecycle >= 0, "lifecycle dictionary declaration is missing");
  assert.ok(rows >= 0, "company rows declaration is missing");
  assert.ok(
    lifecycle < rows,
    "lifecycle must be initialized before rows map evaluates it",
  );
});

test("R1 isolates RichText command-dialog events from parent training modals", () => {
  const source = read("packages/ui/src/rich-text-editor.tsx");

  assert.match(
    source,
    /function applyCommandDialog[\s\S]*event\.preventDefault\(\);[\s\S]*event\.stopPropagation\(\);/,
  );
  assert.match(source, /createPortal\(commandDialogContent, document\.body\)/);
  assert.match(
    source,
    /onPointerDown=\{\(event\) => \{[\s\S]*event\.stopPropagation\(\);/,
  );
  assert.match(
    source,
    /onMouseDown=\{\(event\) => \{[\s\S]*event\.stopPropagation\(\);/,
  );
  assert.match(
    source,
    /onKeyDown=\{\(event\) => \{[\s\S]*event\.stopPropagation\(\);/,
  );
});

test("R1 uses one reusable action-control system for table and lifecycle rows", () => {
  const controls = read(
    "apps/portal/src/components/admin/admin-action-controls.tsx",
  );
  const table = read("apps/portal/src/components/admin/admin-data-table.tsx");
  const lifecycle = read(
    "apps/portal/src/components/admin/admin-lifecycle-row-actions.tsx",
  );

  assert.match(controls, /export function AdminActionGroup/);
  assert.match(controls, /export function AdminActionLink/);
  assert.match(controls, /export function AdminActionButton/);
  assert.match(controls, /inline-flex h-8/);

  assert.match(table, /AdminActionGroup/);
  assert.match(table, /AdminActionLink/);
  assert.match(table, /type: "actions"/);

  assert.match(lifecycle, /AdminActionGroup/);
  assert.match(lifecycle, /AdminActionLink/);
  assert.match(lifecycle, /AdminActionButton/);
  assert.match(lifecycle, /tone="warning"/);
  assert.match(lifecycle, /tone="danger"/);
  assert.doesNotMatch(lifecycle, /className="text-xs font-medium text-brand/);
});
