"use client";

import type { LocalizedText } from "@odookrd/types";
import { useState } from "react";

import {
  DEFAULT_LOCALE,
  getTextDirection,
  SUPPORTED_LOCALES,
} from "@/lib/i18n/config";
import type { ContentEditorDictionary } from "@/lib/i18n/types";

interface LocalizedTextFieldsProps {
  field: string;
  label: string;
  content: ContentEditorDictionary;
  translations?: LocalizedText;
  fallback?: string | null;
  maxLength: number;
  required?: boolean;
  multiline?: boolean;
}

const controlClassName =
  "rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-[#714b67] focus:ring-2 focus:ring-[#714b67]/15";

export function LocalizedTextFields({
  field,
  label,
  content,
  translations,
  fallback,
  maxLength,
  required = false,
  multiline = false,
}: LocalizedTextFieldsProps) {
  const [values, setValues] = useState<LocalizedText>(() => {
    const initialValues: LocalizedText = {};

    for (const locale of SUPPORTED_LOCALES) {
      initialValues[locale] =
        translations?.[locale] ??
        (locale === DEFAULT_LOCALE ? (fallback ?? "") : "");
    }

    return initialValues;
  });

  function updateValue(locale: keyof LocalizedText, value: string): void {
    setValues((previous) => ({ ...previous, [locale]: value }));
  }

  return (
    <fieldset className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
      <legend className="px-2 text-sm font-semibold text-slate-800">
        {label}
      </legend>

      {SUPPORTED_LOCALES.map((locale) => {
        const id = `${field}-${locale}`;
        const value = values[locale] ?? "";
        const isDefault = locale === DEFAULT_LOCALE;

        return (
          <div key={locale} className="grid gap-1.5">
            <label
              htmlFor={id}
              className="flex items-center gap-2 text-sm font-medium text-slate-700"
            >
              <span>{content.languages[locale]}</span>
              <span className="text-xs font-normal text-slate-500">
                {isDefault ? content.defaultLanguage : content.optionalLanguage}
              </span>
            </label>

            {multiline ? (
              <textarea
                id={id}
                name={`${field}.${locale}`}
                dir={getTextDirection(locale)}
                value={value}
                onChange={(event) =>
                  updateValue(locale, event.currentTarget.value)
                }
                maxLength={maxLength}
                rows={3}
                required={required && isDefault}
                className={`${controlClassName} py-2`}
              />
            ) : (
              <input
                id={id}
                name={`${field}.${locale}`}
                type="text"
                dir={getTextDirection(locale)}
                value={value}
                onChange={(event) =>
                  updateValue(locale, event.currentTarget.value)
                }
                maxLength={maxLength}
                required={required && isDefault}
                className={`${controlClassName} h-11`}
              />
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
