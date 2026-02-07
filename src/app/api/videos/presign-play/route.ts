import {GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {z} from "zod";
import {env} from "@/lib/env";
import {getR2Client, resolveObjectKey} from "@/lib/r2/client";

const querySchema = z.object({
  key: z.string().min(1),
  // seconds
  expires: z.coerce.number().int().min(60).max(60 * 60).default(15 * 60),
});

export async function GET(req: Request) {
  try {
    if (!env.R2_BUCKET) {
      return Response.json(
        {
          error: "R2_BUCKET missing",
          hint: "请在 Netlify Site settings > Environment variables 中设置 R2_BUCKET 等 R2 环境变量",
        },
        {status: 500}
      );
    }

    const url = new URL(req.url);
    const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      return Response.json({error: "Invalid query", details: parsed.error.flatten()}, {status: 400});
    }

    const {key, expires} = parsed.data;
    const resolvedKey = resolveObjectKey(key);
    const client = getR2Client();

    const signed = await getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: resolvedKey,
      }),
      {expiresIn: expires},
    );

    return Response.json({url: signed, expiresIn: expires});
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("[presign-play] failed:", e);
    return Response.json({error: "Presign play failed", message}, {status: 500});
  }
}

