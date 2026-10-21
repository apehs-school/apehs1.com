"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { scholarshipRecords } from "@/db/schema";
import { ensureCurrentUser, hasAdminAccess } from "@/lib/auth";
import { toScholarshipRecord, validateScholarship, type ScholarshipDraft, type ScholarshipRecord } from "@/lib/scholarships";

async function requireAdmin() {
  const user = await ensureCurrentUser();
  if (!user || !hasAdminAccess(user)) redirect("/account?error=admin");
  const db = getDb();
  if (!db) redirect("/admin");
  return db;
}

function refresh() {
  revalidatePath("/scholarship");
  revalidatePath("/admin/academics");
}

async function recordsAfter(db: Awaited<ReturnType<typeof requireAdmin>>) {
  const rows = await db.select().from(scholarshipRecords).orderBy(desc(scholarshipRecords.updatedAt));
  return rows.flatMap((row) => {
    const record = toScholarshipRecord(row);
    return record ? [record] : [];
  });
}

export async function saveScholarship(input: ScholarshipDraft & { id?: string }): Promise<{ ok: true; record: ScholarshipRecord; records: ScholarshipRecord[] } | { ok: false; error: string }> {
  const db = await requireAdmin();
  const parsed = validateScholarship(input);
  if (!parsed.ok) return parsed;
  const draft = parsed.value;
  const id = input.id || crypto.randomUUID();
  try {
    if (input.id) {
      const [current] = await db.select().from(scholarshipRecords).where(eq(scholarshipRecords.id, input.id)).limit(1);
      if (!current) return { ok: false, error: "That scholarship record could not be found." };
      await db.update(scholarshipRecords).set({ ...draft, updatedAt: new Date() }).where(eq(scholarshipRecords.id, input.id));
    } else {
      await db.insert(scholarshipRecords).values({ ...draft, id, published: false, createdAt: new Date(), updatedAt: new Date() });
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not save scholarship");
    return { ok: false, error: "Could not save this scholarship. Your entries are still here." };
  }
  refresh();
  const records = await recordsAfter(db);
  const record = records.find((item) => item.id === id);
  if (!record) return { ok: false, error: "The record was saved, but it could not be reloaded." };
  return { ok: true, record, records };
}

export async function publishScholarship(id: string): Promise<{ ok: true; records: ScholarshipRecord[] } | { ok: false; error: string }> {
  const db = await requireAdmin();
  const [current] = await db.select().from(scholarshipRecords).where(eq(scholarshipRecords.id, id)).limit(1);
  if (!current || !toScholarshipRecord(current)) return { ok: false, error: "That scholarship record could not be found." };
  try {
    await db.update(scholarshipRecords).set({ published: true, updatedAt: new Date() }).where(eq(scholarshipRecords.id, id));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not publish scholarship");
    return { ok: false, error: "Could not publish this record." };
  }
  refresh();
  return { ok: true, records: await recordsAfter(db) };
}

export async function unpublishScholarship(id: string): Promise<{ ok: true; records: ScholarshipRecord[] } | { ok: false; error: string }> {
  const db = await requireAdmin();
  try {
    await db.update(scholarshipRecords).set({ published: false, updatedAt: new Date() }).where(eq(scholarshipRecords.id, id));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not unpublish scholarship");
    return { ok: false, error: "Could not unpublish this record." };
  }
  refresh();
  return { ok: true, records: await recordsAfter(db) };
}

export async function deleteScholarship(id: string): Promise<{ ok: true; records: ScholarshipRecord[] } | { ok: false; error: string }> {
  const db = await requireAdmin();
  try {
    await db.delete(scholarshipRecords).where(eq(scholarshipRecords.id, id));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not delete scholarship");
    return { ok: false, error: "Could not delete this record." };
  }
  refresh();
  return { ok: true, records: await recordsAfter(db) };
}
