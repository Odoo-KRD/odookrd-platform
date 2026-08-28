"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import {
  AdminActionIcon,
  type AdminActionIconName,
} from "@/components/admin/admin-action-icons";

export type AdminActionTone = "default" | "primary" | "warning" | "danger";

function actionClassName(tone: AdminActionTone): string {
  const base =
    "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

  if (tone === "primary") {
    return `${base} border-brand/20 bg-brand-soft text-brand hover:bg-brand/10`;
  }

  if (tone === "warning") {
    return `${base} border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100`;
  }

  if (tone === "danger") {
    return `${base} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`;
  }

  return `${base} border-line bg-white text-content hover:bg-surface-subtle`;
}

export function AdminActionGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function AdminActionLink({
  href,
  children,
  tone = "default",
  icon,
}: {
  href: string;
  children: ReactNode;
  tone?: AdminActionTone;
  icon?: AdminActionIconName;
}) {
  return (
    <Link href={href} className={actionClassName(tone)}>
      {icon ? <AdminActionIcon name={icon} /> : null}
      <span>{children}</span>
    </Link>
  );
}

interface AdminActionButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> {
  children: ReactNode;
  tone?: AdminActionTone;
  icon?: AdminActionIconName;
}

export function AdminActionButton({
  children,
  tone = "default",
  type = "button",
  icon,
  ...props
}: AdminActionButtonProps) {
  return (
    <button type={type} className={actionClassName(tone)} {...props}>
      {icon ? <AdminActionIcon name={icon} /> : null}
      <span>{children}</span>
    </button>
  );
}

export function inferAdminActionIcon(key: string): AdminActionIconName {
  const normalized = key.toLocaleLowerCase();

  if (
    normalized === "editor" ||
    normalized.includes("course-editor") ||
    normalized.includes("course_editor")
  ) {
    return "course-editor";
  }

  if (normalized.includes("edit")) return "edit";
  if (normalized.includes("archive") || normalized.includes("restore")) {
    return "archive";
  }
  if (normalized.includes("delete") || normalized.includes("remove")) {
    return "delete";
  }

  return "view";
}
