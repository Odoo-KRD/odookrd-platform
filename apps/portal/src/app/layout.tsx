import type { Metadata } from "next";
import { Noto_Kufi_Arabic, Noto_Sans_Arabic } from "next/font/google";

import { getTextDirection } from "@/lib/i18n/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getPublicSettings } from "@/lib/public-settings";

import "./globals.css";

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-noto-kufi-arabic",
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-noto-sans-arabic",
});

const fontStacks: Record<string, string> = {
  "Noto Kufi Arabic":
    'var(--font-noto-kufi-arabic), "Noto Kufi Arabic", system-ui, sans-serif',
  "Noto Sans Arabic":
    'var(--font-noto-sans-arabic), "Noto Sans Arabic", system-ui, sans-serif',
  Arial: "Arial, system-ui, sans-serif",
  "system-ui": "system-ui, sans-serif",
};

export async function generateMetadata(): Promise<Metadata> {
  const [settings, { dictionary }] = await Promise.all([
    getPublicSettings(),
    getDictionary(),
  ]);

  return {
    title: {
      default: `${settings.siteTitle} | ${dictionary.common.platform}`,
      template: `%s | ${settings.siteTitle}`,
    },
    description: dictionary.common.secureAccess,
    robots: { index: false, follow: false },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [locale, settings] = await Promise.all([
    getLocale(),
    getPublicSettings(),
  ]);

  return (
    <html
      lang={locale}
      dir={getTextDirection(locale)}
      className={`h-full ${notoKufiArabic.variable} ${notoSansArabic.variable}`}
    >
      <body
        className="min-h-full antialiased"
        style={{
          fontFamily:
            fontStacks[settings.defaultFont] ?? fontStacks["system-ui"],
        }}
      >
        {children}
      </body>
    </html>
  );
}
