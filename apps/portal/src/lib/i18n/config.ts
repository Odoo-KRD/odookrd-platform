import type { Locale, TextDirection } from "@odookrd/types";

export const DEFAULT_LOCALE: Locale = "ku";
export const SUPPORTED_LOCALES = ["ku", "ar", "en"] as const;

export const LOCALE_METADATA: Record<
  Locale,
  { label: string; direction: TextDirection; dateLocale: string }
> = {
  ku: { label: "کوردی", direction: "rtl", dateLocale: "ckb-IQ" },
  ar: { label: "العربية", direction: "rtl", dateLocale: "ar-IQ" },
  en: { label: "English", direction: "ltr", dateLocale: "en-GB" },
};

export function isSupportedLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && SUPPORTED_LOCALES.includes(value as Locale)
  );
}

export function getTextDirection(locale: Locale): TextDirection {
  return LOCALE_METADATA[locale].direction;
}
