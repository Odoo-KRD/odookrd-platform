import type { Locale } from "@odookrd/types";

import { frontendKu } from "./ku";
import { frontendAr } from "./ar";
import { frontendEn } from "./en";
import type { FrontendTranslations } from "../types";

export const frontendTranslations: Record<Locale, FrontendTranslations> = {
  ku: frontendKu,
  ar: frontendAr,
  en: frontendEn,
};
