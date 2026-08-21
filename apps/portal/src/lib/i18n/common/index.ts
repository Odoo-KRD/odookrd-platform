import type { Locale } from "@odookrd/types";

import { commonKu } from "./ku";
import { commonAr } from "./ar";
import { commonEn } from "./en";
import type { Dictionary } from "../types";

export const commonTranslations: Record<Locale, Dictionary> = {
  ku: commonKu,
  ar: commonAr,
  en: commonEn,
};
