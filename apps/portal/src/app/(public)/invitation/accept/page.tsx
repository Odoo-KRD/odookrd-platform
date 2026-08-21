import { redirect } from "next/navigation";

import { AcceptInvitationForm } from "@/components/invitations/accept-invitation-form";
import { LanguageSwitcher } from "@/components/preferences/language-switcher";
import { getDictionary } from "@/lib/i18n/server";
import { usersDictionaries } from "@/lib/i18n/users";
import { getSession } from "@/lib/session";

export default async function AcceptInvitationPage() {
  const session = await getSession();

  if (session) {
    redirect("/admin");
  }

  const { locale, dictionary } = await getDictionary();
  const labels = usersDictionaries[locale];

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-7 sm:p-9">
        <div className="mb-9 flex justify-end">
          <LanguageSwitcher locale={locale} label={dictionary.common.language} />
        </div>

        <div className="border-b border-slate-200 pb-7">
          <p className="text-lg font-semibold tracking-tight text-slate-900">
            {dictionary.common.brand}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {dictionary.common.platform}
          </p>
        </div>

        <div className="pt-7 text-start">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {labels.acceptanceTitle}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {labels.acceptanceDescription}
          </p>

          <AcceptInvitationForm labels={labels} />
        </div>
      </section>
    </main>
  );
}
