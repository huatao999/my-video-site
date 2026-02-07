"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {useTranslations} from "next-intl";
import type {Locale} from "@/i18n/locales";

export default function Navigation({locale}: {locale: Locale}) {
  const t = useTranslations("navigation");
  const pathname = usePathname();

  const navItems = [
    {href: "/", label: t("home")},
    {href: "/videos", label: t("videos")},
  ];

  return (
    <nav className="flex gap-4 sm:gap-6">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center text-sm font-medium underline-offset-4 transition-all duration-200 hover:underline touch-manipulation ${
              isActive ? "text-neutral-50 hover:text-white" : "text-neutral-400 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
