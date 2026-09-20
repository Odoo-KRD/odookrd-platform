import type { CustomerTicketMessage, Locale } from "@odookrd/types";

import {
  formatDateTime,
  formatFileSize,
  formatRelativeTime,
} from "@/lib/format";
import type { HelpdeskDictionary } from "@/lib/i18n/helpdesk";

import { UserAvatar, UserText } from "./ticket-visuals";

function authorName(
  message: CustomerTicketMessage,
  viewerId: string,
  labels: HelpdeskDictionary,
): string {
  if (message.authorScope === "PLATFORM") {
    return message.author.displayName ?? labels.supportTeam;
  }

  if (message.author.id === viewerId) {
    return labels.you;
  }

  return message.author.displayName ?? message.author.email ?? "—";
}

/**
 * The customer's view of a thread: one card per message on a timeline.
 * Internal notes are filtered out by the API query and never reach this
 * component. Support replies have a brand avatar, a "Support" badge and a
 * tinted header, so authorship is never in doubt.
 */
export function TicketThread({
  messages,
  viewerId,
  locale,
  labels,
}: {
  messages: CustomerTicketMessage[];
  viewerId: string;
  locale: Locale;
  labels: HelpdeskDictionary;
}) {
  const now = new Date();

  return (
    <ol className="relative grid gap-5 before:absolute before:inset-y-5 before:start-5 before:w-px before:bg-line">
      {messages.map((message) => {
        const isSupport = message.authorScope === "PLATFORM";
        const name = authorName(message, viewerId, labels);

        return (
          <li key={message.id} className="relative flex gap-3 sm:gap-4">
            <span className="relative z-10 rounded-full ring-4 ring-surface-page">
              <UserAvatar
                name={
                  isSupport
                    ? labels.supportTeam
                    : (message.author.displayName ??
                      message.author.email ??
                      name)
                }
                tone={isSupport ? "brand" : "neutral"}
              />
            </span>

            <article
              className={`min-w-0 flex-1 overflow-hidden rounded-xl border bg-surface-panel shadow-sm ${
                isSupport ? "border-brand/25" : "border-line"
              }`}
            >
              <header
                className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b px-4 py-2.5 sm:px-5 ${
                  isSupport
                    ? "border-brand/15 bg-brand-soft"
                    : "border-line bg-surface-subtle"
                }`}
              >
                <span className="text-sm font-semibold text-content">
                  <bdi>{name}</bdi>
                </span>
                {isSupport ? (
                  <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">
                    {labels.supportBadge}
                  </span>
                ) : null}
                <time
                  dateTime={message.createdAt}
                  title={formatDateTime(message.createdAt, locale)}
                  className="ms-auto text-sm text-muted"
                >
                  {formatRelativeTime(message.createdAt, locale, now)}
                </time>
              </header>

              <div className="px-4 py-4 sm:px-5">
                <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-content">
                  <UserText text={message.body} />
                </p>

                {message.attachments.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {message.attachments.map((attachment) => (
                      <li key={attachment.id} className="min-w-0">
                        <a
                          href={`/api/files/${encodeURIComponent(attachment.fileAsset.id)}/content`}
                          className="inline-flex max-w-80 items-center gap-2.5 rounded-lg border border-line bg-surface-subtle px-3 py-2 text-sm text-content transition hover:border-slate-300 hover:bg-white"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="size-5 shrink-0 text-muted"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          >
                            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
                            <path d="M14 3v5h5" />
                          </svg>
                          <span className="min-w-0">
                            <bdi className="block truncate font-medium">
                              {attachment.fileAsset.originalFilename}
                            </bdi>
                            <bdi dir="ltr" className="block text-xs text-muted">
                              {formatFileSize(attachment.fileAsset.sizeBytes)}
                            </bdi>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
