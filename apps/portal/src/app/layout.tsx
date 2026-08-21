import type { Metadata } from "next";

import { getTextDirection } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "OdooKRD | Customer Platform",
    template: "%s | OdooKRD",
  },
  description: "Secure OdooKRD customer and administration platform.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={getTextDirection(locale)} className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
