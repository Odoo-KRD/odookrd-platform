import type { Locale } from "@odookrd/types";

export interface SharedLanguages {
  ar: string;
  defaultLanguage: string;
  en: string;
  ku: string;
  optionalLanguage: string;
}

const en: SharedLanguages = {
  ar: "Arabic",
  defaultLanguage: "Primary language",
  en: "English",
  ku: "Kurdish",
  optionalLanguage: "Optional",
};

const ku: SharedLanguages = {
  ar: "عەرەبی",
  defaultLanguage: "زمانی سەرەکی",
  en: "ئینگلیزی",
  ku: "کوردی",
  optionalLanguage: "ئارەزوومەندانە",
};

const ar: SharedLanguages = {
  ar: "العربية",
  defaultLanguage: "اللغة الأساسية",
  en: "الإنجليزية",
  ku: "الكردية",
  optionalLanguage: "اختياري",
};

export const sharedLanguages: Record<Locale, SharedLanguages> = { ku, ar, en };
