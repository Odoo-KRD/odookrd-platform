import { PERMISSIONS, type TrainingManageableCourse } from "@odookrd/types";
import { EmptyState, PageHeading, Panel } from "@odookrd/ui";
import Link from "next/link";

import { apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";
import { trainingCustomerDictionaries } from "@/lib/i18n/training-customer";
import { getTrainingDictionary } from "@/lib/i18n/training-server";
import { localizeTrainingText } from "@/lib/training-display";

export default async function CustomerTrainingManagementPage() {
  const [{ token }, { locale }] = await Promise.all([
    getCustomerApiContext(PERMISSIONS.TRAINING_ASSIGN),
    getTrainingDictionary(),
  ]);
  const labels = trainingCustomerDictionaries[locale];
  const courses = await apiRequest<TrainingManageableCourse[]>(
    "/training/access/company-courses",
    { token },
  );

  return (
    <div className="grid gap-7">
      <PageHeading
        title={labels.manageCoursesTitle}
        description={labels.manageCoursesDescription}
        actions={
          <Link
            href="/dashboard/training"
            className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm font-medium text-content hover:bg-surface-subtle"
          >
            {labels.backToCatalog}
          </Link>
        }
      />

      {courses.length === 0 ? (
        <Panel className="p-6 sm:p-8">
          <EmptyState
            title={labels.noManageableCourses}
            description={labels.manageCoursesDescription}
          />
        </Panel>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Panel key={course.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-content">
                    {localizeTrainingText(
                      course.title,
                      course.titleTranslations,
                      locale,
                    )}
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    {course.hasAllUsers
                      ? labels.allUsersAlready
                      : labels.assignmentRequired}
                  </p>
                </div>
                <Link
                  href={`/dashboard/training/${encodeURIComponent(course.slug)}/learners`}
                  className="inline-flex h-9 items-center rounded-md bg-brand px-3 text-sm font-medium text-white hover:bg-brand-hover"
                >
                  {labels.manageLearners}
                </Link>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
