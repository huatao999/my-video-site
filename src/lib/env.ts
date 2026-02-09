import {z} from "zod";

const envSchema = z.object({
  // Cloudflare R2 (S3-compatible)
  R2_ACCOUNT_ID: z.string().optional(),
  // R2_ACCESS_KEY_ID: 之前为了防止误填 Cloudflare API Token，限制长度必须为 32。
  // 但在 Netlify 等环境中，如果变量配置有误，会在导入阶段直接抛错，
  // 导致所有使用 R2 的 API 变成 500 Internal Error（Netlify 显示带 ID 的 Internal Error 页面）。
  // 为了让错误在业务代码里被捕获并返回更友好的 JSON，而不是函数直接崩溃，
  // 这里放宽为任意非空字符串，具体校验和错误提示交给调用 R2 的代码处理。
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  // 可选：R2 对象键前缀。若视频在 my-video-site/ 下，则设为 "my-video-site/"
  R2_PREFIX: z.string().optional(),
  // Optional: public CDN base, e.g. https://cdn.example.com
  PUBLIC_CDN_BASE_URL: z.string().url().optional(),
  // VAST Ad URLs (ExoClick / Adsterra)
  // 预留接口：申请成功后填入对应的 VAST Tag URL
  VAST_EXOCLICK_PRE_ROLL: z.string().url().optional(),
  VAST_EXOCLICK_MID_ROLL: z.string().url().optional(),
  VAST_EXOCLICK_POST_ROLL: z.string().url().optional(),
  VAST_ADSTERRA_PRE_ROLL: z.string().url().optional(),
  VAST_ADSTERRA_MID_ROLL: z.string().url().optional(),
  VAST_ADSTERRA_POST_ROLL: z.string().url().optional(),
  // Ad provider selection: "exoclick" | "adsterra" | "both" | "none"
  AD_PROVIDER: z.enum(["exoclick", "adsterra", "both", "none"]).default("none"),
  // Enable/disable ads globally
  ADS_ENABLED: z
    .string()
    .optional()
    .transform((val) => val === "true" || val === "1"),
  // Admin authentication
  ADMIN_PASSWORD: z.string().optional(),
});

export const env = envSchema.parse({
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET: process.env.R2_BUCKET,
  R2_PREFIX: process.env.R2_PREFIX,
  PUBLIC_CDN_BASE_URL: process.env.PUBLIC_CDN_BASE_URL,
  VAST_EXOCLICK_PRE_ROLL: process.env.VAST_EXOCLICK_PRE_ROLL,
  VAST_EXOCLICK_MID_ROLL: process.env.VAST_EXOCLICK_MID_ROLL,
  VAST_EXOCLICK_POST_ROLL: process.env.VAST_EXOCLICK_POST_ROLL,
  VAST_ADSTERRA_PRE_ROLL: process.env.VAST_ADSTERRA_PRE_ROLL,
  VAST_ADSTERRA_MID_ROLL: process.env.VAST_ADSTERRA_MID_ROLL,
  VAST_ADSTERRA_POST_ROLL: process.env.VAST_ADSTERRA_POST_ROLL,
  AD_PROVIDER: process.env.AD_PROVIDER,
  ADS_ENABLED: process.env.ADS_ENABLED,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
});

