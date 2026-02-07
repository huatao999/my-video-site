import {S3Client} from "@aws-sdk/client-s3";
import {env} from "@/lib/env";

/**
 * 将用户输入的 key（如 ep1.mp4）解析为 R2 完整对象键。
 * 若配置了 R2_PREFIX（如 my-video-site/），则自动加上前缀。
 */
export function resolveObjectKey(userKey: string): string {
  const prefix = env.R2_PREFIX?.trim();
  if (!prefix) return userKey;
  const p = prefix.endsWith("/") ? prefix : prefix + "/";
  if (userKey.startsWith(p)) return userKey;
  return p + userKey.replace(/^\//, "");
}

export function getR2Client() {
  // Cloudflare R2 uses S3-compatible endpoint:
  // https://<accountid>.r2.cloudflarestorage.com
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 env vars missing. Please set R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY.");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

