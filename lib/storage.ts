import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const storageBuckets = ["images", "documents", "files"] as const;
export type StorageBucket = (typeof storageBuckets)[number];

const publicBuckets = new Set<StorageBucket>(["images", "documents"]);

export function isStorageBucket(value: string): value is StorageBucket {
  return storageBuckets.includes(value as StorageBucket);
}

export function storageClient() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!endpoint || !region || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
}

export function publicObjectUrl(bucket: StorageBucket, objectKey: string) {
  if (!publicBuckets.has(bucket)) return null;
  const endpoint = process.env.AWS_ENDPOINT_URL_S3?.replace(/\/$/, "");
  if (!endpoint) return null;
  return `${endpoint}/${bucket}/${objectKey.split("/").map(encodeURIComponent).join("/")}`;
}

export function fileHref(file: { id: string; bucket: string; objectKey: string }) {
  if (isStorageBucket(file.bucket)) {
    return publicObjectUrl(file.bucket, file.objectKey) ?? `/api/files/${file.id}`;
  }
  return `/api/files/${file.id}`;
}

export async function putStoredObject(bucket: StorageBucket, objectKey: string, body: Buffer, contentType: string) {
  const client = storageClient();
  if (!client) throw new Error("Object storage is not configured");
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteStoredObject(bucket: StorageBucket, objectKey: string) {
  const client = storageClient();
  if (!client) throw new Error("Object storage is not configured");
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
}

export async function readStoredObject(bucket: StorageBucket, objectKey: string) {
  const client = storageClient();
  if (!client) throw new Error("Object storage is not configured");
  return client.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey }));
}

export async function signedObjectUrl(bucket: StorageBucket, objectKey: string) {
  const client = storageClient();
  if (!client) return null;
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: objectKey }), { expiresIn: 300 });
}
