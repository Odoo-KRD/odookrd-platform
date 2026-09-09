import { redirect } from "next/navigation";
import { AcceptInvitationForm } from "@/components/invitations/accept-invitation-form";
import { LanguageSwitcher } from "@/components/preferences/language-switcher";
import { activationCopy } from "@/lib/i18n/customer/activation";
import { getDictionary } from "@/lib/i18n/server";
import { frontendTranslations } from "@/lib/i18n/public/translations";
import { getSession } from "@/lib/session";

export default async function AcceptInvitationPage() {
  const session = await getSession();
  if (session) redirect("/admin");
  const { locale, dictionary } = await getDictionary();
  const labels = frontendTranslations[locale].invitations;
  const copy = activationCopy[locale];

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <section className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#714b67]/10 text-[#714b67]">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3 4.5 6v5.25c0 4.5 2.7 7.7 7.5 9.75 4.8-2.05 7.5-5.25 7.5-9.75V6L12 3Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 12 2 2 4-4"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p dir="ltr" className="text-base font-bold text-slate-900">
                  OdooKRD
                </p>
                <p className="text-xs text-slate-500">
                  {dictionary.common.platform}
                </p>
              </div>
            </div>
            <LanguageSwitcher
              locale={locale}
              label={dictionary.common.language}
            />
          </div>
        </div>
        <div className="px-6 py-7 sm:px-8 sm:py-8">
          <div className="text-start">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#714b67]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
              {labels.acceptanceTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {labels.acceptanceDescription}
            </p>
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-start">
            <div className="mt-0.5 shrink-0 text-[#714b67]">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="size-5"
              >
                <rect x="5" y="10" width="14" height="11" rx="2" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 10V7a4 4 0 0 1 8 0v3"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">
                {copy.step}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {copy.security}
              </p>
            </div>
          </div>
          <AcceptInvitationForm labels={labels} locale={locale} />
        </div>
      </section>
    </main>
  );
}
