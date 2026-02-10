/**
 * Monetag 站点验证：将 /sw.js 请求代理到此 API，返回 MONETAG_SW_JS_CONTENT 的内容。
 * Monetag 要求 sw.js 必须在站点根路径，Next.js 的 public/ 只能放静态文件，
 * 所以通过 next.config rewrites 将 /sw.js 映射到此 API。
 *
 * 在 Netlify 环境变量中设置 MONETAG_SW_JS_CONTENT，值为 Monetag 验证页面下载的 sw.js 完整文件内容。
 */
import {env} from "@/lib/env";

export async function GET() {
  const content = env.MONETAG_SW_JS_CONTENT?.trim();
  if (!content) {
    return new Response("Not found", {status: 404});
  }

  return new Response(content, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
