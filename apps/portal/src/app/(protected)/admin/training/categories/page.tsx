import {
  PERMISSIONS,
  type PaginatedResult,
  type TrainingCategory,
  type TrainingCategoryStatus,
} from "@odookrd/types";
import { EmptyState, PageHeading } from "@odookrd/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  AdminDataTable,
  type AdminDataTableRow,
  type AdminTableTone,
} from "@/components/admin/admin-data-table";
import { AdminLifecycleRowActions } from "@/components/admin/admin-lifecycle-row-actions";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { adminLifecycleDictionaries } from "@/lib/i18n/companies/lifecycle";
import { adminTableDictionaries } from "@/lib/i18n/admin/table";
import { getTrainingDictionary } from "@/lib/i18n/training/server";

import {
  archiveTrainingCategoryRowAction,
  batchTrainingCategoryStatusAction,
  deleteTrainingCategoryRowAction,
  restoreTrainingCategoryRowAction,
} from "../actions";

interface TrainingCategoriesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const statuses: TrainingCategoryStatus[] = ["ACTIVE", "INACTIVE"];
const pageSize = 20;

function selectedStatus(
  value: string | string[] | undefined,
): TrainingCategoryStatus | null {
  return typeof value === "string" &&
    statuses.includes(value as TrainingCategoryStatus)
    ? (value as TrainingCategoryStatus)
    : null;
}

function selectedOffset(value: string | string[] | undefined): number {
  if (typeof value !== "string") return 0;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 1_000_000
    ? parsed
    : 0;
}

function selectedSearch(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim().slice(0, 200) : "";
}

function href(
  status: TrainingCategoryStatus | null,
  search: string,
  offset: number,
): string {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (search) query.set("search", search);
  if (offset > 0) query.set("offset", String(offset));
  const suffix = query.toString();
  return suffix
    ? `/admin/training/categories?${suffix}`
    : "/admin/training/categories";
}

function tone(status: TrainingCategoryStatus): AdminTableTone {
  return status === "ACTIVE" ? "success" : "neutral";
}

export default async function TrainingCategoriesPage({
  searchParams,
}: TrainingCategoriesPageProps) {
  const [{ session, token }, { locale, training }, parameters] =
    await Promise.all([
      getAdminApiContext(PERMISSIONS.TRAINING_MANAGE),
      getTrainingDictionary(),
      searchParams,
    ]);

  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  const status = selectedStatus(parameters.status);
  const search = selectedSearch(parameters.search);
  const offset = selectedOffset(parameters.offset);
  const query = new URLSearchParams({
    limit: String(pageSize),
    offset: String(offset),
  });
  if (status) query.set("status", status);
  if (search) query.set("search", search);

  const result = await apiRequest<PaginatedResult<TrainingCategory>>(
    `/training/categories?${query.toString()}`,
    { token },
  );

  const lifecycle = adminLifecycleDictionaries[locale];

  const rows: AdminDataTableRow[] = result.items.map((category) => ({
    id: category.id,
    searchText: `${category.name} ${category.key}`,
    cells: {
      name: { type: "text", value: category.name, emphasis: true },
      key: { type: "text", value: category.key, dir: "ltr", muted: true },
      status: {
        type: "badge",
        label: training.categoryStatus[category.status],
        tone: tone(category.status),
      },
      courses: { type: "text", value: String(category.courseCount) },
      order: { type: "text", value: String(category.sortOrder) },
      actions: {
        type: "node",
        value: (
          <AdminLifecycleRowActions
            id={category.id}
            name={category.name}
            status={category.status}
            editHref={`/admin/training/categories/${category.id}`}
            labels={lifecycle}
            archiveAction={archiveTrainingCategoryRowAction}
            restoreAction={restoreTrainingCategoryRowAction}
            deleteAction={deleteTrainingCategoryRowAction}
          />
        ),
      },
    },
  }));

  const toolbar = (
    <form
      action="/admin/training/categories"
      method="get"
      className="flex flex-1 flex-wrap items-center gap-2"
    >
      <input
        type="search"
        name="search"
        defaultValue={search}
        placeholder={training.searchCategories}
        className="h-9 min-w-[220px] flex-1 rounded-md border border-line bg-white px-3 text-xs text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
      />
      <select
        name="status"
        defaultValue={status ?? ""}
        className="h-9 rounded-md border border-line bg-white px-3 text-xs text-content"
      >
        <option value="">{training.allStatuses}</option>
        {statuses.map((item) => (
          <option key={item} value={item}>
            {training.categoryStatus[item]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="h-9 rounded-md border border-brand/20 bg-brand-soft px-3 text-xs font-medium text-brand hover:bg-brand/10"
      >
        {training.filter}
      </button>
      {status || search ? (
        <Link
          href="/admin/training/categories"
          className="h-9 rounded-md border border-line bg-white px-3 py-2 text-xs font-medium text-muted hover:bg-surface-subtle"
        >
          {training.clearFilters}
        </Link>
      ) : null}
    </form>
  );

  const footer =
    result.pagination.total > 0 ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {result.pagination.total} {training.records}
        </p>
        <div className="flex items-center gap-2">
          {result.pagination.offset > 0 ? (
            <Link
              href={href(
                status,
                search,
                Math.max(0, result.pagination.offset - result.pagination.limit),
              )}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-subtle"
            >
              {training.previous}
            </Link>
          ) : null}
          {result.pagination.offset + result.items.length <
          result.pagination.total ? (
            <Link
              href={href(
                status,
                search,
                result.pagination.offset + result.pagination.limit,
              )}
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-subtle"
            >
              {training.next}
            </Link>
          ) : null}
        </div>
      </div>
    ) : undefined;

  return (
    <div className="grid gap-7">
      <PageHeading
        title={training.categoriesTitle}
        description={training.categoriesDescription}
        actions={
          <Link
            href="/admin/training/categories/new"
            className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
          >
            {training.addCategory}
          </Link>
        }
      />

      <AdminDataTable
        columns={[
          { key: "name", label: training.name },
          { key: "key", label: training.key },
          { key: "status", label: training.status },
          { key: "courses", label: training.courseCount },
          { key: "order", label: training.sortOrder },
          { key: "actions", label: training.actions },
        ]}
        rows={rows}
        labels={adminTableDictionaries[locale]}
        searchEnabled={false}
        selectable
        batchAction={batchTrainingCategoryStatusAction}
        batchActions={[
          {
            value: "ACTIVE",
            label: training.categoryStatus.ACTIVE,
          },
          {
            value: "INACTIVE",
            label: training.categoryStatus.INACTIVE,
            tone: "danger",
          },
        ]}
        toolbar={toolbar}
        footer={footer}
        minWidthClassName="min-w-[900px]"
        empty={
          <EmptyState
            title={training.noCategories}
            description={training.categoriesDescription}
          />
        }
      />
    </div>
  );
}
