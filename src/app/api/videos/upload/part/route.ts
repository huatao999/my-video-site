import {UploadPartCommand} from "@aws-sdk/client-s3";
import {z} from "zod";
import {env} from "@/lib/env";
import {getR2Client} from "@/lib/r2/client";

// Netlify Functions 单次请求体上限约为 6MB。
// 由于这里使用 multipart/form-data，实际请求体大小 > 纯文件大小，
// 若设置为 5MB，编码后的体积可能逼近甚至超过 6MB，导致 Netlify 在到达函数前就直接返回 Internal Error。
// 为了避免这种情况，将服务器端允许的分片大小与前端 CHUNK_SIZE 保持一致：2MB。
const MAX_PART_SIZE = 2 * 1024 * 1024; // 2MB, stay well below Netlify 6MB limit

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
