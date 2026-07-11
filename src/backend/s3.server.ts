import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface S3RuntimeConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

interface S3UploadInput {
  key: string;
  contentType: string;
  body: Uint8Array;
}

function createClient(config: S3RuntimeConfig) {
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

export function createIssueObjectKey(userId: string, fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  return `${userId}/${crypto.randomUUID()}.${ext}`;
}

function awsErrorDetails(error: unknown) {
  const err = error as {
    name?: string;
    message?: string;
    Code?: string;
    code?: string;
    $metadata?: {
      httpStatusCode?: number;
      requestId?: string;
      extendedRequestId?: string;
      cfId?: string;
    };
  };

  return {
    code: err.name || err.Code || err.code || "S3Error",
    message: err.message || "AWS S3 request failed.",
    status: err.$metadata?.httpStatusCode,
    requestId: err.$metadata?.requestId,
    extendedRequestId: err.$metadata?.extendedRequestId,
    cfId: err.$metadata?.cfId,
  };
}

function toS3Error(action: string, error: unknown) {
  const details = awsErrorDetails(error);
  console.error(`[S3 ${action}] failed`, details);

  return new Error(
    `S3 ${action} failed` +
      (details.status ? ` [${details.status}]` : "") +
      (details.code ? ` — ${details.code}` : "") +
      (details.message ? `: ${details.message}` : "") +
      (details.requestId ? ` (RequestId ${details.requestId})` : ""),
  );
}

export async function uploadS3Object(config: S3RuntimeConfig, input: S3UploadInput) {
  const client = createClient(config);
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType || "application/octet-stream",
      }),
    );
  } catch (error) {
    throw toS3Error("upload", error);
  }
}

export async function createS3UploadSignedUrl(
  config: S3RuntimeConfig,
  key: string,
  contentType: string,
  expiresIn: number,
) {
  const client = createClient(config);
  try {
    return await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ContentType: contentType || "application/octet-stream",
      }),
      { expiresIn },
    );
  } catch (error) {
    throw toS3Error("sign upload", error);
  }
}

export async function createS3DownloadSignedUrl(
  config: S3RuntimeConfig,
  key: string,
  expiresIn: number,
) {
  const client = createClient(config);
  try {
    return await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: config.bucket, Key: key }),
      { expiresIn },
    );
  } catch (error) {
    throw toS3Error("sign download", error);
  }
}

export async function deleteS3ObjectKey(config: S3RuntimeConfig, key: string) {
  const client = createClient(config);
  try {
    await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
  } catch (error) {
    throw toS3Error("delete", error);
  }
}