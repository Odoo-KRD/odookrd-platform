import { PERMISSIONS } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import { redirect } from "next/navigation";

import { TrainingCategoryForm } from "@/components/training/training-forms";
import { getAdminApiContext } from "@/lib/authorization";
import { getTrainingDictionary } from "@/lib/i18n/training-server";

import { createTrainingCategoryAction } from "../../actions";

export default async function NewTrainingCategoryPage() {
  const [{ session }, { training, content }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.TRAINING_MANAGE),
    getTrainingDictionary(),
  ]);
  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  return (
    <div className="grid gap-7">
      <PageHeading
        title={training.newCategory}
        description={training.description}
      />
      <Panel className="p-5 sm:p-7">
        <TrainingCategoryForm
          action={createTrainingCategoryAction}
          labels={training}
          content={content}
          cancelHref="/admin/training/categories"
        />
      </Panel>
    </div>
  );
}
