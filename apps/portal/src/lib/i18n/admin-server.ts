import { adminTranslations } from "@/lib/i18n/admin/index";
import { adminDictionaries } from "@/lib/i18n/admin";
import { getDictionary } from "@/lib/i18n/server";

export async function getAdminDictionary() {
  const { locale, dictionary } = await getDictionary();

  return {
    locale,
    dictionary,
    admin: adminDictionaries[locale],
    content: adminTranslations[locale].content,
  };
}
