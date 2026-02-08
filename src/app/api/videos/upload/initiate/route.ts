import {CreateMultipartUploadCommand} from "@aws-sdk/client-s3";
import {z} from "zod";
import {env} from "@/lib/env";
import {getR2Client, resolveObjectKey} from "@/lib/r2/client";

const bodySchema = z.object({
  key: z.string().min(1),
  contentType: z.string().min(1).default("video/mp4"),
});

export async function POST(req: Request) {
  try {
    if (!env.R2_BUCKET) {
      return Response.json({error: "R2_BUCKET missing"}, {status: 500});
    }

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({error: "Invalid body", details: parsed.error.flatten()}, {status: 400});
    }

    const {key, contentType} = parsed.data;
    const resolvedKey = resolveObjectKey(key);
    const client = getR2Client();

    const {UploadId} = await client.send(
      new CreateMultipartUploadCommand({
        Bucket: env.R2_BUCKET,
        Key: resolvedKey,
        ContentType: contentType,
      })
    );

    return Response.json({uploadId: UploadId, key: resolvedKey});
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("[upload/initiate] failed:", e);
    return Response.json({error: "Initiate upload failed", message}, {status: 500});
  }
}
