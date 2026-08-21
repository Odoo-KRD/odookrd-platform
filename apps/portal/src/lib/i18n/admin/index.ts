import type { Locale } from "@odookrd/types";

import { adminKu } from "./ku";
import { adminAr } from "./ar";
import { adminEn } from "./en";
import type { AdminTranslations } from "../types";

export const adminTranslations: Record<Locale, AdminTranslations> = {
  ku: adminKu,
  ar: adminAr,
  en: adminEn,
};
