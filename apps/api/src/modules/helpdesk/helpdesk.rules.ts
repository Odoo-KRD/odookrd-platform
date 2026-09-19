import { BadRequestException } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client';
import {
  AccountScope,
  FileAssetStatus,
  TicketStatus,
} from '../../generated/prisma/enums';
import { DEFAULT_PLATFORM_TIMEZONE } from '../subscriptions/subscription-timezone';

/**
 * Rules shared by the customer (6C) and staff (6D) sides of the helpdesk.
 * Kept free of Nest providers so they can be unit tested directly.
 */

export const MAX_ATTACHMENTS_PER_MESSAGE = 5;
export const MAX_MESSAGE_BODY_LENGTH = 10_000;
export const MAX_TICKET_SUBJECT_LENGTH = 250;

/**
 * SVG is refused on helpdesk messages regardless of the files.types.svg toggle:
 * it can carry script, and helpdesk content flows from customers to staff.
 */
export const BLOCKED_ATTACHMENT_MIME_TYPES: readonly string[] = [
  'image/svg+xml',
];

/**
 * The only filter that keeps internal notes away from customers. Every
 * customer-facing read of ticket messages must use it in the query itself, not
 * in a mapper, so a later refactor of the response shape cannot leak a note.
 */
export const CUSTOMER_VISIBLE_MESSAGE_WHERE = {
  isInternal: false,
} as const satisfies Prisma.TicketMessageWhereInput;

/**
 * Attachments are listed only while their file still exists; a file removed
 * through the files API disappears from the thread instead of breaking it.
 */
export const LIVE_ATTACHMENT_WHERE = {
  fileAsset: { status: FileAssetStatus.READY, deletedAt: null },
} as const satisfies Prisma.TicketAttachmentWhereInput;

export function formatTicketReference(year: number, sequence: number): string {
  return `TKT-${year}-${String(sequence).padStart(5, '0')}`;
}

/**
 * The reference year follows the platform's local calendar, so a ticket filed
 * at 01:00 on 1 January in Baghdad is numbered in the new year.
 */
export function ticketYear(
  now: Date,
  timeZone: string = DEFAULT_PLATFORM_TIMEZONE,
): number {
  return Number(
    new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric' }).format(now),
  );
}

/**
 * Allocates the next reference inside the caller's transaction.
 *
 * The upsert compiles to INSERT ... ON CONFLICT DO UPDATE, which takes a row
 * lock on the year's counter; concurrent ticket creations queue on it until
 * the creating transaction commits, so two tickets can never share a number.
 */
export async function allocateTicketReference(
  transaction: Prisma.TransactionClient,
  now: Date,
): Promise<string> {
  const year = ticketYear(now);
  const counter = await transaction.ticketSequence.upsert({
    where: { year },
    create: { year, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
    select: { lastValue: true },
  });

  return formatTicketReference(year, counter.lastValue);
}

/**
 * A customer reply reopens a ticket that was waiting on them or marked
 * resolved. CLOSED is final and is rejected before this is reached.
 */
export function statusAfterCustomerReply(current: TicketStatus): TicketStatus {
  if (
    current === TicketStatus.WAITING_ON_CUSTOMER ||
    current === TicketStatus.RESOLVED
  ) {
    return TicketStatus.OPEN;
  }

  return current;
}

export interface TicketStatusState {
  status: TicketStatus;
  resolvedAt: Date | null;
  closedAt: Date | null;
}

/**
 * The status plus the timestamps that must move with it. resolvedAt records
 * the latest resolution (kept when a resolved ticket is then closed);
 * reopening clears both.
 */
export function statusChangeData(
  current: TicketStatusState,
  next: TicketStatus,
  now: Date,
): TicketStatusState {
  switch (next) {
    case TicketStatus.RESOLVED:
      return {
        status: next,
        resolvedAt:
          current.status === TicketStatus.RESOLVED && current.resolvedAt
            ? current.resolvedAt
            : now,
        closedAt: null,
      };
    case TicketStatus.CLOSED:
      return {
        status: next,
        resolvedAt: current.resolvedAt,
        closedAt:
          current.status === TicketStatus.CLOSED && current.closedAt
            ? current.closedAt
            : now,
      };
    default:
      return { status: next, resolvedAt: null, closedAt: null };
  }
}

/**
 * Status after a public staff reply when the agent did not choose one: a new
 * ticket moves to IN_PROGRESS, anything else keeps its status.
 */
export function statusAfterStaffReply(current: TicketStatus): TicketStatus {
  return current === TicketStatus.OPEN ? TicketStatus.IN_PROGRESS : current;
}

export function normalizeMessageBody(body: string): string {
  const trimmed = body.trim();

  if (!trimmed) {
    throw new BadRequestException('The message cannot be empty.');
  }

  return trimmed;
}

export function uniqueIds(ids: readonly string[] | undefined): string[] {
  return [...new Set(ids ?? [])];
}

/**
 * Checks that every file can be attached to a message on a ticket of the given
 * company, and returns the ids to link.
 *
 * The file must be live, company-scoped to the ticket's company (never
 * PLATFORM-scoped, which every authenticated user can read), uploaded by the
 * person attaching it, of a permitted type, and not already on a ticket.
 * Any failure rejects the whole message with one generic error, so the
 * response does not reveal which ids exist in another company.
 */
export async function assertAttachableFiles(
  transaction: Prisma.TransactionClient,
  input: {
    companyId: string;
    uploaderUserId: string;
    fileAssetIds: readonly string[] | undefined;
  },
): Promise<string[]> {
  const ids = uniqueIds(input.fileAssetIds);

  if (ids.length === 0) {
    return ids;
  }

  if (ids.length > MAX_ATTACHMENTS_PER_MESSAGE) {
    throw new BadRequestException(
      `A message can carry at most ${MAX_ATTACHMENTS_PER_MESSAGE} attachments.`,
    );
  }

  // Sequential on purpose: an interactive transaction runs on one connection.
  const eligible = await transaction.fileAsset.findMany({
    where: {
      id: { in: ids },
      status: FileAssetStatus.READY,
      deletedAt: null,
      accountScope: AccountScope.COMPANY,
      companyId: input.companyId,
      uploadedByUserId: input.uploaderUserId,
      mimeType: { notIn: [...BLOCKED_ATTACHMENT_MIME_TYPES] },
    },
    select: { id: true },
  });
  const alreadyAttached = await transaction.ticketAttachment.count({
    where: { fileAssetId: { in: ids } },
  });

  if (eligible.length !== ids.length || alreadyAttached > 0) {
    throw new BadRequestException('One or more attachments are invalid.');
  }

  return ids;
}
