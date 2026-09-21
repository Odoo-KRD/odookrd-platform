import { PERMISSIONS } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import { notFound, redirect } from "next/navigation";

import { DepartmentForm } from "@/components/helpdesk/admin/department-form";
import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { adminTranslations } from "@/lib/i18n/admin/translations";
import { helpdeskAdminDictionaries } from "@/lib/i18n/helpdesk-admin";
import { getLocale } from "@/lib/i18n/server";

import { updateDepartmentAction } from "../actions";
import type { AdminDepartment } from "../types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface EditDepartmentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDepartmentPage({
  params,
}: EditDepartmentPageProps) {
  const [{ session, token }, locale, { id }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.HELPDESK_MANAGE),
    getLocale(),
    params,
  ]);

  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  if (!uuidPattern.test(id)) {
    notFound();
  }

  const labels = helpdeskAdminDictionaries[locale];
  let department: AdminDepartment;

  try {
    department = await apiRequest<AdminDepartment>(
      `/helpdesk/admin/departments/${encodeURIComponent(id)}`,
      { token },
    );
  } catch (error: unknown) {
    if (error instanceof ApiRequestError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.editDepartment}
        description={department.name}
      />
      <Panel className="p-5 sm:p-7">
        <DepartmentForm
          action={updateDepartmentAction.bind(null, department.id)}
          labels={labels}
          content={adminTranslations[locale].content}
          initial={{
            slug: department.slug,
            name: department.name,
            nameTranslations: department.nameTranslations,
            description: department.description,
            descriptionTranslations: department.descriptionTranslations,
            status: department.status,
            sortOrder: department.sortOrder,
          }}
          cancelHref="/admin/helpdesk/departments"
        />
      </Panel>
    </div>
  );
}
