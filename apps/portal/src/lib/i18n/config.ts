import type { Locale, TextDirection } from "@odookrd/types";

export const DEFAULT_LOCALE: Locale = "ku";
export const SUPPORTED_LOCALES = ["ku", "ar", "en"] as const;

export function isSupportedLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    SUPPORTED_LOCALES.includes(value as Locale)
  );
}

export function getTextDirection(locale: Locale): TextDirection {
  return locale === "en" ? "ltr" : "rtl";
}
