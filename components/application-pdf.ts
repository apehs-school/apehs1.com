"use client";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { admissionDocuments, type ApplicationDeclaration, type ApplicationOffice, type ApplicationPerson } from "@/lib/application-people";

const black = rgb(0.04, 0.12, 0.23);
const rule = rgb(0.04, 0.12, 0.23);
const muted = rgb(0.24, 0.34, 0.5);
const paper = rgb(1, 0.953, 0.64);

export type PdfPicture = Blob | string | null;

export type PdfApplication = {
  number: string;
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
  photo: PdfPicture;
  mother: ApplicationPerson;
  father: ApplicationPerson;
  guardian: ApplicationPerson;
  emergency: ApplicationPerson;
  declaration: ApplicationDeclaration;
  photoOne: PdfPicture;
  photoTwo: PdfPicture;
  documents: { label: string; attached: boolean }[];
  uploads?: PdfUpload[];
  office: ApplicationOffice | null;
};

export type PdfUpload = { label: string; name: string; source: PdfPicture };

export function uploadPages(files: { id: string; filename: string; source?: string; preview?: string }[]) {
  const pages: PdfUpload[] = [];
  for (const [id, label] of admissionDocuments) {
    for (const file of files) {
      if (file.id !== id) continue;
      const source = file.source || file.preview;
      if (!source) continue;
      pages.push({ label, name: file.filename, source });
    }
  }
  return pages;
}

export async function downloadApplicationPdf(input: PdfApplication) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pictures = {
    photo: await embedPicture(pdf, input.photo),
    photoOne: await embedPicture(pdf, input.photoOne),
    photoTwo: await embedPicture(pdf, input.photoTwo),
    mother: await embedPicture(pdf, input.mother.signature),
    father: await embedPicture(pdf, input.father.signature),
    guardian: await embedPicture(pdf, input.guardian.signature),
    emergency: await embedPicture(pdf, input.emergency.signature),
    signatureOne: await embedPicture(pdf, input.declaration.signatureOne),
    signatureTwo: await embedPicture(pdf, input.declaration.signatureTwo),
    office: await embedPicture(pdf, input.office?.signature ?? ""),
  };
  const sheet = new Sheet(pdf, font, bold);
  drawStudentPage(sheet, input, pictures);
  drawFamilyPage(sheet, input, pictures);
  for (const upload of input.uploads ?? []) await drawUploadPage(pdf, sheet, upload);
  const bytes = await pdf.save();
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `APEHS-application-${input.number || "form"}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

type Pictures = {
  photo: PDFImage | null;
  photoOne: PDFImage | null;
  photoTwo: PDFImage | null;
  mother: PDFImage | null;
  father: PDFImage | null;
  guardian: PDFImage | null;
  emergency: PDFImage | null;
  signatureOne: PDFImage | null;
  signatureTwo: PDFImage | null;
  office: PDFImage | null;
};

class Sheet {
  page: PDFPage;
  y = 760;
  constructor(private pdf: PDFDocument, readonly font: PDFFont, readonly bold: PDFFont) {
    this.page = pdf.addPage([612, 792]);
  }
  freshPage() {
    this.page = this.pdf.addPage([612, 792]);
    this.y = 760;
  }
  need(height: number) {
    if (this.y - height < 36) this.freshPage();
  }
  text(value: string, x: number, y: number, size: number, font = this.font, color = black) {
    this.page.drawText(value, { x, y, size, font, color });
  }
  rule(x: number, y: number, width: number) {
    this.page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: 0.6, color: rule });
  }
  box(x: number, y: number, width: number, height: number, fill?: ReturnType<typeof rgb>) {
    this.page.drawRectangle({ x, y, width, height, borderWidth: 1, borderColor: rule, color: fill });
  }
}

function drawStudentPage(sheet: Sheet, input: PdfApplication, pictures: Pictures) {
  const columnLeft = 36;
  const columnRight = 420;
  const center = (value: string, y: number, size: number, font = sheet.bold) => {
    const width = font.widthOfTextAtSize(value, size);
    const x = columnLeft + (columnRight - columnLeft - width) / 2;
    sheet.text(value, Math.max(columnLeft, x), y, size, font);
  };
  if (input.number) sheet.text(`No. ${input.number}`, 36, 760, 10, sheet.bold);
  const school = "ARDENNE PREPARATORY & EXTENSION HIGH SCHOOL";
  const schoolWidth = sheet.bold.widthOfTextAtSize(school, 11);
  const schoolLeft = input.number ? 90 : columnLeft;
  const schoolX = schoolLeft + (columnRight - schoolLeft - schoolWidth) / 2;
  sheet.text(school, Math.max(schoolLeft, schoolX), 760, 11, sheet.bold);
  center("37 Hope Road, Kingston 10", 744, 9, sheet.font);
  center("Telephone: 876-926-7047 / 876-968-7643", 732, 9, sheet.font);
  center("Email: ardenne.prep.saw@moeschools.edu.jm", 720, 9, sheet.font);
  center("STUDENT APPLICATION FORM", 698, 14);
  center("Use block letters in blue or black ink, or type.", 684, 8, sheet.font);
  sheet.box(430, 620, 146, 168);
  if (pictures.photo) sheet.page.drawImage(pictures.photo, { x: 438, y: 668, width: 130, height: 100 });
  else centerNote(sheet, "Student's photograph", 503, 710);
  wrap(sheet, "Write the student's full name on the back of the photo.", 438, 656, 130, 7);
  sheet.box(36, 648, 380, 42, paper);
  wrap(sheet, "This is an application form only. It does not imply automatic entry. Registration fees are non-refundable.", 42, 676, 368, 8);
  sheet.y = 630;
  field(sheet, "Academic year applying for", input.academicYear, 36, 540);
  names(sheet, "Child's full name", input.lastName, input.firstName, input.middleName);
  checks(sheet, "Sex", [["Male", input.sex === "male"], ["Female", input.sex === "female"]]);
  pair(sheet, "Date of birth", [input.birthDate, input.birthMonth, input.birthYear].filter(Boolean).join(" "), "Age", input.age);
  pair(sheet, "Place of birth / country", input.birthPlace, "Nationality", input.nationality);
  field(sheet, "Current address", input.address, 36, 540);
  pair(sheet, "Student NSRN", input.nsrn, "Grade seeking entry into", input.gradeSeeking);
  pair(sheet, "Church", input.church, "Pastor's name", input.pastor);
  field(sheet, "Type of entry", entryLabel(input.entryType), 36, 540);
  pair(sheet, "Name of last school", input.lastSchool, "Last grade / class", input.lastGrade);
  personBlock(sheet, "Mother", input.mother, pictures.mother, false);
  personBlock(sheet, "Father", input.father, pictures.father, false);
}

function drawFamilyPage(sheet: Sheet, input: PdfApplication, pictures: Pictures) {
  sheet.need(346);
  sheet.text("TO BE COMPLETED IF APPLICABLE", 36, sheet.y, 8, sheet.bold, muted);
  sheet.y -= 16;
  personBlock(sheet, "Guardian", input.guardian, pictures.guardian, true);
  sheet.need(346);
  sheet.text("MUST BE DIFFERENT FROM THE PARENTS AND GUARDIAN. THIS IS MANDATORY.", 36, sheet.y, 8, sheet.bold, muted);
  sheet.y -= 16;
  personBlock(sheet, "Emergency contact", input.emergency, pictures.emergency, true);
  sheet.need(250);
  sheet.text("PHOTOGRAPHS AND SIGNATURES", 36, sheet.y, 10, sheet.bold);
  sheet.y -= 14;
  wrap(sheet, "I herewith enclose all documents so required for registration prior to admission. I agree to pay all the required fees prior to admission, inclusive of registration fees. Registration fees are non-refundable, non-negotiable.", 36, sheet.y, 540, 8);
  sheet.y -= 8;
  photoPair(sheet, pictures.photoOne, `${input.declaration.firstFirstName} ${input.declaration.firstLastName}`.trim(), pictures.signatureOne, "Signature (1)", 36);
  photoPair(sheet, pictures.photoTwo, `${input.declaration.secondFirstName} ${input.declaration.secondLastName}`.trim(), pictures.signatureTwo, "Signature (2)", 310);
  sheet.y -= 108;
  field(sheet, "Date", longDate(input.declaration.date), 36, 250);
  officeBlock(sheet, input, pictures.office);
}

function personBlock(sheet: Sheet, title: string, person: ApplicationPerson, signature: PDFImage | null, relation: boolean) {
  sheet.need(relation ? 330 : 300);
  const top = sheet.y;
  sheet.text(title.toUpperCase(), 42, top - 14, 9, sheet.bold);
  sheet.y = top - 30;
  names(sheet, "Name", person.lastName, person.firstName, person.middleName, 42, 516);
  if (relation) field(sheet, "Relation to child", person.relation, 42, 516);
  field(sheet, "Home address", person.address, 42, 516);
  triple(sheet, "Home telephone", person.homeTel, "Cell", person.cell, "Work", person.workTel, 42);
  field(sheet, "Workplace name", person.workplace, 42, 516);
  field(sheet, "Workplace address", person.workplaceAddress, 42, 516);
  if (person.occupation || title !== "Emergency contact") field(sheet, "Occupation", person.occupation, 42, 516);
  const signY = sheet.y;
  sheet.text("SIGNATURE", 42, signY, 7, sheet.bold, muted);
  if (signature) sheet.page.drawImage(signature, { x: 42, y: signY - 36, width: 140, height: 28 });
  sheet.rule(42, signY - 38, 160);
  sheet.text("ID TYPE", 230, signY, 7, sheet.bold, muted);
  sheet.text(clip(person.idType), 230, signY - 12, 10);
  sheet.rule(230, signY - 15, 140);
  sheet.text("ID NUMBER", 390, signY, 7, sheet.bold, muted);
  sheet.text(clip(person.idNumber), 390, signY - 12, 10);
  sheet.rule(390, signY - 15, 168);
  sheet.y = signY - 50;
  field(sheet, "Email address", person.email, 42, 516);
  const height = top - sheet.y + 8;
  sheet.box(36, sheet.y - 4, 540, height);
  sheet.y -= 16;
}

function photoPair(sheet: Sheet, photo: PDFImage | null, name: string, signature: PDFImage | null, label: string, x: number) {
  sheet.box(x, sheet.y - 96, 78, 96);
  if (photo) sheet.page.drawImage(photo, { x: x + 4, y: sheet.y - 90, width: 70, height: 84 });
  sheet.text(name || "Parent or guardian", x + 86, sheet.y - 16, 9, sheet.bold);
  sheet.text(label, x + 86, sheet.y - 36, 8, sheet.font, muted);
  if (signature) sheet.page.drawImage(signature, { x: x + 86, y: sheet.y - 78, width: 120, height: 32 });
  sheet.rule(x + 86, sheet.y - 80, 140);
}

function officeBlock(sheet: Sheet, input: PdfApplication, signature: PDFImage | null) {
  const items = input.documents.length ? input.documents : admissionDocuments.map(([, label]) => ({ label, attached: false }));
  const rows = Math.ceil(items.length / 2);
  sheet.need(190 + rows * 16);
  const top = sheet.y;
  sheet.text("FOR OFFICE USE ONLY", 42, top - 14, 10, sheet.bold);
  wrap(sheet, "Registration fees, documents and school fees must be submitted prior to full admission, if accepted.", 42, top - 28, 520, 8);
  sheet.y = top - 46;
  sheet.text("Documents received", 42, sheet.y, 9, sheet.bold);
  sheet.y -= 16;
  for (let index = 0; index < items.length; index += 2) {
    tick(sheet, 42, sheet.y, items[index]?.attached ?? false, items[index]?.label ?? "", 42);
    if (items[index + 1]) tick(sheet, 306, sheet.y, items[index + 1].attached, items[index + 1].label, 42);
    sheet.y -= 15;
  }
  sheet.y -= 6;
  const office = input.office;
  pair(sheet, "Student's entry date", office ? longDate(office.entryDate) : "", "Entry grade", office?.entryGrade ?? "");
  field(sheet, "Documents received and checked by", office?.staffName ?? "", 42, 516);
  sheet.text("Official signature", 42, sheet.y, 8, sheet.bold, muted);
  if (signature) sheet.page.drawImage(signature, { x: 150, y: sheet.y - 16, width: 120, height: 28 });
  sheet.rule(150, sheet.y - 18, 150);
  field(sheet, "Date", office ? longDate(office.date) : "", 360, 198);
  const height = top - sheet.y + 10;
  sheet.box(36, sheet.y - 6, 540, height);
}

function names(sheet: Sheet, label: string, last: string, first: string, middle: string, x = 36, width = 540) {
  field(sheet, label, [last, first, middle].filter(Boolean).join("  "), x, width);
}

function field(sheet: Sheet, label: string, value: string, x: number, width: number) {
  sheet.text(label.toUpperCase(), x, sheet.y, 7, sheet.bold, muted);
  sheet.text(clip(value), x, sheet.y - 12, 10);
  sheet.rule(x, sheet.y - 15, width);
  sheet.y -= 28;
}

function pair(sheet: Sheet, left: string, leftValue: string, right: string, rightValue: string) {
  const y = sheet.y;
  sheet.text(left.toUpperCase(), 36, y, 7, sheet.bold, muted);
  sheet.text(clip(leftValue), 36, y - 12, 10);
  sheet.rule(36, y - 15, 250);
  sheet.text(right.toUpperCase(), 310, y, 7, sheet.bold, muted);
  sheet.text(clip(rightValue), 310, y - 12, 10);
  sheet.rule(310, y - 15, 266);
  sheet.y -= 28;
}

function triple(sheet: Sheet, a: string, aValue: string, b: string, bValue: string, c: string, cValue: string, x: number) {
  const y = sheet.y;
  const columns = [[a, aValue, x], [b, bValue, x + 175], [c, cValue, x + 350]] as const;
  for (const [label, value, column] of columns) {
    sheet.text(label.toUpperCase(), column, y, 7, sheet.bold, muted);
    sheet.text(clip(value), column, y - 12, 10);
    sheet.rule(column, y - 15, 160);
  }
  sheet.y -= 28;
}

function checks(sheet: Sheet, label: string, options: [string, boolean][]) {
  sheet.text(label.toUpperCase(), 36, sheet.y, 7, sheet.bold, muted);
  let x = 80;
  for (const [name, on] of options) {
    tick(sheet, x, sheet.y - 1, on, name);
    x += 90;
  }
  sheet.y -= 20;
}

function tick(sheet: Sheet, x: number, y: number, on: boolean, label: string, max = 24) {
  sheet.page.drawRectangle({ x, y, width: 8, height: 8, borderWidth: 0.8, borderColor: rule });
  if (on) {
    sheet.page.drawLine({ start: { x: x + 1.5, y: y + 1.5 }, end: { x: x + 6.5, y: y + 6.5 }, thickness: 1, color: black });
    sheet.page.drawLine({ start: { x: x + 1.5, y: y + 6.5 }, end: { x: x + 6.5, y: y + 1.5 }, thickness: 1, color: black });
  }
  sheet.text(clip(label, max), x + 12, y + 1, 8);
}

async function drawUploadPage(pdf: PDFDocument, sheet: Sheet, upload: PdfUpload) {
  const bytes = await loadBytes(upload.source);
  if (bytes && isPdf(bytes, upload.name)) {
    try {
      const source = await PDFDocument.load(bytes);
      const pages = await pdf.embedPdf(source);
      for (let index = 0; index < pages.length; index += 1) {
        const embedded = pages[index];
        sheet.freshPage();
        drawUploadHeading(sheet, upload, index, pages.length);
        drawFitted(embedded.width, embedded.height, (x, y, width, height) => sheet.page.drawPage(embedded, { x, y, width, height }));
      }
      return;
    } catch {
      // A PDF that cannot be copied is noted on its own page below.
    }
  }
  sheet.freshPage();
  drawUploadHeading(sheet, upload, 0, 1);
  const image = bytes ? await embedImageBytes(pdf, bytes) : null;
  if (!image) {
    sheet.text("This file could not be included.", 36, 700, 10);
    return;
  }
  drawFitted(image.width, image.height, (x, y, width, height) => sheet.page.drawImage(image, { x, y, width, height }));
}

function drawUploadHeading(sheet: Sheet, upload: PdfUpload, index: number, total: number) {
  sheet.text(upload.label, 36, 752, 12, sheet.bold);
  const note = total > 1 ? ` · page ${index + 1} of ${total}` : "";
  sheet.text(`${upload.name}${note}`, 36, 734, 9, sheet.font, muted);
}

function drawFitted(width: number, height: number, draw: (x: number, y: number, width: number, height: number) => void) {
  const scale = Math.min(540 / width, 680 / height);
  const fittedWidth = width * scale;
  const fittedHeight = height * scale;
  draw(36 + (540 - fittedWidth) / 2, 36 + (680 - fittedHeight) / 2, fittedWidth, fittedHeight);
}

async function loadBytes(source: PdfPicture) {
  if (!source) return null;
  try {
    if (typeof source !== "string") return new Uint8Array(await source.arrayBuffer());
    const response = await fetch(source);
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}

function isPdf(bytes: Uint8Array, name: string) {
  return name.toLowerCase().endsWith(".pdf") || (bytes.length > 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46);
}

async function embedImageBytes(pdf: PDFDocument, bytes: Uint8Array) {
  try {
    return await pdf.embedPng(bytes);
  } catch {
    try {
      return await pdf.embedJpg(bytes);
    } catch {
      return embedPicture(pdf, new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer]));
    }
  }
}

function wrap(sheet: Sheet, value: string, x: number, y: number, width: number, size: number) {
  let line = "";
  let cursor = y;
  for (const word of value.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (sheet.font.widthOfTextAtSize(next, size) > width) {
      sheet.text(line, x, cursor, size);
      line = word;
      cursor -= size + 2;
    } else line = next;
  }
  if (line) sheet.text(line, x, cursor, size);
  sheet.y = Math.min(sheet.y, cursor - 8);
}

function centerNote(sheet: Sheet, value: string, x: number, y: number) {
  const width = sheet.font.widthOfTextAtSize(value, 8);
  sheet.text(value, x - width / 2, y, 8, sheet.font, muted);
}

function entryLabel(value: string) {
  if (value === "pep") return "PEP";
  if (value === "transfer") return "Transfer";
  if (value === "other") return "Other";
  return value;
}

function longDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("en-JM", { day: "numeric", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
}

function clip(value: string, max = 80) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

async function embedPicture(pdf: PDFDocument, source: PdfPicture) {
  const bytes = await raster(source);
  if (!bytes) return null;
  try {
    return await pdf.embedPng(bytes);
  } catch {
    return null;
  }
}

async function raster(source: PdfPicture) {
  if (!source) return null;
  const url = typeof source === "string" ? source : URL.createObjectURL(source);
  const revoke = typeof source !== "string";
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(bitmap, 0, 0);
    const png = await new Promise<Blob | null>((resolve) => canvas.toBlob((value) => resolve(value), "image/png"));
    return png ? new Uint8Array(await png.arrayBuffer()) : null;
  } catch {
    return null;
  } finally {
    if (revoke) URL.revokeObjectURL(url);
  }
}
