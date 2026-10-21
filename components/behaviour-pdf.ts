"use client";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { conflictOptions, disciplineOptions, emotionalOptions, helpOptions, socialOptions, type BehaviourAnswers } from "@/lib/behaviour";

const ink = rgb(0.04, 0.08, 0.16);
const rule = rgb(0.04, 0.08, 0.16);

export async function downloadBehaviourPdf(form: BehaviourAnswers, stampSrc: string) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const signature = await embedPicture(pdf, form.signature);
  const stamp = await embedPicture(pdf, stampSrc);
  const sheet = new Sheet(pdf, font, bold);
  drawForm(sheet, form, signature, stamp);
  const bytes = await pdf.save();
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const name = [form.lastName, form.firstName].filter(Boolean).join("-") || "form";
  link.href = url;
  link.download = `APEHS-behaviour-assessment-${name}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

function drawForm(sheet: Sheet, form: BehaviourAnswers, signature: PDFImage | null, stamp: PDFImage | null) {
  const child = [form.lastName, form.firstName, form.middleName].filter(Boolean).join(" ");
  center(sheet, "ARDENNE PREPARATORY & EXTENSION HIGH SCHOOL", 752, 12, sheet.bold);
  center(sheet, "37 Hope Road, Kingston 10", 736, 9, sheet.font);
  center(sheet, "Telephone: 876-926-7047 / 876-926-7910", 724, 9, sheet.font);
  center(sheet, "Email: ardenne.prep.saw@moeschools.edu.jm", 712, 9, sheet.font);
  center(sheet, "BEHAVIOUR ASSESSMENT FORM", 692, 13, sheet.bold);
  center(sheet, "TO THE PRINCIPAL OR REPRESENTATIVE", 676, 9, sheet.bold);
  sheet.y = 656;
  sheet.text(`The parent(s) of ${child || "________________"} request a transfer`, 36, sheet.y, 10);
  sheet.y -= 16;
  sheet.text(`from ${form.lastSchool || "________________"}`, 36, sheet.y, 10);
  sheet.y -= 14;
  write(sheet, form.lastSchoolAddress, 36, 540, 9, true);
  write(sheet, "to Ardenne Preparatory and Extension High School. Please fill out the following form and return directly to the Principal of Ardenne Preparatory and Extension High School under CONFIDENTIAL COVER.", 36, 540, 9);
  const lines: [string, string, string][] = [
    ["1", "Full name of student (as it appears on Birth Certificate)", form.fullName],
    ["2", "Date of birth / Age", [paperDate(form.birthDate), form.age].filter(Boolean).join(" / ")],
    ["3", "Full name of mother", form.motherName],
    ["4", "Full name of father", form.fatherName],
    ["5", "Grades to which the student was admitted", form.gradesAdmitted],
    ["6", "Present grade", form.presentGrade],
    ["7", "Areas of academic strength", form.academicStrength],
    ["8", "Areas of academic weakness", form.academicWeakness],
    ["9", "Has the student ever been suspended?", labelYes(form.suspended)],
    ["10", "If yes, state how many times.", form.suspendedTimes],
    ["11", "Has the student been involved in disciplinary problems / altercations, etc.", labelYes(form.disciplinary)],
    ["12", "If yes, please state nature of the problems.", form.disciplinaryNature],
    ["13", "Was student expelled from your school.", labelYes(form.expelled)],
    ["14", "If yes, state reason why", form.expelledReason],
    ["15", "Has student ever received detentions?", labelYes(form.detentions)],
    ["16", "If yes, give number and circumstances.", form.detentionCircumstances],
    ["17", "Is student an active club or society member? If yes, please list.", form.clubs],
    ["19", "Is the student prepared for school and class? Has books and equipment ready?", form.prepared],
    ["20", "Are the parents active members of the PTA body?", form.pta],
    ["21", "Would you readily re-admit this student to your institution? If yes, state why?", form.readmit],
    ["22", "Give reasons for considering this transfer from your institution.", form.transferReasons],
  ];
  for (const [number, label, value] of lines) tableRow(sheet, number, label, value);
  sheet.y -= 14;
  sheet.need(36);
  sheet.text("PART B: Please rate him/her in the following areas. (You may tick more than one)", 36, sheet.y, 9, sheet.bold);
  sheet.y -= 16;
  rate(sheet, "1. EMOTIONAL MATURITY", "How does the applicant deal with setbacks, unfamiliar/challenging situations? The child:", emotionalOptions, form.emotional, "seeks help from:", form.emotionalHelp);
  rate(sheet, "2. CONFLICT RESOLUTION CAPACITY: The child:", "", conflictOptions, form.conflict, "seeks aid of:", form.conflictHelp);
  rate(sheet, "3. ACADEMIC DISCIPLINE: The child:", "", disciplineOptions, form.discipline);
  rate(sheet, "4. SOCIAL INTEGRATION: The child:", "", socialOptions, form.social);
  closeBlock(sheet, form, signature, stamp);
}

function tableRow(sheet: Sheet, number: string, label: string, value: string) {
  const labelLines = wrap(sheet.font, label, 8, 210);
  const valueLines = wrap(sheet.font, value || " ", 9, 270);
  const height = Math.max(labelLines.length, valueLines.length) * 11 + 8;
  sheet.need(height);
  const top = sheet.y;
  const bottom = top - height;
  sheet.page.drawRectangle({ x: 36, y: bottom, width: 22, height, borderWidth: 0.6, borderColor: rule });
  sheet.page.drawRectangle({ x: 58, y: bottom, width: 220, height, borderWidth: 0.6, borderColor: rule });
  sheet.page.drawRectangle({ x: 278, y: bottom, width: 298, height, borderWidth: 0.6, borderColor: rule });
  sheet.text(number, 42, top - 12, 8, sheet.bold);
  labelLines.forEach((line, index) => sheet.text(line, 64, top - 12 - index * 11, 8));
  valueLines.forEach((line, index) => sheet.text(line, 284, top - 12 - index * 11, 9));
  sheet.y = bottom;
}

function rate(sheet: Sheet, title: string, prompt: string, options: readonly string[], selected: string[], help?: string, helpSelected: string[] = []) {
  const rows = Math.ceil(options.length / 2) + (help ? 1 : 0);
  sheet.need(28 + rows * 16);
  sheet.text(title, 36, sheet.y, 9, sheet.bold);
  sheet.y -= 12;
  if (prompt) write(sheet, prompt, 36, 540, 8);
  for (let index = 0; index < options.length; index += 2) {
    sheet.need(16);
    option(sheet, 36, sheet.y, options[index], selected.includes(options[index]));
    if (options[index + 1]) option(sheet, 306, sheet.y, options[index + 1], selected.includes(options[index + 1]));
    sheet.y -= 14;
  }
  if (help) {
    sheet.need(16);
    sheet.text(help, 36, sheet.y, 8, sheet.bold);
    let x = 130;
    for (const name of helpOptions) {
      option(sheet, x, sheet.y, name, helpSelected.includes(name));
      x += 100;
    }
    sheet.y -= 16;
  }
  sheet.y -= 6;
}

function option(sheet: Sheet, x: number, y: number, label: string, on: boolean) {
  sheet.page.drawEllipse({ x: x + 4, y: y + 3, xScale: 4, yScale: 4, borderWidth: 0.8, borderColor: ink, color: on ? ink : rgb(1, 1, 1) });
  sheet.text(label, x + 12, y, 8);
}

function closeBlock(sheet: Sheet, form: BehaviourAnswers, signature: PDFImage | null, stamp: PDFImage | null) {
  sheet.need(210);
  sheet.text("Person completing this form", 36, sheet.y, 8, sheet.bold);
  sheet.text(form.completedBy, 36, sheet.y - 14, 10);
  sheet.rule(36, sheet.y - 17, 250);
  sheet.text("Date", 320, sheet.y, 8, sheet.bold);
  sheet.text(paperDate(form.completedDate), 320, sheet.y - 14, 10);
  sheet.rule(320, sheet.y - 17, 250);
  sheet.y -= 40;
  sheet.text("Signature", 36, sheet.y, 8, sheet.bold);
  if (signature) sheet.page.drawImage(signature, { x: 36, y: sheet.y - 34, width: 140, height: 28 });
  sheet.rule(36, sheet.y - 36, 180);
  sheet.text("Position", 320, sheet.y, 8, sheet.bold);
  sheet.text(form.position, 320, sheet.y - 14, 10);
  sheet.rule(320, sheet.y - 17, 250);
  sheet.y -= 52;
  sheet.need(28);
  sheet.text("Address of the school / institution", 36, sheet.y, 8, sheet.bold);
  write(sheet, form.institutionAddress, 36, 540, 10);
  sheet.need(70);
  sheet.text("Telephone #", 36, sheet.y, 8, sheet.bold);
  sheet.text(form.telephone, 36, sheet.y - 14, 10);
  sheet.rule(36, sheet.y - 17, 250);
  sheet.text("Email", 320, sheet.y, 8, sheet.bold);
  sheet.text(form.email, 320, sheet.y - 14, 10);
  sheet.rule(320, sheet.y - 17, 250);
  sheet.y -= 36;
  sheet.need(130);
  sheet.page.drawRectangle({ x: 36, y: sheet.y - 78, width: 540, height: 78, borderWidth: 0.8, borderColor: rule, borderDashArray: [3, 2] });
  if (stamp) {
    const scale = Math.min(160 / stamp.width, 64 / stamp.height);
    const width = stamp.width * scale;
    const height = stamp.height * scale;
    sheet.page.drawImage(stamp, { x: 306 - width / 2, y: sheet.y - 70 + (64 - height) / 2, width, height });
  } else {
    center(sheet, "Place institution's / school stamp here", sheet.y - 42, 9, sheet.font);
  }
  sheet.y -= 96;
  sheet.need(36);
  center(sheet, "NOTE: THE APPLICATION PROCESS WILL NOT BE COMPLETE IF THIS FORM IS NOT", sheet.y, 8, sheet.bold);
  center(sheet, "RETURNED UNDER CONFIDENTIAL COVER.", sheet.y - 12, 8, sheet.bold);
  center(sheet, "This form is part of the application process. It does not imply automatic entry or acceptance.", sheet.y - 28, 8, sheet.bold);
}

function write(sheet: Sheet, value: string, x: number, width: number, size: number, centerLine = false) {
  const lines = wrap(centerLine ? sheet.font : sheet.font, value, size, width);
  for (const line of lines) {
    sheet.need(size + 4);
    const left = centerLine ? x + (width - sheet.font.widthOfTextAtSize(line, size)) / 2 : x;
    sheet.text(line, left, sheet.y, size);
    sheet.y -= size + 3;
  }
  sheet.y -= 4;
}

function wrap(font: PDFFont, value: string, size: number, width: number) {
  const words = safe(value).split(" ").filter(Boolean);
  if (!words.length) return [" "];
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function center(sheet: Sheet, value: string, y: number, size: number, font: PDFFont) {
  const text = safe(value);
  const width = font.widthOfTextAtSize(text, size);
  sheet.text(text, (612 - width) / 2, y, size, font);
}

function safe(value: string) {
  return value.replace(/[‘’]/g, "'").replace(/[“”]/g, "\"").replace(/[–—]/g, "-").replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
}

function labelYes(value: string) {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  return "";
}

function paperDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("en-JM", { day: "numeric", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
}

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
    if (this.y - height < 40) this.freshPage();
  }
  text(value: string, x: number, y: number, size: number, font = this.font) {
    const text = safe(value);
    if (!text) return;
    this.page.drawText(text, { x, y, size, font, color: ink });
  }
  rule(x: number, y: number, width: number) {
    this.page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: 0.6, color: rule });
  }
}

async function embedPicture(pdf: PDFDocument, source: string) {
  if (!source) return null;
  try {
    const response = await fetch(source);
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
    if (!png) return null;
    return await pdf.embedPng(new Uint8Array(await png.arrayBuffer()));
  } catch {
    return null;
  }
}
