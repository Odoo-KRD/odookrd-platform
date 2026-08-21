import { getDictionary } from "@/lib/i18n/server";
import { settingsDictionaries } from "@/lib/i18n/settings";

export async function getSettingsDictionary() {
  const { locale, dictionary } = await getDictionary();

  return { locale, dictionary, settings: settingsDictionaries[locale] };
}
