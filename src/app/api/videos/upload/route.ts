import {PutObjectCommand} from "@aws-sdk/client-s3";
import {z} from "zod";
import {env} from "@/lib/env";
import {getR2Client, resolveObjectKey} from "@/lib/r2/client";

const bodySchema = z.object({
  key: z.string().min(1),
  contentType: z.string().min(1).default("video/mp4"),
});

/**
 * 服务端代理上传：客户端 POST 文件到本 API，API 上传到 R2。
 * 避免直传 R2 时的 CORS 问题。
 */
export async function POST(req: Request) {
  try {
    if (!env.R2_BUCKET) {
      return Response.json({error: "R2_BUCKET missing"}, {status: 500});
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const keyParam = formData.get("key") as string | null;
    const contentTypeParam = (formData.get("contentType") as string | null) || "video/mp4";

    if (!file || !file.size) {
      return Response.json({error: "请选择要上传的文件"}, {status: 400});
    }
    if (!keyParam || !keyParam.trim()) {
      return Response.json({error: "缺少 key 参数"}, {status: 400});
    }

    const parsed = bodySchema.safeParse({
      key: keyParam.trim(),
      contentType: contentTypeParam,
    });
    if (!parsed.success) {
      return Response.json({error: "Invalid body", details: parsed.error.flatten()}, {status: 400});
    }

    const {key, contentType} = parsed.data;
    const resolvedKey = resolveObjectKey(key);
    const client = getR2Client();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: resolvedKey,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return Response.json({success: true, key: resolvedKey});
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("[upload] failed:", e);
    return Response.json({error: "上传失败", message}, {status: 500});
  }
}
