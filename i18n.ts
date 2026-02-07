import {getRequestConfig} from "next-intl/server";

// 单语言：始终使用中文
export default getRequestConfig(async () => {
  return {
    locale: "zh",
    messages: (await import("./messages/zh.json")).default,
  };
});
