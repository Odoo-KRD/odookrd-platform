"use server";

import {
  PERMISSIONS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketStatus,
} from "@odookrd/types";
import { revalidatePath } from "next/cache";

import type { AdminDataTableActionResult } from "@/components/admin/admin-data-table";
import { ApiRequestError, apiRequest } from "@/lib/api";
import { getAdminApiContext } from "@/lib/authorization";
import type { HelpdeskFormState } from "@/lib/helpdesk-forms";
import { helpdeskAdminDictionaries } from "@/lib/i18n/helpdesk-admin";
import { getLocale } from "@/lib/i18n/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY = 10_000;
const MAX_ATTACHMENTS = 5;

async function labels() {
  return helpdeskAdminDictionaries[await getLocale()];
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

function selectedIds(formData: FormData): string[] {
  return [
    ...new Set(
      formData
        .getAll("selectedIds")
        .filter((value): value is string => typeof value === "string"),
    ),
  ];
}

function isStatus(value: string): value is TicketStatus {
  return (TICKET_STATUSES as readonly string[]).includes(value);
}

function isPriority(value: string): value is TicketPriority {
  return (TICKET_PRIORITIES as readonly string[]).includes(value);
}

/** Status, priority and assignee from the triage panel, in one request. */
export async function updateTicketAction(
  ticketId: string,
  _previousState: HelpdeskFormState,
  formData: FormData,
): Promise<HelpdeskFormState> {
  const { token } = await getAdminApiContext(PERMISSIONS.HELPDESK_MANAGE);
  const dictionary = await labels();
  const status = text(formData, "status");
  const priority = text(formData, "priority");
  const assignee = text(formData, "assigneeUserId");
  const hasAssignee = formData.has("assigneeUserId");

  if (
    !uuidPattern.test(ticketId) ||
    !isStatus(status) ||
    !isPriority(priority) ||
    (assignee !== "" && !uuidPattern.test(assignee))
  ) {
    return { message: dictionary.genericError };
  }

  try {
    await apiRequest(
      `/helpdesk/admin/tickets/${encodeURIComponent(ticketId)}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify({ status, priority }),
      },
    );

    // Assignment is a separate endpoint because it needs helpdesk.assign.
    if (hasAssignee) {
      await apiRequest(
        `/helpdesk/admin/tickets/${encodeURIComponent(ticketId)}/assign`,
        {
          method: "POST",
          token,
          body: JSON.stringify({ assigneeUserId: assignee || null }),
        },
      );
    }
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath(`/admin/helpdesk/${ticketId}`);
  revalidatePath("/admin/helpdesk");

  return { message: dictionary.saved, success: true };
}

/** A customer-visible reply or an internal note, decided by the composer tab. */
export async function addStaffMessageAction(
  ticketId: string,
  _previousState: HelpdeskFormState,
  formData: FormData,
): Promise<HelpdeskFormState> {
  const { token } = await getAdminApiContext(PERMISSIONS.HELPDESK_MANAGE);
  const dictionary = await labels();
  const body = text(formData, "body");
  const isInternal = formData.get("isInternal") === "true";
  const status = text(formData, "status");
  const attachmentIds = [
    ...new Set(
      formData
        .getAll("attachmentIds")
        .filter((value): value is string => typeof value === "string"),
    ),
  ];

  if (!uuidPattern.test(ticketId) || !body || body.length > MAX_BODY) {
    return { message: dictionary.genericError };
  }

  if (
    attachmentIds.length > MAX_ATTACHMENTS ||
    attachmentIds.some((id) => !uuidPattern.test(id)) ||
    (status !== "" && !isStatus(status))
  ) {
    return { message: dictionary.genericError };
  }

  try {
    await apiRequest(
      `/helpdesk/admin/tickets/${encodeURIComponent(ticketId)}/messages`,
      {
        method: "POST",
        token,
        body: JSON.stringify({
          isInternal,
          body,
          // The API refuses both on an internal note, so they are only sent
          // with a customer-visible reply.
          ...(isInternal
            ? {}
            : {
                ...(status ? { status } : {}),
                ...(attachmentIds.length > 0 ? { attachmentIds } : {}),
              }),
        }),
      },
    );
  } catch (error: unknown) {
    return failed(error);
  }

  revalidatePath(`/admin/helpdesk/${ticketId}`);
  revalidatePath("/admin/helpdesk");

  return { message: null, success: true, submittedAt: Date.now() };
}

/** Queue batch actions: assignment and the common status moves. */
export async function batchQueueAction(
  formData: FormData,
): Promise<AdminDataTableActionResult> {
  const { session, token } = await getAdminApiContext(
    PERMISSIONS.HELPDESK_MANAGE,
  );
  const dictionary = await labels();
  const ids = selectedIds(formData);
  const action = text(formData, "batchAction");

  if (
    ids.length === 0 ||
    ids.length > 100 ||
    ids.some((id) => !uuidPattern.test(id))
  ) {
    return { ok: false, message: dictionary.genericError };
  }

  const assignment =
    action === "assign-me"
      ? session.user.id
      : action === "unassign"
        ? null
        : undefined;

  try {
    const result =
      assignment !== undefined
        ? await apiRequest<{ changed: number }>(
            "/helpdesk/admin/tickets/batch/assign",
            {
              method: "POST",
              token,
              body: JSON.stringify({ ids, assigneeUserId: assignment }),
            },
          )
        : isStatus(action)
          ? await apiRequest<{ changed: number }>(
              "/helpdesk/admin/tickets/batch/status",
              {
                method: "POST",
                token,
                body: JSON.stringify({ ids, status: action }),
              },
            )
          : null;

    if (!result) {
      return { ok: false, message: dictionary.genericError };
    }

    revalidatePath("/admin/helpdesk");

    return {
      ok: true,
      message:
        result.changed > 0
          ? dictionary.batchDone.replace("{count}", String(result.changed))
          : dictionary.batchUnchanged,
    };
  } catch (error: unknown) {
    return { ok: false, message: (await failed(error)).message };
  }
}
