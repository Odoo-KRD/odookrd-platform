import type { Locale } from "@odookrd/types";
import { cookies } from "next/headers";
import { cache } from "react";

import { LOCALE_COOKIE_NAME } from "@/lib/constants";
import { DEFAULT_LOCALE, isSupportedLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const getLocale = cache(async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
});

export async function getDictionary() {
  const locale = await getLocale();

  return { locale, dictionary: dictionaries[locale] };
}
