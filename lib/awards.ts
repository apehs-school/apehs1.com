export const awardCategories = ["Dance", "Music", "Drumming", "Sports", "Academic", "Other"] as const;

export type PepResult = { id: string; year: string; result: string; published?: boolean };
export type GradeAssessment = {
  id: string;
  grade: string;
  academicYear: string;
  name: string;
  subjects: string;
  result: string;
  published?: boolean;
};
export type RecognitionAward = {
  id: string;
  category: string;
  year: string;
  body: string;
  title: string;
  details: string;
  published?: boolean;
};

export type AwardsDocument = {
  title: string;
  introduction: string;
  pepResults: PepResult[];
  assessments: GradeAssessment[];
  awards: RecognitionAward[];
};

export const awardDefaults: AwardsDocument = {
  title: "Awards and Achievements",
  introduction: "",
  pepResults: [
    { id: "pep-2021", year: "2021", result: "94" },
    { id: "pep-2022", year: "2022", result: "98" },
    { id: "pep-2023", year: "2023", result: "98" },
    { id: "pep-2024", year: "2024", result: "96" },
    { id: "pep-2025", year: "2025", result: "95" },
  ],
  assessments: [
    { id: "assess-grade-3", grade: "Grade 3", academicYear: "2024–2025", name: "Diagnostic Test", subjects: "", result: "100" },
    { id: "assess-grade-4", grade: "Grade 4", academicYear: "", name: "PEP – Literacy and Numeracy", subjects: "", result: "100" },
    {
      id: "assess-grade-5",
      grade: "Grade 5",
      academicYear: "",
      name: "PEP Performance Tasks",
      subjects: "Language Arts, Mathematics, Science, and Social Studies",
      result: "100",
    },
  ],
  awards: [
    {
      id: "award-dance",
      category: "Dance",
      year: "2023–2024",
      body: "JCDC – Performing Arts",
      title: "Most Outstanding School and Community",
      details: "Trophy winners (Classes 2 and 3)",
    },
    {
      id: "award-music",
      category: "Music",
      year: "2023–2024",
      body: "JCDC – Performing Arts",
      title: "Best Vocal Solo – Jamaica Folklore",
      details: "Trophy winner",
    },
    {
      id: "award-drumming",
      category: "Drumming",
      year: "2023–2024",
      body: "JCDC – Performing Arts",
      title: "National Gold Medal and World Champions",
      details: "Lightning Drummers",
    },
  ],
};

export function isPublished(row: { published?: boolean }) {
  return row.published !== false;
}

export function normalizePercent(value: string) {
  const text = value.trim();
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const number = Number(text);
  if (!Number.isFinite(number) || number < 0 || number > 100) return null;
  const rounded = Math.round(number * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function awardsAverage(results: string[]) {
  const numbers = results.flatMap((value) => {
    const percent = normalizePercent(value);
    return percent === null ? [] : [Number(percent)];
  });
  if (numbers.length === 0) return null;
  const rounded = Math.round((numbers.reduce((sum, value) => sum + value, 0) / numbers.length) * 10) / 10;
  const percent = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return { count: numbers.length, percent };
}

function cleanText(value: string, limit: number) {
  return value.trim().slice(0, limit);
}

function validYear(value: string) {
  return /^\d{4}$/.test(value) && Number(value) >= 1900 && Number(value) <= 2100;
}

export function validateAwards(input: AwardsDocument): { ok: true; value: AwardsDocument } | { ok: false; error: string } {
  const title = cleanText(input.title ?? "", 120);
  const introduction = cleanText(input.introduction ?? "", 2000);
  if (!title) return { ok: false, error: "Page title is required." };
  if (!Array.isArray(input.pepResults) || !Array.isArray(input.assessments) || !Array.isArray(input.awards)) {
    return { ok: false, error: "The awards form is incomplete." };
  }
  if (input.pepResults.length > 40 || input.assessments.length > 40 || input.awards.length > 40) {
    return { ok: false, error: "Each section can hold up to 40 records." };
  }

  const seenYears = new Set<string>();
  const pepResults: PepResult[] = [];
  for (const row of input.pepResults) {
    const year = cleanText(row.year ?? "", 4);
    const result = normalizePercent(row.result ?? "");
    if (!validYear(year)) return { ok: false, error: "Each PEP year must be a four-digit year from 1900 to 2100." };
    if (seenYears.has(year)) return { ok: false, error: `PEP year ${year} is listed more than once.` };
    if (result === null) return { ok: false, error: `Enter a PEP result from 0 to 100 for ${year}.` };
    seenYears.add(year);
    pepResults.push({ id: cleanText(row.id ?? "", 80) || crypto.randomUUID(), year, result, published: row.published !== false });
  }

  const assessments: GradeAssessment[] = [];
  for (const row of input.assessments) {
    const grade = cleanText(row.grade ?? "", 40);
    const name = cleanText(row.name ?? "", 160);
    const result = normalizePercent(row.result ?? "");
    if (!grade) return { ok: false, error: "Each assessment needs a grade." };
    if (!name) return { ok: false, error: `Enter an assessment name for ${grade}.` };
    if (result === null) return { ok: false, error: `Enter a result from 0 to 100 for ${grade}.` };
    assessments.push({
      id: cleanText(row.id ?? "", 80) || crypto.randomUUID(),
      grade,
      academicYear: cleanText(row.academicYear ?? "", 40),
      name,
      subjects: cleanText(row.subjects ?? "", 300),
      result,
      published: row.published !== false,
    });
  }

  const awards: RecognitionAward[] = [];
  for (const row of input.awards) {
    const category = cleanText(row.category ?? "", 40);
    const year = cleanText(row.year ?? "", 40);
    const title = cleanText(row.title ?? "", 200);
    if (!awardCategories.includes(category as (typeof awardCategories)[number])) {
      return { ok: false, error: "Choose a category for each award." };
    }
    if (!year) return { ok: false, error: `Enter a year for the ${category} award.` };
    if (!title) return { ok: false, error: `Enter a title for the ${category} award.` };
    awards.push({
      id: cleanText(row.id ?? "", 80) || crypto.randomUUID(),
      category,
      year,
      body: cleanText(row.body ?? "", 200),
      title,
      details: cleanText(row.details ?? "", 300),
      published: row.published !== false,
    });
  }

  return { ok: true, value: { title, introduction, pepResults, assessments, awards } };
}

export function parseAwardDocument(row: { title: string; introduction: string; pepResults: string; assessments: string; awards: string }) {
  try {
    const parsed = validateAwards({
      title: row.title,
      introduction: row.introduction,
      pepResults: JSON.parse(row.pepResults),
      assessments: JSON.parse(row.assessments),
      awards: JSON.parse(row.awards),
    });
    return parsed.ok ? parsed.value : null;
  } catch {
    return null;
  }
}
