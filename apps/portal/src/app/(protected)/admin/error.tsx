"use client";

import { ActionButton, Panel } from "@odookrd/ui";

import { adminTranslations } from "@/lib/i18n/admin/translations";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  const language =
    typeof document === "undefined" ? "ku" : document.documentElement.lang;
  const messages =
    language === "ar"
      ? adminTranslations.ar.errors
      : language === "en"
        ? adminTranslations.en.errors
        : adminTranslations.ku.errors;

  return (
    <Panel className="p-8">
      <h2 className="text-lg font-semibold text-slate-900">{messages.title}</h2>
      <p className="mt-3 text-sm text-slate-500">{messages.description}</p>
      {/* Next's digest also appears in the server log and the Sentry event, so
          a customer quoting it turns a vague report into one lookup. */}
      {error.digest ? (
        <p className="mt-2 text-xs text-slate-400">
          {messages.reference}:{" "}
          <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
      <div className="mt-6">
        <ActionButton type="button" onClick={reset}>
          {messages.retry}
        </ActionButton>
      </div>
    </Panel>
  );
}
