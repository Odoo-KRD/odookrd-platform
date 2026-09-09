import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { LanguageSelect } from "@/components/preferences/language-select";
import { getDefaultAuthenticatedPath } from "@/lib/authorization";
import { customerPortalRefinementDictionaries } from "@/lib/i18n/customer/refinements";
import { frontendTranslations } from "@/lib/i18n/public/translations";
import { getDictionary } from "@/lib/i18n/server";
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

function BenefitIcon({ kind }: { kind: "services" | "learning" | "account" }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "size-5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    "aria-hidden": true,
  } as const;

  if (kind === "services") {
    return (
      <svg {...common}>
        <path d="M12 3 4 7l8 4 8-4-8-4ZM4 12l8 4 8-4M4 17l8 4 8-4" />
      </svg>
    );
  }

  if (kind === "learning") {
    return (
      <svg {...common}>
        <path d="M4 5.5h11a3 3 0 0 1 3 3V20H7a3 3 0 0 1-3-3V5.5ZM7 5.5V20M10 9h5M10 13h5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 21v-2a6 6 0 0 1 12 0v2M16 4.5a4 4 0 0 1 0 7.5M17 15a6 6 0 0 1 4 5.65" />
    </svg>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  if (session) {
    redirect(getDefaultAuthenticatedPath(session));
  }

  const [{ locale, dictionary }, parameters, publicSettings] =
    await Promise.all([getDictionary(), searchParams, getPublicSettings()]);

  const labels = customerPortalRefinementDictionaries[locale].login;
  const accountActivated = parameters.invitation === "accepted";

  return (
    <main className="flex min-h-screen items-center bg-surface-page px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-line bg-white shadow-sm lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <aside className="relative hidden min-h-[610px] overflow-hidden bg-slate-950 px-10 py-11 text-white lg:flex lg:flex-col">
          <div
            aria-hidden="true"
            className="absolute -end-24 -top-24 size-72 rounded-full bg-brand/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-32 -start-20 size-80 rounded-full bg-white/5 blur-3xl"
          />

          <div className="relative">
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
              {labels.portalEyebrow}
            </p>
            <h1 className="mt-3 max-w-md text-3xl font-semibold tracking-tight">
              {labels.welcomeTitle}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/65">
              {labels.welcomeDescription}
            </p>
          </div>

          <div className="relative mt-auto grid gap-3">
            {(
              [
                ["services", labels.servicesBenefit],
                ["learning", labels.learningBenefit],
                ["account", labels.accountBenefit],
              ] satisfies ReadonlyArray<
                readonly ["services" | "learning" | "account", string]
              >
            ).map(([kind, text]) => (
              <div
                key={kind}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3.5"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-white">
                  <BenefitIcon kind={kind} />
                </span>
                <span className="text-sm font-medium text-white/85">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-h-[610px] flex-col px-6 py-7 sm:px-10 sm:py-9 lg:px-11">
          <div className="lg:hidden">
            <p className="text-lg font-semibold tracking-tight text-content">
              {publicSettings.siteTitle}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-muted">
              {labels.portalEyebrow}
            </p>
          </div>

          <div className="my-auto py-7">
            <div className="max-w-md">
              <p className="hidden text-xs font-semibold uppercase tracking-[0.14em] text-brand lg:block">
                {publicSettings.siteTitle}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-content sm:text-3xl">
                {dictionary.login.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {dictionary.login.description}
              </p>

              {accountActivated ? (
                <p
                  role="status"
                  className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
                >
                  {frontendTranslations[locale].invitations.accountActivated}
                </p>
              ) : null}

              <LoginForm
                messages={dictionary.login}
                labels={labels}
                redirectTo={
                  typeof parameters.next === "string"
                    ? safeRedirect(parameters.next)
                    : "/"
                }
              />
            </div>
          </div>

          <footer className="border-t border-line pt-5">
            <LanguageSelect
              locale={locale}
              label={dictionary.common.language}
              className="max-w-48"
            />
          </footer>
        </div>
      </section>
    </main>
  );
}
