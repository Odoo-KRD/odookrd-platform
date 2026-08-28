"use client";

import type { Locale, LocalizedText } from "@odookrd/types";
import { useEffect, useId, useRef, useState } from "react";

import {
  DEFAULT_LOCALE,
  getTextDirection,
  SUPPORTED_LOCALES,
} from "@/lib/i18n/config";
import type { ContentEditorDictionary } from "@/lib/i18n/types";

export interface LocalizedTextFieldProps {
  field: string;
  label: string;
  content: ContentEditorDictionary;
  translations?: LocalizedText;
  fallback?: string | null;
  maxLength: number;
  required?: boolean;
  multiline?: boolean;
  locale?: Locale;
}

const fieldClassName =
  "w-full rounded-md border border-slate-300 bg-white ps-3 pe-16 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15";

const popupFieldClassName =
  "w-full border-0 border-b border-slate-300 bg-transparent px-0 text-sm text-slate-900 outline-none transition-colors focus:border-[#714b67] focus:ring-0";

function initialLocalizedValues(
  translations: LocalizedText | undefined,
  fallback: string | null | undefined,
): LocalizedText {
  const initialValues: LocalizedText = {};

  for (const locale of SUPPORTED_LOCALES) {
    initialValues[locale] =
      translations?.[locale] ??
      (locale === DEFAULT_LOCALE ? (fallback ?? "") : "");
  }

  return initialValues;
}

function localeDirection(locale: Locale) {
  return getTextDirection(locale);
}

export function LocalizedTextField({
  field,
  label,
  content,
  translations,
  fallback,
  maxLength,
  required = false,
  multiline = false,
  locale,
}: LocalizedTextFieldProps) {
  const activeLocale = locale ?? content.locale;
  const dialogId = useId();
  const dialogTitleId = useId();
  const firstFieldRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [values, setValues] = useState<LocalizedText>(() =>
    initialLocalizedValues(translations, fallback),
  );
  const [draft, setDraft] = useState<LocalizedText>(values);
  const [open, setOpen] = useState(false);
  const value = values[activeLocale] ?? "";
  const fallbackPlaceholder =
    activeLocale === DEFAULT_LOCALE
      ? undefined
      : values[DEFAULT_LOCALE] || undefined;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstFieldRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setDraft(values);
        setOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, values]);

  function updateValue(selectedLocale: Locale, nextValue: string): void {
    setValues((previous) => ({ ...previous, [selectedLocale]: nextValue }));
  }

  function updateDraftValue(selectedLocale: Locale, nextValue: string): void {
    setDraft((previous) => ({ ...previous, [selectedLocale]: nextValue }));
  }

  function openTranslations(): void {
    setDraft(values);
    setOpen(true);
  }

  function saveDraft(): void {
    setValues(draft);
    setOpen(false);
  }

  function discardDraft(): void {
    setDraft(values);
    setOpen(false);
  }

  return (
    <div className="grid gap-2">
      <input
        type="hidden"
        name={`${field}.__activeLocale`}
        value={activeLocale}
      />
      <label
        htmlFor={`${field}-${activeLocale}`}
        className="text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        {multiline ? (
          <textarea
            id={`${field}-${activeLocale}`}
            name={`${field}.${activeLocale}`}
            dir={localeDirection(activeLocale)}
            value={value}
            onChange={(event) =>
              updateValue(activeLocale, event.currentTarget.value)
            }
            placeholder={fallbackPlaceholder}
            maxLength={maxLength}
            rows={4}
            required={required}
            className={`${fieldClassName} min-h-28 py-2.5`}
          />
        ) : (
          <input
            id={`${field}-${activeLocale}`}
            name={`${field}.${activeLocale}`}
            type="text"
            dir={localeDirection(activeLocale)}
            value={value}
            onChange={(event) =>
              updateValue(activeLocale, event.currentTarget.value)
            }
            placeholder={fallbackPlaceholder}
            maxLength={maxLength}
            required={required}
            className={`${fieldClassName} h-11`}
          />
        )}

        <button
          type="button"
          onClick={openTranslations}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={dialogId}
          title={content.translations}
          className={`absolute end-1 inline-flex min-w-11 items-center justify-center rounded px-2 text-xs font-semibold tracking-wide transition-colors hover:bg-[#714b67]/10 hover:text-[#714b67] focus:outline-none focus:ring-2 focus:ring-[#714b67]/25 ${
            multiline ? "top-2 h-8" : "top-1 h-9"
          }`}
        >
          {activeLocale.toUpperCase()}
        </button>
      </div>

      {SUPPORTED_LOCALES.filter(
        (selectedLocale) => selectedLocale !== activeLocale,
      ).map((selectedLocale) => (
        <input
          key={selectedLocale}
          type="hidden"
          name={`${field}.${selectedLocale}`}
          value={values[selectedLocale] ?? ""}
        />
      ))}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[1px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) discardDraft();
          }}
        >
          <section
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <h2
                id={dialogTitleId}
                className="text-base font-semibold text-slate-900"
              >
                {content.translations}: {label}
              </h2>
              <button
                type="button"
                onClick={discardDraft}
                aria-label={content.discardTranslations}
                className="inline-flex size-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#714b67]/25"
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
                const id = `${field}-translation-${selectedLocale}`;
                const value = draft[selectedLocale] ?? "";
                const isDefault = selectedLocale === DEFAULT_LOCALE;

                return (
                  <div
                    key={selectedLocale}
                    className="grid gap-2 sm:grid-cols-[minmax(10rem,0.38fr)_minmax(0,1fr)] sm:items-start sm:gap-6"
                  >
                    <label
                      htmlFor={id}
                      className="flex items-center gap-2 pt-2 text-sm text-slate-700"
                    >
                      <span>{content.languages[selectedLocale]}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        {selectedLocale}
                      </span>
                      <span className="text-xs text-slate-400">
                        {isDefault
                          ? content.defaultLanguage
                          : content.optionalLanguage}
                      </span>
                    </label>

                    {multiline ? (
                      <textarea
                        id={id}
                        ref={(node) => {
                          if (selectedLocale === activeLocale)
                            firstFieldRef.current = node;
                        }}
                        dir={localeDirection(selectedLocale)}
                        value={value}
                        onChange={(event) =>
                          updateDraftValue(
                            selectedLocale,
                            event.currentTarget.value,
                          )
                        }
                        maxLength={maxLength}
                        rows={3}
                        required={required && selectedLocale === activeLocale}
                        className={`${popupFieldClassName} min-h-20 py-2`}
                      />
                    ) : (
                      <input
                        id={id}
                        ref={(node) => {
                          if (selectedLocale === activeLocale)
                            firstFieldRef.current = node;
                        }}
                        type="text"
                        dir={localeDirection(selectedLocale)}
                        value={value}
                        onChange={(event) =>
                          updateDraftValue(
                            selectedLocale,
                            event.currentTarget.value,
                          )
                        }
                        maxLength={maxLength}
                        required={required && selectedLocale === activeLocale}
                        className={`${popupFieldClassName} h-10`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <footer className="flex flex-wrap items-center gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={saveDraft}
                className="inline-flex h-10 items-center justify-center rounded-md bg-[#714b67] px-4 text-sm font-semibold text-white hover:bg-[#5f3f57] focus:outline-none focus:ring-2 focus:ring-[#714b67]/30"
              >
                {content.saveTranslations}
              </button>
              <button
                type="button"
                onClick={discardDraft}
                className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-200/70 focus:outline-none focus:ring-2 focus:ring-slate-300"
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

// Backward-compatible alias for existing Stage 2F forms.
export const LocalizedTextFields = LocalizedTextField;
