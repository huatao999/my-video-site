import {defineRouting} from "next-intl/routing";

export const routing = defineRouting({
  locales: ["zh", "en"],
  defaultLocale: "zh",
  localePrefix: "never", // 不使用路径前缀，用 cookie 管理语言
});
