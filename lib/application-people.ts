export type ApplicationPerson = {
  lastName: string;
  firstName: string;
  middleName: string;
  address: string;
  homeTel: string;
  cell: string;
  workTel: string;
  workplace: string;
  workplaceAddress: string;
  occupation: string;
  signature: string;
  idType: string;
  idNumber: string;
  email: string;
  relation: string;
};

export type ApplicationDeclaration = {
  photoOneId: string;
  photoTwoId: string;
  firstLastName: string;
  firstFirstName: string;
  secondLastName: string;
  secondFirstName: string;
  signatureOne: string;
  signatureTwo: string;
  date: string;
};

export type ApplicationDocument = { id: string; fileId: string; filename: string; preview?: string; source?: string };

export type ApplicationOffice = {
  received: string[];
  staffName: string;
  signature: string;
  date: string;
  entryGrade: string;
  entryDate: string;
};

export const admissionDocuments = [
  ["application", "Student application form completed"],
  ["birth-certificate", "Original Birth Certificate and Copy"],
  ["passport-photos", "2 Passport Sized Photographs (current)"],
  ["recommendation", "Recommendation from last school"],
  ["school-report", "Last School Report and Copy"],
  ["immunization-card", "Immunization Card (Stamped FULLY IMMUNIZED)"],
  ["immunization-copy", "Copy of Immunization"],
  ["intake", "Request INTAKE Form"],
  ["trn", "Student TRN/ID/NSR and Copy"],
  ["agreement", "Agreement Form (Contract—Appendix A)"],
  ["pickup", "Pick Up Consent (Appendix B)"],
  ["food-drug", "Food & Drug Policy (Appendix C)"],
  ["fee-policy", "School Fee Policy (Appendix D)"],
  ["medical", "Medical Exam Forms (Appendix E)"],
  ["dental", "Child's Dental Forms (Appendix E)"],
  ["pep", "P.E.P. Results (Grade 7 intake)"],
  ["parent-photos", "Each Parent: Passport Sized Photo EACH (Current)"],
  ["drivers", "Each Parent: Drivers Licence & Copy"],
  ["parent-passport", "OR Each Parent passport information / photo page"],
  ["job-letter", "Each parent: Job Recommendation Letter"],
  ["residence", "Each Parent: Proof of residence: Water/Light Bill"],
  ["school-fee", "Vouchers/proof payment School Fee"],
  ["registration-fee", "Proof Registration fees paid"],
] as const;

export function blankPerson(): ApplicationPerson {
  return { lastName: "", firstName: "", middleName: "", address: "", homeTel: "", cell: "", workTel: "", workplace: "", workplaceAddress: "", occupation: "", signature: "", idType: "", idNumber: "", email: "", relation: "" };
}

export function blankDeclaration(): ApplicationDeclaration {
  return { photoOneId: "", photoTwoId: "", firstLastName: "", firstFirstName: "", secondLastName: "", secondFirstName: "", signatureOne: "", signatureTwo: "", date: "" };
}

export function personStarted(person: ApplicationPerson) {
  return Object.values(person).some((value) => value.trim());
}

export function validatePerson(person: ApplicationPerson, label: string, options: { required: boolean; occupation: boolean; relation: boolean }): { ok: true; value: ApplicationPerson } | { ok: false; error: string } {
  const value = cleanPerson(person);
  if (!options.required && !personStarted(value)) return { ok: true, value: blankPerson() };
  if (!value.lastName || !value.firstName) return { ok: false, error: `Enter the ${label} last name and first name.` };
  if (options.relation && !value.relation) return { ok: false, error: `Enter the ${label} relationship to the child.` };
  if (!value.address) return { ok: false, error: `Enter the ${label} home address.` };
  if (!value.homeTel && !value.cell && !value.workTel) return { ok: false, error: `Enter a telephone number for the ${label}.` };
  if (options.occupation && !value.workplace) return { ok: false, error: `Enter the ${label} workplace name.` };
  if (options.occupation && !value.workplaceAddress) return { ok: false, error: `Enter the ${label} workplace address.` };
  if (options.occupation && !value.occupation) return { ok: false, error: `Enter the ${label} occupation.` };
  if (!isSignature(value.signature)) return { ok: false, error: `Add the ${label} signature.` };
  if (!value.idType || !value.idNumber) return { ok: false, error: `Enter the ${label} ID type and number.` };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) return { ok: false, error: `Enter the ${label} email address.` };
  return { ok: true, value };
}

export function validateEmergency(person: ApplicationPerson, others: ApplicationPerson[]) {
  const parsed = validatePerson(person, "emergency contact", { required: true, occupation: false, relation: true });
  if (!parsed.ok) return parsed;
  const key = personName(parsed.value);
  if (others.some((item) => personStarted(item) && personName(item) === key)) {
    return { ok: false as const, error: "The emergency contact must be different from the parents and guardian." };
  }
  return parsed;
}

export function validateDeclaration(input: ApplicationDeclaration): { ok: true; value: ApplicationDeclaration } | { ok: false; error: string } {
  const value: ApplicationDeclaration = {
    photoOneId: input.photoOneId.trim(),
    photoTwoId: input.photoTwoId.trim(),
    firstLastName: clip(input.firstLastName, 80),
    firstFirstName: clip(input.firstFirstName, 80),
    secondLastName: clip(input.secondLastName, 80),
    secondFirstName: clip(input.secondFirstName, 80),
    signatureOne: input.signatureOne,
    signatureTwo: input.signatureTwo,
    date: input.date.trim(),
  };
  if (!value.photoOneId || !value.photoTwoId) return { ok: false, error: "Add both parent or guardian photographs." };
  if (!value.firstLastName || !value.firstFirstName || !value.secondLastName || !value.secondFirstName) return { ok: false, error: "Enter both parent or guardian names." };
  if (!isSignature(value.signatureOne) || !isSignature(value.signatureTwo)) return { ok: false, error: "Add both signatures." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date)) return { ok: false, error: "Enter the declaration date." };
  return { ok: true, value };
}

export function validateDocuments(input: ApplicationDocument[]): { ok: true; value: ApplicationDocument[] } | { ok: false; error: string } {
  const known = new Set<string>(admissionDocuments.map(([id]) => id));
  const value: ApplicationDocument[] = [];
  const seen = new Set<string>();
  const counts = new Map<string, number>();
  for (const item of input) {
    const id = String(item?.id ?? "");
    const fileId = String(item?.fileId ?? "").trim();
    const filename = clip(item?.filename ?? "", 160);
    if (!known.has(id) || !fileId) return { ok: false, error: "One of the uploaded documents could not be saved." };
    if (seen.has(fileId)) continue;
    const count = (counts.get(id) ?? 0) + 1;
    if (count > 8) return { ok: false, error: "Each document can include up to 8 files." };
    seen.add(fileId);
    counts.set(id, count);
    value.push({ id, fileId, filename });
  }
  return { ok: true, value };
}

export function validateOffice(input: Partial<ApplicationOffice>): { ok: true; value: ApplicationOffice } | { ok: false; error: string } {
  const known = new Set<string>(admissionDocuments.map(([id]) => id));
  const value: ApplicationOffice = {
    received: [...new Set((input.received ?? []).map((id) => String(id)).filter((id) => known.has(id)))],
    staffName: clip(input.staffName ?? "", 120),
    signature: input.signature ?? "",
    date: String(input.date ?? "").trim(),
    entryGrade: clip(input.entryGrade ?? "", 40),
    entryDate: String(input.entryDate ?? "").trim(),
  };
  if (!value.staffName) return { ok: false, error: "Enter the staff name." };
  if (!isSignature(value.signature)) return { ok: false, error: "Add the staff signature." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date)) return { ok: false, error: "Enter the office date." };
  if (!value.entryGrade) return { ok: false, error: "Enter the entry grade." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.entryDate)) return { ok: false, error: "Enter the student's entry date." };
  return { ok: true, value };
}

export function parsePerson(value: string) {
  const person = blankPerson();
  try {
    Object.assign(person, JSON.parse(value));
  } catch {
    return person;
  }
  return cleanPerson(person);
}

export function parseDeclaration(value: string): ApplicationDeclaration {
  const declaration = { photoOneId: "", photoTwoId: "", firstLastName: "", firstFirstName: "", secondLastName: "", secondFirstName: "", signatureOne: "", signatureTwo: "", date: "" };
  try {
    Object.assign(declaration, JSON.parse(value));
  } catch {
    return declaration;
  }
  return declaration;
}

export function parseDocuments(value: string): ApplicationDocument[] {
  try {
    const parsed = JSON.parse(value) as ApplicationDocument[];
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item.fileId) : [];
  } catch {
    return [];
  }
}

export function parseOffice(value: string): ApplicationOffice {
  const office: ApplicationOffice = { received: [], staffName: "", signature: "", date: "", entryGrade: "", entryDate: "" };
  try {
    const parsed = JSON.parse(value) as Partial<ApplicationOffice>;
    office.received = Array.isArray(parsed.received) ? parsed.received.map(String) : [];
    office.staffName = String(parsed.staffName ?? "");
    office.signature = String(parsed.signature ?? "");
    office.date = String(parsed.date ?? "");
    office.entryGrade = String(parsed.entryGrade ?? "");
    office.entryDate = String(parsed.entryDate ?? "");
  } catch {
    return office;
  }
  return office;
}

function personName(person: ApplicationPerson) {
  return `${person.firstName} ${person.lastName}`.trim().toLowerCase().replace(/\s+/g, " ");
}

function cleanPerson(person: ApplicationPerson): ApplicationPerson {
  return {
    lastName: clip(person.lastName, 80),
    firstName: clip(person.firstName, 80),
    middleName: clip(person.middleName, 80),
    address: clip(person.address, 300),
    homeTel: clip(person.homeTel, 40),
    cell: clip(person.cell, 40),
    workTel: clip(person.workTel, 40),
    workplace: clip(person.workplace, 160),
    workplaceAddress: clip(person.workplaceAddress, 300),
    occupation: clip(person.occupation, 120),
    signature: isSignature(person.signature) ? person.signature : "",
    idType: clip(person.idType, 80),
    idNumber: clip(person.idNumber, 80),
    email: clip(person.email, 160),
    relation: clip(person.relation, 80),
  };
}

function isSignature(value: string) {
  return value.startsWith("data:image/png;base64,") && value.length < 180000;
}

function clip(value: string, max: number) {
  return String(value ?? "").trim().slice(0, max);
}
