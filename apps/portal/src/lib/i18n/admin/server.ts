import { adminDictionaries } from "@/lib/i18n/admin";
import { adminTranslations } from "@/lib/i18n/admin/translations";
import { companiesDictionaries } from "@/lib/i18n/companies";
import { navigationDictionaries } from "@/lib/i18n/navigation";
import { getDictionary } from "@/lib/i18n/server";
import { roleCatalogDictionaries } from "@/lib/i18n/users/role-catalog";

export async function getAdminDictionary() {
  const { locale, dictionary } = await getDictionary();

  return {
    locale,
    dictionary,
    admin: adminDictionaries[locale],
    navigation: navigationDictionaries[locale],
    companies: companiesDictionaries[locale],
    roleCatalog: roleCatalogDictionaries[locale],
    content: adminTranslations[locale].content,
  };
}
