// 单语言：仅中文
export const locales = ["zh"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh";
