import { redirect } from "next/navigation";

export default async function LegacyTrainingLessonPage({
  params,
}: {
  params: Promise<{ id: string; sectionId: string; lessonId: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/training/courses/${id}/editor`);
}
