"use client";

import type { Locale } from "@odookrd/types";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import {
  isSupportedLocale,
  LOCALE_METADATA,
  SUPPORTED_LOCALES,
} from "@/lib/i18n/config";

interface LanguageSelectProps {
  locale: Locale;
  label: string;
  compact?: boolean;
  className?: string;
}

export function LanguageSelect({
  locale,
  label,
  compact = false,
  className = "",
}: LanguageSelectProps) {
  const router = useRouter();
  const id = useId();
  const [pending, setPending] = useState(false);

  async function changeLocale(nextLocale: Locale): Promise<void> {
    if (pending || nextLocale === locale) {
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });

      if (response.ok) {
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={`grid gap-1.5 ${className}`}>
      {compact ? null : (
        <label htmlFor={id} className="text-xs font-medium text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={locale}
          aria-label={compact ? label : undefined}
          disabled={pending}
          onChange={(event) => {
            const value = event.target.value;
            if (isSupportedLocale(value)) {
              void changeLocale(value);
            }
          }}
          className={`w-full appearance-none rounded-md border border-line bg-white pe-9 text-content outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10 disabled:opacity-60 ${
            compact
              ? "h-9 min-w-28 ps-3 text-xs font-medium"
              : "h-10 ps-3 text-sm"
          }`}
        >
          {SUPPORTED_LOCALES.map((value) => (
            <option key={value} value={value}>
              {LOCALE_METADATA[value].label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="m6 8 4 4 4-4" />
        </svg>
      </div>
    </div>
  );
}
