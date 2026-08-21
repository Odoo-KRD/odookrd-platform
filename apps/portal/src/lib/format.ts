import type { Locale } from "@odookrd/types";

import { LOCALE_METADATA } from "@/lib/i18n/config";

export function formatDate(value: string, locale: Locale): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(LOCALE_METADATA[locale].dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
