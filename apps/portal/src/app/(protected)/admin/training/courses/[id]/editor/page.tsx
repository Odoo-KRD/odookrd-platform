import {
  PERMISSIONS,
  type TrainingCourse,
  type TrainingCourseStructure,
} from "@odookrd/types";
import { PageHeading } from "@odookrd/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CourseStructureEditor } from "@/components/training/course-structure-editor";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { getTrainingDictionary } from "@/lib/i18n/training-server";

export default async function TrainingCourseEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ session, token }, { locale, training, content }, { id }] =
    await Promise.all([
      getAdminApiContext(PERMISSIONS.TRAINING_MANAGE),
      getTrainingDictionary(),
      params,
    ]);

  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  const [course, structure] = await Promise.all([
    apiRequest<TrainingCourse>(`/training/courses/${encodeURIComponent(id)}`, {
      token,
    }),
    apiRequest<TrainingCourseStructure>(
      `/training/courses/${encodeURIComponent(id)}/structure`,
      { token },
    ),
  ]);

  return (
    <div className="grid gap-7">
      <PageHeading
        title={`${course.title} — ${training.courseEditor}`}
        description={training.editor.professionalHint}
        actions={
          <>
            <Link
              href={`/admin/training/courses/${id}`}
              className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-medium text-content hover:bg-surface-subtle"
            >
              {training.editMetadata}
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

      <CourseStructureEditor
        courseId={id}
        initialStructure={structure}
        locale={locale}
        training={training}
        content={content}
      />
    </div>
  );
}
