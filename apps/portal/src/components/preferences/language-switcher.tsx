"use client";

import type { Locale } from "@odookrd/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

const languages: ReadonlyArray<{ value: Locale; label: string }> = [
  { value: "ku", label: "کوردی" },
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
];

interface LanguageSwitcherProps {
  locale: Locale;
  label: string;
}

export function LanguageSwitcher({ locale, label }: LanguageSwitcherProps) {
  const router = useRouter();
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
    <div aria-label={label} className="flex flex-wrap items-center gap-1">
      {languages.map((language) => (
        <button
          key={language.value}
          type="button"
          aria-pressed={language.value === locale}
          disabled={pending}
          onClick={() => void changeLocale(language.value)}
          className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            language.value === locale
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          {language.label}
        </button>
      ))}
    </div>
  );
}
