"use client";

import type {
  Locale,
  LocalizedRichText,
  LocalizedText,
  RichTextDocument,
} from "@odookrd/types";
import { RichTextEditor } from "@odookrd/ui";
import { useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_LOCALE,
  getTextDirection,
  SUPPORTED_LOCALES,
} from "@/lib/i18n/config";
import type { ContentEditorDictionary } from "@/lib/i18n/types";
import type { RichTextToolbarDictionary } from "@/lib/i18n/rich-text";

function plainDocument(text: string | null | undefined): RichTextDocument {
  const normalized = text?.trim();
  return {
    type: "doc",
    content: [
      normalized
        ? {
            type: "paragraph",
            content: [{ type: "text", text: normalized }],
          }
        : { type: "paragraph" },
    ],
  };
}

function hasDocument(value: unknown): value is RichTextDocument {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "doc"
  );
}

export function initializeLocalizedRichText(
  rich: LocalizedRichText | null | undefined,
  plain: LocalizedText | null | undefined,
  fallback: string | null | undefined,
): LocalizedRichText {
  const result: LocalizedRichText = {};

  for (const locale of SUPPORTED_LOCALES) {
    const richValue = rich?.[locale];
    if (hasDocument(richValue)) {
      result[locale] = richValue;
      continue;
    }

    result[locale] = plainDocument(
      plain?.[locale] ?? (locale === DEFAULT_LOCALE ? fallback : null) ?? null,
    );
  }

  return result;
}

export function richTextToPlainText(
  document: RichTextDocument | undefined,
): string {
  if (!document) return "";

  const parts: string[] = [];
  const visit = (node: unknown): void => {
    if (typeof node !== "object" || node === null) return;
    if ("text" in node && typeof node.text === "string") parts.push(node.text);
    if ("content" in node && Array.isArray(node.content)) {
      for (const child of node.content) visit(child);
      if (
        "type" in node &&
        typeof node.type === "string" &&
        [
          "paragraph",
          "heading",
          "blockquote",
          "listItem",
          "codeBlock",
        ].includes(node.type)
      ) {
        parts.push("\n");
      }
    }
  };

  visit(document);
  return parts
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function uploadAsset(
  file: File,
  kind: "IMAGE" | "DOCUMENT" | "ATTACHMENT",
) {
  const payload = new FormData();
  payload.set("kind", kind);
  payload.set("file", file, file.name || "upload");

  const response = await fetch("/api/files/upload", {
    method: "POST",
    body: payload,
    credentials: "same-origin",
  });
  const body = (await response.json()) as
    { id: string; originalFilename?: string } | { message?: string | string[] };

  if (!response.ok || !("id" in body)) {
    const message =
      "message" in body
        ? Array.isArray(body.message)
          ? body.message[0]
          : body.message
        : undefined;
    throw new Error(message || "File upload failed.");
  }

  return {
    href: `/api/files/${encodeURIComponent(body.id)}/content`,
    name: body.originalFilename || file.name || "file",
  };
}

export function LocalizedRichTextEditor({
  value,
  onChange,
  content,
  toolbar,
  disabled = false,
  activeLocale: controlledLocale,
  onActiveLocaleChange,
  actions,
}: {
  value: LocalizedRichText;
  onChange: (value: LocalizedRichText) => void;
  content: ContentEditorDictionary;
  toolbar: RichTextToolbarDictionary;
  disabled?: boolean;
  /**
   * Optional. Lift the active tab into the parent when something outside the
   * editor needs to know which language is being edited — the copy-to-other-
   * languages action, for instance. Left alone, the editor manages its own.
   */
  activeLocale?: Locale;
  onActiveLocaleChange?: (locale: Locale) => void;
  /**
   * Rendered at the end of the language tab row. The copy-to-languages button
   * belongs to the form, not the editor, but it reads as part of the tabs.
   */
  actions?: ReactNode;
}) {
  const [uncontrolledLocale, setUncontrolledLocale] = useState<Locale>(
    content.locale,
  );

  const activeLocale = controlledLocale ?? uncontrolledLocale;

  const setActiveLocale = (locale: Locale): void => {
    setUncontrolledLocale(locale);
    onActiveLocaleChange?.(locale);
  };

  const activeValue = useMemo(
    () => value[activeLocale] ?? plainDocument(null),
    [activeLocale, value],
  );

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {SUPPORTED_LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => setActiveLocale(locale)}
            className={`inline-flex h-8 items-center rounded-md border px-3 text-xs font-semibold ${
              activeLocale === locale
                ? "border-brand/30 bg-brand-soft text-brand"
                : "border-line bg-white text-muted hover:bg-surface-subtle"
            }`}
          >
            {content.languages[locale]} · {locale.toUpperCase()}
          </button>
        ))}
        {actions ? <div className="ms-auto">{actions}</div> : null}
      </div>

      <RichTextEditor
        key={activeLocale}
        value={activeValue}
        onChange={(next) =>
          onChange({
            ...value,
            [activeLocale]: next as RichTextDocument,
          })
        }
        labels={toolbar}
        dir={getTextDirection(activeLocale)}
        disabled={disabled}
        onUploadImage={async (file) => (await uploadAsset(file, "IMAGE")).href}
        onUploadFile={async (file) => uploadAsset(file, "ATTACHMENT")}
      />
    </div>
  );
}
