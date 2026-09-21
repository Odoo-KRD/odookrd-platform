"use client";

import type { CustomerNotification, Locale } from "@odookrd/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";

import { markNotificationReadAction } from "@/app/(protected)/(customer)/dashboard/notifications/actions";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { formatDate } from "@/lib/format";

import { NotificationText } from "./notification-text";

export interface NotificationMessageLabels {
  viewMessage: string;
  closeMessage: string;
  openRelatedPage: string;
}

interface NotificationMessageDialogProps {
  notification: CustomerNotification | null;
  locale: Locale;
  labels: NotificationMessageLabels;
  onClose: () => void;
}

/**
 * Shows one notification as a full message. Opening an unread message marks
 * it as read, the same way opening an email does.
 */
export function NotificationMessageDialog({
  notification,
  locale,
  labels,
  onClose,
}: NotificationMessageDialogProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const markedIds = useRef(new Set<string>());

  useEffect(() => {
    if (!notification || notification.readAt) return;
    if (markedIds.current.has(notification.id)) return;
    markedIds.current.add(notification.id);

    const formData = new FormData();
    formData.set("recipientId", notification.id);
    startTransition(async () => {
      try {
        await markNotificationReadAction(formData);
        router.refresh();
      } catch {
        // Reading the message still works; the unread state stays as it was.
        markedIds.current.delete(notification.id);
      }
    });
  }, [notification, router]);

  return (
    <ModalDialog
      open={notification !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={notification?.title ?? ""}
      description={
        notification ? formatDate(notification.createdAt, locale) : undefined
      }
      closeLabel={labels.closeMessage}
      triggerLabel={labels.viewMessage}
    >
      {notification ? (
        <div className="grid gap-6">
          <p
            dir="auto"
            className="whitespace-pre-wrap break-words text-start text-sm leading-7 text-content"
          >
            <NotificationText text={notification.body} />
          </p>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
            {notification.actionUrl ? (
              <Link
                href={notification.actionUrl}
                onClick={onClose}
                className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
              >
                {labels.openRelatedPage}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-medium text-content hover:bg-surface-subtle"
            >
              {labels.closeMessage}
            </button>
          </div>
        </div>
      ) : null}
    </ModalDialog>
  );
}

interface NotificationMessageButtonProps {
  notification: CustomerNotification;
  locale: Locale;
  labels: NotificationMessageLabels;
  className?: string;
  children: ReactNode;
}

/** A button that opens the notification in the message dialog. */
export function NotificationMessageButton({
  notification,
  locale,
  labels,
  className = "",
  children,
}: NotificationMessageButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        {children}
      </button>
      <NotificationMessageDialog
        notification={open ? notification : null}
        locale={locale}
        labels={labels}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
