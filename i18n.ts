import {cookies} from "next/headers";
import {getRequestConfig} from "next-intl/server";
import {defaultLocale, locales, type Locale} from "./src/i18n/locales";

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  const locale: Locale = localeCookie && isLocale(localeCookie) ? localeCookie : defaultLocale;

  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
