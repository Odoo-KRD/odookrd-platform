import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), "utf8");

test("Stage 3B.2 presents Training as E-Learning without renaming backend contracts", () => {
  const dictionary = read("src/lib/i18n/training.ts");
  const actions = read("src/app/(protected)/admin/training/actions.ts");
  assert.match(dictionary, /navigation: "E-Learning"/);
  assert.match(dictionary, /navigation: "التعلّم الإلكتروني"/);
  assert.match(actions, /\/training\/courses/);
  assert.doesNotMatch(actions, /\/e-learning\//);
});

test("Stage 3B.2 exposes dedicated Courses and Categories navigation", () => {
  const navigation = read("src/lib/admin-navigation.ts");
  assert.match(navigation, /href: "\/admin\/training\/courses"/);
  assert.match(navigation, /href: "\/admin\/training\/categories"/);
  assert.match(navigation, /labels\.trainingCourses/);
  assert.match(navigation, /labels\.trainingCategories/);
});

test("Stage 3B.2 uses AdminDataTable for standalone course and category management", () => {
  const courses = read("src/app/(protected)/admin/training/courses/page.tsx");
  const categories = read(
    "src/app/(protected)/admin/training/categories/page.tsx",
  );
  assert.match(courses, /AdminDataTable/);
  assert.match(categories, /AdminDataTable/);
  assert.match(courses, /type: "actions"/);
  assert.match(categories, /type: "actions"/);
});

test("Stage 3B.2 separates course metadata from the Course Editor workspace", () => {
  const courses = read("src/app/(protected)/admin/training/courses/page.tsx");
  const metadata = read(
    "src/app/(protected)/admin/training/courses/[id]/page.tsx",
  );
  const editor = read(
    "src/app/(protected)/admin/training/courses/[id]/editor/page.tsx",
  );
  assert.match(courses, /\/editor/);
  assert.match(metadata, /TrainingCourseForm/);
  assert.doesNotMatch(metadata, /TrainingSectionForm/);
  assert.match(editor, /TrainingSection/);
  assert.match(editor, /addSection/);
});

test("Stage 3B.2 keeps generic content types and drag-and-drop in Stage 3C.1", () => {
  const editor = read(
    "src/app/(protected)/admin/training/courses/[id]/editor/page.tsx",
  );
  const packageJson = read("package.json");
  assert.doesNotMatch(editor, /VIDEO|ARTICLE|DOCUMENT|QUIZ/);
  assert.doesNotMatch(editor, /DndContext|SortableContext|useSortable/);
  assert.doesNotMatch(packageJson, /@dnd-kit/);
});
