import type { Locale } from "@odookrd/types";

const dateLocales: Record<Locale, string> = {
  ku: "ckb-IQ",
  ar: "ar-IQ",
  en: "en-GB",
};

export function formatDate(value: string, locale: Locale): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(dateLocales[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
