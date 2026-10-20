"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { storedFiles } from "@/db/schema";
import { ensureCurrentUser, hasAdminAccess } from "@/lib/auth";
import { setNotice } from "@/lib/notice";
import { deleteStoredObject, isStorageBucket, putStoredObject } from "@/lib/storage";

const maxBytes = 25 * 1024 * 1024;

async function requireAdmin() {
  const user = await ensureCurrentUser();
  if (!user || !hasAdminAccess(user)) redirect("/account?error=admin");
  const db = getDb();
  if (!db) redirect("/admin/files");
  return db;
}

function safeName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned.slice(0, 120) || "file";
}

export async function uploadStoredFile(formData: FormData) {
  const db = await requireAdmin();
  const kind = String(formData.get("kind") ?? "");
  const upload = formData.get("file");
  if (!isStorageBucket(kind) || !(upload instanceof File) || upload.size === 0) return;
  if (upload.size > maxBytes) return;

  const filename = upload.name || "file";
  const objectKey = `${crypto.randomUUID()}-${safeName(filename)}`;
  const contentType = upload.type || "application/octet-stream";
  const body = Buffer.from(await upload.arrayBuffer());
  await putStoredObject(kind, objectKey, body, contentType);
  await db.insert(storedFiles).values({
    id: crypto.randomUUID(),
    bucket: kind,
    objectKey,
    filename,
    contentType,
    sizeBytes: body.length,
  });
  await setNotice("File uploaded");
  revalidatePath("/admin/files");
}

export async function deleteStoredFile(formData: FormData) {
  const db = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const [file] = await db.select().from(storedFiles).where(eq(storedFiles.id, id)).limit(1);
  if (!file || !isStorageBucket(file.bucket)) return;
  await deleteStoredObject(file.bucket, file.objectKey);
  await db.delete(storedFiles).where(eq(storedFiles.id, id));
  await setNotice("File deleted");
  revalidatePath("/admin/files");
}
