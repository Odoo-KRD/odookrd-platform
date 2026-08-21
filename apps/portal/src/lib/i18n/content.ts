import type { LocalizedText } from "@odookrd/types";

import { SUPPORTED_LOCALES } from "@/lib/i18n/config";

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
