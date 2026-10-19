import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { neon } from "@neondatabase/serverless";

function loadEnv(text) {
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

const groups = [
  ["images", "public/images"],
  ["documents", "public/Documents"],
];

const contentTypes = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
loadEnv(envText);

const client = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
});
const sql = neon(process.env.DATABASE_URL);

let uploaded = 0;
for (const [bucket, folder] of groups) {
  const dir = path.join(process.cwd(), folder);
  const names = await readdir(dir);
  for (const filename of names) {
    const existing = await sql`select id from stored_files where bucket = ${bucket} and filename = ${filename} limit 1`;
    if (existing.length > 0) continue;
    const body = await readFile(path.join(dir, filename));
    const objectKey = `${crypto.randomUUID()}-${filename.replace(/[^a-zA-Z0-9._-]+/g, "-")}`;
    const contentType = contentTypes[path.extname(filename).toLowerCase()] ?? "application/octet-stream";
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: body,
        ContentType: contentType,
      }),
    );
    await sql`
      insert into stored_files (id, bucket, object_key, filename, content_type, size_bytes)
      values (${crypto.randomUUID()}, ${bucket}, ${objectKey}, ${filename}, ${contentType}, ${body.length})
    `;
    uploaded += 1;
  }
}

console.log(`uploaded ${uploaded}`);
