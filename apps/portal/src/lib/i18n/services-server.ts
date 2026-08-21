import { adminTranslations } from "@/lib/i18n/admin/index";
import { servicesDictionaries } from "@/lib/i18n/services";
import { getDictionary } from "@/lib/i18n/server";

export async function getServicesDictionary() {
  const { locale, dictionary } = await getDictionary();

  return {
    locale,
    dictionary,
    services: servicesDictionaries[locale],
    content: adminTranslations[locale].content,
  };
}
