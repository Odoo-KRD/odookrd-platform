import { PERMISSIONS, type TrainingLessonEditorState } from "@odookrd/types";
import { NavigationArrowIcon, PageHeading } from "@odookrd/ui";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { TrainingLessonEditor } from "@/components/training/training-lesson-editor";
import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import { getTrainingDictionary } from "@/lib/i18n/training/server";
import { trainingLessonEditorDictionaries } from "@/lib/i18n/training/lesson-editor";
import { localizeTrainingText } from "@/lib/training-display";

type EditorTab = "general" | "content" | "resources" | "review";

function normalizeTab(value: string | string[] | undefined): EditorTab {
  const tab = Array.isArray(value) ? value[0] : value;
  return tab === "content" || tab === "resources" || tab === "review"
    ? tab
    : "general";
}

export default async function TrainingLessonEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; sectionId: string; lessonId: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const [context, dictionary, route, query] = await Promise.all([
    getAdminApiContext(PERMISSIONS.TRAINING_MANAGE),
    getTrainingDictionary(),
    params,
    searchParams,
  ]);
  if (context.session.user.accountScope !== "PLATFORM") redirect("/dashboard");

  const { id, sectionId, lessonId } = route;
  let editor: TrainingLessonEditorState;
  try {
    editor = await apiRequest<TrainingLessonEditorState>(
      `/training/courses/${encodeURIComponent(id)}/sections/${encodeURIComponent(sectionId)}/lessons/${encodeURIComponent(lessonId)}/editor`,
      { token: context.token },
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }

  const labels = trainingLessonEditorDictionaries[dictionary.locale];
  const title = localizeTrainingText(
    editor.lesson.title,
    editor.lesson.titleTranslations,
    dictionary.locale,
  );

  return (
    <div className="grid gap-7">
      <PageHeading
        title={`${title} — ${labels.title}`}
        description={labels.subtitle}
        actions={
          <Link
            href={`/admin/training/courses/${encodeURIComponent(id)}/editor`}
            className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-medium text-content hover:bg-surface-subtle"
          >
            <NavigationArrowIcon
              direction={dictionary.locale === "en" ? "left" : "right"}
              className="me-2 size-4"
            />
            {labels.backToCourse}
          </Link>
        }
      />
      <TrainingLessonEditor
        key={lessonId}
        courseId={id}
        sectionId={sectionId}
        lessonId={lessonId}
        initialState={editor}
        initialTab={normalizeTab(query.tab)}
        labels={labels}
        training={dictionary.training}
        contentDictionary={dictionary.content}
      />
    </div>
  );
}
