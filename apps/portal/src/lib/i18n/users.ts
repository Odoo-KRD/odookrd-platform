import type { Locale } from "@odookrd/types";

import { adminTranslations } from "@/lib/i18n/admin/index";
import type { UsersDictionary } from "@/lib/i18n/types";

export type { UsersDictionary } from "@/lib/i18n/types";

export const usersDictionaries: Record<Locale, UsersDictionary> = {
  ku: adminTranslations.ku.users,
  ar: adminTranslations.ar.users,
  en: adminTranslations.en.users,
};
