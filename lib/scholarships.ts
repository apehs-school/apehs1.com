import { admissionDepartments, departmentLabel, type AdmissionDepartment } from "@/lib/admissions";

export { admissionDepartments, departmentLabel };
export type { AdmissionDepartment };

export type ScholarshipDraft = {
  studentName: string;
  awardName: string;
  year: number;
  grade: string;
  department: AdmissionDepartment;
  organization: string;
  details: string;
};

export type ScholarshipRecord = ScholarshipDraft & {
  id: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

type ScholarshipRow = {
  id: string;
  studentName: string;
  awardName: string;
  year: number;
  grade: string;
  department: string;
  organization: string;
  details: string;
  published: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function validateScholarship(input: {
  studentName?: string;
  awardName?: string;
  year?: number | string;
  grade?: string;
  department?: string;
  organization?: string;
  details?: string;
}): { ok: true; value: ScholarshipDraft } | { ok: false; error: string } {
  const studentName = String(input.studentName ?? "").trim();
  const awardName = String(input.awardName ?? "").trim();
  const grade = String(input.grade ?? "").trim();
  const organization = String(input.organization ?? "").trim();
  const details = String(input.details ?? "").trim();
  const department = input.department;
  const year = Number(input.year);
  if (!studentName) return { ok: false, error: "Student name is required." };
  if (studentName.length > 160) return { ok: false, error: "Student name must be 160 characters or fewer." };
  if (!awardName) return { ok: false, error: "Scholarship name is required." };
  if (awardName.length > 200) return { ok: false, error: "Scholarship name must be 200 characters or fewer." };
  if (!Number.isInteger(year) || year < 1900 || year > 2100) return { ok: false, error: "Enter the year the scholarship was awarded." };
  if (!department || !admissionDepartments.some(([id]) => id === department)) return { ok: false, error: "Choose a school department." };
  if (grade.length > 80) return { ok: false, error: "Grade must be 80 characters or fewer." };
  if (organization.length > 200) return { ok: false, error: "Awarding organization must be 200 characters or fewer." };
  if (details.length > 2000) return { ok: false, error: "Achievement details must be 2,000 characters or fewer." };
  return { ok: true, value: { studentName, awardName, year, grade, department: department as AdmissionDepartment, organization, details } };
}

export function toScholarshipRecord(row: ScholarshipRow): ScholarshipRecord | null {
  const draft = validateScholarship(row);
  if (!draft.ok) return null;
  return { ...draft.value, id: row.id, published: row.published, createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) };
}

export function formatScholarshipUpdated(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-JM", {
    timeZone: "America/Jamaica",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function iso(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}
