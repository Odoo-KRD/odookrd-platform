"use client";

import { ActionButton, Panel } from "@odookrd/ui";

import { adminTranslations } from "@/lib/i18n/admin/index";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ reset }: AdminErrorProps) {
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
      <div className="mt-6">
        <ActionButton type="button" onClick={reset}>
          {messages.retry}
        </ActionButton>
      </div>
    </Panel>
  );
}
