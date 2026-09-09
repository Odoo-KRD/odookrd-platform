import {
  PERMISSIONS,
  type Locale,
  type LocalizedText,
  type Pagination,
  type TrainingReportCertificatePage,
  type TrainingReportCoursePage,
  type TrainingReportLearnerPage,
  type TrainingReportOptions,
  type TrainingReportOverview,
  type TrainingReportQuizPage,
} from "@odookrd/types";
import { EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  AdminDataTable,
  type AdminDataTableColumn,
  type AdminDataTableRow,
  type AdminTableTone,
} from "@/components/admin/admin-data-table";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { adminTableDictionaries } from "@/lib/i18n/admin/table";
import { getTrainingDictionary } from "@/lib/i18n/training/server";
import { trainingReportsDictionaries } from "@/lib/i18n/training/reports";

interface TrainingReportsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type ReportView =
  "overview" | "courses" | "learners" | "quizzes" | "certificates";

interface SelectedFilters {
  companyId: string | null;
  courseId: string | null;
  categoryId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}

const views: ReportView[] = [
  "overview",
  "courses",
  "learners",
  "quizzes",
  "certificates",
];
const pageSize = 25;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function single(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function selectedView(value: string | string[] | undefined): ReportView {
  const candidate = single(value);
  return candidate && views.includes(candidate as ReportView)
    ? (candidate as ReportView)
    : "overview";
}

function selectedUuid(value: string | string[] | undefined): string | null {
  const candidate = single(value);
  return candidate && uuidPattern.test(candidate) ? candidate : null;
}

function selectedDate(value: string | string[] | undefined): string | null {
  const candidate = single(value);
  return candidate && datePattern.test(candidate) ? candidate : null;
}

function selectedOffset(value: string | string[] | undefined): number {
  const candidate = single(value);
  if (!candidate) return 0;

  const parsed = Number(candidate);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= 1_000_000
    ? parsed
    : 0;
}

function reportQuery(filters: SelectedFilters, includeCompany = true) {
  const query = new URLSearchParams();
  if (includeCompany && filters.companyId) {
    query.set("companyId", filters.companyId);
  }
  if (filters.courseId) query.set("courseId", filters.courseId);
  if (filters.categoryId) query.set("categoryId", filters.categoryId);
  if (filters.dateFrom) query.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) query.set("dateTo", filters.dateTo);
  return query;
}

function workspaceHref(
  view: ReportView,
  filters: SelectedFilters,
  offset = 0,
): string {
  const query = reportQuery(filters);
  query.set("view", view);
  if (offset > 0) query.set("offset", String(offset));
  return `/admin/training/reports?${query.toString()}`;
}

function exportHref(
  view: Exclude<ReportView, "overview">,
  filters: SelectedFilters,
) {
  const query = reportQuery(filters);
  query.set("dataset", view);
  return `/api/training/reports/export?${query.toString()}`;
}

function percent(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

function localizedText(
  fallback: string,
  translations: LocalizedText,
  locale: Locale,
): string {
  return (
    translations[locale]?.trim() ||
    translations.ku?.trim() ||
    translations.ar?.trim() ||
    translations.en?.trim() ||
    fallback
  );
}

function statusTone(status: string): AdminTableTone {
  if (status === "PUBLISHED" || status === "ACTIVE") return "success";
  if (status === "DRAFT") return "warning";
  if (status === "REVOKED") return "danger";
  return "neutral";
}

function paginationFooter(
  pagination: Pagination,
  view: ReportView,
  filters: SelectedFilters,
  previousLabel: string,
  nextLabel: string,
  recordsLabel: string,
): ReactNode {
  if (pagination.total <= 0) return undefined;

  const hasPrevious = pagination.offset > 0;
  const hasNext = pagination.offset + pagination.limit < pagination.total;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted">
        {pagination.total} {recordsLabel}
      </p>
      <div className="flex items-center gap-2">
        {hasPrevious ? (
          <Link
            href={workspaceHref(
              view,
              filters,
              Math.max(0, pagination.offset - pagination.limit),
            )}
            className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-subtle"
          >
            {previousLabel}
          </Link>
        ) : null}
        {hasNext ? (
          <Link
            href={workspaceHref(
              view,
              filters,
              pagination.offset + pagination.limit,
            )}
            className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-subtle"
          >
            {nextLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default async function TrainingReportsPage({
  searchParams,
}: TrainingReportsPageProps) {
  const [{ session, token }, { locale }, parameters] = await Promise.all([
    getAdminApiContext(PERMISSIONS.TRAINING_REPORTS_READ),
    getTrainingDictionary(),
    searchParams,
  ]);

  const labels = trainingReportsDictionaries[locale];
  const view = selectedView(parameters.view);
  const filters: SelectedFilters = {
    companyId:
      session.user.accountScope === "PLATFORM"
        ? selectedUuid(parameters.companyId)
        : null,
    courseId: selectedUuid(parameters.courseId),
    categoryId: selectedUuid(parameters.categoryId),
    dateFrom: selectedDate(parameters.dateFrom),
    dateTo: selectedDate(parameters.dateTo),
  };
  const offset = selectedOffset(parameters.offset);

  const optionsQuery = new URLSearchParams();
  if (filters.companyId) {
    optionsQuery.set("companyId", filters.companyId);
  }
  const optionsSuffix = optionsQuery.toString();
  const options = await apiRequest<TrainingReportOptions>(
    `/training/reports/options${optionsSuffix ? `?${optionsSuffix}` : ""}`,
    { token },
  );

  const apiQuery = reportQuery(filters);
  let content: ReactNode;

  if (view === "overview") {
    const overview = await apiRequest<TrainingReportOverview>(
      `/training/reports/overview${
        apiQuery.toString() ? `?${apiQuery.toString()}` : ""
      }`,
      { token },
    );

    const cards = [
      [labels.activeLearners, overview.activeLearners],
      [labels.coursesEngaged, overview.coursesEngaged],
      [labels.completions, overview.completions],
      [labels.quizAttempts, overview.quizAttempts],
      [labels.quizPassRate, percent(overview.quizPassRate)],
      [labels.quizAverageScore, percent(overview.quizAverageScore)],
      [labels.certificatesIssued, overview.certificatesIssued],
      [labels.activeCertificates, overview.activeCertificates],
      [labels.revokedCertificates, overview.revokedCertificates],
    ] as const;

    content = (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <Panel key={label} className="p-5">
            <p className="text-xs font-medium text-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-content">{value}</p>
          </Panel>
        ))}
        <p className="sm:col-span-2 xl:col-span-3 text-xs text-muted">
          {labels.overviewHint}
        </p>
      </div>
    );
  } else {
    apiQuery.set("limit", String(pageSize));
    apiQuery.set("offset", String(offset));

    let columns: readonly AdminDataTableColumn[] = [];
    let rows: AdminDataTableRow[] = [];
    let pagination: Pagination = { limit: pageSize, offset, total: 0 };

    if (view === "courses") {
      const result = await apiRequest<TrainingReportCoursePage>(
        `/training/reports/courses?${apiQuery.toString()}`,
        { token },
      );
      pagination = result.pagination;
      columns = [
        { key: "course", label: labels.course },
        { key: "category", label: labels.category },
        { key: "status", label: labels.status },
        { key: "learners", label: labels.learnersCount },
        { key: "completions", label: labels.completions },
        { key: "quiz", label: labels.quizAttempts },
        { key: "passRate", label: labels.quizPassRate },
        { key: "average", label: labels.averageScore },
        { key: "certificates", label: labels.certificatesCount },
        { key: "latest", label: labels.latestActivity },
      ];
      rows = result.items.map((row) => ({
        id: row.id,
        searchText: `${row.title} ${row.category.name}`,
        cells: {
          course: { type: "text", value: row.title, emphasis: true },
          category: { type: "text", value: row.category.name },
          status: {
            type: "badge",
            label: labels.courseStatus[row.status],
            tone: statusTone(row.status),
          },
          learners: { type: "text", value: String(row.engagedLearners) },
          completions: { type: "text", value: String(row.completions) },
          quiz: { type: "text", value: String(row.quizAttempts) },
          passRate: { type: "text", value: percent(row.quizPassRate) },
          average: { type: "text", value: percent(row.quizAverageScore) },
          certificates: {
            type: "text",
            value: String(row.certificatesIssued),
          },
          latest: {
            type: "text",
            value: row.latestActivityAt
              ? formatDate(row.latestActivityAt, locale)
              : "—",
          },
        },
      }));
    } else if (view === "learners") {
      const result = await apiRequest<TrainingReportLearnerPage>(
        `/training/reports/learners?${apiQuery.toString()}`,
        { token },
      );
      pagination = result.pagination;
      columns = [
        { key: "learner", label: labels.learner },
        { key: "company", label: labels.company },
        { key: "courses", label: labels.coursesEngaged },
        { key: "completed", label: labels.completedCourses },
        { key: "attempts", label: labels.quizAttempts },
        { key: "passRate", label: labels.quizPassRate },
        { key: "average", label: labels.averageScore },
        { key: "certificates", label: labels.certificatesCount },
        { key: "latest", label: labels.latestActivity },
      ];
      rows = result.items.map((row) => ({
        id: row.id,
        searchText: `${row.learnerName} ${row.email} ${row.company.name}`,
        cells: {
          learner: {
            type: "node",
            value: (
              <div>
                <p className="font-medium text-content">{row.learnerName}</p>
                <p dir="ltr" className="mt-1 text-xs text-muted">
                  {row.email}
                </p>
              </div>
            ),
          },
          company: { type: "text", value: row.company.name },
          courses: { type: "text", value: String(row.coursesEngaged) },
          completed: { type: "text", value: String(row.completedCourses) },
          attempts: { type: "text", value: String(row.quizAttempts) },
          passRate: { type: "text", value: percent(row.quizPassRate) },
          average: { type: "text", value: percent(row.quizAverageScore) },
          certificates: {
            type: "text",
            value: String(row.certificatesIssued),
          },
          latest: {
            type: "text",
            value: row.latestActivityAt
              ? formatDate(row.latestActivityAt, locale)
              : "—",
          },
        },
      }));
    } else if (view === "quizzes") {
      const result = await apiRequest<TrainingReportQuizPage>(
        `/training/reports/quizzes?${apiQuery.toString()}`,
        { token },
      );
      pagination = result.pagination;
      columns = [
        { key: "quiz", label: labels.quizzes },
        { key: "course", label: labels.course },
        { key: "placement", label: labels.placement },
        { key: "status", label: labels.status },
        { key: "learners", label: labels.learnersCount },
        { key: "attempts", label: labels.attempts },
        { key: "passed", label: labels.passed },
        { key: "failed", label: labels.failed },
        { key: "passRate", label: labels.quizPassRate },
        { key: "average", label: labels.averageScore },
        { key: "latest", label: labels.latestAttempt },
      ];
      rows = result.items.map((row) => ({
        id: row.id,
        searchText: `${row.title} ${row.course.title}`,
        cells: {
          quiz: { type: "text", value: row.title, emphasis: true },
          course: { type: "text", value: row.course.title },
          placement: {
            type: "badge",
            label: labels.quizPlacement[row.placement],
            tone: "accent",
          },
          status: {
            type: "badge",
            label: labels.quizStatus[row.status],
            tone: statusTone(row.status),
          },
          learners: { type: "text", value: String(row.learners) },
          attempts: { type: "text", value: String(row.attempts) },
          passed: { type: "text", value: String(row.passed) },
          failed: { type: "text", value: String(row.failed) },
          passRate: { type: "text", value: percent(row.passRate) },
          average: { type: "text", value: percent(row.averagePercentage) },
          latest: {
            type: "text",
            value: row.latestAttemptAt
              ? formatDate(row.latestAttemptAt, locale)
              : "—",
          },
        },
      }));
    } else {
      const result = await apiRequest<TrainingReportCertificatePage>(
        `/training/reports/certificates?${apiQuery.toString()}`,
        { token },
      );
      pagination = result.pagination;
      columns = [
        { key: "number", label: labels.certificateNumber },
        { key: "learner", label: labels.learner },
        { key: "company", label: labels.company },
        { key: "course", label: labels.course },
        { key: "score", label: labels.score },
        { key: "status", label: labels.status },
        { key: "issued", label: labels.issuedAt },
        { key: "revoked", label: labels.revokedAt },
      ];
      rows = result.items.map((row) => ({
        id: row.id,
        searchText: `${row.certificateNumber} ${row.learnerName} ${row.learnerEmail} ${row.companyName} ${row.courseTitle}`,
        cells: {
          number: {
            type: "text",
            value: row.certificateNumber,
            dir: "ltr",
            emphasis: true,
          },
          learner: {
            type: "node",
            value: (
              <div>
                <p className="font-medium text-content">{row.learnerName}</p>
                <p dir="ltr" className="mt-1 text-xs text-muted">
                  {row.learnerEmail}
                </p>
              </div>
            ),
          },
          company: { type: "text", value: row.companyName },
          course: {
            type: "text",
            value: localizedText(
              row.courseTitle,
              row.courseTitleTranslations,
              locale,
            ),
          },
          score: {
            type: "text",
            value:
              row.scorePercentage === null ? "—" : percent(row.scorePercentage),
          },
          status: {
            type: "badge",
            label: labels.certificateStatus[row.status],
            tone: statusTone(row.status),
          },
          issued: {
            type: "text",
            value: formatDate(row.issuedAt, locale),
          },
          revoked: {
            type: "text",
            value: row.revokedAt ? formatDate(row.revokedAt, locale) : "—",
          },
        },
      }));
    }

    content = (
      <AdminDataTable
        columns={columns}
        rows={rows}
        labels={adminTableDictionaries[locale]}
        searchEnabled={false}
        minWidthClassName="min-w-[1180px]"
        footer={paginationFooter(
          pagination,
          view,
          filters,
          labels.previous,
          labels.next,
          labels.records,
        )}
        empty={
          <EmptyState
            title={labels.noResults}
            description={labels.noResultsDescription}
          />
        }
      />
    );
  }

  const tabLabels: Record<ReportView, string> = {
    overview: labels.overview,
    courses: labels.courses,
    learners: labels.learners,
    quizzes: labels.quizzes,
    certificates: labels.certificates,
  };

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.title}
        description={labels.description}
        actions={
          view === "overview" ? undefined : (
            <Link
              href={exportHref(view, filters)}
              className="inline-flex h-10 items-center rounded-md border border-brand/20 bg-brand-soft px-4 text-sm font-medium text-brand hover:bg-brand/10"
            >
              {labels.exportCsv}
            </Link>
          )
        }
      />

      <div className="flex flex-wrap gap-2">
        {views.map((item) => (
          <Link
            key={item}
            href={workspaceHref(item, filters)}
            className={`inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium ${
              view === item
                ? "border-brand bg-brand text-white"
                : "border-line bg-white text-content hover:bg-surface-subtle"
            }`}
          >
            {tabLabels[item]}
          </Link>
        ))}
      </div>

      <Panel className="p-4">
        <form
          action="/admin/training/reports"
          method="get"
          className="grid gap-3 lg:grid-cols-6"
        >
          <input type="hidden" name="view" value={view} />

          {session.user.accountScope === "PLATFORM" ? (
            <select
              name="companyId"
              defaultValue={filters.companyId ?? ""}
              className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content"
            >
              <option value="">{labels.allCompanies}</option>
              {options.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          ) : null}

          <select
            name="categoryId"
            defaultValue={filters.categoryId ?? ""}
            className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content"
          >
            <option value="">{labels.allCategories}</option>
            {options.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            name="courseId"
            defaultValue={filters.courseId ?? ""}
            className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content"
          >
            <option value="">{labels.allCourses}</option>
            {options.courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>

          <label className="grid gap-1 text-xs font-medium text-muted">
            {labels.dateFrom}
            <input
              type="date"
              name="dateFrom"
              defaultValue={filters.dateFrom ?? ""}
              className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content"
            />
          </label>

          <label className="grid gap-1 text-xs font-medium text-muted">
            {labels.dateTo}
            <input
              type="date"
              name="dateTo"
              defaultValue={filters.dateTo ?? ""}
              className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content"
            />
          </label>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
            >
              {labels.filter}
            </button>
            <Link
              href={`/admin/training/reports?view=${view}`}
              className="inline-flex h-10 items-center rounded-md border border-line bg-white px-3 text-sm font-medium text-muted hover:bg-surface-subtle"
            >
              {labels.clearFilters}
            </Link>
          </div>
        </form>
      </Panel>

      {content}
    </div>
  );
}
