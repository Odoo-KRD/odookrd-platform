import type { Locale, LocalizedText } from "@odookrd/types";

export function localizeTrainingText(
  fallback: string | null,
  translations: LocalizedText,
  locale: Locale,
): string {
  return (
    translations[locale]?.trim() ||
    translations.ku?.trim() ||
    translations.en?.trim() ||
    translations.ar?.trim() ||
    fallback?.trim() ||
    ""
  );
}
