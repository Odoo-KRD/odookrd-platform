import type { Locale } from "@odookrd/types";

import { LOCALE_METADATA } from "@/lib/i18n/config";

export function formatDate(value: string, locale: Locale): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(LOCALE_METADATA[locale].dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string, locale: Locale): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(LOCALE_METADATA[locale].dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Kurdish (Sorani) phrasing for relative times. The ckb locale data shipped
 * with Node and browsers has no relative-time patterns, so
 * Intl.RelativeTimeFormat("ckb-IQ") falls back to fragments like "-١٢ h".
 */
function kurdishRelativeTime(seconds: number, number: Intl.NumberFormat) {
  const past = seconds <= 0;
  const absolute = Math.abs(seconds);
  const phrase = (value: number, unit: string) =>
    `${number.format(value)} ${unit} ${past ? "لەمەوبەر" : "لە ئێستاوە"}`;

  if (absolute < 60) {
    return "ئێستا";
  }

  if (absolute < 3600) {
    return phrase(Math.round(absolute / 60), "خولەک");
  }

  if (absolute < 86_400) {
    return phrase(Math.round(absolute / 3600), "کاتژمێر");
  }

  const days = Math.round(absolute / 86_400);

  if (days === 1) {
    return past ? "دوێنێ" : "بەیانی";
  }

  return phrase(days, "ڕۆژ");
}

/**
 * "5 minutes ago" in the viewer's language. Falls back to the absolute date
 * after a week, where a relative phrase stops being useful.
 */
export function formatRelativeTime(
  value: string,
  locale: Locale,
  now: Date = new Date(),
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const absolute = Math.abs(seconds);

  if (absolute >= 604_800) {
    return formatDate(value, locale);
  }

  const dateLocale = LOCALE_METADATA[locale].dateLocale;

  if (locale === "ku") {
    return kurdishRelativeTime(seconds, new Intl.NumberFormat(dateLocale));
  }

  const format = new Intl.RelativeTimeFormat(dateLocale, { numeric: "auto" });

  if (absolute < 60) {
    return format.format(0, "second");
  }

  if (absolute < 3600) {
    return format.format(Math.round(seconds / 60), "minute");
  }

  if (absolute < 86_400) {
    return format.format(Math.round(seconds / 3600), "hour");
  }

  return format.format(Math.round(seconds / 86_400), "day");
}
