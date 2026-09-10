import {
  PERMISSIONS,
  type PaginatedResult,
  type TrainingCategory,
  type TrainingCourse,
  type TrainingCourseStatus,
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
import { getAdminApiContext, hasPermission } from "@/lib/authorization";
import { adminLifecycleDictionaries } from "@/lib/i18n/companies/lifecycle";
import { adminTableDictionaries } from "@/lib/i18n/admin/table";
import { trainingCustomerDictionaries } from "@/lib/i18n/training/customer";
import { getTrainingDictionary } from "@/lib/i18n/training/server";

import {
  archiveTrainingCourseRowAction,
  batchTrainingCourseStatusAction,
  deleteTrainingCourseRowAction,
  restoreTrainingCourseRowAction,
} from "../actions";
import { plural } from "@/lib/i18n/plural";
import { recordsPhrase } from "@/lib/i18n/shared/plurals";

interface TrainingCoursesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const statuses: TrainingCourseStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const pageSize = 20;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function selectedStatus(
  value: string | string[] | undefined,
): TrainingCourseStatus | null {
  return typeof value === "string" &&
    statuses.includes(value as TrainingCourseStatus)
    ? (value as TrainingCourseStatus)
    : null;
}

function selectedCategory(value: string | string[] | undefined): string | null {
  return typeof value === "string" && uuidPattern.test(value) ? value : null;
}

function selectedOffset(value: string | string[] | undefined): number {
  if (typeof value !== "string") return 0;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 1_000_000
    ? parsed
    : 0;
}

function selectedSearch(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim().slice(0, 250) : "";
}

function href(
  status: TrainingCourseStatus | null,
  categoryId: string | null,
  search: string,
  offset: number,
): string {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (categoryId) query.set("categoryId", categoryId);
  if (search) query.set("search", search);
  if (offset > 0) query.set("offset", String(offset));
  const suffix = query.toString();
  return suffix
    ? `/admin/training/courses?${suffix}`
    : "/admin/training/courses";
}

function tone(status: TrainingCourseStatus): AdminTableTone {
  if (status === "PUBLISHED") return "success";
  if (status === "ARCHIVED") return "neutral";
  return "warning";
}

export default async function TrainingCoursesPage({
  searchParams,
}: TrainingCoursesPageProps) {
  const [{ session, token }, { locale, training }, parameters] =
    await Promise.all([
      getAdminApiContext(PERMISSIONS.TRAINING_MANAGE),
      getTrainingDictionary(),
      searchParams,
    ]);

  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  const status = selectedStatus(parameters.status);
  const categoryId = selectedCategory(parameters.categoryId);
  const search = selectedSearch(parameters.search);
  const offset = selectedOffset(parameters.offset);
  const query = new URLSearchParams({
    limit: String(pageSize),
    offset: String(offset),
  });
  if (status) query.set("status", status);
  if (categoryId) query.set("categoryId", categoryId);
  if (search) query.set("search", search);

  const [result, categories] = await Promise.all([
    apiRequest<PaginatedResult<TrainingCourse>>(
      `/training/courses?${query.toString()}`,
      { token },
    ),
    apiRequest<PaginatedResult<TrainingCategory>>(
      "/training/categories?limit=100&offset=0",
      { token },
    ),
  ]);

  const lifecycle = adminLifecycleDictionaries[locale];

  const rows: AdminDataTableRow[] = result.items.map((course) => ({
    id: course.id,
    searchText: `${course.title} ${course.slug} ${course.category.name}`,
    cells: {
      cover: {
        type: "image",
        src: course.coverImageAssetId
          ? `/api/files/${encodeURIComponent(course.coverImageAssetId)}/content`
          : null,
        alt: course.title,
        fallback: course.title.slice(0, 1).toLocaleUpperCase(),
      },
      title: { type: "text", value: course.title, emphasis: true },
      category: { type: "text", value: course.category.name },
      status: {
        type: "badge",
        label: training.courseStatus[course.status],
        tone: tone(course.status),
      },
      structure: {
        type: "text",
        value: `${course.sectionCount} / ${course.lessonCount}`,
      },
      order: { type: "text", value: String(course.sortOrder) },
      actions: {
        type: "node",
        value: (
          <AdminLifecycleRowActions
            id={course.id}
            name={course.title}
            status={course.status}
            editHref={`/admin/training/courses/${course.id}`}
            compactMenu
            extraActions={[
              {
                key: "course-editor",
                label: training.courseEditor,
                href: `/admin/training/courses/${course.id}/editor`,
                tone: "primary",
                icon: "course-editor",
                showInline: true,
              },
              ...(hasPermission(session, PERMISSIONS.TRAINING_ASSIGN)
                ? [
                    {
                      key: "manage-access",
                      label:
                        trainingCustomerDictionaries[locale].manageTraining,
                      href: `/admin/training/courses/${course.id}/access`,
                      icon: "manage-access" as const,
                    },
                  ]
                : []),
            ]}
            labels={lifecycle}
            archiveAction={archiveTrainingCourseRowAction}
            restoreAction={restoreTrainingCourseRowAction}
            deleteAction={deleteTrainingCourseRowAction}
          />
        ),
      },
    },
  }));

  const toolbar = (
    <form
      action="/admin/training/courses"
      method="get"
      className="flex flex-1 flex-wrap items-center gap-2"
    >
      <input
        type="search"
        name="search"
        defaultValue={search}
        placeholder={training.searchCourses}
        className="h-9 min-w-[220px] flex-1 rounded-md border border-line bg-white px-3 text-xs text-content outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
      />
      <select
        name="categoryId"
        defaultValue={categoryId ?? ""}
        className="h-9 min-w-40 rounded-md border border-line bg-white px-3 text-xs text-content"
      >
        <option value="">{training.allCategories}</option>
        {categories.items.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <select
        name="status"
        defaultValue={status ?? ""}
        className="h-9 rounded-md border border-line bg-white px-3 text-xs text-content"
      >
        <option value="">{training.allStatuses}</option>
        {statuses.map((item) => (
          <option key={item} value={item}>
            {training.courseStatus[item]}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="h-9 rounded-md border border-brand/20 bg-brand-soft px-3 text-xs font-medium text-brand hover:bg-brand/10"
      >
        {training.filter}
      </button>
      {status || categoryId || search ? (
        <Link
          href="/admin/training/courses"
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
          {plural(recordsPhrase, locale, result.pagination.total)}
        </p>
        <div className="flex items-center gap-2">
          {result.pagination.offset > 0 ? (
            <Link
              href={href(
                status,
                categoryId,
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
                categoryId,
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
        title={training.coursesTitle}
        description={training.coursesDescription}
        actions={
          <Link
            href="/admin/training/courses/new"
            className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
          >
            {training.addCourse}
          </Link>
        }
      />

      <AdminDataTable
        locale={locale}
        columns={[
          { key: "cover", label: training.coverImage, className: "w-20" },
          { key: "title", label: training.courseTitle },
          { key: "category", label: training.category },
          { key: "status", label: training.status },
          { key: "structure", label: training.structure },
          { key: "order", label: training.sortOrder },
          { key: "actions", label: training.actions },
        ]}
        rows={rows}
        labels={adminTableDictionaries[locale]}
        searchEnabled={false}
        selectable
        batchAction={batchTrainingCourseStatusAction}
        batchActions={[
          { value: "DRAFT", label: training.courseStatus.DRAFT },
          { value: "PUBLISHED", label: training.courseStatus.PUBLISHED },
          {
            value: "ARCHIVED",
            label: training.courseStatus.ARCHIVED,
            tone: "danger",
          },
        ]}
        toolbar={toolbar}
        footer={footer}
        minWidthClassName="min-w-[1080px]"
        empty={
          <EmptyState
            title={training.noCourses}
            description={training.coursesDescription}
          />
        }
      />
    </div>
  );
}
