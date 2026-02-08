import {CompleteMultipartUploadCommand} from "@aws-sdk/client-s3";
import {z} from "zod";
import {env} from "@/lib/env";
import {getR2Client} from "@/lib/r2/client";

const partSchema = z.object({
  partNumber: z.number().int().min(1).max(10000),
  etag: z.string().min(1),
});

const bodySchema = z.object({
  key: z.string().min(1),
  uploadId: z.string().min(1),
  parts: z.array(partSchema).min(1).max(10000),
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

    const {key, uploadId, parts} = parsed.data;
    const client = getR2Client();

    parts.sort((a, b) => a.partNumber - b.partNumber);

    const MultipartUpload = {
      Parts: parts.map((p) => ({
        PartNumber: p.partNumber,
        ETag: p.etag.startsWith('"') ? p.etag : `"${p.etag}"`,
      })),
    };

    await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        UploadId: uploadId,
        MultipartUpload,
      })
    );

    return Response.json({success: true, key});
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("[upload/complete] failed:", e);
    return Response.json({error: "Complete upload failed", message}, {status: 500});
  }
}
