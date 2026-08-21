import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import MaintenanceBanner from "@/components/system/MaintenanceBanner";
import { Watermark } from "@/components/system/Watermark";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fmtmufa.uz"),
  title: {
    default: "O'zbekiston Murabbiylar ta'limi — Murabbiy Litsenziya Tizimi",
    template: "%s | UFA Litsenziya",
  },
  description:
    "O'zbekiston futbol murabbiylari uchun rasmiy litsenziya olish tizimi. Onlayn ariza topshirish, litsenziya holatini kuzatish va murabbiylik hujjatlarini boshqarish.",
  keywords: [
    "futbol murabbiy litsenziyasi",
    "UFA",
    "O'zbekiston Futbol Assotsiatsiyasi",
    "murabbiylar ta'limi",
    "coach license Uzbekistan",
  ],
  openGraph: {
    title: "O'zbekiston Murabbiylar ta'limi",
    description:
      "Futbol murabbiylari uchun rasmiy litsenziya olish tizimi.",
    url: "https://fmtmufa.uz",
    siteName: "UFA Litsenziya Tizimi",
    images: [
      {
        url: "/fmtm.uz.png",
        width: 1200,
        height: 630,
        alt: "UFA Litsenziya Tizimi logotipi",
      },
    ],
    locale: "uz_UZ",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-64.png", type: "image/png", sizes: "64x64" },
    ],
    shortcut: { url: "/favicon.ico" },
    apple: { url: "/favicon-180.png", sizes: "180x180" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={cn("font-sans", geistSans.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <I18nProvider>
            {/* FMTM watermark — faqat admin va foydalanuvchi panellarida */}
            <Watermark />
            <MaintenanceBanner />
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
