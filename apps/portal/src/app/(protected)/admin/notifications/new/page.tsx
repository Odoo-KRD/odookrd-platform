import { redirect } from "next/navigation";

export default function LegacyNotificationComposerPage() {
  redirect("/admin/notifications/broadcasts/new");
}
