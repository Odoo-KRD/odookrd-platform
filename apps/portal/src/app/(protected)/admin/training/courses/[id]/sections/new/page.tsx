import { redirect } from "next/navigation";

export default async function LegacyNewTrainingSectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/training/courses/${id}/editor`);
}
