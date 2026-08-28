import type { Locale, LocalizedText } from "@odookrd/types";

import { SUPPORTED_LOCALES } from "@/lib/i18n/config";

function isSupportedLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

function preferredLocalizedValue(
  formData: FormData,
  field: string,
  translations: LocalizedText,
): string | null {
  const activeLocale = formData.get(`${field}.__activeLocale`);

  if (isSupportedLocale(activeLocale)) {
    const activeValue = translations[activeLocale]?.trim();
    if (activeValue) return activeValue;
  }

  for (const locale of ["ku", "en", "ar"] as const) {
    const value = translations[locale]?.trim();
    if (value) return value;
  }

  return null;
}

export function localizedFormValues(
  formData: FormData,
  field: string,
  maximumLength: number,
): LocalizedText | null {
  const translations: LocalizedText = {};

  for (const locale of SUPPORTED_LOCALES) {
    const selected = formData.get(`${field}.${locale}`);

    if (typeof selected !== "string") {
      return null;
    }

    const value = selected.trim();

    if (value.length > maximumLength) {
      return null;
    }

    if (value) {
      translations[locale] = value;
    }
  }

  if (!translations.ku) {
    const fallback = preferredLocalizedValue(formData, field, translations);
    if (fallback) translations.ku = fallback;
  }

  return translations;
}

export function primaryLocalizedValue(
  translations: LocalizedText,
): string | null {
  for (const locale of SUPPORTED_LOCALES) {
    const value = translations[locale]?.trim();

    if (value) {
      return value;
    }
  }

  return null;
}
