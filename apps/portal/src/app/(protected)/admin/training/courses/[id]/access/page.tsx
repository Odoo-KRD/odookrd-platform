import {
  PERMISSIONS,
  type TrainingAccessOptions,
  type TrainingAccessSummary,
} from "@odookrd/types";
import { EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { trainingCustomerDictionaries } from "@/lib/i18n/training-customer";
import { getTrainingDictionary } from "@/lib/i18n/training-server";
import { localizeTrainingText } from "@/lib/training-display";

import {
  createCompanyAccessAction,
  createServiceAccessAction,
  createUserAccessAction,
  deleteCompanyAccessAction,
  deleteServiceAccessAction,
  deleteUserAccessAction,
  updateCompanyAccessAction,
  updateServiceAccessAction,
  updateUserAccessAction,
} from "./actions";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PlatformTrainingAccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ session, token }, { locale }, { id }, query] = await Promise.all([
    getAdminApiContext(PERMISSIONS.TRAINING_ASSIGN),
    getTrainingDictionary(),
    params,
    searchParams,
  ]);
  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  const labels = trainingCustomerDictionaries[locale];
  const selectedCompanyId =
    typeof query.companyId === "string" && uuid.test(query.companyId)
      ? query.companyId
      : "";
  const optionsQuery = selectedCompanyId
    ? `?companyId=${encodeURIComponent(selectedCompanyId)}`
    : "";

  const [summary, options] = await Promise.all([
    apiRequest<TrainingAccessSummary>(`/training/access/courses/${id}`, {
      token,
    }),
    apiRequest<TrainingAccessOptions>(
      `/training/access/courses/${id}/options${optionsQuery}`,
      { token },
    ),
  ]);
  const error =
    typeof query.error === "string" ? query.error.slice(0, 500) : null;
  const courseTitle = localizeTrainingText(
    summary.course.title,
    summary.course.titleTranslations,
    locale,
  );

  return (
    <div className="grid gap-7">
      <PageHeading
        title={`${labels.accessTitle}: ${courseTitle}`}
        description={labels.accessDescription}
        actions={
          <Link
            href={`/admin/training/courses/${id}`}
            className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium text-content hover:bg-surface-subtle"
          >
            {labels.backToCatalog}
          </Link>
        }
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Panel className="p-5 sm:p-6">
        <h2 className="text-base font-semibold text-content">
          {labels.companyAccess}
        </h2>
        <form
          action={createCompanyAccessAction.bind(null, id)}
          className="mt-5 grid gap-3 xl:grid-cols-[minmax(220px,1fr)_200px_170px_170px_auto]"
        >
          <select
            name="companyId"
            required
            className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content"
          >
            <option value="">{labels.selectCompany}</option>
            {options.companies.map((company) => (
              <option key={company.id} value={company.id}>
                {localizeTrainingText(
                  company.name,
                  company.nameTranslations,
                  locale,
                )}
              </option>
            ))}
          </select>
          <AccessMode labels={labels} />
          <DateInputs labels={labels} />
          <AddButton label={labels.addRule} />
        </form>

        <div className="mt-6 grid gap-3 border-t border-line pt-5">
          {summary.companyAccess.length === 0 ? (
            <p className="text-sm text-muted">{labels.noAssignments}</p>
          ) : (
            summary.companyAccess.map((access) => (
              <div
                key={access.id}
                className="rounded-md border border-line p-4"
              >
                <p className="mb-3 text-sm font-semibold text-content">
                  {localizeTrainingText(
                    access.company.name,
                    access.company.nameTranslations,
                    locale,
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  <form
                    action={updateCompanyAccessAction.bind(null, id, access.id)}
                    className="flex flex-1 flex-wrap gap-2"
                  >
                    <AccessMode labels={labels} value={access.mode} compact />
                    <DateInputs
                      labels={labels}
                      startsAt={access.startsAt}
                      expiresAt={access.expiresAt}
                      compact
                    />
                    <UpdateButton label={labels.update} />
                  </form>
                  <DeleteForm
                    action={deleteCompanyAccessAction.bind(null, id, access.id)}
                    label={labels.remove}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>

      <Panel className="p-5 sm:p-6">
        <h2 className="text-base font-semibold text-content">
          {labels.serviceAccess}
        </h2>
        <form
          action={createServiceAccessAction.bind(null, id)}
          className="mt-5 grid gap-3 xl:grid-cols-[minmax(220px,1fr)_200px_170px_170px_auto]"
        >
          <select
            name="serviceId"
            required
            className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content"
          >
            <option value="">{labels.selectService}</option>
            {options.services.map((service) => (
              <option key={service.id} value={service.id}>
                {localizeTrainingText(
                  service.name,
                  service.nameTranslations,
                  locale,
                )}
              </option>
            ))}
          </select>
          <AccessMode labels={labels} />
          <DateInputs labels={labels} />
          <AddButton label={labels.addRule} />
        </form>

        <div className="mt-6 grid gap-3 border-t border-line pt-5">
          {summary.serviceAccess.length === 0 ? (
            <p className="text-sm text-muted">{labels.noAssignments}</p>
          ) : (
            summary.serviceAccess.map((access) => (
              <div
                key={access.id}
                className="rounded-md border border-line p-4"
              >
                <p className="mb-3 text-sm font-semibold text-content">
                  {localizeTrainingText(
                    access.service.name,
                    access.service.nameTranslations,
                    locale,
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  <form
                    action={updateServiceAccessAction.bind(null, id, access.id)}
                    className="flex flex-1 flex-wrap gap-2"
                  >
                    <AccessMode labels={labels} value={access.mode} compact />
                    <DateInputs
                      labels={labels}
                      startsAt={access.startsAt}
                      expiresAt={access.expiresAt}
                      compact
                    />
                    <UpdateButton label={labels.update} />
                  </form>
                  <DeleteForm
                    action={deleteServiceAccessAction.bind(null, id, access.id)}
                    label={labels.remove}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>

      <Panel className="p-5 sm:p-6">
        <h2 className="text-base font-semibold text-content">
          {labels.userAccess}
        </h2>

        <form method="get" className="mt-5 flex flex-wrap gap-3">
          <select
            name="companyId"
            defaultValue={selectedCompanyId}
            className="h-10 min-w-[260px] rounded-md border border-line bg-white px-3 text-sm text-content"
          >
            <option value="">{labels.chooseCompanyForLearner}</option>
            {options.companies.map((company) => (
              <option key={company.id} value={company.id}>
                {localizeTrainingText(
                  company.name,
                  company.nameTranslations,
                  locale,
                )}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-10 rounded-md border border-line px-4 text-sm font-medium text-content hover:bg-surface-subtle"
          >
            {labels.apply}
          </button>
        </form>

        {selectedCompanyId ? (
          <form
            action={createUserAccessAction.bind(null, id, selectedCompanyId)}
            className="mt-4 grid gap-3 xl:grid-cols-[minmax(260px,1fr)_180px_180px_auto]"
          >
            <select
              name="userId"
              required
              className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content"
            >
              <option value="">{labels.selectLearner}</option>
              {options.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
            <DateInputs labels={labels} />
            <AddButton label={labels.addRule} />
          </form>
        ) : null}

        <div className="mt-6 grid gap-3 border-t border-line pt-5">
          {summary.userAccess.length === 0 ? (
            <EmptyState
              title={labels.noAssignments}
              description={labels.userAccess}
            />
          ) : (
            summary.userAccess.map((access) => (
              <div
                key={access.id}
                className="rounded-md border border-line p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-content">
                    {access.user.email}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {access.source === "PLATFORM"
                      ? labels.platformSource
                      : labels.companyAdminSource}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <form
                    action={updateUserAccessAction.bind(null, id, access.id)}
                    className="flex flex-1 flex-wrap gap-2"
                  >
                    <DateInputs
                      labels={labels}
                      startsAt={access.startsAt}
                      expiresAt={access.expiresAt}
                      compact
                    />
                    <UpdateButton label={labels.update} />
                  </form>
                  <DeleteForm
                    action={deleteUserAccessAction.bind(null, id, access.id)}
                    label={labels.remove}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}

function AccessMode({
  labels,
  value = "ALL_USERS",
  compact = false,
}: {
  labels: typeof trainingCustomerDictionaries.en;
  value?: "ALL_USERS" | "ASSIGNED_USERS";
  compact?: boolean;
}) {
  return (
    <select
      name="mode"
      defaultValue={value}
      className={`${compact ? "h-9 text-xs" : "h-10 text-sm"} rounded-md border border-line bg-white px-3 text-content`}
    >
      <option value="ALL_USERS">{labels.allUsers}</option>
      <option value="ASSIGNED_USERS">{labels.assignedUsers}</option>
    </select>
  );
}

function DateInputs({
  labels,
  startsAt,
  expiresAt,
  compact = false,
}: {
  labels: typeof trainingCustomerDictionaries.en;
  startsAt?: string | null;
  expiresAt?: string | null;
  compact?: boolean;
}) {
  const className = `${compact ? "h-9 text-xs" : "h-10 text-sm"} rounded-md border border-line bg-white px-3 text-content`;
  return (
    <>
      <input
        type="date"
        name="startsAt"
        defaultValue={startsAt?.slice(0, 10) ?? ""}
        aria-label={labels.startsAt}
        className={className}
      />
      <input
        type="date"
        name="expiresAt"
        defaultValue={expiresAt?.slice(0, 10) ?? ""}
        aria-label={labels.expiresAt}
        className={className}
      />
    </>
  );
}

function AddButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="h-10 rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
    >
      {label}
    </button>
  );
}

function UpdateButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="h-9 rounded-md border border-line px-3 text-xs font-medium text-content hover:bg-surface-subtle"
    >
      {label}
    </button>
  );
}

function DeleteForm({
  action,
  label,
}: {
  action: (formData: FormData) => void | Promise<void>;
  label: string;
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="h-9 rounded-md border border-red-200 px-3 text-xs font-medium text-red-700 hover:bg-red-50"
      >
        {label}
      </button>
    </form>
  );
}
