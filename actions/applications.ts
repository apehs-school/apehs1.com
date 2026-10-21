"use server";

import { eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { admissionApplications, storedFiles } from "@/db/schema";
import { parseDeclaration, parseDocuments, parsePerson, validateDeclaration, validateDocuments, validateEmergency, validateOffice, validatePerson, type ApplicationDocument } from "@/lib/application-people";
import { validateApplication } from "@/lib/applications";
import { ensureCurrentUser, hasAdminAccess } from "@/lib/auth";
import { deleteStoredObject, isStorageBucket, putStoredObject } from "@/lib/storage";

const imageTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const fileTypes = new Set([...imageTypes, "application/pdf"]);
const maxFileBytes = 8 * 1024 * 1024;

function cleanName(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned.slice(0, 80) || "file";
}

async function requireAdmin() {
  const user = await ensureCurrentUser();
  if (!user || !hasAdminAccess(user)) redirect("/account?error=admin");
  const db = getDb();
  if (!db) redirect("/admin");
  return db;
}

export async function uploadApplicationFile(formData: FormData): Promise<{ ok: true; fileId: string } | { ok: false; error: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: "Files cannot be saved right now." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose a file." };
  if (!fileTypes.has(file.type)) return { ok: false, error: "Use a JPG, PNG, WebP, GIF, or PDF file." };
  if (file.size > maxFileBytes) return { ok: false, error: "Each file must be 8 MB or smaller." };
  const fileId = crypto.randomUUID();
  const objectKey = `admissions/${fileId}-${cleanName(file.name)}`;
  try {
    await putStoredObject("files", objectKey, Buffer.from(await file.arrayBuffer()), file.type);
    await db.insert(storedFiles).values({ id: fileId, bucket: "files", objectKey, filename: file.name || "document", contentType: file.type, sizeBytes: file.size });
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not store application file");
    await deleteStoredObject("files", objectKey).catch(() => undefined);
    return { ok: false, error: "The file could not be saved." };
  }
  return { ok: true, fileId };
}

export async function submitAdmissionApplication(formData: FormData): Promise<{ ok: true; number: string } | { ok: false; error: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: "Applications cannot be saved right now. Your entries are still here." };
  const parsed = validateApplication({
    academicYear: String(formData.get("academicYear") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    middleName: String(formData.get("middleName") ?? ""),
    sex: String(formData.get("sex") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
    birthMonth: String(formData.get("birthMonth") ?? ""),
    birthYear: String(formData.get("birthYear") ?? ""),
    age: String(formData.get("age") ?? ""),
    birthPlace: String(formData.get("birthPlace") ?? ""),
    nationality: String(formData.get("nationality") ?? ""),
    address: String(formData.get("address") ?? ""),
    nsrn: String(formData.get("nsrn") ?? ""),
    gradeSeeking: String(formData.get("gradeSeeking") ?? ""),
    church: String(formData.get("church") ?? ""),
    pastor: String(formData.get("pastor") ?? ""),
    entryType: String(formData.get("entryType") ?? ""),
    lastSchool: String(formData.get("lastSchool") ?? ""),
    lastGrade: String(formData.get("lastGrade") ?? ""),
  });
  if (!parsed.ok) return parsed;
  const mother = validatePerson(parsePerson(String(formData.get("mother") ?? "")), "mother", { required: true, occupation: true, relation: false });
  const father = validatePerson(parsePerson(String(formData.get("father") ?? "")), "father", { required: true, occupation: true, relation: false });
  const guardian = validatePerson(parsePerson(String(formData.get("guardian") ?? "")), "guardian", { required: false, occupation: true, relation: true });
  const emergency = validateEmergency(parsePerson(String(formData.get("emergency") ?? "")), [mother.ok ? mother.value : parsePerson("{}"), father.ok ? father.value : parsePerson("{}"), guardian.ok ? guardian.value : parsePerson("{}")]);
  const declaration = validateDeclaration(parseDeclaration(String(formData.get("declaration") ?? "")));
  let documents: ApplicationDocument[] = [];
  try {
    documents = JSON.parse(String(formData.get("documents") ?? "[]")) as ApplicationDocument[];
  } catch {
    return { ok: false, error: "The documents could not be read." };
  }
  const savedDocuments = validateDocuments(documents);
  const people = [mother, father, guardian, emergency, declaration, savedDocuments];
  const failed = people.find((item) => !item.ok);
  if (failed && !failed.ok) return failed;

  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return { ok: false, error: "Add a photograph of the student." };
  if (!imageTypes.has(photo.type)) return { ok: false, error: "Use a JPG, PNG, GIF, or WebP photograph." };
  if (photo.size > maxFileBytes) return { ok: false, error: "The photograph must be 8 MB or smaller." };
  if (!mother.ok || !father.ok || !guardian.ok || !emergency.ok || !declaration.ok || !savedDocuments.ok) return { ok: false, error: "Complete the application before sending it." };

  const referenced = [declaration.value.photoOneId, declaration.value.photoTwoId, ...savedDocuments.value.map((item) => item.fileId)];
  const existing = referenced.length ? await db.select({ id: storedFiles.id }).from(storedFiles).where(inArray(storedFiles.id, referenced)) : [];
  if (existing.length !== new Set(referenced).size) return { ok: false, error: "One of the uploaded files is no longer available. Upload it again." };

  const applicationId = crypto.randomUUID();
  const fileId = crypto.randomUUID();
  const objectKey = `admissions/${applicationId}-${cleanName(photo.name)}`;
  let uploaded = false;
  let number = "";
  try {
    await putStoredObject("files", objectKey, Buffer.from(await photo.arrayBuffer()), photo.type);
    uploaded = true;
    await db.insert(storedFiles).values({ id: fileId, bucket: "files", objectKey, filename: photo.name || "student-photo", contentType: photo.type, sizeBytes: photo.size });
    const [created] = await db.insert(admissionApplications).values({
      id: applicationId,
      photoFileId: fileId,
      ...parsed.value,
      mother: JSON.stringify(mother.value),
      father: JSON.stringify(father.value),
      guardian: JSON.stringify(guardian.value),
      emergency: JSON.stringify(emergency.value),
      declaration: JSON.stringify(declaration.value),
      documents: JSON.stringify(savedDocuments.value),
      submissionNumber: sql`nextval('admission_application_number_seq')::int`,
    }).returning({ submissionNumber: admissionApplications.submissionNumber });
    if (!created) throw new Error("Could not number the application");
    number = String(created.submissionNumber).padStart(4, "0");
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not save application");
    if (uploaded) await deleteStoredObject("files", objectKey).catch(() => undefined);
    await db.delete(storedFiles).where(eq(storedFiles.id, fileId)).catch(() => undefined);
    return { ok: false, error: "The application could not be saved. Your entries are still here." };
  }
  revalidatePath("/admin/academics");
  return { ok: true, number };
}

export async function saveAdmissionOffice(id: string, input: { received: string[]; staffName: string; signature: string; date: string; entryGrade: string; entryDate: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await requireAdmin();
  const parsed = validateOffice(input);
  if (!parsed.ok) return parsed;
  try {
    await db.update(admissionApplications).set({ office: JSON.stringify(parsed.value) }).where(eq(admissionApplications.id, id));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not save office record");
    return { ok: false, error: "The office record could not be saved." };
  }
  revalidatePath("/admin/academics");
  return { ok: true };
}

export async function deleteAdmissionApplication(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await requireAdmin();
  const [row] = await db.select().from(admissionApplications).where(eq(admissionApplications.id, id)).limit(1);
  if (!row) return { ok: false, error: "That application could not be found." };
  const declaration = parseDeclaration(row.declaration);
  const documents = parseDocuments(row.documents);
  let stampFileId = "";
  try {
    stampFileId = String((JSON.parse(row.behaviour ?? "{}") as { stampFileId?: string }).stampFileId ?? "");
  } catch {
    stampFileId = "";
  }
  const fileIds = [row.photoFileId, declaration.photoOneId, declaration.photoTwoId, stampFileId, ...documents.map((item) => item.fileId)].filter((item): item is string => Boolean(item));
  const files = fileIds.length ? await db.select().from(storedFiles).where(inArray(storedFiles.id, fileIds)) : [];
  try {
    for (const file of files) {
      if (isStorageBucket(file.bucket)) await deleteStoredObject(file.bucket, file.objectKey).catch(() => undefined);
      await db.delete(storedFiles).where(eq(storedFiles.id, file.id));
    }
    await db.delete(admissionApplications).where(eq(admissionApplications.id, id));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not delete application");
    return { ok: false, error: "The application could not be deleted." };
  }
  revalidatePath("/admin/academics");
  return { ok: true };
}

export async function getAdmissionApplication(id: string) {
  const db = await requireAdmin();
  const [row] = await db.select().from(admissionApplications).where(eq(admissionApplications.id, id)).limit(1);
  if (!row) return { ok: false as const, error: "That application could not be found." };
  return {
    ok: true as const,
    application: {
      id: row.id,
      submissionNumber: row.submissionNumber,
      photoFileId: row.photoFileId ?? "",
      firstName: row.firstName,
      lastName: row.lastName,
      middleName: row.middleName,
      sex: row.sex,
      academicYear: row.academicYear,
      birthDate: row.birthDate,
      birthMonth: row.birthMonth,
      birthYear: row.birthYear,
      age: row.age,
      birthPlace: row.birthPlace,
      nationality: row.nationality,
      address: row.address,
      nsrn: row.nsrn,
      gradeSeeking: row.gradeSeeking,
      church: row.church,
      pastor: row.pastor,
      entryType: row.entryType,
      lastSchool: row.lastSchool,
      lastGrade: row.lastGrade,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      documents: row.documents,
      office: row.office,
      mother: row.mother,
      father: row.father,
      guardian: row.guardian,
      emergency: row.emergency,
      declaration: row.declaration,
      behaviour: row.behaviour ?? "{}",
    },
  };
}
