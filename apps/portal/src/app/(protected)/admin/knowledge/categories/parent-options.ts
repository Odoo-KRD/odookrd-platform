import { MAX_CATEGORY_DEPTH } from "@/lib/knowledge-depth";

export interface AdminCategory {
  id: string;
  slug: string;
  parentId: string | null;
  name: string;
  nameTranslations: Record<string, string>;
  description: string | null;
  descriptionTranslations: Record<string, string>;
  status: "ACTIVE" | "INACTIVE";
  sortOrder: number;
  _count: { articles: number; children: number };
}

export interface ParentOption {
  id: string;
  label: string;
  depth: number;
}

/**
 * Categories that may be chosen as a parent: anything shallower than the depth
 * limit, since a child of a level-3 category would be level 4.
 *
 * `excludeId` removes a category and its descendants when editing, so a
 * category cannot be moved inside its own subtree. The API enforces both rules;
 * this only keeps impossible choices out of the dropdown.
 */
export function parentOptions(
  categories: AdminCategory[],
  excludeId?: string,
): ParentOption[] {
  const excluded = new Set<string>();

  if (excludeId) {
    excluded.add(excludeId);

    let grew = true;
    while (grew) {
      grew = false;
      for (const category of categories) {
        if (
          category.parentId &&
          excluded.has(category.parentId) &&
          !excluded.has(category.id)
        ) {
          excluded.add(category.id);
          grew = true;
        }
      }
    }
  }

  const walk = (parentId: string | null, depth: number): ParentOption[] =>
    categories
      .filter(
        (category) =>
          category.parentId === parentId && !excluded.has(category.id),
      )
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .flatMap((category) =>
        depth + 1 >= MAX_CATEGORY_DEPTH
          ? [{ id: category.id, label: category.name, depth }]
          : [
              { id: category.id, label: category.name, depth },
              ...walk(category.id, depth + 1),
            ],
      );

  return walk(null, 0);
}

/** Flattens parent/child rows into tree order, carrying the depth for display. */
export function orderCategories(
  categories: AdminCategory[],
  parentId: string | null = null,
  depth = 0,
): Array<AdminCategory & { depth: number }> {
  return categories
    .filter((category) => category.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .flatMap((category) => [
      { ...category, depth },
      ...orderCategories(categories, category.id, depth + 1),
    ]);
}

export interface CategoryPathOption {
  id: string;
  label: string;
  depth: number;
  parentPath: string[];
}

/** Tree order with each entry's ancestor names, for the category picker. */
export function categoryPathOptions(
  categories: AdminCategory[],
): CategoryPathOption[] {
  const names = new Map(categories.map((category) => [category.id, category.name]));

  const pathOf = (category: AdminCategory): string[] => {
    const path: string[] = [];
    let parentId = category.parentId;
    let guard = 0;

    while (parentId && guard < 5) {
      path.unshift(names.get(parentId) ?? "");
      parentId = categories.find((entry) => entry.id === parentId)?.parentId ?? null;
      guard += 1;
    }

    return path.filter(Boolean);
  };

  return orderCategories(categories).map((category) => ({
    id: category.id,
    label: category.name,
    depth: category.depth,
    parentPath: pathOf(category),
  }));
}
