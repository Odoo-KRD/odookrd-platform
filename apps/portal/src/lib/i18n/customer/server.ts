import { portalDictionaries } from "@/lib/i18n/customer";
import { getDictionary } from "@/lib/i18n/server";

export async function getPortalDictionary() {
  const { locale, dictionary } = await getDictionary();

  return {
    locale,
    dictionary,
    portal: portalDictionaries[locale],
  };
}
