"use client";

import {
  type ManagedSetting,
  type SettingCategory,
  type SettingScope,
} from "@odookrd/types";
import { ActionButton, Badge } from "@odookrd/ui";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { SettingsFormState } from "@/app/(protected)/admin/settings/actions";
import type { SettingsDictionary } from "@/lib/i18n/settings";
import type { SettingsNavigationDictionary } from "@/lib/i18n/settings-navigation";
import { useRouter } from "next/navigation";

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
  "trainings",
  "files",
  "notifications",
];

type NotificationTab = "general" | "email" | "whatsapp";
type TrainingTab =
  "general" | "video" | "progress" | "quizzes" | "certificates";
type FileTab = "general" | "limits" | "types" | "aws";
type S3TestState = "idle" | "testing" | "success" | "error";
type VideoSettingsGroup = "delivery" | "player" | "captions";
type SettingsControlSnapshot = {
  name: string;
  value: string;
  checked?: boolean;
};

const imageTypeKeys = new Set([
  "files.types.jpeg_enabled",
  "files.types.png_enabled",
  "files.types.webp_enabled",
  "files.types.gif_enabled",
  "files.types.svg_enabled",
]);

const documentTypeKeys = new Set([
  "files.types.pdf_enabled",
  "files.types.docx_enabled",
  "files.types.pptx_enabled",
  "files.types.xlsx_enabled",
  "files.types.zip_enabled",
]);

const awsStoredCredentialKeys = new Set([
  "files.aws_s3.access_key_id",
  "files.aws_s3.secret_access_key",
  "files.aws_s3.session_token",
]);

const fontOptions = [
  "Noto Kufi Arabic",
  "Noto Sans Arabic",
  "Arial",
  "system-ui",
] as const;

function selectOptions(
  setting: ManagedSetting,
  labels: SettingsDictionary,
  navigationLabels: SettingsNavigationDictionary,
) {
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
  if (setting.key === "trainings.video.primary_provider") {
    return [
      ["AWS_S3", "AWS S3"],
      ["LOCAL", "Local"],
    ];
  }
  if (setting.key === "trainings.player.default_playback_rate")
    return [
      ["0.75", "0.75x"],
      ["1", "1x"],
      ["1.25", "1.25x"],
      ["1.5", "1.5x"],
      ["2", "2x"],
    ];
  if (setting.key === "trainings.player.seek_seconds")
    return [
      ["5", "5 seconds"],
      ["10", "10 seconds"],
      ["15", "15 seconds"],
      ["30", "30 seconds"],
    ];
  if (setting.key === "trainings.player.captions.default_behavior")
    return [
      ["off", "Off"],
      ["video_default", "Video default"],
      ["prefer_learner_language", "Prefer learner language"],
    ];
  if (setting.key === "trainings.player.captions.font_size")
    return [
      ["small", "Small"],
      ["medium", "Medium"],
      ["large", "Large"],
      ["xlarge", "Extra large"],
    ];
  if (setting.key === "trainings.player.captions.text_color")
    return [
      ["white", "White"],
      ["yellow", "Yellow"],
    ];
  if (setting.key === "trainings.player.captions.background")
    return [
      ["none", "None"],
      ["light", "Light"],
      ["medium", "Medium"],
      ["dark", "Dark"],
      ["solid", "Solid"],
    ];
  if (setting.key === "trainings.player.captions.edge_style")
    return [
      ["none", "None"],
      ["soft", "Soft"],
      ["strong", "Strong"],
    ];
  if (setting.key === "trainings.player.captions.position")
    return [
      ["bottom", "Bottom"],
      ["top", "Top"],
    ];
  if (setting.key === "files.storage.default_provider") {
    return [
      ["LOCAL", "Local"],
      ["AWS_S3", "AWS S3"],
    ];
  }
  if (setting.key === "files.aws_s3.credential_source") {
    return [
      ["default_chain", navigationLabels.s3.defaultCredentials],
      ["stored", navigationLabels.s3.storedCredentials],
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

function trainingTabFor(setting: ManagedSetting): TrainingTab | null {
  if (setting.category !== "trainings") return null;
  if (setting.key.startsWith("trainings.video.")) return "video";
  if (setting.key.startsWith("trainings.player.")) return "video";
  if (setting.key.startsWith("trainings.progress.")) return "progress";
  if (setting.key.startsWith("trainings.quizzes.")) return "quizzes";
  if (setting.key.startsWith("trainings.certificates.")) return "certificates";
  return "general";
}

function fileTabFor(setting: ManagedSetting): FileTab | null {
  if (setting.category !== "files") return null;
  if (setting.key.startsWith("files.upload.")) return "limits";
  if (setting.key.startsWith("files.types.")) return "types";
  if (setting.key.startsWith("files.aws_s3.")) return "aws";
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
  const [trainingTab, setTrainingTab] = useState<TrainingTab>("general");
  const [fileTab, setFileTab] = useState<FileTab>("general");
  const initialCredentialSource =
    settings.find((setting) => setting.key === "files.aws_s3.credential_source")
      ?.value === "stored"
      ? "stored"
      : "default_chain";
  const [credentialSource, setCredentialSource] = useState<
    "default_chain" | "stored"
  >(initialCredentialSource);
  const [s3TestState, setS3TestState] = useState<S3TestState>("idle");
  const [s3TestDetails, setS3TestDetails] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(action, {
    message: null,
    success: false,
  });
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const submittedControlsRef = useRef<SettingsControlSnapshot[]>([]);
  const [openVideoSettingsGroup, setOpenVideoSettingsGroup] =
    useState<VideoSettingsGroup | null>("player");

  const readCaptionSetting = (key: string, fallback: string): string => {
    const value = settings.find((setting) => setting.key === key)?.value;
    return value === null || value === undefined ? fallback : String(value);
  };

  const [captionPreview, setCaptionPreview] = useState(() => ({
    font_size: readCaptionSetting(
      "trainings.player.captions.font_size",
      "medium",
    ),
    text_color: readCaptionSetting(
      "trainings.player.captions.text_color",
      "white",
    ),
    background: readCaptionSetting(
      "trainings.player.captions.background",
      "dark",
    ),
    background_opacity: readCaptionSetting(
      "trainings.player.captions.background_opacity",
      "75",
    ),
    edge_style: readCaptionSetting(
      "trainings.player.captions.edge_style",
      "soft",
    ),
    position: readCaptionSetting(
      "trainings.player.captions.position",
      "bottom",
    ),
    max_width_percent: readCaptionSetting(
      "trainings.player.captions.max_width_percent",
      "90",
    ),
  }));

  const availableCategories = useMemo(
    () =>
      categories.filter((item) =>
        settings.some((setting) => setting.category === item),
      ),
    [settings],
  );

  const visibleSettings = useMemo(() => {
    const filtered = settings.filter((setting) => {
      if (setting.category !== category) return false;
      if (category === "notifications") {
        return notificationTabFor(setting) === notificationTab;
      }
      if (category === "trainings") {
        return trainingTabFor(setting) === trainingTab;
      }
      if (category === "files") {
        if (fileTabFor(setting) !== fileTab) return false;
        if (
          fileTab === "aws" &&
          credentialSource !== "stored" &&
          awsStoredCredentialKeys.has(setting.key)
        ) {
          return false;
        }
      }
      return true;
    });

    if (category === "files" && fileTab === "aws") {
      const order = [
        "files.aws_s3.credential_source",
        "files.aws_s3.region",
        "files.aws_s3.bucket",
        "files.aws_s3.access_key_id",
        "files.aws_s3.secret_access_key",
        "files.aws_s3.session_token",
      ];
      return [...filtered].sort(
        (left, right) => order.indexOf(left.key) - order.indexOf(right.key),
      );
    }

    return filtered;
  }, [
    category,
    credentialSource,
    fileTab,
    notificationTab,
    settings,
    trainingTab,
  ]);

  useEffect(() => {
    if (!state.success) return;

    const form = formRef.current;
    if (form) {
      for (const snapshot of submittedControlsRef.current) {
        const control = form.elements.namedItem(snapshot.name);
        if (control instanceof HTMLInputElement) {
          if (control.type === "checkbox") {
            control.checked = snapshot.checked === true;
          } else if (control.type !== "password") {
            control.value = snapshot.value;
          }
        } else if (control instanceof HTMLSelectElement) {
          control.value = snapshot.value;
        }
      }

      form
        .querySelectorAll<HTMLInputElement>('input[type="password"]')
        .forEach((input) => {
          input.value = "";
        });
    }

    router.refresh();
  }, [router, state]);

  function rememberSubmittedControls(
    event: React.FormEvent<HTMLFormElement>,
  ): void {
    submittedControlsRef.current = Array.from(
      event.currentTarget.querySelectorAll<
        HTMLInputElement | HTMLSelectElement
      >('input[name^="setting."], select[name^="setting."]'),
    )
      .filter(
        (control) =>
          !(control instanceof HTMLInputElement && control.type === "password"),
      )
      .map((control) => ({
        name: control.name,
        value: control.value,
        checked:
          control instanceof HTMLInputElement && control.type === "checkbox"
            ? control.checked
            : undefined,
      }));
  }

  function updateCaptionPreview(event: React.FormEvent<HTMLFormElement>): void {
    const target = event.target;
    if (
      !(target instanceof HTMLInputElement) &&
      !(target instanceof HTMLSelectElement)
    ) {
      return;
    }

    const prefix = "setting.trainings.player.captions.";
    if (!target.name.startsWith(prefix)) return;

    const key = target.name.slice(prefix.length);
    setCaptionPreview((current) => ({
      ...current,
      [key]: target.value,
    }));
  }

  function toggleVideoSettingsGroup(group: VideoSettingsGroup): void {
    setOpenVideoSettingsGroup((current) => (current === group ? null : group));
  }

  function selectCategory(next: SettingCategory): void {
    setCategory(next);
    if (next === "notifications") setNotificationTab("general");
    if (next === "trainings") setTrainingTab("general");
    if (next === "files") setFileTab("general");
  }

  const horizontalTabs =
    category === "notifications"
      ? Object.entries(navigationLabels.notificationTabs).map(
          ([key, label]) => ({
            key,
            label,
          }),
        )
      : category === "trainings"
        ? Object.entries(navigationLabels.trainingTabs).map(([key, label]) => ({
            key,
            label,
          }))
        : category === "files"
          ? Object.entries(navigationLabels.fileTabs).map(([key, label]) => ({
              key,
              label,
            }))
          : [];

  const activeHorizontalTab =
    category === "notifications"
      ? notificationTab
      : category === "trainings"
        ? trainingTab
        : fileTab;

  function selectHorizontalTab(key: string): void {
    if (category === "notifications") {
      setNotificationTab(key as NotificationTab);
    }
    if (category === "trainings") {
      setTrainingTab(key as TrainingTab);
    }
    if (category === "files") setFileTab(key as FileTab);
  }

  function resetPlayerSettings(): void {
    const form = formRef.current;
    if (!form) return;
    const defaults: Record<string, string | boolean> = {
      "trainings.player.autoplay": true,
      "trainings.player.default_playback_rate": "1",
      "trainings.player.seek_seconds": "10",
      "trainings.player.controls_auto_hide_seconds": "2",
      "trainings.player.show_fullscreen": true,
      "trainings.player.show_volume": true,
      "trainings.player.show_chapters": true,
      "trainings.player.show_speed_control": true,
      "trainings.player.show_quality_selector": true,
      "trainings.player.branding.enabled": true,
      "trainings.player.branding.text": "OdooKRD Training",
      "trainings.player.captions.default_behavior": "prefer_learner_language",
      "trainings.player.captions.font_size": "medium",
      "trainings.player.captions.text_color": "white",
      "trainings.player.captions.background": "dark",
      "trainings.player.captions.background_opacity": "75",
      "trainings.player.captions.edge_style": "soft",
      "trainings.player.captions.position": "bottom",
      "trainings.player.captions.max_width_percent": "90",
    };
    Object.entries(defaults).forEach(([key, value]) => {
      const input = form.querySelector<HTMLInputElement | HTMLSelectElement>(
        `[name="setting.${key}"]`,
      );
      if (!input) return;
      if (input instanceof HTMLInputElement && input.type === "checkbox")
        input.checked = value === true;
      else input.value = String(value);
      setCaptionPreview({
        font_size: "medium",
        text_color: "white",
        background: "dark",
        background_opacity: "75",
        edge_style: "soft",
        position: "bottom",
        max_width_percent: "90",
      });
    });
  }

  async function testS3Connection(): Promise<void> {
    setS3TestState("testing");
    setS3TestDetails(null);
    try {
      const response = await fetch("/api/files/storage/s3/test", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const body = (await response.json()) as {
        ok?: boolean;
        message?: string;
        region?: string;
        bucket?: string;
      };
      if (!response.ok || body.ok !== true) {
        throw new Error(body.message || navigationLabels.s3.testFailed);
      }
      setS3TestState("success");
      setS3TestDetails(
        [body.bucket, body.region].filter(Boolean).join(" · ") || null,
      );
    } catch {
      setS3TestState("error");
    }
  }

  function renderSettingCard(
    setting: ManagedSetting,
    compact = false,
  ): ReactNode {
    const copy = navigationLabels.fieldCopy[setting.key] ??
      labels.fields[setting.key] ?? {
        label: setting.key,
        description: setting.key,
      };
    const editable = canManage && setting.editable;
    const options = selectOptions(setting, labels, navigationLabels);
    const inherited = scope === "COMPANY" && setting.source !== "COMPANY";
    const isCredentialSource = setting.key === "files.aws_s3.credential_source";

    if (isCredentialSource) {
      return (
        <div
          key={setting.key}
          className={`rounded-lg border border-line bg-white ${
            compact ? "p-4" : "p-5"
          }`}
        >
          {editable ? (
            <input type="hidden" name="editable" value={setting.key} />
          ) : null}
          <input
            id={`setting-${setting.key}`}
            type="hidden"
            name={`setting.${setting.key}`}
            value={credentialSource}
          />

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-content">{copy.label}</p>
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

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <button
              type="button"
              disabled={!editable}
              onClick={() => setCredentialSource("default_chain")}
              className={`rounded-lg border p-4 text-start transition ${
                credentialSource === "default_chain"
                  ? "border-brand bg-brand-soft/60 ring-1 ring-brand/15"
                  : "border-line bg-white hover:bg-surface-subtle"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span className="block text-sm font-semibold text-content">
                {navigationLabels.s3.defaultCredentials}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                {navigationLabels.s3.defaultCredentialsHelp}
              </span>
            </button>

            <button
              type="button"
              disabled={!editable}
              onClick={() => setCredentialSource("stored")}
              className={`rounded-lg border p-4 text-start transition ${
                credentialSource === "stored"
                  ? "border-brand bg-brand-soft/60 ring-1 ring-brand/15"
                  : "border-line bg-white hover:bg-surface-subtle"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span className="block text-sm font-semibold text-content">
                {navigationLabels.s3.storedCredentials}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                {navigationLabels.s3.storedCredentialsHelp}
              </span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={setting.key}
        className={`rounded-lg border border-line bg-white ${
          compact ? "p-4" : "p-5"
        }`}
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
            inputMode={setting.valueType === "NUMBER" ? "numeric" : undefined}
            min={setting.valueType === "NUMBER" ? 1 : undefined}
            autoComplete={setting.isSecret ? "new-password" : undefined}
            defaultValue={setting.isSecret ? "" : String(setting.value ?? "")}
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
              className={setting.configured ? "text-emerald-700" : "text-muted"}
            >
              {setting.configured ? labels.configured : labels.notConfigured}
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
          <p className="mt-3 text-xs text-muted">{labels.inheritedNotice}</p>
        ) : null}
      </div>
    );
  }

  const imageTypes = visibleSettings.filter((setting) =>
    imageTypeKeys.has(setting.key),
  );
  const documentTypes = visibleSettings.filter((setting) =>
    documentTypeKeys.has(setting.key),
  );
  const playerSettingsGroups =
    category === "trainings" && trainingTab === "video"
      ? {
          delivery: visibleSettings.filter((setting) =>
            setting.key.startsWith("trainings.video."),
          ),
          player: visibleSettings.filter(
            (setting) =>
              setting.key.startsWith("trainings.player.") &&
              !setting.key.startsWith("trainings.player.captions."),
          ),
          captions: visibleSettings.filter((setting) =>
            setting.key.startsWith("trainings.player.captions."),
          ),
        }
      : null;

  const awsCredentialSettings = visibleSettings.filter((setting) =>
    awsStoredCredentialKeys.has(setting.key),
  );
  const awsConfigurationSettings = visibleSettings.filter(
    (setting) => !awsStoredCredentialKeys.has(setting.key),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
      <nav
        aria-label={navigationLabels.categoriesLabel}
        className="self-start rounded-lg border border-line bg-slate-50 p-2 lg:sticky lg:top-0"
      >
        <div role="tablist" aria-orientation="vertical" className="grid gap-1">
          {availableCategories.map((item) => (
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

        {horizontalTabs.length > 0 ? (
          <div
            role="tablist"
            className="mb-6 flex gap-1 overflow-x-auto border-b border-line"
          >
            {horizontalTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeHorizontalTab === tab.key}
                onClick={() => selectHorizontalTab(tab.key)}
                className={`shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeHorizontalTab === tab.key
                    ? "border-brand text-brand"
                    : "border-transparent text-muted hover:text-content"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}

        <form
          ref={formRef}
          action={formAction}
          onSubmit={rememberSubmittedControls}
          onChange={updateCaptionPreview}
          className="grid gap-5"
        >
          <input type="hidden" name="scope" value={scope} />
          <input type="hidden" name="category" value={category} />
          {companyId ? (
            <input type="hidden" name="companyId" value={companyId} />
          ) : null}

          {playerSettingsGroups ? (
            <>
              <section className="overflow-hidden rounded-xl border border-line bg-slate-50/60">
                <button
                  type="button"
                  onClick={() => toggleVideoSettingsGroup("delivery")}
                  aria-expanded={openVideoSettingsGroup === "delivery"}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-start sm:px-5"
                >
                  <h3 className="text-sm font-semibold text-content">
                    {navigationLabels.playerSettingsGroups.delivery}
                  </h3>
                  <span
                    aria-hidden="true"
                    className={`text-muted transition-transform ${
                      openVideoSettingsGroup === "delivery" ? "rotate-180" : ""
                    }`}
                  >
                    ▾
                  </span>
                </button>
                {openVideoSettingsGroup === "delivery" ? (
                  <div className="grid gap-4 border-t border-line p-4 sm:p-5">
                    {playerSettingsGroups.delivery.map((setting) =>
                      renderSettingCard(setting),
                    )}
                  </div>
                ) : null}
              </section>

              <section className="overflow-hidden rounded-xl border border-line bg-slate-50/60">
                <button
                  type="button"
                  onClick={() => toggleVideoSettingsGroup("player")}
                  aria-expanded={openVideoSettingsGroup === "player"}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-start sm:px-5"
                >
                  <h3 className="text-sm font-semibold text-content">
                    {navigationLabels.playerSettingsGroups.player}
                  </h3>
                  <span
                    aria-hidden="true"
                    className={`text-muted transition-transform ${
                      openVideoSettingsGroup === "player" ? "rotate-180" : ""
                    }`}
                  >
                    ▾
                  </span>
                </button>
                {openVideoSettingsGroup === "player" ? (
                  <div className="grid gap-4 border-t border-line p-4 sm:p-5 md:grid-cols-2">
                    {playerSettingsGroups.player.map((setting) =>
                      renderSettingCard(setting, true),
                    )}
                  </div>
                ) : null}
              </section>

              <section className="overflow-hidden rounded-xl border border-line bg-slate-50/60">
                <button
                  type="button"
                  onClick={() => toggleVideoSettingsGroup("captions")}
                  aria-expanded={openVideoSettingsGroup === "captions"}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-start sm:px-5"
                >
                  <h3 className="text-sm font-semibold text-content">
                    {navigationLabels.playerSettingsGroups.captions}
                  </h3>
                  <span
                    aria-hidden="true"
                    className={`text-muted transition-transform ${
                      openVideoSettingsGroup === "captions" ? "rotate-180" : ""
                    }`}
                  >
                    ▾
                  </span>
                </button>

                {openVideoSettingsGroup === "captions" ? (
                  <div className="grid gap-4 border-t border-line p-4 sm:p-5">
                    <div className="rounded-lg border border-line bg-white p-4">
                      <p className="text-sm font-semibold text-content">
                        {navigationLabels.playerSettingsGroups.previewTitle}
                      </p>
                      <div className="relative mt-3 aspect-video overflow-hidden rounded-lg bg-slate-900">
                        <div
                          className={`absolute inset-x-4 flex justify-center ${
                            captionPreview.position === "top"
                              ? "top-[8%]"
                              : "bottom-[8%]"
                          }`}
                        >
                          <span
                            dir="auto"
                            style={{
                              maxWidth: `${Math.max(
                                40,
                                Math.min(
                                  100,
                                  Number(captionPreview.max_width_percent) ||
                                    90,
                                ),
                              )}%`,
                              fontSize:
                                {
                                  small: "16px",
                                  medium: "20px",
                                  large: "26px",
                                  xlarge: "32px",
                                }[captionPreview.font_size] ?? "20px",
                              color:
                                captionPreview.text_color === "yellow"
                                  ? "#fde047"
                                  : "#ffffff",
                              background:
                                captionPreview.background === "none"
                                  ? "transparent"
                                  : `rgba(0, 0, 0, ${
                                      captionPreview.background === "solid"
                                        ? 1
                                        : (Math.max(
                                            0,
                                            Math.min(
                                              100,
                                              Number(
                                                captionPreview.background_opacity,
                                              ) || 0,
                                            ),
                                          ) /
                                            100) *
                                          (captionPreview.background === "light"
                                            ? 0.35
                                            : captionPreview.background ===
                                                "medium"
                                              ? 0.6
                                              : 1)
                                    })`,
                              textShadow:
                                captionPreview.edge_style === "none"
                                  ? "none"
                                  : captionPreview.edge_style === "strong"
                                    ? "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 2px 3px #000"
                                    : "0 1px 2px rgba(0,0,0,.95), 0 0 3px rgba(0,0,0,.75)",
                              padding: "0.3em 0.55em",
                              lineHeight: 1.25,
                              textAlign: "center",
                            }}
                            className="rounded"
                          >
                            {navigationLabels.playerSettingsGroups.previewText}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {playerSettingsGroups.captions.map((setting) =>
                        renderSettingCard(setting, true),
                      )}
                    </div>
                  </div>
                ) : null}
              </section>

              {scope === "PLATFORM" && canManage ? (
                <section className="rounded-xl border border-line bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-content">
                        {navigationLabels.playerSettingsGroups.reset}
                      </p>
                      <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
                        {navigationLabels.playerSettingsGroups.resetHelp}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetPlayerSettings}
                      className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-semibold text-content hover:bg-surface-subtle"
                    >
                      {navigationLabels.playerSettingsGroups.reset}
                    </button>
                  </div>
                </section>
              ) : null}
            </>
          ) : category === "files" && fileTab === "types" ? (
            <>
              <section className="rounded-xl border border-line bg-slate-50/60 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-content">
                  {navigationLabels.fileTypeGroups.images}
                </h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {imageTypes.map((setting) =>
                    renderSettingCard(setting, true),
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-line bg-slate-50/60 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-content">
                  {navigationLabels.fileTypeGroups.documents}
                </h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {documentTypes.map((setting) =>
                    renderSettingCard(setting, true),
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-line bg-slate-50/60 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-content">
                  {navigationLabels.fileTypeGroups.video}
                </h3>
                <div className="mt-4 rounded-lg border border-dashed border-line bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-content">MP4</p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        {navigationLabels.fileTypeGroups.videoComingSoon}
                      </p>
                    </div>
                    <Badge>Stage 3C.2</Badge>
                  </div>
                </div>
              </section>
            </>
          ) : category === "files" && fileTab === "aws" ? (
            <>
              {awsConfigurationSettings.map((setting) =>
                renderSettingCard(setting),
              )}
              {credentialSource === "stored" &&
              awsCredentialSettings.length > 0 ? (
                <section className="rounded-xl border border-line bg-slate-50/60 p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-content">
                    {navigationLabels.s3.storedCredentialsTitle}
                  </h3>
                  <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
                    {navigationLabels.s3.storedCredentialsHint}
                  </p>
                  <div className="mt-4 grid gap-4">
                    {awsCredentialSettings.map((setting) =>
                      renderSettingCard(setting, true),
                    )}
                  </div>
                </section>
              ) : null}
            </>
          ) : (
            visibleSettings.map((setting) => renderSettingCard(setting))
          )}

          {category === "files" && fileTab === "aws" && scope === "PLATFORM" ? (
            <section className="rounded-xl border border-line bg-slate-50/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-content">
                    {navigationLabels.s3.testConnection}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {navigationLabels.s3.saveBeforeTest}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void testS3Connection()}
                  disabled={!canManage || s3TestState === "testing"}
                  className="inline-flex h-10 items-center rounded-md border border-brand/30 bg-white px-4 text-sm font-semibold text-brand hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {s3TestState === "testing"
                    ? navigationLabels.s3.testing
                    : navigationLabels.s3.testConnection}
                </button>
              </div>
              {s3TestState === "success" ? (
                <p
                  role="status"
                  className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                >
                  {navigationLabels.s3.testSuccess}
                  {s3TestDetails ? ` ${s3TestDetails}` : ""}
                </p>
              ) : null}
              {s3TestState === "error" ? (
                <p
                  role="alert"
                  className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {navigationLabels.s3.testFailed}
                </p>
              ) : null}
            </section>
          ) : null}

          {visibleSettings.length === 0 &&
          !(category === "files" && fileTab === "types") ? (
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
