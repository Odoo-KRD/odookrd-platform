"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface AdminNavigationItem {
  href: string;
  label: string;
}

interface AdminNavigationProps {
  label: string;
  items: AdminNavigationItem[];
}

export function AdminNavigation({ label, items }: AdminNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="grid gap-1">
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-[#714b67]/10 text-[#714b67]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
