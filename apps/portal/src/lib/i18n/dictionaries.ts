import type { Locale } from "@odookrd/types";

import { commonTranslations } from "@/lib/i18n/shared/dictionary";
import type { Dictionary } from "@/lib/i18n/types";

export type { Dictionary } from "@/lib/i18n/types";

export const dictionaries: Record<Locale, Dictionary> = {
  ku: commonTranslations.ku,
  ar: commonTranslations.ar,
  en: commonTranslations.en,
};
