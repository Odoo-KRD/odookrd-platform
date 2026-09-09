import { PERMISSIONS, type TrainingCategory } from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { TrainingCategoryForm } from "@/components/training/training-forms";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { getTrainingDictionary } from "@/lib/i18n/training/server";

import { updateTrainingCategoryAction } from "../../actions";

export default async function TrainingCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ session, token }, { training, content }, { id }] = await Promise.all(
    [
      getAdminApiContext(PERMISSIONS.TRAINING_MANAGE),
      getTrainingDictionary(),
      params,
    ],
  );
  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  const category = await apiRequest<TrainingCategory>(
    `/training/categories/${encodeURIComponent(id)}`,
    { token },
  );

  return (
    <div className="grid gap-7">
      <PageHeading
        title={category.name}
        description={training.editCategory}
        actions={
          <Link
            href="/admin/training/categories"
            className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium text-content hover:bg-surface-subtle"
          >
            {training.back}
          </Link>
        }
      />
      <Panel className="p-5 sm:p-7">
        <TrainingCategoryForm
          action={updateTrainingCategoryAction.bind(null, id)}
          labels={training}
          content={content}
          initial={category}
          cancelHref="/admin/training/categories"
        />
      </Panel>
    </div>
  );
}
