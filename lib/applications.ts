import { worldCountries } from "@/lib/countries";

export const applicationMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;

export const applicationEntryTypes = [
  ["pep", "PEP"],
  ["transfer", "Transfer"],
  ["other", "Other"],
] as const;

export type ApplicationEntryType = (typeof applicationEntryTypes)[number][0];

export type ApplicationInput = {
  academicYear: string;
  lastName: string;
  firstName: string;
  middleName: string;
  sex: string;
  birthDate: string;
  birthMonth: string;
  birthYear: string;
  age: string;
  birthPlace: string;
  nationality: string;
  address: string;
  nsrn: string;
  gradeSeeking: string;
  church: string;
  pastor: string;
  entryType: string;
  lastSchool: string;
  lastGrade: string;
};

export function validateApplication(input: Partial<ApplicationInput>): { ok: true; value: ApplicationInput } | { ok: false; error: string } {
  const value = {
    academicYear: text(input.academicYear, 40),
    lastName: text(input.lastName, 80),
    firstName: text(input.firstName, 80),
    middleName: text(input.middleName, 80),
    sex: text(input.sex, 10).toLowerCase(),
    birthDate: text(input.birthDate, 2),
    birthMonth: text(input.birthMonth, 20),
    birthYear: text(input.birthYear, 4),
    age: text(input.age, 3),
    birthPlace: text(input.birthPlace, 120),
    nationality: text(input.nationality, 80),
    address: text(input.address, 300),
    nsrn: text(input.nsrn, 40),
    gradeSeeking: text(input.gradeSeeking, 40),
    church: text(input.church, 120),
    pastor: text(input.pastor, 120),
    entryType: text(input.entryType, 20).toLowerCase(),
    lastSchool: text(input.lastSchool, 160),
    lastGrade: text(input.lastGrade, 40),
  };
  if (!value.academicYear) return { ok: false, error: "Enter the academic year." };
  if (!value.lastName || !value.firstName) return { ok: false, error: "Enter the student's last name and first name." };
  if (value.sex !== "male" && value.sex !== "female") return { ok: false, error: "Choose male or female." };
  const day = Number(value.birthDate);
  const year = Number(value.birthYear);
  const age = ageFromBirth(day, value.birthMonth, year);
  if (age === null) return { ok: false, error: "Enter the date of birth." };
  value.age = String(age);
  if (!worldCountries.includes(value.birthPlace as (typeof worldCountries)[number])) return { ok: false, error: "Choose the country of birth." };
  if (!value.nationality) return { ok: false, error: "Enter the nationality." };
  if (!value.address) return { ok: false, error: "Enter the current address." };
  if (!value.gradeSeeking) return { ok: false, error: "Enter the grade seeking entry." };
  if (!applicationEntryTypes.some(([id]) => id === value.entryType)) return { ok: false, error: "Choose PEP, transfer, or other." };
  if (!value.lastSchool) return { ok: false, error: "Enter the name of the last school." };
  if (!value.lastGrade) return { ok: false, error: "Enter the last grade or class." };
  return { ok: true, value };
}

export function ageFromBirth(day: number, monthName: string, year: number) {
  const monthIndex = applicationMonths.indexOf(monthName as (typeof applicationMonths)[number]);
  if (!Number.isInteger(day) || !Number.isInteger(year) || monthIndex < 0 || year < 1990 || year > 2100) return null;
  const born = new Date(year, monthIndex, day);
  if (born.getFullYear() !== year || born.getMonth() !== monthIndex || born.getDate() !== day) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (born > today) return null;
  let age = today.getFullYear() - year;
  if (today.getMonth() < monthIndex || (today.getMonth() === monthIndex && today.getDate() < day)) age -= 1;
  return age >= 0 && age <= 100 ? age : null;
}

export function birthdayInputValue(day: string, monthName: string, year: string) {
  const monthIndex = applicationMonths.indexOf(monthName as (typeof applicationMonths)[number]);
  const dayNumber = Number(day);
  const yearNumber = Number(year);
  if (monthIndex < 0 || !Number.isInteger(dayNumber) || !Number.isInteger(yearNumber)) return "";
  return `${yearNumber}-${String(monthIndex + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
}

function text(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}
