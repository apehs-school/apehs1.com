export type YesNo = "" | "yes" | "no";

export type BehaviourAnswers = {
  lastName: string;
  firstName: string;
  middleName: string;
  lastSchool: string;
  lastSchoolAddress: string;
  fullName: string;
  birthDate: string;
  age: string;
  motherName: string;
  fatherName: string;
  gradesAdmitted: string;
  presentGrade: string;
  academicStrength: string;
  academicWeakness: string;
  suspended: YesNo;
  suspendedTimes: string;
  disciplinary: YesNo;
  disciplinaryNature: string;
  expelled: YesNo;
  expelledReason: string;
  detentions: YesNo;
  detentionCircumstances: string;
  clubs: string;
  prepared: string;
  pta: string;
  readmit: string;
  transferReasons: string;
  emotional: string[];
  emotionalHelp: string[];
  conflict: string[];
  conflictHelp: string[];
  discipline: string[];
  social: string[];
  completedBy: string;
  completedDate: string;
  signature: string;
  position: string;
  institutionAddress: string;
  telephone: string;
  email: string;
  stampFileId: string;
};

export const behaviourSteps = ["Transfer request", "Student record", "Conduct", "School report", "Part B", "Ratings", "Sign", "Review"] as const;

export const emotionalOptions = ["sulks", "complains a great deal", "becomes aggressive/abusive", "resolves to do better", "becomes complacent", "is forgiving"] as const;
export const conflictOptions = ["quick to fight", "seeks arbitration", "becomes abusive and threatening", "never been in a fight", "talks through problems", "never been in verbal conflicts"] as const;
export const disciplineOptions = ["always does home/classwork", "spends free time in playing", "rarely/never does home/classwork", "spends free time in studying", "has materials/tools for class", "rarely has materials/tools"] as const;
export const socialOptions = ["makes friends easily", "is reserved", "does not easily make friend", "communicates well with all", "is respectful to all", "plays in a violent manner", "is sullen", "practices punctuality"] as const;
export const helpOptions = ["Teacher", "Counsellor", "Peers", "Principal"] as const;

export function blankBehaviour(): BehaviourAnswers {
  return {
    lastName: "",
    firstName: "",
    middleName: "",
    lastSchool: "",
    lastSchoolAddress: "",
    fullName: "",
    birthDate: "",
    age: "",
    motherName: "",
    fatherName: "",
    gradesAdmitted: "",
    presentGrade: "",
    academicStrength: "",
    academicWeakness: "",
    suspended: "",
    suspendedTimes: "",
    disciplinary: "",
    disciplinaryNature: "",
    expelled: "",
    expelledReason: "",
    detentions: "",
    detentionCircumstances: "",
    clubs: "",
    prepared: "",
    pta: "",
    readmit: "",
    transferReasons: "",
    emotional: [],
    emotionalHelp: [],
    conflict: [],
    conflictHelp: [],
    discipline: [],
    social: [],
    completedBy: "",
    completedDate: "",
    signature: "",
    position: "",
    institutionAddress: "",
    telephone: "",
    email: "",
    stampFileId: "",
  };
}

function clip(value: string, max: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function chosen(options: readonly string[], values: string[]) {
  const known = new Set<string>(options);
  return values.filter((value) => known.has(value));
}

export function cleanBehaviour(input: Partial<BehaviourAnswers>): BehaviourAnswers {
  const blank = blankBehaviour();
  return {
    ...blank,
    lastName: clip(input.lastName ?? "", 80),
    firstName: clip(input.firstName ?? "", 80),
    middleName: clip(input.middleName ?? "", 80),
    lastSchool: clip(input.lastSchool ?? "", 160),
    lastSchoolAddress: clip(input.lastSchoolAddress ?? "", 240),
    fullName: clip(input.fullName ?? "", 160),
    birthDate: /^\d{4}-\d{2}-\d{2}$/.test(input.birthDate ?? "") ? input.birthDate ?? "" : "",
    age: clip(input.age ?? "", 20),
    motherName: clip(input.motherName ?? "", 160),
    fatherName: clip(input.fatherName ?? "", 160),
    gradesAdmitted: clip(input.gradesAdmitted ?? "", 160),
    presentGrade: clip(input.presentGrade ?? "", 80),
    academicStrength: clip(input.academicStrength ?? "", 2000),
    academicWeakness: clip(input.academicWeakness ?? "", 2000),
    suspended: input.suspended === "yes" || input.suspended === "no" ? input.suspended : "",
    suspendedTimes: input.suspended === "yes" ? clip(input.suspendedTimes ?? "", 80) : "",
    disciplinary: input.disciplinary === "yes" || input.disciplinary === "no" ? input.disciplinary : "",
    disciplinaryNature: input.disciplinary === "yes" ? clip(input.disciplinaryNature ?? "", 2000) : "",
    expelled: input.expelled === "yes" || input.expelled === "no" ? input.expelled : "",
    expelledReason: input.expelled === "yes" ? clip(input.expelledReason ?? "", 2000) : "",
    detentions: input.detentions === "yes" || input.detentions === "no" ? input.detentions : "",
    detentionCircumstances: input.detentions === "yes" ? clip(input.detentionCircumstances ?? "", 2000) : "",
    clubs: clip(input.clubs ?? "", 2000),
    prepared: clip(input.prepared ?? "", 2000),
    pta: clip(input.pta ?? "", 2000),
    readmit: clip(input.readmit ?? "", 2000),
    transferReasons: clip(input.transferReasons ?? "", 2000),
    emotional: chosen(emotionalOptions, input.emotional ?? []),
    emotionalHelp: chosen(helpOptions, input.emotionalHelp ?? []),
    conflict: chosen(conflictOptions, input.conflict ?? []),
    conflictHelp: chosen(helpOptions, input.conflictHelp ?? []),
    discipline: chosen(disciplineOptions, input.discipline ?? []),
    social: chosen(socialOptions, input.social ?? []),
    completedBy: clip(input.completedBy ?? "", 120),
    completedDate: /^\d{4}-\d{2}-\d{2}$/.test(input.completedDate ?? "") ? input.completedDate ?? "" : "",
    signature: input.signature?.startsWith("data:image/png;base64,") && input.signature.length < 180000 ? input.signature : "",
    position: clip(input.position ?? "", 80),
    institutionAddress: clip(input.institutionAddress ?? "", 240),
    telephone: clip(input.telephone ?? "", 40),
    email: clip(input.email ?? "", 120),
    stampFileId: clip(input.stampFileId ?? "", 80),
  };
}

function missing(value: string, label: string) {
  return value.trim() ? "" : `Enter ${label}.`;
}

function yesNo(value: YesNo, label: string, detail: string) {
  if (!value) return `Choose yes or no for “${label}”.`;
  if (value === "yes" && !detail.trim()) return `Enter the details for “${label}”.`;
  return "";
}

export function behaviourStepError(step: number, form: BehaviourAnswers) {
  if (step === 0) return missing(form.lastName, "the child's last name") || missing(form.firstName, "the child's first name") || missing(form.lastSchool, "the full name of the last school") || missing(form.lastSchoolAddress, "the address of the last school");
  if (step === 1) return missing(form.fullName, "the student's full name") || missing(form.birthDate, "the date of birth") || missing(form.age, "the age") || missing(form.motherName, "the mother's full name") || missing(form.fatherName, "the father's full name") || missing(form.gradesAdmitted, "the grades to which the student was admitted") || missing(form.presentGrade, "the present grade") || missing(form.academicStrength, "the areas of academic strength");
  if (step === 2) return missing(form.academicWeakness, "the areas of academic weakness") || yesNo(form.suspended, "Has the student ever been suspended?", form.suspendedTimes) || yesNo(form.disciplinary, "Has the student been involved in disciplinary problems?", form.disciplinaryNature) || yesNo(form.expelled, "Was the student expelled from your school?", form.expelledReason) || yesNo(form.detentions, "Has the student ever received detentions?", form.detentionCircumstances);
  if (step === 3) return missing(form.clubs, "the club or society answer") || missing(form.prepared, "whether the student is prepared for school") || missing(form.pta, "whether the parents are active in the PTA") || missing(form.readmit, "whether you would re-admit this student") || missing(form.transferReasons, "the reasons for this transfer");
  if (step === 4) {
    if (!form.emotional.length && !form.emotionalHelp.length) return "Tick at least one response for emotional maturity.";
    if (!form.conflict.length && !form.conflictHelp.length) return "Tick at least one response for conflict resolution.";
    return "";
  }
  if (step === 5) {
    if (!form.discipline.length) return "Tick at least one response for academic discipline.";
    if (!form.social.length) return "Tick at least one response for social integration.";
    return "";
  }
  if (step === 6) {
    return missing(form.completedBy, "the name of the person completing this form")
      || missing(form.completedDate, "the date")
      || (form.signature ? "" : "Add the signature.")
      || missing(form.position, "the position")
      || missing(form.institutionAddress, "the address of the school or institution")
      || missing(form.telephone, "the telephone number")
      || (form.email.includes("@") ? "" : "Enter an email address.");
  }
  return "";
}

export function validateBehaviour(input: Partial<BehaviourAnswers>): { ok: true; value: BehaviourAnswers } | { ok: false; error: string } {
  const value = cleanBehaviour(input);
  for (let step = 0; step < behaviourSteps.length; step += 1) {
    const error = behaviourStepError(step, value);
    if (error) return { ok: false, error };
  }
  return { ok: true, value };
}
