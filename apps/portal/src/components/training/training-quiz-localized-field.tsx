"use client";

import type { Locale, LocalizedText } from "@odookrd/types";
import { useId, useState } from "react";

import {
  DEFAULT_LOCALE,
  getTextDirection,
  SUPPORTED_LOCALES,
} from "@/lib/i18n/config";
import type { ContentEditorDictionary } from "@/lib/i18n/types";

type LocalizedFormValue = Record<Locale, string>;

interface TrainingQuizLocalizedFieldProps {
  label: string;
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  locale: Locale;
  content: ContentEditorDictionary;
  maxLength: number;
  multiline?: boolean;
  disabled?: boolean;
  hideLabel?: boolean;
}

const fieldClassName =
  "w-full rounded-md border border-line bg-white ps-3 pe-16 text-sm text-content outline-none transition-colors placeholder:text-muted/60 focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:bg-surface-subtle disabled:opacity-70";

function asFormValue(value: LocalizedText): LocalizedFormValue {
  return {
    ku: value.ku ?? "",
    ar: value.ar ?? "",
    en: value.en ?? "",
  };
}

function fallbackPlaceholder(
  value: LocalizedText,
  activeLocale: Locale,
): string | undefined {
  for (const candidate of [
    DEFAULT_LOCALE,
    "en",
    "ar",
  ] as const satisfies readonly Locale[]) {
    if (candidate === activeLocale) continue;
    const text = value[candidate]?.trim();
    if (text) return text;
  }
  return undefined;
}

export function TrainingQuizLocalizedField({
  label,
  value,
  onChange,
  locale,
  content,
  maxLength,
  multiline = false,
  disabled = false,
  hideLabel = false,
}: TrainingQuizLocalizedFieldProps) {
  const dialogId = useId();
  const titleId = useId();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LocalizedFormValue>(() =>
    asFormValue(value),
  );

  const currentValue = value[locale] ?? "";
  const placeholder = fallbackPlaceholder(value, locale);

  function openTranslations(): void {
    setDraft(asFormValue(value));
    setOpen(true);
  }

  function cancelTranslations(): void {
    setDraft(asFormValue(value));
    setOpen(false);
  }

  function saveTranslations(): void {
    onChange({
      ku: draft.ku,
      ar: draft.ar,
      en: draft.en,
    });
    setOpen(false);
  }

  function updateDraftTranslation(
    selectedLocale: Locale,
    nextValue: string,
  ): void {
    setDraft((previous) => ({
      ...previous,
      [selectedLocale]: nextValue,
    }));
  }

  return (
    <div className="grid min-w-0 gap-2">
      <label
        htmlFor={inputId}
        className={hideLabel ? "sr-only" : "text-xs font-semibold text-content"}
      >
        {label}
      </label>

      <div className="relative min-w-0">
        {multiline ? (
          <textarea
            id={inputId}
            aria-label={hideLabel ? label : undefined}
            value={currentValue}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            rows={3}
            dir={getTextDirection(locale)}
            onChange={(event) =>
              onChange({
                ...value,
                [locale]: event.currentTarget.value,
              })
            }
            className={`${fieldClassName} min-h-20 resize-y py-2.5`}
          />
        ) : (
          <input
            id={inputId}
            aria-label={hideLabel ? label : undefined}
            type="text"
            value={currentValue}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            dir={getTextDirection(locale)}
            onChange={(event) =>
              onChange({
                ...value,
                [locale]: event.currentTarget.value,
              })
            }
            className={`${fieldClassName} h-10`}
          />
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={openTranslations}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={dialogId}
          title={content.translations}
          className={`absolute end-1 inline-flex min-w-11 items-center justify-center rounded px-2 text-xs font-semibold uppercase tracking-wide text-muted transition-colors hover:bg-brand-soft hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:pointer-events-none ${
            multiline ? "top-2 h-8" : "top-1 h-8"
          }`}
        >
          {locale.toUpperCase()}
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cancelTranslations();
          }}
        >
          <section
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-lg border border-line bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
              <h3 id={titleId} className="text-base font-semibold text-content">
                {content.translations}: {label}
              </h3>
              <button
                type="button"
                onClick={cancelTranslations}
                aria-label={content.discardTranslations}
                className="inline-flex size-9 items-center justify-center rounded-md text-muted hover:bg-surface-subtle hover:text-content focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <div className="grid gap-5 px-5 py-5 sm:px-6 sm:py-6">
              {SUPPORTED_LOCALES.map((selectedLocale) => {
                const translationId = `${inputId}-${selectedLocale}`;
                const isDefault = selectedLocale === DEFAULT_LOCALE;

                return (
                  <div
                    key={selectedLocale}
                    className="grid gap-2 sm:grid-cols-[minmax(10rem,0.38fr)_minmax(0,1fr)] sm:items-start sm:gap-6"
                  >
                    <label
                      htmlFor={translationId}
                      className="flex items-center gap-2 pt-2 text-sm text-content"
                    >
                      <span>{content.languages[selectedLocale]}</span>
                      <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                        {selectedLocale}
                      </span>
                      <span className="text-xs text-muted">
                        {isDefault
                          ? content.defaultLanguage
                          : content.optionalLanguage}
                      </span>
                    </label>

                    {multiline ? (
                      <textarea
                        id={translationId}
                        value={draft[selectedLocale]}
                        maxLength={maxLength}
                        rows={3}
                        dir={getTextDirection(selectedLocale)}
                        onChange={(event) =>
                          updateDraftTranslation(
                            selectedLocale,
                            event.currentTarget.value,
                          )
                        }
                        className="min-h-20 w-full resize-y border-0 border-b border-line bg-transparent px-0 py-2 text-sm text-content outline-none transition-colors focus:border-brand focus:ring-0"
                      />
                    ) : (
                      <input
                        id={translationId}
                        type="text"
                        value={draft[selectedLocale]}
                        maxLength={maxLength}
                        dir={getTextDirection(selectedLocale)}
                        onChange={(event) =>
                          updateDraftTranslation(
                            selectedLocale,
                            event.currentTarget.value,
                          )
                        }
                        className="h-10 w-full border-0 border-b border-line bg-transparent px-0 text-sm text-content outline-none transition-colors focus:border-brand focus:ring-0"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <footer className="flex flex-wrap items-center gap-3 border-t border-line bg-surface-subtle px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={saveTranslations}
                className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand/30"
              >
                {content.saveTranslations}
              </button>
              <button
                type="button"
                onClick={cancelTranslations}
                className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-content hover:bg-white focus:outline-none focus:ring-2 focus:ring-line"
              >
                {content.discardTranslations}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
