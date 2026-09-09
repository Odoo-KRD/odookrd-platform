import type { Locale } from "@odookrd/types";

import { adminTranslations } from "@/lib/i18n/admin/translations";
import type { AdminDictionary } from "@/lib/i18n/types";

export type { AdminDictionary } from "@/lib/i18n/types";

export const adminDictionaries: Record<Locale, AdminDictionary> = {
  ku: adminTranslations.ku.administration,
  ar: adminTranslations.ar.administration,
  en: adminTranslations.en.administration,
};
