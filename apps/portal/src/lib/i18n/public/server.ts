import { portalDictionaries } from "@/lib/i18n/customer";
import { frontendTranslations } from "@/lib/i18n/public/translations";
import { getDictionary } from "@/lib/i18n/server";

export async function getFrontendDictionary() {
  const { locale, dictionary } = await getDictionary();
  const frontend = frontendTranslations[locale];

  return {
    locale,
    dictionary,
    frontend,
    portal: portalDictionaries[locale],
    services: frontend.services,
    invitations: frontend.invitations,
    workspace: frontend.workspace,
    notifications: frontend.notifications,
    content: frontend.content,
  };
}
