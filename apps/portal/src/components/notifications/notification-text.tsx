import { Fragment } from "react";

/** Ticket references such as TKT-2026-00006. */
const TICKET_REFERENCE = /(TKT-\d{4}-\d+)/g;

/**
 * Notification text with ticket references kept intact. A reference is Latin
 * inside Kurdish or Arabic text, so without isolation it can break at a hyphen
 * ("TKT-" on one line, "2026-00006" on the next) and its parts can be reordered
 * by the bidi algorithm. Each reference is isolated left-to-right and kept on
 * one line; the rest of the text renders unchanged.
 */
export function NotificationText({ text }: { text: string }) {
  const parts = text.split(TICKET_REFERENCE);

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <bdi key={index} dir="ltr" className="whitespace-nowrap">
            {part}
          </bdi>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
