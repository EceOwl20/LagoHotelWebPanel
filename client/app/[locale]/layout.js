import { Geist, Geist_Mono } from "next/font/google";
import "react-datepicker/dist/react-datepicker.css";
import "../globals.css";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getMessages, setRequestLocale } from 'next-intl/server'   // ← setRequestLocale ekledik
import ClientLayoutWrapper from "./ClientLayoutWrapper";
import { listPublishedPageNavigation } from "@/lib/admin/pages";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Lago Hotel",
  description: "Lago Hotel Antalya",
  icons: {
    icon: "/favicon.ico",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// ✅ async function tanımlanıyor
export default async function RootLayout({ children, params }) {
  const { locale } = await params;

  if (!routing.locales.includes(locale)) {
    notFound();
  }

   // 1) Gelen locale bilgisini Next Intl’in store’una yazıyoruz
   setRequestLocale(locale)
  
    // 2) Ardından mesajları yükleyip client’a iletebiliriz
    const messages = await getMessages()
    const dynamicNavigation = await listPublishedPageNavigation(locale)


  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClientLayoutWrapper dynamicNavigation={dynamicNavigation}>
            {children}
          </ClientLayoutWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
