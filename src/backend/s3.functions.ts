import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  createIssueObjectKey,
  createS3DownloadSignedUrl,
  createS3UploadSignedUrl,
  deleteS3ObjectKey,
  uploadS3Object,
  type S3RuntimeConfig,
} from "@/backend/s3.server";

export const getS3UploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fileName: string; contentType: string }) => input)
  .handler(async ({ data, context }) => {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_S3_BUCKET;
  if (!region || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("AWS credentials are not fully configured.");
  }
    const config: S3RuntimeConfig = { region, accessKeyId, secretAccessKey, bucket };
    const key = createIssueObjectKey(context.userId, data.fileName);

    const uploadUrl = await createS3UploadSignedUrl(
      config,
      key,
      data.contentType || "application/octet-stream",
      60 * 60,
    );
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    return { uploadUrl, key, publicUrl };
  });

export const uploadS3File = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fileName: string; contentType: string; base64Data: string }) => input)
  .handler(async ({ data, context }) => {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucket = process.env.AWS_S3_BUCKET;
    if (!region || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error("AWS credentials are not fully configured.");
    }
    const config: S3RuntimeConfig = { region, accessKeyId, secretAccessKey, bucket };

    const rawBase64 = data.base64Data.includes(",")
      ? data.base64Data.split(",").pop() || ""
      : data.base64Data;
    const binary = atob(rawBase64);
    if (binary.length > 10 * 1024 * 1024) {
      throw new Error("Each file must be smaller than 10 MB.");
    }

    const body = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      body[index] = binary.charCodeAt(index);
    }

    const key = createIssueObjectKey(context.userId, data.fileName);
    await uploadS3Object(config, {
      key,
      contentType: data.contentType || "application/octet-stream",
      body,
    });

    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    return { key, publicUrl };
  });

export const getS3DownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { key: string }) => input)
  .handler(async ({ data }) => {
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucket = process.env.AWS_S3_BUCKET;
    if (!region || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error("AWS credentials are not fully configured.");
    }
    const config: S3RuntimeConfig = { region, accessKeyId, secretAccessKey, bucket };

    const url = await createS3DownloadSignedUrl(config, data.key, 60 * 60);
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
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucket = process.env.AWS_S3_BUCKET;
    if (!region || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error("AWS credentials are not fully configured.");
    }
    const config: S3RuntimeConfig = { region, accessKeyId, secretAccessKey, bucket };

    await deleteS3ObjectKey(config, data.key);
    return { ok: true };
  });
