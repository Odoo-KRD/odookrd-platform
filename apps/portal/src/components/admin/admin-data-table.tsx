"use client";

import Link from "next/link";

import {
  AdminActionGroup,
  AdminActionLink,
  inferAdminActionIcon,
  type AdminActionTone,
} from "@/components/admin/admin-action-controls";
import type { AdminActionIconName } from "@/components/admin/admin-action-icons";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";

export type AdminTableTone =
  "neutral" | "accent" | "success" | "warning" | "danger";

export type AdminTableCell =
  | {
      type: "text";
      value: string;
      dir?: "ltr" | "rtl";
      emphasis?: boolean;
      muted?: boolean;
      className?: string;
    }
  | {
      type: "badge";
      label: string;
      tone?: AdminTableTone;
      dir?: "ltr" | "rtl";
    }
  | {
      type: "badges";
      items: Array<{
        key: string;
        label: string;
        tone?: AdminTableTone;
        dir?: "ltr" | "rtl";
      }>;
    }
  | {
      type: "link";
      label: string;
      href: string;
      dir?: "ltr" | "rtl";
    }
  | {
      type: "image";
      src: string | null;
      alt: string;
      fallback: string;
    }
  | {
      type: "node";
      value: ReactNode;
    }
  | {
      type: "actions";
      items: Array<{
        key: string;
        label: string;
        href: string;
        tone?: AdminActionTone;
        icon?: AdminActionIconName;
      }>;
    };

export interface AdminDataTableColumn {
  key: string;
  label: string;
  className?: string;
  headerClassName?: string;
}

export interface AdminDataTableRow {
  id: string;
  searchText?: string;
  cells: Record<string, AdminTableCell>;
}

export interface AdminDataTableBatchAction {
  value: string;
  label: string;
  tone?: "default" | "danger";
}

export interface AdminDataTableLabels {
  search: string;
  selectAll: string;
  selectRow: string;
  selected: string;
  clearSelection: string;
  batchAction: string;
  apply: string;
  confirmBatch: string;
  completed: string;
  failed: string;
}

export interface AdminDataTableActionResult {
  ok: boolean;
  message?: string | null;
}

interface AdminDataTableProps {
  columns: readonly AdminDataTableColumn[];
  rows: readonly AdminDataTableRow[];
  labels: AdminDataTableLabels;
  selectable?: boolean;
  searchEnabled?: boolean;
  toolbar?: ReactNode;
  footer?: ReactNode;
  empty?: ReactNode;
  batchActions?: readonly AdminDataTableBatchAction[];
  batchAction?: (formData: FormData) => Promise<AdminDataTableActionResult>;
  batchFields?: ReactNode;
  minWidthClassName?: string;
}

const badgeClasses: Record<AdminTableTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  accent: "border-brand/20 bg-brand-soft text-brand",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
};

function renderCell(cell: AdminTableCell): ReactNode {
  if (cell.type === "link") {
    return (
      <Link
        href={cell.href}
        dir={cell.dir}
        className="font-medium text-brand hover:text-brand-hover"
      >
        {cell.label}
      </Link>
    );
  }

  if (cell.type === "image") {
    return (
      <div className="flex size-12 items-center justify-center overflow-hidden rounded-md border border-line bg-surface-subtle">
        {cell.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cell.src}
            alt={cell.alt}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-semibold text-muted">
            {cell.fallback}
          </span>
        )}
      </div>
    );
  }

  if (cell.type === "node") {
    return cell.value;
  }

  if (cell.type === "actions") {
    return (
      <AdminActionGroup>
        {cell.items.map((item) => (
          <AdminActionLink
            key={item.key}
            href={item.href}
            tone={item.tone ?? "default"}
            icon={item.icon ?? inferAdminActionIcon(item.key)}
          >
            {item.label}
          </AdminActionLink>
        ))}
      </AdminActionGroup>
    );
  }

  if (cell.type === "badge") {
    return (
      <span
        dir={cell.dir}
        className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${
          badgeClasses[cell.tone ?? "neutral"]
        }`}
      >
        {cell.label}
      </span>
    );
  }

  if (cell.type === "badges") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {cell.items.map((item) => (
          <span
            key={item.key}
            dir={item.dir}
            className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${
              badgeClasses[item.tone ?? "neutral"]
            }`}
          >
            {item.label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <span
      dir={cell.dir}
      className={`${cell.emphasis ? "font-medium text-content" : ""} ${
        cell.muted ? "text-muted" : ""
      } ${cell.className ?? ""}`}
    >
      {cell.value}
    </span>
  );
}

export function AdminDataTable({
  columns,
  rows,
  labels,
  selectable = false,
  searchEnabled = true,
  toolbar,
  footer,
  empty,
  batchActions = [],
  batchAction,
  batchFields,
  minWidthClassName = "min-w-[760px]",
}: AdminDataTableProps) {
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<{
    scope: string;
    ids: Set<string>;
  }>(() => ({ scope: "", ids: new Set() }));
  const [selectedAction, setSelectedAction] = useState("");
  const [result, setResult] = useState<AdminDataTableActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectAllRef = useRef<HTMLInputElement>(null);
  const batchActionId = useId();

  const visibleRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();

    if (!normalized) {
      return rows;
    }

    return rows.filter((row) =>
      (
        row.searchText ??
        Object.values(row.cells)
          .map((cell) => {
            if (cell.type === "text") return cell.value;
            if (cell.type === "link") return cell.label;
            if (cell.type === "node") return "";
            if (cell.type === "badge") return cell.label;
            if (cell.type === "image") return cell.alt;
            return cell.items.map((item) => item.label).join(" ");
          })
          .join(" ")
      )
        .toLocaleLowerCase()
        .includes(normalized),
    );
  }, [query, rows]);

  const visibleIds = visibleRows.map((row) => row.id);
  const selectionScope = visibleIds.join("\u0000");
  const currentIds = new Set(visibleIds);
  const selectedIds =
    selection.scope === selectionScope
      ? new Set(Array.from(selection.ids).filter((id) => currentIds.has(id)))
      : new Set<string>();
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));
  const canSelect =
    selectable && Boolean(batchAction) && batchActions.length > 0;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        someVisibleSelected && !allVisibleSelected;
    }
  }, [allVisibleSelected, someVisibleSelected]);

  function setSelectedIds(
    value: Set<string> | ((current: Set<string>) => Set<string>),
  ): void {
    setSelection((current) => {
      const scoped =
        current.scope === selectionScope ? current.ids : new Set<string>();

      return {
        scope: selectionScope,
        ids: typeof value === "function" ? value(scoped) : value,
      };
    });
  }

  function toggleRow(id: string): void {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAllVisible(): void {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }

      return next;
    });
  }

  function clearSelection(): void {
    setSelectedIds(new Set());
    setSelectedAction("");
  }

  function onBatchSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (
      !batchAction ||
      selectedIds.size === 0 ||
      !selectedAction ||
      isPending
    ) {
      return;
    }

    const action = batchActions.find((item) => item.value === selectedAction);
    const confirmation = labels.confirmBatch
      .replace("{action}", action?.label ?? selectedAction)
      .replace("{count}", String(selectedIds.size));

    if (!window.confirm(confirmation)) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    setResult(null);

    startTransition(async () => {
      try {
        const response = await batchAction(formData);
        setResult(response);

        if (response.ok) {
          clearSelection();
        }
      } catch {
        setResult({ ok: false, message: labels.failed });
      }
    });
  }

  const batchEnabled =
    Boolean(batchAction) &&
    batchActions.length > 0 &&
    selectedIds.size > 0 &&
    Boolean(selectedAction) &&
    !isPending;

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface-panel">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
          {searchEnabled ? (
            <label className="relative min-w-[180px] max-w-72 flex-1">
              <span className="sr-only">{labels.search}</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={labels.search}
                className="h-9 w-full rounded-md border border-line bg-white px-3 text-sm text-content outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </label>
          ) : null}

          {toolbar}
        </div>

        {canSelect && selectedIds.size > 0 ? (
          <form
            onSubmit={onBatchSubmit}
            className="flex flex-wrap items-center gap-2"
          >
            {Array.from(selectedIds).map((id) => (
              <input key={id} type="hidden" name="selectedIds" value={id} />
            ))}
            <span className="whitespace-nowrap text-xs font-medium text-muted">
              {selectedIds.size} {labels.selected}
            </span>
            <label className="sr-only" htmlFor={batchActionId}>
              {labels.batchAction}
            </label>
            <select
              id={batchActionId}
              name="batchAction"
              value={selectedAction}
              onChange={(event) => setSelectedAction(event.target.value)}
              className="h-9 rounded-md border border-line bg-white px-3 text-xs text-content"
              required
            >
              <option value="" disabled>
                {labels.batchAction}
              </option>
              {batchActions.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
            {batchFields}
            <button
              type="submit"
              disabled={!batchEnabled}
              className="h-9 rounded-md bg-brand px-3 text-xs font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? `${labels.apply}…` : labels.apply}
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="whitespace-nowrap text-xs font-medium text-brand hover:text-brand-hover"
            >
              {labels.clearSelection}
            </button>
          </form>
        ) : null}

        {result?.message ? (
          <span className="text-xs" aria-live="polite">
            {result.message}
          </span>
        ) : null}
      </div>

      {visibleRows.length === 0 ? (
        <div className="px-6 py-14">{empty}</div>
      ) : (
        <div className="overflow-x-auto">
          <table
            className={`w-full border-separate border-spacing-0 text-sm ${minWidthClassName}`}
          >
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr>
                {canSelect ? (
                  <th
                    scope="col"
                    className="w-12 border-b border-line px-4 py-3 text-center"
                  >
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label={labels.selectAll}
                      className="size-4 rounded border-slate-300 accent-brand"
                    />
                  </th>
                ) : null}

                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`border-b border-line px-4 py-3 text-xs font-semibold text-muted ${
                      column.key === "actions" ? "text-end" : "text-start"
                    } ${column.headerClassName ?? ""}`}
                  >
                    <span
                      className="block max-w-[280px] truncate"
                      title={column.label}
                    >
                      {column.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {visibleRows.map((row) => {
                const selected = selectedIds.has(row.id);

                return (
                  <tr
                    key={row.id}
                    className={`align-middle transition-colors ${
                      selected ? "bg-brand-soft/70" : "hover:bg-slate-50/70"
                    }`}
                  >
                    {canSelect ? (
                      <td className="border-b border-slate-100 px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleRow(row.id)}
                          aria-label={`${labels.selectRow}: ${row.searchText ?? row.id}`}
                          className="size-4 rounded border-slate-300 accent-brand"
                        />
                      </td>
                    ) : null}

                    {columns.map((column) => {
                      const cell = row.cells[column.key];

                      return (
                        <td
                          key={column.key}
                          className={`border-b border-slate-100 px-4 py-4 text-slate-700 ${
                            column.key === "actions" ? "text-end" : ""
                          } ${column.className ?? ""}`}
                        >
                          {cell ? renderCell(cell) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {footer ? (
        <div className="border-t border-line px-4 py-3">{footer}</div>
      ) : null}
    </div>
  );
}
