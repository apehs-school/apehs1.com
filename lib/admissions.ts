export const admissionDepartments = [
  ["preparatory", "Preparatory Department"],
  ["extension", "Extension High School"],
  ["both", "Both Departments"],
] as const;

export type AdmissionDepartment = (typeof admissionDepartments)[number][0];

export type AdmissionStep = { id: string; title: string; description: string };

export type AdmissionDraft = {
  title: string;
  department: AdmissionDepartment;
  introduction: string;
  minAge: number | null;
  maxAge: number | null;
  gradeRange: string;
  eligibilityNote: string;
  documents: string[];
  steps: AdmissionStep[];
  additional: string;
};

export type AdmissionRecord = AdmissionDraft & {
  id: string;
  published: boolean;
  publishedSnapshot: AdmissionDraft | null;
  createdAt: string;
  updatedAt: string;
};

export const legacyAdmissionId = "legacy-admissions";

export function departmentLabel(value: string) {
  return admissionDepartments.find(([id]) => id === value)?.[1] ?? value;
}

export function eligibilitySummary(draft: Pick<AdmissionDraft, "minAge" | "maxAge" | "gradeRange" | "eligibilityNote">) {
  if (draft.eligibilityNote.trim()) return draft.eligibilityNote.trim();
  const parts = [];
  if (draft.minAge !== null && draft.maxAge !== null) parts.push(`Ages ${draft.minAge} to ${draft.maxAge}`);
  else if (draft.minAge !== null) parts.push(`Minimum age ${draft.minAge}`);
  else if (draft.maxAge !== null) parts.push(`Maximum age ${draft.maxAge}`);
  if (draft.gradeRange.trim()) parts.push(draft.gradeRange.trim());
  return parts.join(" · ");
}

export function admissionStatus(record: Pick<AdmissionRecord, "published" | "publishedSnapshot"> & AdmissionDraft) {
  if (!record.published) return "Draft";
  if (record.publishedSnapshot && !draftsMatch(record, record.publishedSnapshot)) return "Published · Unpublished changes";
  return "Published";
}

export function draftsMatch(left: AdmissionDraft, right: AdmissionDraft) {
  return JSON.stringify(snapshotOf(left)) === JSON.stringify(snapshotOf(right));
}

export function snapshotOf(draft: AdmissionDraft): AdmissionDraft {
  return {
    title: draft.title,
    department: draft.department,
    introduction: draft.introduction,
    minAge: draft.minAge,
    maxAge: draft.maxAge,
    gradeRange: draft.gradeRange,
    eligibilityNote: draft.eligibilityNote,
    documents: draft.documents,
    steps: draft.steps,
    additional: draft.additional,
  };
}

function readAge(value: unknown) {
  if (value === null || value === undefined || value === "") return { ok: true as const, value: null };
  const number = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isInteger(number) || number < 0 || number > 100) return { ok: false as const };
  return { ok: true as const, value: number };
}

export function validateAdmission(input: Partial<AdmissionDraft>): { ok: true; value: AdmissionDraft } | { ok: false; error: string } {
  const title = String(input.title ?? "").trim().slice(0, 160);
  const department = String(input.department ?? "");
  const introduction = String(input.introduction ?? "").trim().slice(0, 4000);
  if (!title) return { ok: false, error: "Title is required." };
  if (!admissionDepartments.some(([id]) => id === department)) return { ok: false, error: "Choose a school department." };
  if (!introduction) return { ok: false, error: "Introduction is required." };
  const minAge = readAge(input.minAge);
  const maxAge = readAge(input.maxAge);
  if (!minAge.ok || !maxAge.ok) return { ok: false, error: "Ages must be whole numbers from 0 to 100." };
  if (minAge.value !== null && maxAge.value !== null && minAge.value > maxAge.value) {
    return { ok: false, error: "Minimum age cannot be greater than maximum age." };
  }
  const documents = Array.isArray(input.documents) ? input.documents : [];
  const steps = Array.isArray(input.steps) ? input.steps : [];
  if (documents.length > 40 || steps.length > 40) return { ok: false, error: "Each list can hold up to 40 items." };
  const cleanDocuments = documents.map((item) => String(item ?? "").trim().slice(0, 200)).filter(Boolean);
  const cleanSteps: AdmissionStep[] = [];
  for (const step of steps) {
    const stepTitle = String(step?.title ?? "").trim().slice(0, 200);
    const description = String(step?.description ?? "").trim().slice(0, 500);
    if (!stepTitle && !description) continue;
    if (!stepTitle) return { ok: false, error: "Each enrollment step needs a title." };
    cleanSteps.push({ id: String(step?.id ?? "").trim().slice(0, 80) || crypto.randomUUID(), title: stepTitle, description });
  }
  return {
    ok: true,
    value: {
      title,
      department: department as AdmissionDepartment,
      introduction,
      minAge: minAge.value,
      maxAge: maxAge.value,
      gradeRange: String(input.gradeRange ?? "").trim().slice(0, 160),
      eligibilityNote: String(input.eligibilityNote ?? "").trim().slice(0, 2000),
      documents: cleanDocuments,
      steps: cleanSteps,
      additional: String(input.additional ?? "").trim().slice(0, 4000),
    },
  };
}

export function legacyAdmission(published: boolean): AdmissionRecord {
  const draft: AdmissionDraft = {
    title: "Admissions Information",
    department: "both",
    introduction: "We welcome applications from students who are eager to learn and grow in a supportive, disciplined, and nurturing environment.",
    minAge: 3,
    maxAge: 11,
    gradeRange: "Grade 7 through Grade 11",
    eligibilityNote: "The Preparatory Department enrolls students aged 3 to 11 years. The Extension High School offers placement for students in Grade 7 through Grade 11.",
    documents: ["Immunization card (passport)", "Birth certificate", "Previous school records"],
    steps: [
      { id: "legacy-step-form", title: "Complete the application form", description: "" },
      { id: "legacy-step-documents", title: "Submit the birth certificate and previous school records", description: "" },
      { id: "legacy-step-interview", title: "Attend the student assessment and interview", description: "" },
      { id: "legacy-step-letter", title: "Receive the acceptance letter", description: "" },
    ],
    additional: "",
  };
  const now = new Date().toISOString();
  return {
    ...draft,
    id: legacyAdmissionId,
    published,
    publishedSnapshot: published ? snapshotOf(draft) : null,
    createdAt: now,
    updatedAt: now,
  };
}

export function parseAdmissionDraft(value: unknown): AdmissionDraft | null {
  if (!value || typeof value !== "object") return null;
  const parsed = validateAdmission(value as Partial<AdmissionDraft>);
  return parsed.ok ? parsed.value : null;
}

type AdmissionRow = {
  id: string;
  title: string;
  department: string;
  introduction: string;
  minAge: number | null;
  maxAge: number | null;
  gradeRange: string;
  eligibilityNote: string;
  documents: string;
  steps: string;
  additional: string;
  published: boolean;
  publishedSnapshot: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

function iso(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export function toAdmissionRecord(row: AdmissionRow): AdmissionRecord | null {
  let documents: unknown = [];
  let steps: unknown = [];
  try {
    documents = JSON.parse(row.documents);
    steps = JSON.parse(row.steps);
  } catch {
    return null;
  }
  const draft = parseAdmissionDraft({
    title: row.title,
    department: row.department,
    introduction: row.introduction,
    minAge: row.minAge,
    maxAge: row.maxAge,
    gradeRange: row.gradeRange,
    eligibilityNote: row.eligibilityNote,
    documents,
    steps,
  });
  if (!draft) return null;
  draft.additional = String(row.additional ?? "").trim().slice(0, 4000);
  let publishedSnapshot: AdmissionDraft | null = null;
  if (row.publishedSnapshot) {
    try {
      publishedSnapshot = parseAdmissionDraft(JSON.parse(row.publishedSnapshot));
    } catch {
      publishedSnapshot = null;
    }
  }
  return {
    ...draft,
    id: row.id,
    published: row.published,
    publishedSnapshot,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function formatAdmissionUpdated(value: string) {
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
