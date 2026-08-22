import { frontendTranslations } from "@/lib/i18n/frontend";
import { getDictionary } from "@/lib/i18n/server";

export async function getFrontendDictionary() {
  const { locale, dictionary } = await getDictionary();
  const frontend = frontendTranslations[locale];

  return {
    locale,
    dictionary,
    frontend,
    portal: frontend.portal,
    services: frontend.services,
    invitations: frontend.invitations,
    workspace: frontend.workspace,
    content: frontend.content,
  };
}
