"use client";

import {useRouter} from "next/navigation";
import {locales, type Locale} from "@/i18n/locales";

function setLocaleCookie(locale: string) {
  document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
}

export default function LanguageSwitcher({currentLocale}: {currentLocale: Locale}) {
  const router = useRouter();

  return (
    <nav className="flex items-center gap-1.5 sm:gap-2 text-xs">
      {(locales as readonly Locale[]).map((loc) => {
        const active = loc === currentLocale;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => {
              setLocaleCookie(loc);
              router.refresh();
            }}
            className={[
              "rounded-md px-2.5 py-2 transition touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center",
              active ? "bg-white text-black" : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700 active:bg-neutral-600",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            {loc.toUpperCase()}
          </button>
        );
      })}
    </nav>
  );
}

