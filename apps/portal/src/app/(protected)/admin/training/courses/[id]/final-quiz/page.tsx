import { PERMISSIONS, type TrainingCourse } from "@odookrd/types";
import { NavigationArrowIcon, PageHeading } from "@odookrd/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { TrainingQuizBuilder } from "@/components/training/training-quiz-builder";
import { apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { getTrainingDictionary } from "@/lib/i18n/training/server";
import { trainingQuizDictionaries } from "@/lib/i18n/training/quiz";
import { localizeTrainingText } from "@/lib/training-display";

export default async function TrainingCourseFinalQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ session, token }, { locale, content }, { id }] = await Promise.all([
    getAdminApiContext(PERMISSIONS.TRAINING_MANAGE),
    getTrainingDictionary(),
    params,
  ]);
  if (session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  const course = await apiRequest<TrainingCourse>(
    `/training/courses/${encodeURIComponent(id)}`,
    { token },
  );
  const labels = trainingQuizDictionaries[locale];
  const courseTitle = localizeTrainingText(
    course.title,
    course.titleTranslations,
    locale,
  );

  return (
    <div className="grid gap-7">
      <PageHeading
        title={`${courseTitle} — ${labels.finalQuiz}`}
        description={labels.finalQuizDescription}
        actions={
          <Link
            href={`/admin/training/courses/${id}/editor`}
            className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-medium text-content hover:bg-surface-subtle"
          >
            <NavigationArrowIcon
              direction={locale === "en" ? "left" : "right"}
              className="me-2 size-4"
            />
            {labels.backToCourseEditor}
          </Link>
        }
      />
      <TrainingQuizBuilder
        target={{ kind: "final", courseId: id }}
        locale={locale}
        contentDictionary={content}
      />
    </div>
  );
}
