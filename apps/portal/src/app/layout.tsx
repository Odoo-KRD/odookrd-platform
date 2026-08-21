import type { Metadata } from "next";

import { getTextDirection } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { getPublicSettings } from "@/lib/public-settings";

import "./globals.css";

const fontStacks: Record<string, string> = {
  "Noto Kufi Arabic": '"Noto Kufi Arabic", system-ui, sans-serif',
  "Noto Sans Arabic": '"Noto Sans Arabic", system-ui, sans-serif',
  Arial: "Arial, system-ui, sans-serif",
  "system-ui": "system-ui, sans-serif",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings();

  return {
    title: {
      default: `${settings.siteTitle} | Customer Platform`,
      template: `%s | ${settings.siteTitle}`,
    },
    description: "Secure customer and administration platform.",
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
    <html lang={locale} dir={getTextDirection(locale)} className="h-full">
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
