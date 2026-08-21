import type { Locale } from "@odookrd/types";
import { cache } from "react";

import { apiRequest } from "@/lib/api";
import { DEFAULT_LOCALE, isSupportedLocale } from "@/lib/i18n/config";

export interface PublicSettings {
  siteTitle: string;
  defaultLocale: Locale;
  defaultFont: string;
}

const fallback: PublicSettings = {
  siteTitle: "OdooKRD",
  defaultLocale: DEFAULT_LOCALE,
  defaultFont: "Noto Kufi Arabic",
};

const supportedFonts = new Set([
  "Noto Kufi Arabic",
  "Noto Sans Arabic",
  "Arial",
  "system-ui",
]);

export const getPublicSettings = cache(async (): Promise<PublicSettings> => {
  try {
    const value = await apiRequest<{
      siteTitle?: unknown;
      defaultLocale?: unknown;
      defaultFont?: unknown;
    }>("/settings/public");

    return {
      siteTitle:
        typeof value.siteTitle === "string" && value.siteTitle.trim().length > 0
          ? value.siteTitle
          : fallback.siteTitle,
      defaultLocale: isSupportedLocale(value.defaultLocale)
        ? value.defaultLocale
        : fallback.defaultLocale,
      defaultFont:
        typeof value.defaultFont === "string" &&
        supportedFonts.has(value.defaultFont)
          ? value.defaultFont
          : fallback.defaultFont,
    };
  } catch {
    return fallback;
  }
});
