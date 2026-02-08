import {AbortMultipartUploadCommand} from "@aws-sdk/client-s3";
import {z} from "zod";
import {env} from "@/lib/env";
import {getR2Client} from "@/lib/r2/client";

const bodySchema = z.object({
  key: z.string().min(1),
  uploadId: z.string().min(1),
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

    const {key, uploadId} = parsed.data;
    const client = getR2Client();

    await client.send(
      new AbortMultipartUploadCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        UploadId: uploadId,
      })
    );

    return Response.json({success: true});
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("[upload/abort] failed:", e);
    return Response.json({error: "Abort upload failed", message}, {status: 500});
  }
}
