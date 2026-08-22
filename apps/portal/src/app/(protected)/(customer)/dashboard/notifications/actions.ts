"use server";

import { PERMISSIONS } from "@odookrd/types";
import { revalidatePath } from "next/cache";

import { apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function markNotificationReadAction(
  formData: FormData,
): Promise<void> {
  const recipientId = String(formData.get("recipientId") ?? "").trim();
  if (!uuidPattern.test(recipientId)) {
    return;
  }

  const { token } = await getCustomerApiContext(PERMISSIONS.NOTIFICATIONS_READ);
  await apiRequest(`/notifications/${encodeURIComponent(recipientId)}/read`, {
    method: "PATCH",
    token,
  });
  revalidatePath("/dashboard/notifications");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const { token } = await getCustomerApiContext(PERMISSIONS.NOTIFICATIONS_READ);
  await apiRequest("/notifications/read-all", {
    method: "PATCH",
    token,
  });
  revalidatePath("/dashboard/notifications");
}
