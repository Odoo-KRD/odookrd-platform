"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type AdminNavigationIconName =
  | "overview"
  | "dashboard"
  | "companies"
  | "users"
  | "roles"
  | "services"
  | "notifications"
  | "settings";

export interface AdminNavigationItem {
  kind: "item";
  href: string;
  label: string;
  icon?: AdminNavigationIconName;
}

export interface AdminNavigationGroup {
  kind: "group";
  id: string;
  label: string;
  icon?: AdminNavigationIconName;
  children: AdminNavigationEntry[];
}

export type AdminNavigationEntry = AdminNavigationItem | AdminNavigationGroup;

interface AdminNavigationProps {
  label: string;
  entries: AdminNavigationEntry[];
  collapsed?: boolean;
}

function isItemActive(pathname: string, href: string): boolean {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

function entryContainsActive(
  pathname: string,
  entry: AdminNavigationEntry,
): boolean {
  if (entry.kind === "item") {
    return isItemActive(pathname, entry.href);
  }

  return entry.children.some((child) => entryContainsActive(pathname, child));
}

function firstItem(entry: AdminNavigationEntry): AdminNavigationItem | null {
  if (entry.kind === "item") {
    return entry;
  }

  for (const child of entry.children) {
    const candidate = firstItem(child);

    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function activeItem(
  pathname: string,
  entry: AdminNavigationEntry,
): AdminNavigationItem | null {
  if (entry.kind === "item") {
    return isItemActive(pathname, entry.href) ? entry : null;
  }

  for (const child of entry.children) {
    const candidate = activeItem(pathname, child);

    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function NavigationIcon({
  name,
  className = "h-5 w-5",
}: {
  name?: AdminNavigationIconName;
  className?: string;
}) {
  const common = {
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 1.8,
    stroke: "currentColor",
    className,
    "aria-hidden": true,
  } as const;

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <path d="M4 4h6v6H4zM14 4h6v10h-6zM4 14h6v6H4zM14 18h6v2h-6z" />
        </svg>
      );
    case "companies":
      return (
        <svg {...common}>
          <path d="M4 20V7l8-3v16M12 9h8v11M7 9h2M7 13h2M7 17h2M15 12h2M15 16h2" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 21v-2a6 6 0 0 1 12 0v2M16 4.5a4 4 0 0 1 0 7.5M17 15a6 6 0 0 1 4 5.65" />
        </svg>
      );
    case "roles":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5c0 4.6 2.8 8.3 7 10 4.2-1.7 7-5.4 7-10V6l-7-3ZM9.5 12l1.7 1.7 3.5-4" />
        </svg>
      );
    case "services":
      return (
        <svg {...common}>
          <path d="M12 3 4 7l8 4 8-4-8-4ZM4 12l8 4 8-4M4 17l8 4 8-4" />
        </svg>
      );
    case "notifications":
      return (
        <svg {...common}>
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path
            d="M19 13.5v-3l-2-.7a7 7 0 0 0-.8-1.8l.9-1.9L15 4l-1.9.9a7 7 0 0 0-1.8-.8L10.5 2h-3l-.7 2.1a7 7 0 0 0-1.8.8L3.1 4 1 6.1 1.9 8a7 7 0 0 0-.8 1.8L-1 10.5v3l2.1.7a7 7 0 0 0 .8 1.8L1 17.9 3.1 20l1.9-.9a7 7 0 0 0 1.8.8l.7 2.1h3l.7-2.1a7 7 0 0 0 1.8-.8l1.9.9 2.1-2.1-.9-1.9a7 7 0 0 0 .8-1.8L19 13.5Z"
            transform="translate(2)"
          />
        </svg>
      );
    case "overview":
    default:
      return (
        <svg {...common}>
          <path d="M4 5h16M4 12h10M4 19h16" />
        </svg>
      );
  }
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`h-4 w-4 shrink-0 transition-transform ${
        open ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m6 8 4 4 4-4" />
    </svg>
  );
}

export function AdminNavigation({
  label,
  entries,
  collapsed = false,
}: AdminNavigationProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};

    const visit = (entry: AdminNavigationEntry): void => {
      if (entry.kind === "group") {
        initial[entry.id] = entryContainsActive(pathname, entry);
        entry.children.forEach(visit);
      }
    };

    entries.forEach(visit);

    return initial;
  });

  function renderEntry(
    entry: AdminNavigationEntry,
    depth = 0,
  ): React.ReactNode {
    if (entry.kind === "item") {
      const active = isItemActive(pathname, entry.href);

      return (
        <Link
          key={entry.href}
          href={entry.href}
          title={collapsed ? entry.label : undefined}
          aria-label={collapsed ? entry.label : undefined}
          aria-current={active ? "page" : undefined}
          className={`flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            active
              ? "bg-brand-soft text-brand"
              : "text-muted hover:bg-surface-subtle hover:text-content"
          } ${collapsed ? "justify-center" : ""}`}
        >
          <NavigationIcon name={entry.icon} />
          {collapsed ? null : (
            <span className="min-w-0 truncate">{entry.label}</span>
          )}
        </Link>
      );
    }

    const containsActive = entryContainsActive(pathname, entry);
    const open = openGroups[entry.id] ?? containsActive;

    if (collapsed) {
      const destination = activeItem(pathname, entry) ?? firstItem(entry);

      if (!destination) {
        return null;
      }

      return (
        <Link
          key={entry.id}
          href={destination.href}
          title={entry.label}
          aria-current={containsActive ? "page" : undefined}
          className={`flex min-h-10 items-center justify-center rounded-md px-3 py-2 transition-colors ${
            containsActive
              ? "bg-brand-soft text-brand"
              : "text-muted hover:bg-surface-subtle hover:text-content"
          }`}
        >
          <NavigationIcon name={entry.icon ?? destination.icon} />
          <span className="sr-only">{entry.label}</span>
        </Link>
      );
    }

    return (
      <div key={entry.id} className={depth === 0 ? "grid gap-1" : "grid gap-1"}>
        <button
          type="button"
          aria-expanded={open}
          onClick={() =>
            setOpenGroups((current) => ({
              ...current,
              [entry.id]: !open,
            }))
          }
          className={`flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
            containsActive
              ? "text-brand"
              : "text-muted hover:bg-surface-subtle hover:text-content"
          }`}
        >
          <NavigationIcon name={entry.icon} />
          <span className="min-w-0 flex-1 truncate text-start">
            {entry.label}
          </span>
          <Chevron open={open} />
        </button>

        {open ? (
          <div className="ms-4 grid gap-1 border-s border-line ps-2">
            {entry.children.map((child) => renderEntry(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <nav aria-label={label} className="grid gap-1.5">
      {entries.map((entry) => renderEntry(entry))}
    </nav>
  );
}
