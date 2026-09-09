import type { Locale } from "@odookrd/types";

import { adminTranslations } from "@/lib/i18n/admin/translations";
import type { SettingsDictionary } from "@/lib/i18n/types";

export type { SettingsDictionary } from "@/lib/i18n/types";

export const settingsDictionaries: Record<Locale, SettingsDictionary> = {
  ku: adminTranslations.ku.settings,
  ar: adminTranslations.ar.settings,
  en: adminTranslations.en.settings,
};
