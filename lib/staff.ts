export const staffRoles = ["Principal", "Vice Principal", "Teacher"] as const;

export type StaffAssignment = { grade: string; subject: string };

export function parseStaffAssignments(value: string): StaffAssignment[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as { grade?: unknown; subject?: unknown };
      const grade = typeof record.grade === "string" ? record.grade : "";
      const subject = typeof record.subject === "string" ? record.subject : "";
      return grade || subject ? [{ grade, subject }] : [];
    });
  } catch {
    return [];
  }
}

export function formatStaffAssignment(item: StaffAssignment) {
  const grade = item.grade && !/^grade\b/i.test(item.grade) ? `Grade ${item.grade}` : item.grade;
  return [grade, item.subject].filter(Boolean).join(" — ");
}
