import {
  PERMISSIONS,
  type PaginatedResult,
  type TrainingCategory,
} from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import { redirect } from "next/navigation";

import { TrainingCourseForm } from "@/components/training/training-forms";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { getTrainingDictionary } from "@/lib/i18n/training-server";

import { createTrainingCourseAction } from "../../actions";

export default async function NewTrainingCoursePage() {
  const [{ session, token }, { training, content }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.TRAINING_MANAGE),
    getTrainingDictionary(),
  ]);
  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  const categories = await apiRequest<PaginatedResult<TrainingCategory>>(
    "/training/categories?limit=100&offset=0",
    { token },
  );

  if (categories.items.length === 0) redirect("/admin/training/categories/new");

  return (
    <div className="grid gap-7">
      <PageHeading
        title={training.newCourse}
        description={training.description}
      />
      <Panel className="p-5 sm:p-7">
        <TrainingCourseForm
          action={createTrainingCourseAction}
          labels={training}
          content={content}
          categories={categories.items}
          cancelHref="/admin/training/courses"
        />
      </Panel>
    </div>
  );
}
