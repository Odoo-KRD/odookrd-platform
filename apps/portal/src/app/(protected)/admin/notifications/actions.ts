"use server";

import {
  PERMISSIONS,
  type Locale,
  type NotificationProviderTestResult,
} from "@odookrd/types";
import { revalidatePath } from "next/cache";

import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";

export interface TestEmailState {
  message: string | null;
  result: NotificationProviderTestResult | null;
}

const locales: readonly Locale[] = ["ku", "ar", "en"];

export async function sendNotificationTestEmailAction(
  _previousState: TestEmailState,
  formData: FormData,
): Promise<TestEmailState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.NOTIFICATIONS_MANAGE,
  );

  if (session.user.accountScope !== "PLATFORM") {
    return {
      message: "Platform notification-provider administration is required.",
      result: null,
    };
  }

  const recipient = formData.get("recipient");
  const localeValue = formData.get("locale");
  const locale =
    typeof localeValue === "string" && locales.includes(localeValue as Locale)
      ? (localeValue as Locale)
      : "ku";

  if (typeof recipient !== "string" || recipient.trim().length === 0) {
    return { message: "Enter a recipient email address.", result: null };
  }

  try {
    const result = await apiRequest<NotificationProviderTestResult>(
      "/notification-administration/test-email",
      {
        method: "POST",
        token,
        body: JSON.stringify({
          recipient: recipient.trim(),
          locale,
        }),
      },
    );

    revalidatePath("/admin/notifications");
    return { message: null, result };
  } catch (error: unknown) {
    return {
      message:
        error instanceof ApiRequestError
          ? error.message
          : "The test email could not be sent.",
      result: null,
    };
  }
}

/**
 * Notification types that can be tested with an approved template. Keep in
 * step with WHATSAPP_TEST_TEMPLATES in the providers page.
 */
const TESTABLE_TEMPLATES = new Set([
  "user.invitation",
  "helpdesk.ticket.replied",
  "helpdesk.ticket.resolved",
  "subscription.reminder",
  "admin.broadcast",
  "admin.helpdesk.ticket.created",
  "admin.helpdesk.customer.replied",
  "admin.renewal.requested",
  "admin.invitation.accepted",
  "admin.course.completed",
  "admin.certificate.issued",
  "admin.knowledge.feedback",
]);

export async function sendNotificationTestWhatsAppAction(
  _previousState: TestEmailState,
  formData: FormData,
): Promise<TestEmailState> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.NOTIFICATIONS_MANAGE,
  );

  if (session.user.accountScope !== "PLATFORM") {
    return {
      message: "Platform notification-provider administration is required.",
      result: null,
    };
  }

  const destination = formData.get("destination");
  const templateValue = formData.get("templateKey");
  const localeValue = formData.get("locale");
  const locale =
    typeof localeValue === "string" && locales.includes(localeValue as Locale)
      ? (localeValue as Locale)
      : "ku";
  const templateKey =
    typeof templateValue === "string" && TESTABLE_TEMPLATES.has(templateValue)
      ? templateValue
      : undefined;

  if (
    typeof destination !== "string" ||
    !/^\+?[0-9 ()-]{8,24}$/.test(destination.trim())
  ) {
    return {
      message: "Enter the WhatsApp number in international format.",
      result: null,
    };
  }

  try {
    const result = await apiRequest<NotificationProviderTestResult>(
      "/notification-administration/test-whatsapp",
      {
        method: "POST",
        token,
        body: JSON.stringify({
          destination: destination.trim(),
          locale,
          ...(templateKey ? { templateKey } : {}),
        }),
      },
    );

    revalidatePath("/admin/notifications");
    return { message: null, result };
  } catch (error: unknown) {
    return {
      message:
        error instanceof ApiRequestError
          ? error.message
          : "The test message could not be sent.",
      result: null,
    };
  }
}
