import { PERMISSIONS } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import { redirect } from "next/navigation";

import { DepartmentForm } from "@/components/helpdesk/admin/department-form";
import { getAdminApiContext } from "@/lib/authorization";
import { adminTranslations } from "@/lib/i18n/admin/translations";
import { helpdeskAdminDictionaries } from "@/lib/i18n/helpdesk-admin";
import { getLocale } from "@/lib/i18n/server";

import { createDepartmentAction } from "../actions";

export default async function NewDepartmentPage() {
  const [{ session }, locale] = await Promise.all([
    getAdminApiContext(PERMISSIONS.HELPDESK_MANAGE),
    getLocale(),
  ]);

  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  const labels = helpdeskAdminDictionaries[locale];

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.newDepartment}
        description={labels.departmentsDescription}
      />
      <Panel className="p-5 sm:p-7">
        <DepartmentForm
          action={createDepartmentAction}
          labels={labels}
          content={adminTranslations[locale].content}
          cancelHref="/admin/helpdesk/departments"
        />
      </Panel>
    </div>
  );
}
