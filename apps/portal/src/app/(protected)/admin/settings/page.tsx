import {
  PERMISSIONS,
  type Company,
  type PaginatedResult,
  type SettingsCollection,
} from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";

import { SettingsForm } from "@/components/settings/settings-form";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext, hasPermission } from "@/lib/authorization";
import { settingsNavigationDictionaries } from "@/lib/i18n/settings-navigation";
import { getSettingsDictionary } from "@/lib/i18n/settings-server";

import { updateSettingsAction } from "./actions";

interface SettingsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const [{ session, token }, { locale, settings: labels }, query] =
    await Promise.all([
      getAdminApiContext(PERMISSIONS.SETTINGS_READ),
      getSettingsDictionary(),
      searchParams,
    ]);

  const isPlatform = session.user.accountScope === "PLATFORM";
  const requestedCompanyId =
    typeof query.companyId === "string" && uuidPattern.test(query.companyId)
      ? query.companyId
      : null;
  const selectedCompanyId = isPlatform
    ? requestedCompanyId
    : session.user.companyId;
  const canReadCompanies =
    isPlatform && hasPermission(session, PERMISSIONS.COMPANIES_READ);

  const companiesResult = canReadCompanies
    ? await apiRequest<PaginatedResult<Company>>(
        "/companies?limit=100&offset=0&status=ACTIVE",
        { token },
      )
    : null;

  const companies = companiesResult?.items ?? [];
  const selectedCompany = selectedCompanyId
    ? companies.find((company) => company.id === selectedCompanyId)
    : null;

  const collection = selectedCompanyId
    ? await apiRequest<SettingsCollection>(
        `/settings/company/${encodeURIComponent(selectedCompanyId)}`,
        { token },
      )
    : await apiRequest<SettingsCollection>("/settings/platform", { token });

  const canManage = hasPermission(session, PERMISSIONS.SETTINGS_MANAGE);
  const title = selectedCompanyId
    ? `${labels.companyScope}${selectedCompany ? ` — ${selectedCompany.name}` : ""}`
    : labels.platformScope;

  return (
    <div className="grid gap-7">
      <PageHeading title={labels.title} description={labels.description} />

      {canReadCompanies ? (
        <Panel className="p-5">
          <form method="get" className="grid gap-2 sm:max-w-lg">
            <label
              htmlFor="settings-company"
              className="text-sm font-medium text-content"
            >
              {labels.selectScope}
            </label>
            <select
              id="settings-company"
              name="companyId"
              defaultValue={selectedCompanyId ?? ""}
              className="h-11 rounded-md border border-line bg-white px-3 text-sm text-content"
            >
              <option value="">{labels.platformDefaults}</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="mt-1 w-fit text-sm font-medium text-brand hover:text-brand-hover"
            >
              {labels.selectScope}
            </button>
          </form>
        </Panel>
      ) : null}

      <Panel className="p-5 sm:p-7">
        <div className="mb-7 border-b border-line pb-5">
          <h2 className="text-lg font-semibold text-content">{title}</h2>
          <p className="mt-1 text-sm text-muted">
            {selectedCompanyId
              ? labels.companyDescription
              : labels.platformDescription}
          </p>
        </div>

        <SettingsForm
          key={`${collection.scope}:${collection.companyId ?? "platform"}`}
          action={updateSettingsAction}
          settings={collection.settings}
          scope={collection.scope}
          companyId={collection.companyId}
          labels={labels}
          navigationLabels={settingsNavigationDictionaries[locale]}
          canManage={canManage}
          hideRestrictedTrainingTabs={!isPlatform}
        />
      </Panel>
    </div>
  );
}
