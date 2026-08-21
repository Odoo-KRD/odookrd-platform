import { getAdminDictionary } from "@/lib/i18n/admin-server";
import { usersDictionaries } from "@/lib/i18n/users";

export async function getUsersDictionary() {
  const translations = await getAdminDictionary();

  return {
    ...translations,
    users: usersDictionaries[translations.locale],
  };
}
