"use client";

import {
  type ManagedSetting,
  type SettingCategory,
  type SettingScope,
} from "@odookrd/types";
import { ActionButton, Badge } from "@odookrd/ui";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import type { SettingsFormState } from "@/app/(protected)/admin/settings/actions";
import type { SettingsDictionary } from "@/lib/i18n/settings";

type SettingsAction = (
  state: SettingsFormState,
  formData: FormData,
) => Promise<SettingsFormState>;

interface SettingsFormProps {
  action: SettingsAction;
  settings: ManagedSetting[];
  scope: SettingScope;
  companyId: string | null;
  labels: SettingsDictionary;
  canManage: boolean;
}

const categories: readonly SettingCategory[] = [
  "general",
  "theme",
  "companies",
  "notifications",
];

const fontOptions = [
  "Noto Kufi Arabic",
  "Noto Sans Arabic",
  "Arial",
  "system-ui",
] as const;

function selectOptions(setting: ManagedSetting, labels: SettingsDictionary) {
  if (setting.key === "general.default_locale") {
    return Object.entries(labels.localeOptions);
  }

  if (setting.key === "theme.default_font") {
    return fontOptions.map((font) => [font, font]);
  }

  if (setting.key === "notifications.email.provider") {
    return [["amazon_ses", "Amazon SES"]];
  }

  return null;
}

function inputType(setting: ManagedSetting) {
  if (setting.valueType === "NUMBER") {
    return "number" as const;
  }
  if (
    setting.key === "notifications.email.sender_email" ||
    setting.key === "notifications.email.reply_to"
  ) {
    return "email" as const;
  }
  if (setting.key.endsWith("api_url")) {
    return "url" as const;
  }
  return "text" as const;
}

export function SettingsForm({
  action,
  settings,
  scope,
  companyId,
  labels,
  canManage,
}: SettingsFormProps) {
  const [category, setCategory] = useState<SettingCategory>("general");
  const [state, formAction, pending] = useActionState(action, {
    message: null,
    success: false,
  });
  const formRef = useRef<HTMLFormElement>(null);
  const visibleSettings = useMemo(
    () => settings.filter((setting) => setting.category === category),
    [category, settings],
  );

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current
      ?.querySelectorAll<HTMLInputElement>('input[type="password"]')
      .forEach((input) => {
        input.value = "";
      });
  }, [state]);

  return (
    <div className="grid gap-6">
      <div
        role="tablist"
        aria-label={labels.title}
        className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-3"
      >
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={category === item}
            onClick={() => setCategory(item)}
            className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              category === item
                ? "bg-slate-900 text-white"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {labels.categories[item]}
          </button>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {labels.categories[category]}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {labels.categoryDescriptions[category]}
        </p>
      </div>

      <form ref={formRef} action={formAction} className="grid gap-5">
        <input type="hidden" name="scope" value={scope} />
        <input type="hidden" name="category" value={category} />
        {companyId ? (
          <input type="hidden" name="companyId" value={companyId} />
        ) : null}

        {visibleSettings.map((setting) => {
          const copy = labels.fields[setting.key] ?? {
            label: setting.key,
            description: setting.key,
          };
          const editable = canManage && setting.editable;
          const options = selectOptions(setting, labels);
          const inherited = scope === "COMPANY" && setting.source !== "COMPANY";

          return (
            <div
              key={setting.key}
              className="rounded-lg border border-slate-200 p-5"
            >
              {editable ? (
                <input type="hidden" name="editable" value={setting.key} />
              ) : null}

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <label
                    htmlFor={`setting-${setting.key}`}
                    className="text-sm font-semibold text-slate-900"
                  >
                    {copy.label}
                  </label>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {copy.description}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={inherited ? "neutral" : "accent"}>
                    {labels.sources[setting.source]}
                  </Badge>
                  {!editable ? <Badge>{labels.readOnly}</Badge> : null}
                </div>
              </div>

              {setting.valueType === "BOOLEAN" ? (
                <label className="mt-4 inline-flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                  <input
                    id={`setting-${setting.key}`}
                    name={`setting.${setting.key}`}
                    type="checkbox"
                    defaultChecked={setting.value === true}
                    disabled={!editable}
                    className="h-4 w-4 rounded border-slate-300 accent-[#714b67]"
                  />
                  {setting.value === true
                    ? labels.booleanOptions.enabled
                    : labels.booleanOptions.disabled}
                </label>
              ) : options ? (
                <select
                  id={`setting-${setting.key}`}
                  name={`setting.${setting.key}`}
                  defaultValue={String(setting.value ?? "")}
                  disabled={!editable}
                  className="mt-4 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                >
                  {options.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`setting-${setting.key}`}
                  name={`setting.${setting.key}`}
                  type={setting.isSecret ? "password" : inputType(setting)}
                  inputMode={
                    setting.valueType === "NUMBER" ? "numeric" : undefined
                  }
                  min={setting.valueType === "NUMBER" ? 1 : undefined}
                  autoComplete={setting.isSecret ? "new-password" : undefined}
                  defaultValue={
                    setting.isSecret ? "" : String(setting.value ?? "")
                  }
                  placeholder={
                    setting.isSecret ? labels.secretPlaceholder : undefined
                  }
                  disabled={!editable}
                  className="mt-4 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                />
              )}

              {setting.isSecret ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span
                    className={
                      setting.configured ? "text-emerald-700" : "text-slate-500"
                    }
                  >
                    {setting.configured
                      ? labels.configured
                      : labels.notConfigured}
                  </span>
                  {editable && setting.configured ? (
                    <label className="inline-flex items-center gap-2 text-red-700">
                      <input
                        type="checkbox"
                        name={`clear.${setting.key}`}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      {labels.clearSecret}
                    </label>
                  ) : null}
                </div>
              ) : inherited ? (
                <p className="mt-3 text-xs text-slate-500">
                  {labels.inheritedNotice}
                </p>
              ) : null}
            </div>
          );
        })}

        {state.message ? (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {state.message}
          </p>
        ) : null}
        {state.success ? (
          <p
            role="status"
            className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {labels.saved}
          </p>
        ) : null}

        {canManage && visibleSettings.some((setting) => setting.editable) ? (
          <div>
            <ActionButton type="submit" disabled={pending}>
              {pending ? labels.saving : labels.save}
            </ActionButton>
          </div>
        ) : null}
      </form>
    </div>
  );
}
