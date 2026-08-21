import { PERMISSIONS, type CompanyServiceAssignment } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ServiceAssignmentForm } from "@/components/services/service-assignment-form";
import { AssignmentStatusBadge } from "@/components/services/service-status-badge";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { formatDate } from "@/lib/format";
import { getServicesDictionary } from "@/lib/i18n/services-server";

import { updateAssignmentAction } from "../../actions";

interface AssignmentDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AssignmentDetailsPage({
  params,
}: AssignmentDetailsPageProps) {
  const [{ session, token }, { locale, services }, { id }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.SERVICES_MANAGE),
    getServicesDictionary(),
    params,
  ]);

  if (session.user.accountScope !== "PLATFORM") {
    redirect("/dashboard");
  }

  const assignment = await apiRequest<CompanyServiceAssignment>(
    `/service-assignments/${encodeURIComponent(id)}`,
    { token },
  );

  return (
    <div className="grid gap-7">
      <PageHeading
        title={assignment.displayName ?? assignment.service.name}
        description={services.editAssignment}
        actions={
          <Link
            href="/admin/services"
            className="inline-flex h-10 items-center rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {services.back}
          </Link>
        }
      />

      <Panel className="p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {services.company}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {assignment.company.name}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              {services.status}
            </p>
            <div className="mt-2">
              <AssignmentStatusBadge
                status={assignment.status}
                labels={services}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              {services.startsAt}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {assignment.startsAt
                ? formatDate(assignment.startsAt, locale)
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              {services.expiresAt}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {assignment.expiresAt
                ? formatDate(assignment.expiresAt, locale)
                : "—"}
            </p>
          </div>
        </div>
      </Panel>

      <Panel className="p-6 sm:p-8">
        <h2 className="mb-6 text-base font-semibold text-slate-900">
          {services.editAssignment}
        </h2>
        <ServiceAssignmentForm
          action={updateAssignmentAction.bind(null, assignment.id)}
          labels={services}
          initial={assignment}
          cancelHref="/admin/services"
        />
      </Panel>
    </div>
  );
}
