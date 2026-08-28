import { redirect } from "next/navigation";

export default async function LegacyNewTrainingLessonPage({
  params,
}: {
  params: Promise<{ id: string; sectionId: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/training/courses/${id}/editor`);
}
