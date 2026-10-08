import type { Metadata } from "next";
import { Caveat, Fraunces, Geist, Geist_Mono } from "next/font/google";

import { SITE_URL } from "@/core/lib/seo";
import { ThemeStyle } from "@/core/theme/theme-style";
import { storeConfig } from "@/store.config";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Serif de exhibición — ecos del monograma "AM" del logo. Sólo para
// titulares (utilidad `font-serif`); el cuerpo sigue en Geist.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

// Manuscrita — sólo para firmas sobre fotos ("Fábrica a la vista"),
// utilidad `font-script`.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

// Metadata por defecto del framework. Cada página la extiende; la
// identidad concreta (nombre/descripción/locale) sale de `store.config.ts`.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: storeConfig.name,
    template: `%s · ${storeConfig.name}`,
  },
  description: storeConfig.description,
  openGraph: {
    type: "website",
    siteName: storeConfig.name,
    locale: storeConfig.locale,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${caveat.variable} h-full`}
    >
      <head>
        <ThemeStyle />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
