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
import type { SettingsNavigationDictionary } from "@/lib/i18n/settings-navigation";

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
  navigationLabels: SettingsNavigationDictionary;
  canManage: boolean;
}

const categories: readonly SettingCategory[] = [
  "general",
  "theme",
  "companies",
  "notifications",
];

type NotificationTab = "general" | "email" | "whatsapp";

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

  if (setting.key === "notifications.email.amazon_ses.transport") {
    return [
      ["api", "SES API"],
      ["smtp", "SES SMTP"],
    ];
  }

  if (setting.key === "notifications.email.amazon_ses.smtp_security") {
    return [
      ["starttls", "STARTTLS"],
      ["tls", "TLS"],
    ];
  }

  return null;
}

function inputType(setting: ManagedSetting) {
  if (setting.valueType === "NUMBER") return "number" as const;

  if (
    setting.key === "notifications.email.sender_email" ||
    setting.key === "notifications.email.reply_to"
  ) {
    return "email" as const;
  }

  if (setting.key.endsWith("api_url")) return "url" as const;

  return "text" as const;
}

function notificationTabFor(setting: ManagedSetting): NotificationTab | null {
  if (setting.category !== "notifications") return null;
  if (setting.key.startsWith("notifications.email.")) return "email";
  if (setting.key.startsWith("notifications.whatsapp.")) return "whatsapp";
  return "general";
}

export function SettingsForm({
  action,
  settings,
  scope,
  companyId,
  labels,
  navigationLabels,
  canManage,
}: SettingsFormProps) {
  const [category, setCategory] = useState<SettingCategory>("general");
  const [notificationTab, setNotificationTab] =
    useState<NotificationTab>("general");
  const [state, formAction, pending] = useActionState(action, {
    message: null,
    success: false,
  });
  const formRef = useRef<HTMLFormElement>(null);

  const visibleSettings = useMemo(
    () =>
      settings.filter((setting) => {
        if (setting.category !== category) return false;
        if (category !== "notifications") return true;
        return notificationTabFor(setting) === notificationTab;
      }),
    [category, notificationTab, settings],
  );

  useEffect(() => {
    if (!state.success) return;

    formRef.current
      ?.querySelectorAll<HTMLInputElement>('input[type="password"]')
      .forEach((input) => {
        input.value = "";
      });
  }, [state]);

  function selectCategory(next: SettingCategory): void {
    setCategory(next);
    if (next === "notifications") {
      setNotificationTab("general");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
      <nav
        aria-label={navigationLabels.categoriesLabel}
        className="self-start rounded-lg border border-line bg-slate-50 p-2 lg:sticky lg:top-0"
      >
        <div role="tablist" aria-orientation="vertical" className="grid gap-1">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={category === item}
              onClick={() => selectCategory(item)}
              className={`w-full rounded-md px-3 py-2.5 text-start text-sm font-medium transition-colors ${
                category === item
                  ? "bg-brand text-white"
                  : "text-muted hover:bg-white hover:text-content"
              }`}
            >
              <span className="block truncate" title={labels.categories[item]}>
                {labels.categories[item]}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <div className="min-w-0">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-content">
            {labels.categories[category]}
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
            {labels.categoryDescriptions[category]}
          </p>
        </div>

        {category === "notifications" ? (
          <div
            role="tablist"
            aria-label={navigationLabels.notificationTabsLabel}
            className="mb-6 flex gap-1 overflow-x-auto border-b border-line"
          >
            {(["general", "email", "whatsapp"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={notificationTab === tab}
                onClick={() => setNotificationTab(tab)}
                className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  notificationTab === tab
                    ? "border-brand text-brand"
                    : "border-transparent text-muted hover:text-content"
                }`}
              >
                {navigationLabels.notificationTabs[tab]}
              </button>
            ))}
          </div>
        ) : null}

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
            const inherited =
              scope === "COMPANY" && setting.source !== "COMPANY";

            return (
              <div
                key={setting.key}
                className="rounded-lg border border-line bg-white p-5"
              >
                {editable ? (
                  <input type="hidden" name="editable" value={setting.key} />
                ) : null}

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <label
                      htmlFor={`setting-${setting.key}`}
                      className="text-sm font-semibold text-content"
                    >
                      {copy.label}
                    </label>
                    <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
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
                  <label className="mt-4 inline-flex cursor-pointer items-center gap-3 text-sm text-content">
                    <input
                      id={`setting-${setting.key}`}
                      name={`setting.${setting.key}`}
                      type="checkbox"
                      defaultChecked={setting.value === true}
                      disabled={!editable}
                      className="h-4 w-4 rounded border-slate-300 accent-brand"
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
                    className="mt-4 h-11 w-full max-w-2xl rounded-md border border-line bg-white px-3 text-sm text-content disabled:bg-slate-50 disabled:text-muted"
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
                    className="mt-4 h-11 w-full max-w-2xl rounded-md border border-line bg-white px-3 text-sm text-content placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-muted"
                  />
                )}

                {setting.isSecret ? (
                  <div className="mt-3 flex max-w-2xl flex-wrap items-center justify-between gap-3 text-xs">
                    <span
                      className={
                        setting.configured ? "text-emerald-700" : "text-muted"
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
                  <p className="mt-3 text-xs text-muted">
                    {labels.inheritedNotice}
                  </p>
                ) : null}
              </div>
            );
          })}

          {visibleSettings.length === 0 ? (
            <div className="rounded-md border border-dashed border-line p-6 text-sm text-muted">
              {labels.readOnly}
            </div>
          ) : null}

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
    </div>
  );
}
