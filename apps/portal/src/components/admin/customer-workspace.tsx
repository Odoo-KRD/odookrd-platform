import type { CurrentSession, Locale } from "@odookrd/types";
import { Panel } from "@odookrd/ui";

import { LogoutButton } from "@/components/auth/logout-button";
import { LanguageSwitcher } from "@/components/preferences/language-switcher";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface CustomerWorkspaceProps {
  session: CurrentSession;
  locale: Locale;
  dictionary: Dictionary;
}

export function CustomerWorkspace({
  session,
  locale,
  dictionary,
}: CustomerWorkspaceProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-5 py-8 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-lg font-semibold tracking-tight text-slate-900">
            {dictionary.common.brand}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {dictionary.common.platform}
          </p>
        </div>

        <LanguageSwitcher locale={locale} label={dictionary.common.language} />
      </header>

      <Panel className="mt-12 p-7 text-start sm:p-9">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {dictionary.workspace.customerTitle}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {dictionary.workspace.customerDescription}
        </p>

        <div className="mt-8 border-t border-slate-200 pt-6">
          <p className="text-xs font-medium text-slate-500">
            {dictionary.workspace.signedInAs}
          </p>
          <p
            dir="ltr"
            className="mt-2 w-fit text-sm font-medium text-slate-900"
          >
            {session.user.email}
          </p>
        </div>

        <div className="mt-8">
          <LogoutButton
            label={dictionary.workspace.signOut}
            pendingLabel={dictionary.workspace.signingOut}
          />
        </div>
      </Panel>
    </main>
  );
}
