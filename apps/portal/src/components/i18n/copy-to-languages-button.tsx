"use client";

import type { Locale, LocalizedRichText } from "@odookrd/types";
import { useState } from "react";

import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import type { ContentEditorDictionary } from "@/lib/i18n/types";

interface CopyToLanguagesButtonProps {
  value: LocalizedRichText;
  /** The tab currently being edited; its content is the source of the copy. */
  activeLocale: Locale;
  onChange: (value: LocalizedRichText) => void;
  content: ContentEditorDictionary;
  disabled?: boolean;
}

/**
 * Copies the active language's content into the other language tabs.
 *
 * Deliberately separate from the editor. The editor renders and emits a
 * document; deciding what to copy where is the form's concern, and keeping it
 * outside means the button can sit wherever the page layout wants it rather
 * than being wedged into a toolbar.
 *
 * Images are referenced by URL inside the document, so copying carries the
 * references rather than duplicating uploads. All languages then point at the
 * same asset, which also means deleting an image affects every translation.
 */
function hasContent(document: LocalizedRichText[Locale]): boolean {
  if (!document || !Array.isArray(document.content)) {
    return false;
  }

  const text = JSON.stringify(document.content);

  // An empty editor still holds one empty paragraph node.
  return text.includes('"text"');
}

export function CopyToLanguagesButton({
  value,
  activeLocale,
  onChange,
  content,
  disabled = false,
}: CopyToLanguagesButtonProps) {
  const [copied, setCopied] = useState(false);

  const targets = SUPPORTED_LOCALES.filter((locale) => locale !== activeLocale);
  const source = value[activeLocale];
  const sourceIsEmpty = !hasContent(source);
  const targetsHaveContent = targets.some((locale) =>
    hasContent(value[locale]),
  );

  const copy = (): void => {
    if (sourceIsEmpty) {
      return;
    }

    // Replacing existing translations silently would lose real work.
    if (targetsHaveContent && !window.confirm(content.copyToLanguagesConfirm)) {
      return;
    }

    const next: LocalizedRichText = { ...value };

    for (const locale of targets) {
      // Structured clone: the languages must not share a mutable document.
      next[locale] = structuredClone(source);
    }

    onChange(next);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 4000);
  };

  // Sized to match the language tabs it sits beside. The hint lives in the
  // title attribute rather than a paragraph: beside the tabs there is no room
  // for a line of explanation, and it is only needed on first encounter.
  return (
    <button
      type="button"
      onClick={copy}
      disabled={disabled || sourceIsEmpty}
      title={content.copyToLanguagesHint}
      className="inline-flex h-8 w-fit items-center rounded-md border border-line bg-white px-2.5 text-xs font-medium text-muted transition-colors hover:bg-surface-subtle hover:text-content disabled:cursor-not-allowed disabled:opacity-60"
    >
      {copied ? content.copyToLanguagesDone : content.copyToLanguages}
    </button>
  );
}
