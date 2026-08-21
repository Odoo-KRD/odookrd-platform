import type { Locale } from "@odookrd/types";

import { frontendTranslations } from "@/lib/i18n/frontend";
import type { PortalDictionary } from "@/lib/i18n/types";

export type { PortalDictionary } from "@/lib/i18n/types";

export const portalDictionaries: Record<Locale, PortalDictionary> = {
  ku: frontendTranslations.ku.portal,
  ar: frontendTranslations.ar.portal,
  en: frontendTranslations.en.portal,
};
