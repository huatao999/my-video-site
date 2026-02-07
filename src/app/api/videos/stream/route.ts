/**
 * 视频代理流：从 R2 拉取视频并流式传输到浏览器
 * 解决预签名 URL 在浏览器中的 CORS 问题
 */

import {Readable} from "stream";
import {GetObjectCommand} from "@aws-sdk/client-s3";
import {z} from "zod";
import {env} from "@/lib/env";
import {getR2Client, resolveObjectKey} from "@/lib/r2/client";

const querySchema = z.object({
  key: z.string().min(1),
});

// 视频/图片 MIME 类型映射
const MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
  ".mov": "video/quicktime",
  ".m3u8": "application/x-mpegURL",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

function getContentType(key: string): string {
  const ext = key.toLowerCase().slice(key.lastIndexOf("."));
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

export async function GET(req: Request) {
  try {
    if (!env.R2_BUCKET) {
      return new Response("R2_BUCKET missing", {status: 500});
    }

    const url = new URL(req.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      return new Response("Invalid key", {status: 400});
    }

    const resolvedKey = resolveObjectKey(parsed.data.key);
    const client = getR2Client();

    const rangeHeader = req.headers.get("range");

    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: resolvedKey,
      ...(rangeHeader ? {Range: rangeHeader} : {}),
    });

    const response = await client.send(command);
    const body = response.Body;

    if (!body) {
      return new Response("Video not found", {status: 404});
    }

    const contentLength = response.ContentLength ?? response.ContentRange?.split("/")[1];
    const contentType = (response.ContentType as string) || getContentType(resolvedKey);

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
      "Accept-Ranges": "bytes",
    };

    if (contentLength != null) {
      headers["Content-Length"] = String(contentLength);
    }

    if (response.ContentRange) {
      headers["Content-Range"] = response.ContentRange;
    }

    const status = rangeHeader ? 206 : 200;

    // 将 Node Readable 转为 Web ReadableStream（Node 18+）
    const webStream = Readable.toWeb(body as Readable) as ReadableStream;

    return new Response(webStream, {
      status,
      headers,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("[videos/stream] failed:", e);
    return new Response(message, {status: 500});
  }
}
