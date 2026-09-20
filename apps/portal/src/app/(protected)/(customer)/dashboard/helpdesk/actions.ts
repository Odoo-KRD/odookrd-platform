"use server";

import {
  PERMISSIONS,
  TICKET_PRIORITIES,
  type TicketPriority,
} from "@odookrd/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { AdminDataTableActionResult } from "@/components/admin/admin-data-table";
import { ApiRequestError, apiRequest } from "@/lib/api";
import { getCustomerApiContext } from "@/lib/authorization";
import type { HelpdeskFormState } from "@/lib/helpdesk-forms";
import { helpdeskDictionaries } from "@/lib/i18n/helpdesk";
import { getLocale } from "@/lib/i18n/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ATTACHMENTS = 5;
const MAX_SUBJECT = 250;
const MAX_BODY = 10_000;

async function labels() {
  return helpdeskDictionaries[await getLocale()];
}

async function failed(error: unknown): Promise<HelpdeskFormState> {
  if (error instanceof ApiRequestError && error.status < 500) {
    return { message: error.message };
  }

  return { message: (await labels()).genericError };
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Ids from the attachment field; null when any is malformed or too many. */
function attachmentIds(formData: FormData): string[] | null {
  const ids = [
    ...new Set(
      formData
        .getAll("attachmentIds")
        .filter((value): value is string => typeof value === "string"),
    ),
  ];

  if (ids.length > MAX_ATTACHMENTS || ids.some((id) => !uuidPattern.test(id))) {
    return null;
  }

  return ids;
}

export async function createTicketAction(
  _previousState: HelpdeskFormState,
  formData: FormData,
): Promise<HelpdeskFormState> {
  const { token } = await getCustomerApiContext(PERMISSIONS.HELPDESK_READ);
  const dictionary = await labels();
  const departmentId = text(formData, "departmentId");
  const companyServiceId = text(formData, "companyServiceId");
  const priority = text(formData, "priority");
  const subject = text(formData, "subject");
  const body = text(formData, "body");
  const attachments = attachmentIds(formData);

  if (!uuidPattern.test(departmentId)) {
    return { message: dictionary.departmentRequired };
  }

  if (companyServiceId && !uuidPattern.test(companyServiceId)) {
    return { message: dictionary.genericError };
  }

  if (
    priority &&
    !(TICKET_PRIORITIES as readonly string[]).includes(priority)
  ) {
    return { message: dictionary.genericError };
  }

  if (!subject || subject.length > MAX_SUBJECT) {
    return { message: dictionary.subjectRequired };
  }

  if (!body || body.length > MAX_BODY) {
    return { message: dictionary.messageRequired };
  }

  if (attachments === null) {
    return { message: dictionary.tooManyFiles };
  }

  let ticketId: string;

  try {
    const ticket = await apiRequest<{ id: string }>("/helpdesk/tickets", {
      method: "POST",
      token,
      body: JSON.stringify({
        departmentId,
        subject,
        body,
        ...(priority ? { priority: priority as TicketPriority } : {}),
        ...(companyServiceId ? { companyServiceId } : {}),
        ...(attachments.length > 0 ? { attachmentIds: attachments } : {}),
      }),
    });
    ticketId = ticket.id;
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath("/dashboard/helpdesk");
  redirect(`/dashboard/helpdesk/${ticketId}`);
}

export async function replyToTicketAction(
  ticketId: string,
  _previousState: HelpdeskFormState,
  formData: FormData,
): Promise<HelpdeskFormState> {
  const { token } = await getCustomerApiContext(PERMISSIONS.HELPDESK_READ);
  const dictionary = await labels();
  const body = text(formData, "body");
  const attachments = attachmentIds(formData);

  if (!uuidPattern.test(ticketId)) {
    return { message: dictionary.genericError };
  }

  if (!body || body.length > MAX_BODY) {
    return { message: dictionary.messageRequired };
  }

  if (attachments === null) {
    return { message: dictionary.tooManyFiles };
  }

  try {
    await apiRequest(
      `/helpdesk/tickets/${encodeURIComponent(ticketId)}/messages`,
      {
        method: "POST",
        token,
        body: JSON.stringify({
          body,
          ...(attachments.length > 0 ? { attachmentIds: attachments } : {}),
        }),
      },
    );
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath(`/dashboard/helpdesk/${ticketId}`);
  revalidatePath("/dashboard/helpdesk");

  return { message: null, success: true, submittedAt: Date.now() };
}

/** Bound to a ticket id; the form state and data it is called with are unused. */
export async function closeTicketAction(
  ticketId: string,
): Promise<HelpdeskFormState> {
  const { token } = await getCustomerApiContext(PERMISSIONS.HELPDESK_READ);

  if (!uuidPattern.test(ticketId)) {
    return { message: (await labels()).genericError };
  }

  try {
    await apiRequest(
      `/helpdesk/tickets/${encodeURIComponent(ticketId)}/close`,
      {
        method: "POST",
        token,
      },
    );
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath(`/dashboard/helpdesk/${ticketId}`);
  revalidatePath("/dashboard/helpdesk");

  return { message: null, success: true };
}

/** Batch action of the ticket list's multi-select: close the chosen tickets. */
export async function batchCloseTicketsAction(
  formData: FormData,
): Promise<AdminDataTableActionResult> {
  const { token } = await getCustomerApiContext(PERMISSIONS.HELPDESK_READ);
  const dictionary = await labels();
  const ids = [
    ...new Set(
      formData
        .getAll("selectedIds")
        .filter((value): value is string => typeof value === "string"),
    ),
  ];

  if (
    formData.get("batchAction") !== "close" ||
    ids.length === 0 ||
    ids.length > 100 ||
    ids.some((id) => !uuidPattern.test(id))
  ) {
    return { ok: false, message: dictionary.genericError };
  }

  try {
    const result = await apiRequest<{ changed: number }>(
      "/helpdesk/tickets/batch/close",
      { method: "POST", token, body: JSON.stringify({ ids }) },
    );

    revalidatePath("/dashboard/helpdesk");

    return {
      ok: true,
      message:
        result.changed > 0
          ? dictionary.batchClosed.replace("{count}", String(result.changed))
          : dictionary.batchAlreadyClosed,
    };
  } catch (error: unknown) {
    return { ok: false, message: (await failed(error)).message };
  }
}
