"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { admissionRecords } from "@/db/schema";
import { ensureCurrentUser, hasAdminAccess } from "@/lib/auth";
import { snapshotOf, toAdmissionRecord, validateAdmission, type AdmissionDraft, type AdmissionRecord } from "@/lib/admissions";

async function requireAdmin() {
  const user = await ensureCurrentUser();
  if (!user || !hasAdminAccess(user)) redirect("/account?error=admin");
  const db = getDb();
  if (!db) redirect("/admin");
  return db;
}

function refresh() {
  revalidatePath("/admissions");
  revalidatePath("/admin/academics");
}

async function recordsAfter(db: Awaited<ReturnType<typeof requireAdmin>>) {
  const rows = await db.select().from(admissionRecords).orderBy(admissionRecords.updatedAt);
  return rows.flatMap((row) => {
    const record = toAdmissionRecord(row);
    return record ? [record] : [];
  }).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function stored(draft: AdmissionDraft, id: string, published: boolean, snapshot: AdmissionDraft | null, createdAt: Date) {
  return {
    id,
    title: draft.title,
    department: draft.department,
    introduction: draft.introduction,
    minAge: draft.minAge,
    maxAge: draft.maxAge,
    gradeRange: draft.gradeRange,
    eligibilityNote: draft.eligibilityNote,
    documents: JSON.stringify(draft.documents),
    steps: JSON.stringify(draft.steps),
    additional: draft.additional,
    published,
    publishedSnapshot: snapshot ? JSON.stringify(snapshotOf(snapshot)) : null,
    createdAt,
    updatedAt: new Date(),
  };
}

export async function saveAdmission(input: AdmissionDraft & { id?: string }): Promise<{ ok: true; record: AdmissionRecord; records: AdmissionRecord[] } | { ok: false; error: string }> {
  const db = await requireAdmin();
  const parsed = validateAdmission(input);
  if (!parsed.ok) return parsed;
  const draft = parsed.value;
  const id = input.id || crypto.randomUUID();
  try {
    if (input.id) {
      const [current] = await db.select().from(admissionRecords).where(eq(admissionRecords.id, input.id)).limit(1);
      const record = current ? toAdmissionRecord(current) : null;
      if (!record) return { ok: false, error: "That admission record could not be found." };
      await db.update(admissionRecords).set({
        title: draft.title,
        department: draft.department,
        introduction: draft.introduction,
        minAge: draft.minAge,
        maxAge: draft.maxAge,
        gradeRange: draft.gradeRange,
        eligibilityNote: draft.eligibilityNote,
        documents: JSON.stringify(draft.documents),
        steps: JSON.stringify(draft.steps),
        additional: draft.additional,
        updatedAt: new Date(),
      }).where(eq(admissionRecords.id, input.id));
    } else {
      await db.insert(admissionRecords).values(stored(draft, id, false, null, new Date()));
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not save admission");
    return { ok: false, error: "Could not save this admission record. Your entries are still here." };
  }
  refresh();
  const records = await recordsAfter(db);
  const record = records.find((item) => item.id === id);
  if (!record) return { ok: false, error: "The record was saved, but it could not be reloaded." };
  return { ok: true, record, records };
}

export async function publishAdmission(id: string): Promise<{ ok: true; records: AdmissionRecord[] } | { ok: false; error: string }> {
  const db = await requireAdmin();
  const [current] = await db.select().from(admissionRecords).where(eq(admissionRecords.id, id)).limit(1);
  const record = current ? toAdmissionRecord(current) : null;
  if (!record) return { ok: false, error: "That admission record could not be found." };
  const parsed = validateAdmission(record);
  if (!parsed.ok) return parsed;
  try {
    await db.update(admissionRecords).set({
      published: true,
      publishedSnapshot: JSON.stringify(snapshotOf(parsed.value)),
      updatedAt: new Date(),
    }).where(eq(admissionRecords.id, id));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not publish admission");
    return { ok: false, error: "Could not publish this record." };
  }
  refresh();
  return { ok: true, records: await recordsAfter(db) };
}

export async function unpublishAdmission(id: string): Promise<{ ok: true; records: AdmissionRecord[] } | { ok: false; error: string }> {
  const db = await requireAdmin();
  try {
    await db.update(admissionRecords).set({ published: false, updatedAt: new Date() }).where(eq(admissionRecords.id, id));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not unpublish admission");
    return { ok: false, error: "Could not unpublish this record." };
  }
  refresh();
  return { ok: true, records: await recordsAfter(db) };
}

export async function deleteAdmission(id: string): Promise<{ ok: true; records: AdmissionRecord[] } | { ok: false; error: string }> {
  const db = await requireAdmin();
  try {
    await db.delete(admissionRecords).where(eq(admissionRecords.id, id));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not delete admission");
    return { ok: false, error: "Could not delete this record." };
  }
  refresh();
  return { ok: true, records: await recordsAfter(db) };
}
