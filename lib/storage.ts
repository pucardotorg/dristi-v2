import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ---------------------------------------------------------------------------
// S3-compatible storage client
//
// Works with any S3-compatible provider (AWS S3, Cloudflare R2, MinIO, etc.)
// by swapping env vars — zero code changes.
//
// Required env:
//   S3_ENDPOINT          – e.g. http://localhost:9000 (MinIO) or https://<id>.r2.cloudflarestorage.com
//   S3_ACCESS_KEY_ID     – access key
//   S3_SECRET_ACCESS_KEY – secret key
//   S3_BUCKET            – bucket name
//   S3_REGION            – region (default: auto)
// ---------------------------------------------------------------------------

function getEnv(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback;
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    endpoint: getEnv("S3_ENDPOINT"),
    region: getEnv("S3_REGION", "auto"),
    credentials: {
      accessKeyId: getEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: getEnv("S3_SECRET_ACCESS_KEY"),
    },
    forcePathStyle: true, // Required for MinIO / R2
  });
  return _client;
}

function bucket(): string {
  return getEnv("S3_BUCKET");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface UploadParams {
  /** S3 object key (path inside bucket), e.g. "cases/abc/cheque.pdf" */
  key: string;
  /** File body as Buffer or Uint8Array */
  body: Buffer | Uint8Array;
  /** MIME type, e.g. "application/pdf" */
  contentType: string;
  /** Optional metadata */
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  bucket: string;
}

/** Upload a file to S3. */
export async function upload(params: UploadParams): Promise<UploadResult> {
  const b = bucket();
  await getClient().send(
    new PutObjectCommand({
      Bucket: b,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      Metadata: params.metadata,
    })
  );
  return { key: params.key, bucket: b };
}

/** Get a time-limited presigned download URL. Default 1 hour. */
export async function getPresignedUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
    { expiresIn: expiresInSeconds }
  );
}

/** Download raw file bytes. */
export async function download(key: string): Promise<{
  body: ReadableStream;
  contentType: string | undefined;
}> {
  const res = await getClient().send(
    new GetObjectCommand({ Bucket: bucket(), Key: key })
  );
  return {
    body: res.Body!.transformToWebStream(),
    contentType: res.ContentType,
  };
}

/** Check if a key exists. */
export async function exists(key: string): Promise<boolean> {
  try {
    await getClient().send(
      new HeadObjectCommand({ Bucket: bucket(), Key: key })
    );
    return true;
  } catch {
    return false;
  }
}

/** Delete a file from S3. */
export async function remove(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: bucket(), Key: key })
  );
}

/** Build a deterministic key for case documents. */
export function caseDocKey(
  caseId: string,
  docType: string,
  filename: string
): string {
  // Sanitise filename — keep extension, strip path separators
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `cases/${caseId}/${docType}/${safe}`;
}
