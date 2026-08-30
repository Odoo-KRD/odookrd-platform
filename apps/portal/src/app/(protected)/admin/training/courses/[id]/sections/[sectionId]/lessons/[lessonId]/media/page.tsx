import { redirect } from "next/navigation";

export default async function LegacyTrainingLessonMediaPage({
  params,
}: {
  params: Promise<{ id: string; sectionId: string; lessonId: string }>;
}) {
  const { id, sectionId, lessonId } = await params;
  redirect(
    `/admin/training/courses/${encodeURIComponent(id)}/sections/${encodeURIComponent(sectionId)}/lessons/${encodeURIComponent(lessonId)}/editor?tab=content`,
  );
}
