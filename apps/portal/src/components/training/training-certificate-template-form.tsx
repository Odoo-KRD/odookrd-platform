"use client";

import type {
  FileAsset,
  Locale,
  LocalizedText,
  TrainingCertificateBackgroundPreset,
  TrainingCertificateFontFamily,
  TrainingCertificateLayoutConfig,
  TrainingCertificateLayoutElement,
  TrainingCertificateTemplate,
  TrainingCertificateTemplateStatus,
} from "@odookrd/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

import type { TrainingCertificateDesignerDictionary } from "@/lib/i18n/training/certificate-designer";
import type { TrainingCertificateDictionary } from "@/lib/i18n/training/certificates";

const maximumImageBytes = 10_485_760;
const canvasWidth = 1600;
const canvasHeight = 1131;
const supportedImages = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]);

type ElementKey = keyof TrainingCertificateLayoutConfig["elements"];
type DesignerTab = "general" | "content" | "background" | "assets" | "layout";

type DragState = {
  key: ElementKey;
  offsetX: number;
  offsetY: number;
} | null;

function baseElement(
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  fontFamily: TrainingCertificateFontFamily,
  fontWeight: number,
  color: string,
  align: "left" | "center" | "right" = "center",
  visible = true,
): TrainingCertificateLayoutElement {
  return {
    x,
    y,
    width,
    height,
    fontSize,
    fontFamily,
    fontWeight,
    color,
    align,
    visible,
  };
}

function defaultLayout(
  primaryColor = "#714b67",
): TrainingCertificateLayoutConfig {
  return {
    version: 1,
    elements: {
      logo: baseElement(800, 135, 220, 110, 16, "SANS", 400, "#0f172a"),
      title: baseElement(
        800,
        275,
        1240,
        95,
        56,
        "ARABIC_NASKH",
        700,
        primaryColor,
      ),
      intro: baseElement(
        800,
        365,
        1120,
        55,
        25,
        "ARABIC_NASKH",
        400,
        "#475569",
      ),
      learnerName: baseElement(
        800,
        455,
        1180,
        110,
        64,
        "ARABIC_NASKH",
        700,
        "#0f172a",
      ),
      body: baseElement(800, 560, 1120, 95, 28, "ARABIC_NASKH", 400, "#475569"),
      courseTitle: baseElement(
        800,
        665,
        1120,
        100,
        38,
        "ARABIC_NASKH",
        700,
        "#0f172a",
      ),
      details: baseElement(
        800,
        755,
        980,
        48,
        22,
        "ARABIC_NASKH",
        400,
        "#64748b",
      ),
      score: baseElement(800, 795, 800, 44, 21, "ARABIC_NASKH", 500, "#475569"),
      signature: baseElement(800, 890, 260, 90, 16, "SANS", 400, "#0f172a"),
      signatoryName: baseElement(
        800,
        972,
        600,
        44,
        22,
        "ARABIC_NASKH",
        700,
        "#0f172a",
      ),
      signatoryTitle: baseElement(
        800,
        1004,
        600,
        40,
        18,
        "ARABIC_NASKH",
        400,
        "#64748b",
      ),
      certificateNumber: baseElement(
        115,
        1040,
        620,
        34,
        16,
        "SANS",
        400,
        "#64748b",
        "left",
      ),
      verificationCode: baseElement(
        115,
        1068,
        620,
        30,
        14,
        "SANS",
        400,
        "#64748b",
        "left",
      ),
    },
  };
}

function localeDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "en" ? "ltr" : "rtl";
}

function localizedValue(
  value: LocalizedText,
  locale: Locale,
  fallback: string,
): string {
  for (const key of [locale, "ku", "ar", "en"] as const) {
    const candidate = value[key];
    if (candidate?.trim()) return candidate.trim();
  }
  return fallback;
}

function normalizedTranslations(
  value: LocalizedText | undefined,
): LocalizedText {
  return {
    ku: value?.ku ?? "",
    ar: value?.ar ?? "",
    en: value?.en ?? "",
  };
}

function compactTranslations(value: LocalizedText): LocalizedText {
  const compacted: LocalizedText = {};

  for (const locale of ["ku", "ar", "en"] as const) {
    const candidate = value[locale]?.trim();
    if (candidate) compacted[locale] = candidate;
  }

  return compacted;
}

function fontFamilyCss(value: TrainingCertificateFontFamily): string {
  switch (value) {
    case "SERIF":
      return '"Noto Serif", "DejaVu Serif", serif';
    case "ARABIC_SANS":
      return '"Noto Sans Arabic", "Noto Sans", "DejaVu Sans", sans-serif';
    case "ARABIC_NASKH":
      return '"Noto Naskh Arabic", "Noto Sans Arabic", "DejaVu Sans", serif';
    case "SANS":
    default:
      return '"Noto Sans", "DejaVu Sans", sans-serif';
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function statusClass(status: TrainingCertificateTemplateStatus): string {
  if (status === "ACTIVE")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "ARCHIVED")
    return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function AssetField({
  field,
  label,
  value,
  labels,
  designer,
  onChange,
}: {
  field: string;
  label: string;
  value: string | null;
  labels: TrainingCertificateDictionary;
  designer: TrainingCertificateDesignerDictionary;
  onChange: (value: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File): Promise<void> {
    setError(null);

    if (
      file.size <= 0 ||
      file.size > maximumImageBytes ||
      !supportedImages.has(file.type)
    ) {
      setError(designer.uploadFailed);
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    try {
      const payload = new FormData();
      payload.set("kind", "IMAGE");
      payload.set("file", file, file.name || field);

      const response = await fetch("/api/files/upload", {
        method: "POST",
        credentials: "same-origin",
        body: payload,
      });

      const body = (await response.json()) as
        FileAsset | { message?: string | string[] };

      if (!response.ok || !("id" in body)) {
        const message =
          "message" in body
            ? Array.isArray(body.message)
              ? body.message[0]
              : body.message
            : null;
        throw new Error(message || designer.uploadFailed);
      }

      onChange(body.id);
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : designer.uploadFailed,
      );
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  const source =
    preview ??
    (value ? `/api/files/${encodeURIComponent(value)}/content` : null);

  return (
    <div className="grid gap-3 rounded-lg border border-line bg-surface-subtle/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-content">{label}</p>
        <span className="rounded-full border border-line bg-white px-2 py-0.5 text-[10px] font-medium text-muted">
          {designer.vectorSupported}
        </span>
      </div>

      <div
        className="h-28 overflow-hidden rounded-md border border-line bg-white bg-contain bg-center bg-no-repeat"
        style={source ? { backgroundImage: `url(${source})` } : undefined}
      >
        {!source ? (
          <div className="flex h-full items-center justify-center text-xs text-muted">
            —
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <label
          className={`inline-flex h-9 cursor-pointer items-center rounded-md bg-brand px-3 text-xs font-semibold text-white hover:bg-brand-hover ${
            uploading ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {uploading
            ? designer.uploading
            : value
              ? designer.replaceImage
              : designer.uploadImage}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml,.svg"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void upload(file);
            }}
          />
        </label>

        {value ? (
          <button
            type="button"
            onClick={() => {
              if (preview) URL.revokeObjectURL(preview);
              setPreview(null);
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-medium text-content hover:bg-surface-subtle"
          >
            {designer.removeImage}
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error || labels.uploadFailed}
        </p>
      ) : null}
    </div>
  );
}

export function TrainingCertificateTemplateForm({
  initial,
  labels,
  designer,
  presets,
  locale,
}: {
  initial?: TrainingCertificateTemplate;
  labels: TrainingCertificateDictionary;
  designer: TrainingCertificateDesignerDictionary;
  presets: TrainingCertificateBackgroundPreset[];
  locale: Locale;
}) {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<DesignerTab>("general");
  const [editLocale, setEditLocale] = useState<Locale>(locale);
  const [previewLocale, setPreviewLocale] = useState<Locale>(locale);
  const [key, setKey] = useState(initial?.key ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [status, setStatus] = useState<TrainingCertificateTemplateStatus>(
    initial?.status ?? "ACTIVE",
  );
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const [primaryColor, setPrimaryColor] = useState(
    initial?.primaryColor ?? "#714b67",
  );
  const [titleTranslations, setTitleTranslations] = useState<LocalizedText>(
    () => normalizedTranslations(initial?.titleTranslations),
  );
  const [introTranslations, setIntroTranslations] = useState<LocalizedText>(
    () => normalizedTranslations(initial?.introTranslations),
  );
  const [bodyTranslations, setBodyTranslations] = useState<LocalizedText>(() =>
    normalizedTranslations(initial?.bodyTranslations),
  );
  const [signatoryName, setSignatoryName] = useState(
    initial?.signatoryName ?? "",
  );
  const [signatoryTitle, setSignatoryTitle] = useState(
    initial?.signatoryTitle ?? "",
  );
  const [logo, setLogo] = useState(initial?.logoFileAssetId ?? null);
  const [background, setBackground] = useState(
    initial?.backgroundFileAssetId ?? null,
  );
  const [signature, setSignature] = useState(
    initial?.signatureFileAssetId ?? null,
  );
  const [backgroundPresetKey, setBackgroundPresetKey] = useState<string | null>(
    initial?.backgroundPresetKey ?? presets[0]?.key ?? null,
  );
  const [layout, setLayout] = useState<TrainingCertificateLayoutConfig>(
    initial?.layoutConfig ?? defaultLayout(initial?.primaryColor ?? "#714b67"),
  );
  const [selectedElement, setSelectedElement] =
    useState<ElementKey>("learnerName");
  const [showGuides, setShowGuides] = useState(false);
  const [dragging, setDragging] = useState<DragState>(null);
  const [sampleLearner, setSampleLearner] = useState("Daban Hameed Iskandar");
  const [sampleCourse, setSampleCourse] = useState(
    "Odoo Accounting: Getting Started",
  );
  const [sampleCompany, setSampleCompany] = useState("OdooKRD");
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const elementLabels = useMemo<Record<ElementKey, string>>(
    () => ({
      logo: designer.elementLogo,
      title: designer.elementTitle,
      intro: designer.elementIntro,
      learnerName: designer.elementLearnerName,
      body: designer.elementBody,
      courseTitle: designer.elementCourseTitle,
      details: designer.elementDetails,
      score: designer.elementScore,
      signature: designer.elementSignature,
      signatoryName: designer.elementSignatoryName,
      signatoryTitle: designer.elementSignatoryTitle,
      certificateNumber: designer.elementCertificateNumber,
      verificationCode: designer.elementVerificationCode,
    }),
    [designer],
  );

  const defaultCopy = useMemo(
    () => ({
      ku: {
        title: "بڕوانامەی تەواوکردن",
        intro: "ئەم بڕوانامەیە بە شانازییەوە پێشکەش دەکرێت بە",
        body: "بۆ بەسەرکەوتوویی تەواوکردنی پێداویستییە فێرکارییەکانی",
      },
      ar: {
        title: "شهادة إكمال",
        intro: "تُقدَّم هذه الشهادة بكل فخر إلى",
        body: "لإتمامه بنجاح جميع المتطلبات التعليمية الخاصة بـ",
      },
      en: {
        title: "Certificate of Completion",
        intro: "This certificate is proudly presented to",
        body: "for successfully completing all learning requirements for",
      },
    }),
    [],
  );

  const previewTitle = localizedValue(
    titleTranslations,
    previewLocale,
    defaultCopy[previewLocale].title,
  );
  const previewIntro = localizedValue(
    introTranslations,
    previewLocale,
    defaultCopy[previewLocale].intro,
  );
  const previewBody = localizedValue(
    bodyTranslations,
    previewLocale,
    defaultCopy[previewLocale].body,
  );

  const sampleDate = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date("2026-09-03T00:00:00Z"));

  const backgroundSource = backgroundPresetKey
    ? `/api/training/certificate-templates/presets/${encodeURIComponent(backgroundPresetKey)}/artwork`
    : background
      ? `/api/files/${encodeURIComponent(background)}/content`
      : null;
  const logoSource = logo
    ? `/api/files/${encodeURIComponent(logo)}/content`
    : null;
  const signatureSource = signature
    ? `/api/files/${encodeURIComponent(signature)}/content`
    : null;

  function updateTranslation(
    setter: (value: LocalizedText) => void,
    current: LocalizedText,
    value: string,
  ) {
    setter({ ...current, [editLocale]: value });
  }

  function updateElement(
    elementKey: ElementKey,
    patch: Partial<TrainingCertificateLayoutElement>,
  ): void {
    setLayout((current) => ({
      ...current,
      elements: {
        ...current.elements,
        [elementKey]: {
          ...current.elements[elementKey],
          ...patch,
        },
      },
    }));
  }

  function handlePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    elementKey: ElementKey,
  ): void {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    const element = layout.elements[elementKey];
    const canvasX = ((event.clientX - rect.left) / rect.width) * canvasWidth;
    const canvasY = ((event.clientY - rect.top) / rect.height) * canvasHeight;
    setSelectedElement(elementKey);
    setDragging({
      key: elementKey,
      offsetX: element.x - canvasX,
      offsetY: element.y - canvasY,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    if (!dragging) return;
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    const canvasX = ((event.clientX - rect.left) / rect.width) * canvasWidth;
    const canvasY = ((event.clientY - rect.top) / rect.height) * canvasHeight;
    updateElement(dragging.key, {
      x: Math.round(clamp(canvasX + dragging.offsetX, 0, canvasWidth)),
      y: Math.round(clamp(canvasY + dragging.offsetY, 0, canvasHeight)),
    });
  }

  function certificatePayload() {
    return {
      titleTranslations: compactTranslations(titleTranslations),
      introTranslations: compactTranslations(introTranslations),
      bodyTranslations: compactTranslations(bodyTranslations),
      logoFileAssetId: logo,
      backgroundFileAssetId: background,
      signatureFileAssetId: signature,
      signatoryName: signatoryName.trim() || null,
      signatoryTitle: signatoryTitle.trim() || null,
      primaryColor,
      backgroundPresetKey,
      layoutConfig: layout,
    };
  }

  async function previewPdf(): Promise<void> {
    setError(null);
    setPreviewing(true);
    const previewWindow = window.open("", "_blank");

    try {
      const response = await fetch(
        "/api/training/certificate-templates/preview",
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...certificatePayload(),
            locale: previewLocale,
            sampleLearnerName: sampleLearner.trim() || "Daban Hameed Iskandar",
            sampleCourseTitle:
              sampleCourse.trim() || "Odoo Accounting: Getting Started",
            sampleCompanyName: sampleCompany.trim() || "OdooKRD",
          }),
        },
      );

      if (!response.ok) {
        let message = designer.previewFailed;
        try {
          const body = (await response.json()) as {
            message?: string | string[];
          };
          message = Array.isArray(body.message)
            ? body.message[0] || message
            : body.message || message;
        } catch {
          // Preserve the localized fallback message for non-JSON errors.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (previewWindow) {
        previewWindow.location.replace(url);
      } else {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (caught: unknown) {
      previewWindow?.close();
      setError(
        caught instanceof Error ? caught.message : designer.previewFailed,
      );
    } finally {
      setPreviewing(false);
    }
  }

  async function duplicate(): Promise<void> {
    if (!initial) return;
    setDuplicating(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/training/certificate-templates/${encodeURIComponent(initial.id)}/duplicate`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        },
      );
      const body = (await response.json()) as
        TrainingCertificateTemplate | { message?: string | string[] };
      if (!response.ok || !("id" in body)) {
        const message =
          "message" in body
            ? Array.isArray(body.message)
              ? body.message[0]
              : body.message
            : null;
        throw new Error(message || designer.duplicateFailed);
      }
      router.push(
        `/admin/training/certificate-templates/${encodeURIComponent(body.id)}`,
      );
      router.refresh();
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : designer.duplicateFailed,
      );
      setDuplicating(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const hasTitle = ["ku", "ar", "en"].some((language) =>
      titleTranslations[language as Locale]?.trim(),
    );
    const hasBody = ["ku", "ar", "en"].some((language) =>
      bodyTranslations[language as Locale]?.trim(),
    );

    if (!hasTitle || !hasBody) {
      setError(designer.languageRequired);
      setSaving(false);
      return;
    }

    if (isDefault && status !== "ACTIVE") {
      setError(designer.defaultRequiresActive);
      setSaving(false);
      return;
    }

    const payload = {
      ...(initial ? {} : { key: key.trim() }),
      name: name.trim(),
      ...certificatePayload(),
      status,
      isDefault,
    };

    try {
      const response = await fetch(
        initial
          ? `/api/training/certificate-templates/${encodeURIComponent(initial.id)}`
          : "/api/training/certificate-templates",
        {
          method: initial ? "PATCH" : "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const body = (await response.json()) as {
        message?: string | string[];
      };
      if (!response.ok) {
        throw new Error(
          Array.isArray(body.message)
            ? body.message[0]
            : body.message || designer.saveFailed,
        );
      }

      router.push("/admin/training/certificate-templates");
      router.refresh();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : designer.saveFailed);
      setSaving(false);
    }
  }

  const selected = layout.elements[selectedElement];
  const selectedDefault = defaultLayout(primaryColor).elements[selectedElement];

  const tabs: Array<{ key: DesignerTab; label: string }> = [
    { key: "general", label: designer.generalTab },
    { key: "content", label: designer.contentTab },
    { key: "background", label: designer.backgroundTab },
    { key: "assets", label: designer.assetsTab },
    { key: "layout", label: designer.layoutTab },
  ];

  function previewNode(
    elementKey: ElementKey,
    content: string,
    options?: { image?: string | null; multiline?: boolean },
  ) {
    const element = layout.elements[elementKey];
    if (!element.visible || (!content && !options?.image)) return null;
    const selectedClass = selectedElement === elementKey;

    return (
      <button
        key={elementKey}
        type="button"
        onPointerDown={(event) => handlePointerDown(event, elementKey)}
        onClick={() => setSelectedElement(elementKey)}
        className={`absolute touch-none select-none rounded-sm border-0 bg-transparent p-0 transition-shadow ${
          selectedClass
            ? "z-20 ring-2 ring-brand ring-offset-1 ring-offset-white/70"
            : "z-10 hover:ring-1 hover:ring-brand/40"
        }`}
        style={{
          left: `${(element.x / canvasWidth) * 100}%`,
          top: `${(element.y / canvasHeight) * 100}%`,
          width: `${(element.width / canvasWidth) * 100}%`,
          height: `${(element.height / canvasHeight) * 100}%`,
          transform: "translate(-50%, -50%)",
          color: element.color,
          fontFamily: fontFamilyCss(element.fontFamily),
          fontWeight: element.fontWeight,
          fontStretch: "normal",
          letterSpacing: "normal",
          fontSize: `${(element.fontSize / canvasWidth) * 100}cqw`,
          lineHeight: options?.multiline ? 1.35 : 1.1,
          textAlign: element.align,
          cursor: dragging?.key === elementKey ? "grabbing" : "grab",
        }}
      >
        {options?.image ? (
          <div
            className="h-full w-full bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${options.image})` }}
          />
        ) : (
          <div
            dir={localeDirection(previewLocale)}
            className={`flex h-full w-full items-center ${
              options?.multiline ? "whitespace-normal" : "whitespace-nowrap"
            } ${
              element.align === "left"
                ? "justify-start"
                : element.align === "right"
                  ? "justify-end"
                  : "justify-center"
            }`}
          >
            <span
              className={options?.multiline ? "w-full" : "max-w-full truncate"}
            >
              {content}
            </span>
          </div>
        )}
      </button>
    );
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-content">
              {designer.designerTitle}
            </h2>
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}
            >
              {status === "ACTIVE"
                ? designer.statusActive
                : status === "ARCHIVED"
                  ? designer.statusArchived
                  : designer.statusDraft}
            </span>
            {isDefault ? (
              <span className="inline-flex rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
                {designer.defaultBadge}
              </span>
            ) : null}
          </div>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
            {designer.designerDescription}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {initial ? (
            <button
              type="button"
              disabled={duplicating}
              onClick={() => void duplicate()}
              className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-content hover:bg-surface-subtle disabled:opacity-60"
            >
              {duplicating ? designer.duplicating : designer.duplicateTemplate}
            </button>
          ) : null}
          <button
            type="button"
            disabled={previewing}
            onClick={() => void previewPdf()}
            className="inline-flex h-10 items-center rounded-md border border-brand/25 bg-brand-soft px-4 text-sm font-semibold text-brand hover:bg-brand/10 disabled:opacity-60"
          >
            {previewing ? designer.previewing : designer.previewPdf}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
          >
            {saving ? labels.saving : designer.saveTemplate}
          </button>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(340px,0.72fr)_minmax(0,1.28fr)]">
        <section className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
          <nav
            className="grid grid-cols-5 border-b border-line bg-surface-subtle/70"
            aria-label={designer.designerTitle}
          >
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`min-h-12 px-2 py-3 text-xs font-semibold transition-colors sm:text-sm ${
                  tab === item.key
                    ? "bg-white text-brand shadow-[inset_0_-2px_0_#714b67]"
                    : "text-muted hover:bg-white/60 hover:text-content"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="grid gap-5 p-4 sm:p-5">
            {tab === "general" ? (
              <>
                <div className="grid gap-4 2xl:grid-cols-2">
                  <label className="min-w-0 grid gap-2 text-sm font-medium text-content">
                    {designer.internalKey}
                    <input
                      dir="ltr"
                      required
                      disabled={Boolean(initial)}
                      value={key}
                      onChange={(event) => setKey(event.currentTarget.value)}
                      pattern="[a-z](?:[a-z0-9_]|-){1,99}"
                      maxLength={100}
                      className="h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand disabled:bg-surface-subtle"
                    />
                  </label>

                  <label className="min-w-0 grid gap-2 text-sm font-medium text-content">
                    {designer.internalName}
                    <input
                      required
                      value={name}
                      onChange={(event) => setName(event.currentTarget.value)}
                      maxLength={200}
                      className="h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand"
                    />
                  </label>
                </div>

                <div className="grid gap-4 2xl:grid-cols-2">
                  <label className="min-w-0 grid gap-2 text-sm font-medium text-content">
                    {designer.lifecycleStatus}
                    <select
                      value={status}
                      onChange={(event) => {
                        const next = event.currentTarget
                          .value as TrainingCertificateTemplateStatus;
                        setStatus(next);
                        if (next !== "ACTIVE") setIsDefault(false);
                      }}
                      className="h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand"
                    >
                      <option value="DRAFT">{designer.statusDraft}</option>
                      <option value="ACTIVE">{designer.statusActive}</option>
                      <option value="ARCHIVED">
                        {designer.statusArchived}
                      </option>
                    </select>
                  </label>

                  <label className="min-w-0 grid gap-2 text-sm font-medium text-content">
                    {designer.primaryColor}
                    <div className="flex h-11 items-center gap-2 rounded-md border border-line bg-white px-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(event) => {
                          const color = event.currentTarget.value;
                          setPrimaryColor(color);
                          updateElement("title", { color });
                        }}
                        className="size-8 rounded border-0 bg-transparent p-0"
                      />
                      <input
                        dir="ltr"
                        value={primaryColor}
                        onChange={(event) =>
                          setPrimaryColor(event.currentTarget.value)
                        }
                        pattern="#[0-9a-fA-F]{6}"
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                      />
                    </div>
                  </label>
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-line bg-surface-subtle/40 p-4">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    disabled={status !== "ACTIVE"}
                    onChange={(event) =>
                      setIsDefault(event.currentTarget.checked)
                    }
                    className="mt-1 size-4 accent-brand"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-content">
                      {designer.defaultTemplate}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted">
                      {designer.defaultTemplateHelp}
                    </span>
                  </span>
                </label>

                <div className="grid gap-3 rounded-lg border border-line bg-surface-subtle/30 p-4">
                  <p className="text-sm font-semibold text-content">
                    {designer.previewData}
                  </p>
                  <label className="grid gap-1.5 text-xs font-medium text-muted">
                    {designer.sampleLearner}
                    <input
                      value={sampleLearner}
                      onChange={(event) =>
                        setSampleLearner(event.currentTarget.value)
                      }
                      maxLength={250}
                      className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand"
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium text-muted">
                    {designer.sampleCourse}
                    <input
                      value={sampleCourse}
                      onChange={(event) =>
                        setSampleCourse(event.currentTarget.value)
                      }
                      maxLength={250}
                      className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand"
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs font-medium text-muted">
                    {designer.sampleCompany}
                    <input
                      value={sampleCompany}
                      onChange={(event) =>
                        setSampleCompany(event.currentTarget.value)
                      }
                      maxLength={200}
                      className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand"
                    />
                  </label>
                </div>
              </>
            ) : null}

            {tab === "content" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-content">
                    {designer.contentLanguage}
                  </p>
                  <div className="inline-flex rounded-md border border-line bg-surface-subtle p-1">
                    {(["ku", "ar", "en"] as const).map((language) => (
                      <button
                        key={language}
                        type="button"
                        onClick={() => {
                          setEditLocale(language);
                          setPreviewLocale(language);
                        }}
                        className={`h-8 rounded px-3 text-xs font-semibold ${
                          editLocale === language
                            ? "bg-white text-brand shadow-sm"
                            : "text-muted hover:text-content"
                        }`}
                      >
                        {language.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="min-w-0 grid gap-2 text-sm font-medium text-content">
                  {designer.certificateTitle}
                  <input
                    dir={localeDirection(editLocale)}
                    value={titleTranslations[editLocale] ?? ""}
                    onChange={(event) =>
                      updateTranslation(
                        setTitleTranslations,
                        titleTranslations,
                        event.currentTarget.value,
                      )
                    }
                    maxLength={1500}
                    className="h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand"
                  />
                </label>

                <label className="min-w-0 grid gap-2 text-sm font-medium text-content">
                  {designer.introText}
                  <input
                    dir={localeDirection(editLocale)}
                    value={introTranslations[editLocale] ?? ""}
                    onChange={(event) =>
                      updateTranslation(
                        setIntroTranslations,
                        introTranslations,
                        event.currentTarget.value,
                      )
                    }
                    maxLength={1500}
                    placeholder={defaultCopy[editLocale].intro}
                    className="h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand"
                  />
                  <span className="text-xs font-normal text-muted">
                    {designer.introTextHelp}
                  </span>
                </label>

                <label className="min-w-0 grid gap-2 text-sm font-medium text-content">
                  {designer.bodyText}
                  <textarea
                    dir={localeDirection(editLocale)}
                    value={bodyTranslations[editLocale] ?? ""}
                    onChange={(event) =>
                      updateTranslation(
                        setBodyTranslations,
                        bodyTranslations,
                        event.currentTarget.value,
                      )
                    }
                    maxLength={1500}
                    rows={4}
                    className="min-h-28 rounded-md border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                  />
                </label>

                <div className="grid gap-4 2xl:grid-cols-2">
                  <label className="min-w-0 grid gap-2 text-sm font-medium text-content">
                    {designer.signatoryName}
                    <input
                      value={signatoryName}
                      onChange={(event) =>
                        setSignatoryName(event.currentTarget.value)
                      }
                      maxLength={200}
                      className="h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand"
                    />
                  </label>
                  <label className="min-w-0 grid gap-2 text-sm font-medium text-content">
                    {designer.signatoryTitle}
                    <input
                      value={signatoryTitle}
                      onChange={(event) =>
                        setSignatoryTitle(event.currentTarget.value)
                      }
                      maxLength={200}
                      className="h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand"
                    />
                  </label>
                </div>
              </>
            ) : null}

            {tab === "background" ? (
              <>
                <div>
                  <p className="text-sm font-semibold text-content">
                    {designer.backgroundPresets}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {designer.backgroundPresetHelp}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {presets.map((preset) => {
                    const selectedPreset = backgroundPresetKey === preset.key;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => {
                          setBackgroundPresetKey(preset.key);
                          setBackground(null);
                        }}
                        className={`overflow-hidden rounded-lg border text-start transition-shadow ${
                          selectedPreset
                            ? "border-brand ring-2 ring-brand/20"
                            : "border-line hover:border-brand/40 hover:shadow-sm"
                        }`}
                      >
                        <div
                          className="aspect-[1600/1131] bg-white bg-cover bg-center"
                          style={{
                            backgroundImage: `url(/api/training/certificate-templates/presets/${encodeURIComponent(preset.key)}/artwork)`,
                          }}
                        />
                        <div className="border-t border-line p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-content">
                              {preset.name}
                            </p>
                            {selectedPreset ? (
                              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">
                                {designer.selectedPreset}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-muted">
                            {preset.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBackgroundPresetKey(null);
                    setBackground(null);
                  }}
                  className={`inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold ${
                    !backgroundPresetKey && !background
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line bg-white text-content hover:bg-surface-subtle"
                  }`}
                >
                  {designer.noBackground}
                </button>

                <div className="border-t border-line pt-5">
                  <p className="text-sm font-semibold text-content">
                    {designer.customBackground}
                  </p>
                  <p className="mb-3 mt-1 text-xs leading-5 text-muted">
                    {designer.customBackgroundHelp}
                  </p>
                  <AssetField
                    field="certificate-background"
                    label={designer.customBackground}
                    value={background}
                    labels={labels}
                    designer={designer}
                    onChange={(value) => {
                      setBackground(value);
                      if (value) setBackgroundPresetKey(null);
                    }}
                  />
                </div>
              </>
            ) : null}

            {tab === "assets" ? (
              <div className="grid gap-4">
                <AssetField
                  field="certificate-logo"
                  label={designer.logo}
                  value={logo}
                  labels={labels}
                  designer={designer}
                  onChange={setLogo}
                />
                <AssetField
                  field="certificate-signature"
                  label={designer.signature}
                  value={signature}
                  labels={labels}
                  designer={designer}
                  onChange={setSignature}
                />
              </div>
            ) : null}

            {tab === "layout" ? (
              <>
                <div>
                  <p className="text-sm font-semibold text-content">
                    {designer.selectedElement}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {designer.elementHelp}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(Object.keys(layout.elements) as ElementKey[]).map(
                    (elementKey) => (
                      <button
                        key={elementKey}
                        type="button"
                        onClick={() => setSelectedElement(elementKey)}
                        className={`min-h-10 rounded-md border px-2 py-2 text-xs font-semibold ${
                          selectedElement === elementKey
                            ? "border-brand bg-brand-soft text-brand"
                            : "border-line bg-white text-content hover:bg-surface-subtle"
                        }`}
                      >
                        {elementLabels[elementKey]}
                      </button>
                    ),
                  )}
                </div>

                <div className="grid gap-4 rounded-lg border border-line bg-surface-subtle/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-content">
                      {elementLabels[selectedElement]}
                    </p>
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-content">
                      <input
                        type="checkbox"
                        checked={selected.visible}
                        onChange={(event) =>
                          updateElement(selectedElement, {
                            visible: event.currentTarget.checked,
                          })
                        }
                        className="size-4 accent-brand"
                      />
                      {designer.visible}
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <NumberField
                      label={designer.xPosition}
                      value={selected.x}
                      min={0}
                      max={1600}
                      onChange={(value) =>
                        updateElement(selectedElement, { x: value })
                      }
                    />
                    <NumberField
                      label={designer.yPosition}
                      value={selected.y}
                      min={0}
                      max={1131}
                      onChange={(value) =>
                        updateElement(selectedElement, { y: value })
                      }
                    />
                    <NumberField
                      label={designer.width}
                      value={selected.width}
                      min={40}
                      max={1600}
                      onChange={(value) =>
                        updateElement(selectedElement, { width: value })
                      }
                    />
                    <NumberField
                      label={designer.height}
                      value={selected.height}
                      min={20}
                      max={1131}
                      onChange={(value) =>
                        updateElement(selectedElement, { height: value })
                      }
                    />
                  </div>

                  {!(["logo", "signature"] as ElementKey[]).includes(
                    selectedElement,
                  ) ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <NumberField
                          label={designer.fontSize}
                          value={selected.fontSize}
                          min={10}
                          max={120}
                          onChange={(value) =>
                            updateElement(selectedElement, { fontSize: value })
                          }
                        />
                        <NumberField
                          label={designer.fontWeight}
                          value={selected.fontWeight}
                          min={300}
                          max={800}
                          step={100}
                          onChange={(value) =>
                            updateElement(selectedElement, {
                              fontWeight: value,
                            })
                          }
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1.5 text-xs font-medium text-muted">
                          {designer.fontFamily}
                          <select
                            value={selected.fontFamily}
                            onChange={(event) =>
                              updateElement(selectedElement, {
                                fontFamily: event.currentTarget
                                  .value as TrainingCertificateFontFamily,
                              })
                            }
                            className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand"
                          >
                            <option value="SANS">{designer.fontSans}</option>
                            <option value="SERIF">{designer.fontSerif}</option>
                            <option value="ARABIC_SANS">
                              {designer.fontArabicSans}
                            </option>
                            <option value="ARABIC_NASKH">
                              {designer.fontArabicNaskh}
                            </option>
                          </select>
                        </label>

                        <label className="grid gap-1.5 text-xs font-medium text-muted">
                          {designer.alignment}
                          <select
                            value={selected.align}
                            onChange={(event) =>
                              updateElement(selectedElement, {
                                align: event.currentTarget.value as
                                  "left" | "center" | "right",
                              })
                            }
                            className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand"
                          >
                            <option value="left">{designer.alignLeft}</option>
                            <option value="center">
                              {designer.alignCenter}
                            </option>
                            <option value="right">{designer.alignRight}</option>
                          </select>
                        </label>
                      </div>

                      <label className="grid gap-1.5 text-xs font-medium text-muted">
                        {designer.textColor}
                        <div className="flex h-10 items-center gap-2 rounded-md border border-line bg-white px-2">
                          <input
                            type="color"
                            value={selected.color}
                            onChange={(event) =>
                              updateElement(selectedElement, {
                                color: event.currentTarget.value,
                              })
                            }
                            className="size-7 border-0 bg-transparent p-0"
                          />
                          <input
                            dir="ltr"
                            value={selected.color}
                            onChange={(event) =>
                              updateElement(selectedElement, {
                                color: event.currentTarget.value,
                              })
                            }
                            className="min-w-0 flex-1 bg-transparent text-sm text-content outline-none"
                          />
                        </div>
                      </label>
                    </>
                  ) : null}

                  <button
                    type="button"
                    onClick={() =>
                      updateElement(selectedElement, selectedDefault)
                    }
                    className="inline-flex h-9 items-center justify-center rounded-md border border-line bg-white px-3 text-xs font-semibold text-content hover:bg-surface-subtle"
                  >
                    {designer.resetElement}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setLayout(defaultLayout(primaryColor))}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-content hover:bg-surface-subtle"
                >
                  {designer.resetLayout}
                </button>
              </>
            ) : null}
          </div>
        </section>

        <aside className="self-start xl:sticky xl:top-24">
          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-subtle/60 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-content">
                  {designer.livePreview}
                </p>
                <p className="mt-0.5 text-xs text-muted">{designer.dragHint}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={previewLocale}
                  onChange={(event) =>
                    setPreviewLocale(event.currentTarget.value as Locale)
                  }
                  className="h-9 rounded-md border border-line bg-white px-2 text-xs font-semibold text-content outline-none"
                >
                  <option value="ku">KU</option>
                  <option value="ar">AR</option>
                  <option value="en">EN</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowGuides((value) => !value)}
                  className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-semibold text-content hover:bg-surface-subtle"
                >
                  {showGuides ? designer.hideGuides : designer.showGuides}
                </button>
              </div>
            </div>

            <div className="bg-slate-100 p-3 sm:p-5">
              <div
                ref={previewRef}
                onPointerMove={handlePointerMove}
                onPointerUp={() => setDragging(null)}
                onPointerCancel={() => setDragging(null)}
                className="relative mx-auto aspect-[1600/1131] w-full max-w-[900px] overflow-hidden bg-white shadow-xl [container-type:inline-size]"
              >
                {backgroundSource ? (
                  <div
                    className="pointer-events-none absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${backgroundSource})` }}
                  />
                ) : null}

                {showGuides ? (
                  <>
                    <div className="pointer-events-none absolute inset-[5%] z-30 border border-dashed border-brand/50" />
                    <div className="pointer-events-none absolute left-1/2 top-0 z-30 h-full border-l border-dashed border-brand/20" />
                    <div className="pointer-events-none absolute left-0 top-1/2 z-30 w-full border-t border-dashed border-brand/20" />
                    <span className="pointer-events-none absolute start-[5.5%] top-[5.5%] z-30 rounded bg-white/80 px-1.5 py-0.5 text-[9px] font-semibold text-brand">
                      {designer.safeArea}
                    </span>
                  </>
                ) : null}

                {previewNode("logo", "", { image: logoSource })}
                {previewNode("title", previewTitle)}
                {previewNode("intro", previewIntro)}
                {previewNode("learnerName", sampleLearner)}
                {previewNode("body", previewBody, { multiline: true })}
                {previewNode("courseTitle", sampleCourse, { multiline: true })}
                {previewNode("details", `${sampleCompany} · ${sampleDate}`)}
                {previewNode(
                  "score",
                  previewLocale === "ku"
                    ? "نمرەی کۆتایی: 95%"
                    : previewLocale === "ar"
                      ? "النتيجة النهائية: 95%"
                      : "Final score: 95%",
                )}
                {previewNode("signature", "", { image: signatureSource })}
                {previewNode("signatoryName", signatoryName)}
                {previewNode("signatoryTitle", signatoryTitle)}
                {previewNode(
                  "certificateNumber",
                  "Certificate: OKRD-TRN-PREVIEW",
                )}
                {previewNode("verificationCode", "Verification code: PREVIEW")}
              </div>
            </div>

            <div className="grid gap-3 border-t border-line px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <p className="text-xs leading-5 text-muted">
                {designer.exactPreviewHelp}
              </p>
              <button
                type="button"
                disabled={previewing}
                onClick={() => void previewPdf()}
                className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
              >
                {previewing ? designer.previewing : designer.previewPdf}
              </button>
            </div>
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap justify-end gap-3 rounded-xl border border-line bg-white p-4 shadow-sm">
        <Link
          href="/admin/training/certificate-templates"
          className="inline-flex h-10 items-center rounded-md border border-line bg-white px-4 text-sm font-medium text-content hover:bg-surface-subtle"
        >
          {labels.cancel}
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center rounded-md bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {saving ? labels.saving : designer.saveTemplate}
        </button>
      </div>
    </form>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted">
      {label}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const next = Number(event.currentTarget.value);
          if (Number.isFinite(next)) onChange(clamp(next, min, max));
        }}
        className="h-10 rounded-md border border-line bg-white px-3 text-sm text-content outline-none focus:border-brand"
      />
    </label>
  );
}
