import {
  PERMISSIONS,
  type PaginatedResult,
  type TrainingCategory,
  type TrainingCourse,
} from "@odookrd/types";
import { PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { TrainingCourseForm } from "@/components/training/training-forms";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { getTrainingDictionary } from "@/lib/i18n/training-server";

import { updateTrainingCourseAction } from "../../actions";

export default async function TrainingCoursePage({
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

  const [course, categories] = await Promise.all([
    apiRequest<TrainingCourse>(`/training/courses/${encodeURIComponent(id)}`, {
      token,
    }),
    apiRequest<PaginatedResult<TrainingCategory>>(
      "/training/categories?limit=100&offset=0",
      { token },
    ),
  ]);

  return (
    <div className="grid gap-7">
      <PageHeading
        title={course.title}
        description={training.editCourse}
        actions={
          <>
            <Link
              href={`/admin/training/courses/${id}/editor`}
              className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
            >
              {training.courseEditor}
            </Link>
            <Link
              href="/admin/training/courses"
              className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium text-content hover:bg-surface-subtle"
            >
              {training.back}
            </Link>
          </>
        }
      />

      <Panel className="p-5 sm:p-7">
        <TrainingCourseForm
          action={updateTrainingCourseAction.bind(null, id)}
          labels={training}
          content={content}
          categories={categories.items}
          initial={course}
          cancelHref="/admin/training/courses"
        />
      </Panel>
    </div>
  );
}
