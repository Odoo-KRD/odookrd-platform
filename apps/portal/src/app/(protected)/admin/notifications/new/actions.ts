"use server";

import {
  PERMISSIONS,
  type Locale,
  type NotificationBroadcastResult,
} from "@odookrd/types";
import { revalidatePath } from "next/cache";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";

export interface NotificationBroadcastFormState {
  message: string | null;
  result: NotificationBroadcastResult | null;
}

const locales: readonly Locale[] = ["ku", "ar", "en"];
const channels = ["IN_APP", "EMAIL", "WHATSAPP"] as const;

export async function sendNotificationBroadcastAction(
  _previousState: NotificationBroadcastFormState,
  formData: FormData,
): Promise<NotificationBroadcastFormState> {
  const { token } = await getAdminApiContext(PERMISSIONS.NOTIFICATIONS_MANAGE);

  const requestId = formData.get("requestId");
  const audience = formData.get("audience");
  const companyId = formData.get("companyId");
  const localeValue = formData.get("locale");
  const title = formData.get("title");
  const body = formData.get("body");
  const actionUrl = formData.get("actionUrl");
  const selectedChannels = formData
    .getAll("channels")
    .filter(
      (value): value is (typeof channels)[number] =>
        typeof value === "string" &&
        channels.includes(value as (typeof channels)[number]),
    );

  if (
    typeof requestId !== "string" ||
    typeof audience !== "string" ||
    !["ALL_CUSTOMERS", "COMPANY"].includes(audience) ||
    typeof title !== "string" ||
    typeof body !== "string"
  ) {
    return {
      message: "Complete the required notification fields.",
      result: null,
    };
  }

  const locale =
    typeof localeValue === "string" && locales.includes(localeValue as Locale)
      ? (localeValue as Locale)
      : "ku";

  try {
    const result = await apiRequest<NotificationBroadcastResult>(
      "/notification-administration/broadcasts",
      {
        method: "POST",
        token,
        body: JSON.stringify({
          requestId,
          audience,
          ...(typeof companyId === "string" && companyId ? { companyId } : {}),
          locale,
          title: title.trim(),
          body: body.trim(),
          channels: selectedChannels,
          ...(typeof actionUrl === "string" && actionUrl.trim()
            ? { actionUrl: actionUrl.trim() }
            : {}),
        }),
      },
    );

    revalidatePath("/admin/notifications");
    revalidatePath("/admin/notifications/deliveries");
    revalidatePath("/admin/notifications/broadcasts");
    revalidatePath("/admin/notifications/broadcasts/new");

    return { message: null, result };
  } catch (error: unknown) {
    return {
      message:
        error instanceof ApiRequestError
          ? error.message
          : "The notification could not be queued.",
      result: null,
    };
  }
}
