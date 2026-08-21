"use client";

import { ActionButton, Panel } from "@odookrd/ui";

const copy = {
  ku: {
    title: "هەڵەیەک ڕوویدا",
    description: "نەتوانرا ئەم بەشە بار بکرێت. تکایە دووبارە هەوڵ بدەوە.",
    retry: "دووبارە هەوڵدانەوە",
  },
  ar: {
    title: "حدث خطأ",
    description: "تعذر تحميل هذا القسم. يرجى المحاولة مرة أخرى.",
    retry: "إعادة المحاولة",
  },
  en: {
    title: "Something went wrong",
    description: "This section could not be loaded. Please try again.",
    retry: "Try again",
  },
};

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ reset }: AdminErrorProps) {
  const language =
    typeof document === "undefined" ? "ku" : document.documentElement.lang;
  const messages = language === "ar" ? copy.ar : language === "en" ? copy.en : copy.ku;

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
