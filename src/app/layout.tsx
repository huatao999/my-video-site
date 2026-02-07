import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import {NextIntlClientProvider} from "next-intl";
import {getMessages} from "next-intl/server";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import SiteLogo from "@/components/layout/SiteLogo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "视频站",
  description: "中文视频网站",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages({locale: "zh"});

  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider locale="zh" messages={messages}>
          <div className="min-h-dvh bg-neutral-950 text-neutral-50">
            <header className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 sm:gap-6">
                <SiteLogo />
                <Navigation />
              </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 pb-10">{children}</main>
            <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-neutral-400">
              © {new Date().getFullYear()} 视频站
            </footer>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
