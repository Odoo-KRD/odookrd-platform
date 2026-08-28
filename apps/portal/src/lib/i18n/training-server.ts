import { adminTranslations } from "@/lib/i18n/admin/index";
import { getDictionary } from "@/lib/i18n/server";
import { trainingDictionaries } from "@/lib/i18n/training";

export async function getTrainingDictionary() {
  const { locale } = await getDictionary();
  return {
    locale,
    training: trainingDictionaries[locale],
    content: adminTranslations[locale].content,
  };
}
