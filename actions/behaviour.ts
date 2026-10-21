"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { admissionApplications } from "@/db/schema";
import { validateBehaviour, type BehaviourAnswers } from "@/lib/behaviour";

export async function submitBehaviourAssessment(input: BehaviourAnswers): Promise<{ ok: true; number: string } | { ok: false; error: string }> {
  const db = getDb();
  if (!db) return { ok: false, error: "The assessment cannot be saved right now. Your entries are still here." };
  const parsed = validateBehaviour(input);
  if (!parsed.ok) return parsed;
  const form = parsed.value;
  const [year, month, day] = form.birthDate.split("-");
  try {
    const [created] = await db.insert(admissionApplications).values({
      id: crypto.randomUUID(),
      academicYear: String(new Date().getFullYear()),
      lastName: form.lastName,
      firstName: form.firstName,
      middleName: form.middleName,
      sex: "",
      birthDate: day ?? "",
      birthMonth: month ?? "",
      birthYear: year ?? "",
      age: form.age,
      address: form.lastSchoolAddress,
      gradeSeeking: form.presentGrade,
      entryType: "behaviour",
      lastSchool: form.lastSchool,
      lastGrade: form.presentGrade,
      mother: JSON.stringify({ firstName: form.motherName }),
      father: JSON.stringify({ firstName: form.fatherName }),
      behaviour: JSON.stringify(form),
      submissionNumber: sql`nextval('admission_application_number_seq')::int`,
    }).returning({ submissionNumber: admissionApplications.submissionNumber });
    if (!created?.submissionNumber) return { ok: false, error: "The assessment could not be numbered. Your entries are still here." };
    revalidatePath("/admin/academics");
    return { ok: true, number: String(created.submissionNumber).padStart(4, "0") };
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Could not save behaviour assessment");
    return { ok: false, error: "The assessment could not be sent. Your entries are still here." };
  }
}
