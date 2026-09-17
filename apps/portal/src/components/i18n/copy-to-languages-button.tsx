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
/**
 * Node types that are content on their own, with no text anywhere in them.
 *
 * A lesson that is one video is a real lesson, and an author who inserts one
 * and finds the copy button greyed out concludes the feature is broken. Keep
 * this list in step with the editor's node set — and with hasText in the API's
 * training-lesson-readiness, which answers the same question for publishing.
 */
const SELF_SUFFICIENT_NODES = new Set([
  "youtubeEmbed",
  "image",
  "separator",
  "horizontalRule",
  "table",
]);

function nodeHasContent(value: unknown, depth = 0): boolean {
  if (depth > 30 || !value || typeof value !== "object") return false;

  if (Array.isArray(value)) {
    return value.some((child) => nodeHasContent(child, depth + 1));
  }

  const node = value as Record<string, unknown>;

  if (typeof node.type === "string" && SELF_SUFFICIENT_NODES.has(node.type)) {
    return true;
  }

  if (typeof node.text === "string" && node.text.trim().length > 0) {
    return true;
  }

  return nodeHasContent(node.content, depth + 1);
}

function hasContent(document: LocalizedRichText[Locale]): boolean {
  if (!document || !Array.isArray(document.content)) {
    return false;
  }

  // An empty editor still holds one empty paragraph node.
  return nodeHasContent(document.content);
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
