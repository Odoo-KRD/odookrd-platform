import { redirect } from "next/navigation";

export default function NotificationsIndexPage() {
  redirect("/admin/notifications/deliveries");
}
