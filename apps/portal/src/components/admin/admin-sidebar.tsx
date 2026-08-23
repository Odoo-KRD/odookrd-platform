"use client";

import { useState } from "react";

import {
  AdminNavigation,
  type AdminNavigationEntry,
} from "@/components/admin/navigation";

interface AdminSidebarProps {
  siteTitle: string;
  administrationLabel: string;
  navigationLabel: string;
  entries: AdminNavigationEntry[];
  signedInAsLabel: string;
  email: string;
  initialCollapsed: boolean;
  collapseLabel: string;
  expandLabel: string;
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 rtl:-scale-x-100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 5h16v14H4zM9 5v14" />
      {collapsed ? <path d="m13 9 3 3-3 3" /> : <path d="m16 9-3 3 3 3" />}
    </svg>
  );
}

export function AdminSidebar({
  siteTitle,
  administrationLabel,
  navigationLabel,
  entries,
  signedInAsLabel,
  email,
  initialCollapsed,
  collapseLabel,
  expandLabel,
}: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const toggleLabel = collapsed ? expandLabel : collapseLabel;

  async function toggleSidebar(): Promise<void> {
    const nextCollapsed = !collapsed;

    setCollapsed(nextCollapsed);

    try {
      const response = await fetch("/api/preferences/ui", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sidebarCollapsed: nextCollapsed }),
      });

      if (!response.ok) {
        throw new Error("Preference update failed.");
      }
    } catch {
      setCollapsed(!nextCollapsed);
    }
  }

  return (
    <aside
      className={`hidden shrink-0 flex-col border-e border-line bg-surface-panel transition-[width] duration-200 lg:flex ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      <div className="border-b border-line px-4 py-5">
        {collapsed ? (
          <div
            title={siteTitle}
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-brand text-base font-bold text-white"
          >
            {siteTitle.trim().charAt(0).toUpperCase() || "O"}
          </div>
        ) : (
          <>
            <p className="truncate text-lg font-semibold tracking-tight text-content">
              {siteTitle}
            </p>
            <p className="mt-1 truncate text-xs text-muted">
              {administrationLabel}
            </p>
          </>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <AdminNavigation
          label={navigationLabel}
          entries={entries}
          collapsed={collapsed}
        />
      </div>

      <div className="border-t border-line p-3">
        <button
          type="button"
          aria-label={toggleLabel}
          title={toggleLabel}
          aria-pressed={collapsed}
          onClick={() => void toggleSidebar()}
          className={`flex min-h-10 w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-subtle hover:text-content ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <CollapseIcon collapsed={collapsed} />
          {collapsed ? null : <span>{collapseLabel}</span>}
        </button>
      </div>

      <div className="border-t border-line px-4 py-4">
        {collapsed ? (
          <div
            title={email}
            className="mx-auto h-2.5 w-2.5 rounded-full bg-brand"
          />
        ) : (
          <>
            <p className="text-xs text-muted">{signedInAsLabel}</p>
            <p
              dir="ltr"
              className="mt-1 truncate text-sm font-medium text-content"
            >
              {email}
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
