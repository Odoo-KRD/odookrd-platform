import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { LanguageSwitcher } from "@/components/preferences/language-switcher";
import { getDefaultAuthenticatedPath } from "@/lib/authorization";
import { getDictionary } from "@/lib/i18n/server";
import { usersDictionaries } from "@/lib/i18n/users";
import { getPublicSettings } from "@/lib/public-settings";
import { getSession } from "@/lib/session";

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function safeRedirect(value: string | string[] | undefined): string {
  if (typeof value !== "string") {
    return "/admin";
  }

  return value === "/admin" ||
    value.startsWith("/admin/") ||
    value === "/dashboard" ||
    value.startsWith("/dashboard/")
    ? value
    : "/admin";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  if (session) {
    redirect(getDefaultAuthenticatedPath(session));
  }

  const [{ locale, dictionary }, parameters, publicSettings] =
    await Promise.all([getDictionary(), searchParams, getPublicSettings()]);

  const accountActivated = parameters.invitation === "accepted";

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-7 sm:p-9">
        <div className="mb-9 flex justify-end">
          <LanguageSwitcher
            locale={locale}
            label={dictionary.common.language}
          />
        </div>

        <div className="border-b border-slate-200 pb-7">
          <p className="text-lg font-semibold tracking-tight text-slate-900">
            {publicSettings.siteTitle}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {dictionary.common.platform}
          </p>
        </div>

        <div className="pt-7 text-start">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {dictionary.login.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {dictionary.login.description}
          </p>

          {accountActivated ? (
            <p
              role="status"
              className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
            >
              {usersDictionaries[locale].accountActivated}
            </p>
          ) : null}

          <LoginForm
            messages={dictionary.login}
            redirectTo={
              typeof parameters.next === "string"
                ? safeRedirect(parameters.next)
                : "/"
            }
          />

          <p className="mt-7 text-center text-xs text-slate-400">
            {dictionary.common.secureAccess}
          </p>
        </div>
      </section>
    </main>
  );
}
