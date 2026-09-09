import {
  PERMISSIONS,
  type TrainingAccessOptions,
  type TrainingAccessSummary,
  type TrainingManageableCourse,
} from "@odookrd/types";
import { EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";
import { trainingCustomerDictionaries } from "@/lib/i18n/training/customer";
import { getTrainingDictionary } from "@/lib/i18n/training/server";
import { localizeTrainingText } from "@/lib/training-display";

import {
  assignCompanyLearnerAction,
  removeCompanyLearnerAction,
  updateCompanyLearnerAction,
} from "./actions";

export default async function CompanyTrainingLearnersPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ token }, { locale }, { slug }, query] = await Promise.all([
    getCustomerApiContext(PERMISSIONS.TRAINING_ASSIGN),
    getTrainingDictionary(),
    params,
    searchParams,
  ]);
  const labels = trainingCustomerDictionaries[locale];

  const manageable = await apiRequest<TrainingManageableCourse[]>(
    "/training/access/company-courses",
    { token },
  );
  const course = manageable.find((item) => item.slug === slug);
  if (!course) notFound();

  let summary: TrainingAccessSummary;
  let options: TrainingAccessOptions;
  try {
    [summary, options] = await Promise.all([
      apiRequest<TrainingAccessSummary>(
        `/training/access/courses/${course.id}`,
        { token },
      ),
      apiRequest<TrainingAccessOptions>(
        `/training/access/courses/${course.id}/options`,
        { token },
      ),
    ]);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }

  const error =
    typeof query.error === "string" ? query.error.slice(0, 500) : null;
  const title = localizeTrainingText(
    summary.course.title,
    summary.course.titleTranslations,
    locale,
  );
  const assignedUserIds = new Set(
    summary.userAccess.map((access) => access.userId),
  );
  const availableUsers = options.users.filter(
    (user) => !assignedUserIds.has(user.id),
  );

  return (
    <div className="grid gap-7">
      <PageHeading
        title={`${labels.manageLearners}: ${title}`}
        description={labels.manageCoursesDescription}
        actions={
          <Link
            href="/dashboard/training/manage"
            className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium text-content hover:bg-surface-subtle"
          >
            {labels.manageTraining}
          </Link>
        }
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Panel className="p-5 sm:p-6">
        <p className="text-sm text-content">
          {summary.eligibility?.hasAllUsers
            ? labels.allUsersAlready
            : labels.assignmentRequired}
        </p>
      </Panel>

      {summary.eligibility?.requiresAssignment ? (
        <Panel className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-content">
            {labels.addRule}
          </h2>
          <form
            action={assignCompanyLearnerAction.bind(
              null,
              course.id,
              course.slug,
            )}
            className="mt-5 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto]"
          >
            <select
              name="userId"
              required
              className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content"
            >
              <option value="">{labels.selectLearner}</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="startsAt"
              aria-label={labels.startsAt}
              className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content"
            />
            <input
              type="date"
              name="expiresAt"
              aria-label={labels.expiresAt}
              className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content"
            />
            <button
              type="submit"
              className="h-10 rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
            >
              {labels.addRule}
            </button>
          </form>
        </Panel>
      ) : null}

      <section className="grid gap-4">
        <h2 className="text-base font-semibold text-content">
          {labels.userAccess}
        </h2>

        {summary.userAccess.length === 0 ? (
          <Panel className="p-6">
            <EmptyState
              title={labels.noAssignments}
              description={
                summary.eligibility?.hasAllUsers
                  ? labels.allUsersAlready
                  : labels.assignmentRequired
              }
            />
          </Panel>
        ) : (
          summary.userAccess.map((access) => {
            const platformManaged = access.source === "PLATFORM";
            return (
              <Panel key={access.id} className="p-5">
                <div>
                  <p className="text-sm font-semibold text-content">
                    {access.user.email}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {platformManaged
                      ? labels.platformSource
                      : labels.companyAdminSource}
                  </p>
                </div>

                {platformManaged ? (
                  <div className="mt-4 grid gap-2 text-xs text-muted sm:grid-cols-2">
                    <span>
                      {labels.startsAt}:{" "}
                      {access.startsAt?.slice(0, 10) ?? labels.noStart}
                    </span>
                    <span>
                      {labels.expiresAt}:{" "}
                      {access.expiresAt?.slice(0, 10) ?? labels.noExpiry}
                    </span>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <form
                      action={updateCompanyLearnerAction.bind(
                        null,
                        course.id,
                        course.slug,
                        access.id,
                      )}
                      className="flex flex-1 flex-wrap gap-2"
                    >
                      <input
                        type="date"
                        name="startsAt"
                        defaultValue={access.startsAt?.slice(0, 10) ?? ""}
                        aria-label={labels.startsAt}
                        className="h-9 rounded-md border border-line bg-white px-3 text-xs text-content"
                      />
                      <input
                        type="date"
                        name="expiresAt"
                        defaultValue={access.expiresAt?.slice(0, 10) ?? ""}
                        aria-label={labels.expiresAt}
                        className="h-9 rounded-md border border-line bg-white px-3 text-xs text-content"
                      />
                      <button
                        type="submit"
                        className="h-9 rounded-md border border-line px-3 text-xs font-medium text-content hover:bg-surface-subtle"
                      >
                        {labels.update}
                      </button>
                    </form>
                    <form
                      action={removeCompanyLearnerAction.bind(
                        null,
                        course.id,
                        course.slug,
                        access.id,
                      )}
                    >
                      <button
                        type="submit"
                        className="h-9 rounded-md border border-red-200 px-3 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        {labels.remove}
                      </button>
                    </form>
                  </div>
                )}
              </Panel>
            );
          })
        )}
      </section>
    </div>
  );
}
