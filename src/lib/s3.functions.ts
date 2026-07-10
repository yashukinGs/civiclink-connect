import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EXPIRES_IN = 60 * 60; // 1 hour

async function getPresigner() {
  const { S3Client } = await import("@aws-sdk/client-s3");
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_S3_BUCKET;
  if (!region || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("AWS credentials are not fully configured.");
  }
  const client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return { client, bucket, region };
}

export const getS3UploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fileName: string; contentType: string }) => input)
  .handler(async ({ data, context }) => {
    const { client, bucket, region } = await getPresigner();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

    const ext = data.fileName.split(".").pop()?.toLowerCase() || "bin";
    const key = `${context.userId}/${crypto.randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: data.contentType || "application/octet-stream",
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: EXPIRES_IN });
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    return { uploadUrl, key, publicUrl };
  });

export const getS3DownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string }) => input)
  .handler(async ({ data }) => {
    const { client, bucket } = await getPresigner();
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

    const command = new GetObjectCommand({ Bucket: bucket, Key: data.key });
    const url = await getSignedUrl(client, command, { expiresIn: EXPIRES_IN });
    return { url };
  });

export const deleteS3Object = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string }) => input)
  .handler(async ({ data, context }) => {
    // Only allow users to delete their own prefix
    if (!data.key.startsWith(`${context.userId}/`)) {
      throw new Error("Forbidden");
    }
    const { client, bucket } = await getPresigner();
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: data.key }));
    return { ok: true };
  });
