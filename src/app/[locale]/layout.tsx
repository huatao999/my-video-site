import type {Metadata} from "next";
import {NextIntlClientProvider} from "next-intl";
import {getMessages} from "next-intl/server";
import {locales, type Locale} from "@/i18n/locales";
import Navigation from "@/components/layout/Navigation";
import SiteLogo from "@/components/layout/SiteLogo";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

export const metadata: Metadata = {
  title: "视频站",
  description: "中文/英文视频网站",
};

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export default async function LocaleLayout({children, params}: Props) {
  const {locale} = await params;
  const validLocale = isValidLocale(locale) ? locale : "zh";
  const messages = await getMessages({locale: validLocale});

  return (
    <NextIntlClientProvider locale={validLocale} messages={messages}>
      <div className="min-h-dvh bg-neutral-950 text-neutral-50">
        <header className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <SiteLogo />
            <Navigation locale={validLocale} />
            <LanguageSwitcher currentLocale={validLocale} />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 pb-10">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-neutral-400">
          © {new Date().getFullYear()} 视频站
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
