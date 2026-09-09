import { adminTranslations } from "@/lib/i18n/admin/translations";
import { serviceFeatureDictionaries } from "@/lib/i18n/services/features";
import { servicesDictionaries } from "@/lib/i18n/services";
import { getDictionary } from "@/lib/i18n/server";

export async function getServicesDictionary() {
  const { locale, dictionary } = await getDictionary();

  return {
    locale,
    dictionary,
    services: servicesDictionaries[locale],
    serviceFeatures: serviceFeatureDictionaries[locale],
    content: adminTranslations[locale].content,
  };
}
