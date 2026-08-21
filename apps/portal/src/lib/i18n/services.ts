import type { Locale } from "@odookrd/types";

import { adminTranslations } from "@/lib/i18n/admin/index";
import type { ServicesDictionary } from "@/lib/i18n/types";

export type { ServicesDictionary } from "@/lib/i18n/types";

export const servicesDictionaries: Record<Locale, ServicesDictionary> = {
  ku: adminTranslations.ku.services,
  ar: adminTranslations.ar.services,
  en: adminTranslations.en.services,
};
