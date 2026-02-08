import type {Metadata} from "next";
import type {Locale} from "@/i18n/locales";
import {Geist, Geist_Mono} from "next/font/google";
import Link from "next/link";
import {NextIntlClientProvider} from "next-intl";
import {getMessages, getLocale} from "next-intl/server";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import SiteLogo from "@/components/layout/SiteLogo";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "视频站",
  description: "中文/英文视频网站",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localeRaw = await getLocale();
  const locale = (localeRaw === "zh" || localeRaw === "en") ? localeRaw : "zh";
  const messages = await getMessages();

  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="min-h-dvh bg-neutral-950 text-neutral-50">
            <header className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                <SiteLogo />
                <Navigation locale={locale as "zh" | "en"} />
                <LanguageSwitcher currentLocale={locale as Locale} />
              </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 pb-10">{children}</main>
            <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-neutral-400">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span>© {new Date().getFullYear()} Video Platform</span>
                <nav className="flex flex-wrap gap-4">
                  <Link href="/about" className="hover:text-neutral-200">About Us</Link>
                  <Link href="/privacy" className="hover:text-neutral-200">Privacy Policy</Link>
                  <Link href="/terms" className="hover:text-neutral-200">Terms of Service</Link>
                  <Link href="/dmca" className="hover:text-neutral-200">DMCA</Link>
                </nav>
              </div>
            </footer>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
