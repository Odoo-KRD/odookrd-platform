import type { TicketPriority, TicketStatus } from "@odookrd/types";

/**
 * Small, server-safe building blocks shared by the helpdesk pages. Everything
 * here uses logical properties only, so it mirrors correctly in RTL.
 */

const statusStyles: Record<TicketStatus, { chip: string; dot: string }> = {
  OPEN: {
    chip: "border-sky-200 bg-sky-50 text-sky-800",
    dot: "bg-sky-500",
  },
  IN_PROGRESS: {
    chip: "border-violet-200 bg-violet-50 text-violet-800",
    dot: "bg-violet-500",
  },
  WAITING_ON_CUSTOMER: {
    chip: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  RESOLVED: {
    chip: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  CLOSED: {
    chip: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  },
};

export function TicketStatusBadge({
  status,
  labels,
}: {
  status: TicketStatus;
  labels: Record<TicketStatus, string>;
}) {
  const style = statusStyles[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[13px] font-medium leading-none ${style.chip}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${style.dot}`}
      />
      {labels[status]}
    </span>
  );
}

export function statusDotClass(status: TicketStatus): string {
  return statusStyles[status].dot;
}

const priorityLevel: Record<TicketPriority, number> = {
  LOW: 1,
  NORMAL: 2,
  HIGH: 3,
  URGENT: 3,
};

const priorityColor: Record<TicketPriority, string> = {
  LOW: "bg-slate-400",
  NORMAL: "bg-brand",
  HIGH: "bg-amber-500",
  URGENT: "bg-red-600",
};

/** Three ascending bars, like a signal meter, plus the priority's name. */
export function TicketPriorityIndicator({
  priority,
  labels,
}: {
  priority: TicketPriority;
  labels: Record<TicketPriority, string>;
}) {
  const level = priorityLevel[priority];

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-content">
      {/* A meter reads the same in both directions, so it is pinned LTR. */}
      <span dir="ltr" aria-hidden="true" className="flex items-end gap-0.5">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={`w-1 rounded-sm ${
              bar === 1 ? "h-1.5" : bar === 2 ? "h-2.5" : "h-3.5"
            } ${bar <= level ? priorityColor[priority] : "bg-slate-200"}`}
          />
        ))}
      </span>
      <span className={priority === "URGENT" ? "text-red-700" : undefined}>
        {labels[priority]}
      </span>
    </span>
  );
}

export function initialsOf(name: string): string {
  const words = name
    .replace(/@.*$/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  const letters =
    words.length >= 2
      ? `${Array.from(words[0])[0]}${Array.from(words[1])[0]}`
      : Array.from(words[0] ?? "?")
          .slice(0, 2)
          .join("");

  return letters.toLocaleUpperCase();
}

export function UserAvatar({
  name,
  tone = "neutral",
  size = "md",
}: {
  name: string;
  tone?: "neutral" | "brand";
  size?: "sm" | "md";
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${
        size === "sm" ? "size-8 text-xs" : "size-10 text-sm"
      } ${
        tone === "brand"
          ? "bg-brand text-white"
          : "bg-surface-subtle text-content ring-1 ring-line"
      }`}
    >
      {initialsOf(name)}
    </span>
  );
}

/** The reference is always Latin; <bdi> keeps it intact inside RTL text. */
export function TicketReference({ reference }: { reference: string }) {
  return (
    <bdi dir="ltr" className="font-mono text-[13px] font-medium text-muted">
      #{reference}
    </bdi>
  );
}

/**
 * User-written text on an RTL or LTR page. The block keeps the page's
 * direction, so it aligns with the layout (right in Kurdish and Arabic); each
 * line is isolated in <bdi>, so an English line still reads left to right and
 * a Kurdish line right to left, whatever the page language.
 *
 * Never put dir="auto" on the block itself: that turns an English subject into
 * an LTR block that aligns left on an RTL page.
 */
export function UserText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, index) => (
        <span key={index}>
          {index > 0 ? "\n" : null}
          <bdi>{line}</bdi>
        </span>
      ))}
    </>
  );
}
