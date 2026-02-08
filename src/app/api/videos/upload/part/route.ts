import {UploadPartCommand} from "@aws-sdk/client-s3";
import {z} from "zod";
import {env} from "@/lib/env";
import {getR2Client} from "@/lib/r2/client";

const MAX_PART_SIZE = 5 * 1024 * 1024; // 5MB, under Netlify 6MB request limit

export async function POST(req: Request) {
  try {
    if (!env.R2_BUCKET) {
      return Response.json({error: "R2_BUCKET missing"}, {status: 500});
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | Blob | null;
    const keyParam = formData.get("key") as string | null;
    const uploadIdParam = formData.get("uploadId") as string | null;
    const partNumberParam = formData.get("partNumber") as string | null;

    if (!file || !(file instanceof Blob) || file.size === 0) {
      return Response.json({error: "Missing or empty part file"}, {status: 400});
    }
    if (!keyParam?.trim() || !uploadIdParam?.trim() || !partNumberParam) {
      return Response.json({error: "Missing key, uploadId, or partNumber"}, {status: 400});
    }

    const partNumber = parseInt(partNumberParam, 10);
    if (isNaN(partNumber) || partNumber < 1 || partNumber > 10000) {
      return Response.json({error: "Invalid partNumber (1-10000)"}, {status: 400});
    }

    if (file.size > MAX_PART_SIZE) {
      return Response.json(
        {error: `Part size exceeds ${MAX_PART_SIZE / 1024 / 1024}MB limit`},
        {status: 400}
      );
    }

    const key = keyParam.trim();
    const uploadId = uploadIdParam.trim();
    const client = getR2Client();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const {ETag} = await client.send(
      new UploadPartCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: buffer,
      })
    );

    return Response.json({etag: ETag?.replace(/"/g, ""), partNumber});
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    // eslint-disable-next-line no-console
    console.error("[upload/part] failed:", e);
    return Response.json({error: "Part upload failed", message}, {status: 500});
  }
}
