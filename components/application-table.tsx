"use client";

import { useEffect, useState } from "react";
import { deleteAdmissionApplication, getAdmissionApplication, saveAdmissionOffice } from "@/actions/applications";
import { downloadApplicationPdf, uploadPages } from "@/components/application-pdf";
import { SignaturePad } from "@/components/signature-pad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogBackdrop, DialogClose, DialogPopup, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogBackdrop, AlertDialogClose, AlertDialogDescription, AlertDialogPopup, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatAdmissionUpdated } from "@/lib/admissions";
import { admissionDocuments, parseDeclaration, parseDocuments, parseOffice, parsePerson, personStarted, type ApplicationOffice, type ApplicationPerson } from "@/lib/application-people";
import { applicationEntryTypes } from "@/lib/applications";
import { BehaviourPaper } from "@/components/behaviour-apply";
import { downloadBehaviourPdf } from "@/components/behaviour-pdf";
import { cleanBehaviour } from "@/lib/behaviour";

const fieldClass = "h-11 text-base";

export type ApplicationRow = {
  id: string;
  submissionNumber: number;
  photoFileId: string;
  firstName: string;
  lastName: string;
  middleName: string;
  sex: string;
  academicYear: string;
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
  createdAt: string;
  documents: string;
  office: string;
  mother: string;
  father: string;
  guardian: string;
  emergency: string;
  declaration: string;
  behaviour: string;
};

export function ApplicationTable({ rows, title = "Online applications" }: { rows: ApplicationRow[]; title?: string }) {
  const [records, setRecords] = useState(rows);
  const [preview, setPreview] = useState<ApplicationRow | null>(null);
  const [message, setMessage] = useState("");
  const [downloadingId, setDownloadingId] = useState("");

  useEffect(() => {
    setRecords(rows);
  }, [rows]);

  async function remove(id: string) {
    const result = await deleteAdmissionApplication(id);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setRecords((current) => current.filter((row) => row.id !== id));
    setMessage("Application deleted.");
  }

  function saved(id: string, office: ApplicationOffice) {
    setRecords((current) => current.map((row) => row.id === id ? { ...row, office: JSON.stringify(office) } : row));
    setPreview((current) => current && current.id === id ? { ...current, office: JSON.stringify(office) } : current);
    setMessage("Office record saved.");
  }

  async function download(row: ApplicationRow) {
    setDownloadingId(row.id);
    setMessage("");
    try {
      if (row.entryType === "behaviour") await downloadBehaviourPdf(behaviourForm(row.behaviour), stampSrc(row.behaviour));
      else await downloadRecordPdf(row);
    } catch {
      setMessage("The PDF could not be prepared.");
    } finally {
      setDownloadingId("");
    }
  }

  return (
    <section className="awards-card">
      <div className="awards-card-head">
        <h2>{title}</h2>
        {message ? <p role="status">{message}</p> : null}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Year / grade</TableHead>
            <TableHead>Entry</TableHead>
            <TableHead>Received</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow><TableCell colSpan={6}>No online applications yet.</TableCell></TableRow>
          ) : records.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{String(row.submissionNumber).padStart(4, "0")}</TableCell>
              <TableCell className="whitespace-normal"><strong>{row.firstName} {row.lastName}</strong></TableCell>
              <TableCell className="whitespace-normal">{row.entryType === "behaviour" ? (row.gradeSeeking || "—") : `${row.academicYear}${row.gradeSeeking ? ` · ${row.gradeSeeking}` : ""}`}</TableCell>
              <TableCell>{row.entryType === "behaviour" ? "Behaviour assessment" : applicationEntryTypes.find(([id]) => id === row.entryType)?.[1] ?? row.entryType}</TableCell>
              <TableCell>{formatAdmissionUpdated(row.createdAt)}</TableCell>
              <TableCell>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" disabled={downloadingId === row.id} onClick={() => void download(row)}>{downloadingId === row.id ? "Preparing PDF…" : "Download PDF"}</Button>
                  <Button type="button" variant="outline" onClick={() => setPreview(row)}>Preview</Button>
                  <DeleteApplication onConfirm={() => remove(row.id)} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={Boolean(preview)} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup className="w-[min(68rem,calc(100vw-2rem))] max-h-[min(92vh,56rem)] p-0">
            {preview?.entryType === "behaviour" ? (
              <>
                <DialogTitle className="sr-only">Behaviour assessment for {preview.firstName} {preview.lastName}</DialogTitle>
                <BehaviourPaper form={behaviourForm(preview.behaviour)} stampSrc={stampSrc(preview.behaviour)} />
              </>
            ) : preview ? <OfficePreview key={preview.id} row={preview} onSaved={(office) => saved(preview.id, office)} /> : null}
          </DialogPopup>
        </DialogPortal>
      </Dialog>
    </section>
  );
}

function OfficePreview({ row, onSaved }: { row: ApplicationRow; onSaved: (office: ApplicationOffice) => void }) {
  const [record, setRecord] = useState(row);
  const [office, setOffice] = useState<ApplicationOffice>(parseOffice(row.office));
  const [status, setStatus] = useState("Loading the application…");
  const [downloading, setDownloading] = useState(false);
  useEffect(() => {
    let live = true;
    getAdmissionApplication(row.id).then((result) => {
      if (!live) return;
      if (result.ok) {
        setRecord(result.application);
        setOffice(parseOffice(result.application.office));
        setStatus("");
        return;
      }
      setStatus(result.error);
    }).catch(() => {
      if (live) setStatus("The application could not be loaded.");
    });
    return () => { live = false; };
  }, [row.id]);
  const savedDocuments = parseDocuments(record.documents);
  const uploaded = new Set(savedDocuments.map((item) => item.id));
  const declaration = parseDeclaration(record.declaration);
  const student = [record.firstName, record.middleName, record.lastName].filter(Boolean).join(" ");
  const entry = applicationEntryTypes.find(([id]) => id === record.entryType)?.[1] ?? record.entryType;
  const number = Number.isFinite(record.submissionNumber) ? String(record.submissionNumber).padStart(4, "0") : "";
  return (
    <form className="office-record" onSubmit={async (event) => {
      event.preventDefault();
      setStatus("Saving…");
      const result = await saveAdmissionOffice(row.id, office);
      if (!result.ok) {
        setStatus(result.error);
        return;
      }
      onSaved(office);
      setStatus("Office record saved.");
    }}>
      <header className="office-record-hero">
        <Portrait fileId={record.photoFileId} name={student} />
        <div>
          <p className="office-kicker">Office record{number ? ` · ${number}` : ""}</p>
          <DialogTitle className="office-record-name">{student}</DialogTitle>
          <p>{record.academicYear} · {record.gradeSeeking || "Grade not stated"} · {entry}</p>
          <p>Received {formatAdmissionUpdated(record.createdAt)}</p>
        </div>
      </header>
      <div className="office-record-body">
        <section className="office-panel">
          <h2>Student</h2>
          <dl className="office-facts">
            <Fact label="Sex" value={record.sex === "male" ? "Male" : record.sex === "female" ? "Female" : record.sex} />
            <Fact label="Date of birth" value={[record.birthDate, record.birthMonth, record.birthYear].filter(Boolean).join(" ")} />
            <Fact label="Age" value={record.age} />
            <Fact label="Place of birth" value={record.birthPlace} />
            <Fact label="Nationality" value={record.nationality} />
            <Fact label="Current address" value={record.address} />
            <Fact label="Student NSRN" value={record.nsrn || "—"} />
            <Fact label="Church" value={record.church || "—"} />
            <Fact label="Pastor's name" value={record.pastor || "—"} />
            <Fact label="Last school" value={record.lastSchool} />
            <Fact label="Last grade / class" value={record.lastGrade} />
          </dl>
        </section>
        <div className="office-people">
          <PersonCard title="Mother" person={parsePerson(record.mother)} />
          <PersonCard title="Father" person={parsePerson(record.father)} />
          <PersonCard title="Guardian" person={parsePerson(record.guardian)} optional />
          <PersonCard title="Emergency contact" person={parsePerson(record.emergency)} />
        </div>
        <section className="office-panel">
          <h2>Photographs and signatures</h2>
          <p>I herewith enclose all documents so required for registration prior to admission. I agree to pay all the required fees prior to admission, inclusive of registration fees. Registration fees are non-refundable, non-negotiable.</p>
          <div className="office-portraits">
            <Portrait fileId={declaration.photoOneId} name={`${declaration.firstFirstName} ${declaration.firstLastName}`.trim() || "Parent or guardian 1"} />
            <div>
              <strong>{declaration.firstFirstName} {declaration.firstLastName}</strong>
              {declaration.signatureOne ? <img className="office-sign" src={declaration.signatureOne} alt="Signature 1" /> : null}
            </div>
            <Portrait fileId={declaration.photoTwoId} name={`${declaration.secondFirstName} ${declaration.secondLastName}`.trim() || "Parent or guardian 2"} />
            <div>
              <strong>{declaration.secondFirstName} {declaration.secondLastName}</strong>
              {declaration.signatureTwo ? <img className="office-sign" src={declaration.signatureTwo} alt="Signature 2" /> : null}
            </div>
          </div>
          <dl className="office-facts"><Fact label="Date signed" value={longDate(declaration.date)} /></dl>
        </section>
        <section className="office-sheet">
          <h2>For office use only</h2>
          <p>Registration fees, documents and school fees must be submitted prior to full admission, if accepted.</p>
          <h3>Documents received</h3>
          <div className="office-docs">
            {admissionDocuments.map(([id, label], index) => {
              const files = savedDocuments.filter((file) => file.id === id);
              const fromUpload = uploaded.has(id) || id === "application";
              const checked = fromUpload || office.received.includes(id);
              return (
                <div className="office-doc" data-in={checked ? "true" : undefined} key={id} style={{ animationDelay: `${index * 25}ms` }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={fromUpload}
                      onChange={(event) => setOffice((current) => ({
                        ...current,
                        received: event.target.checked ? [...current.received, id] : current.received.filter((item) => item !== id),
                      }))}
                    />
                    <strong>{label}</strong>
                  </label>
                  {files.map((file) => isImageName(file.filename) ? (
                    <a key={file.fileId} href={`/api/files/${file.fileId}`} target="_blank" rel="noreferrer">
                      <img src={`/api/files/${file.fileId}`} alt="" />
                      {file.filename}
                    </a>
                  ) : (
                    <a key={file.fileId} href={`/api/files/${file.fileId}`} target="_blank" rel="noreferrer">{file.filename || "View file"}</a>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="apply-pair">
            <label className="apply-field">Student&apos;s entry date into the school
              <Input className={fieldClass} type="date" value={office.entryDate} onChange={(event) => setOffice({ ...office, entryDate: event.target.value })} />
            </label>
            <label className="apply-field">Entry grade
              <Input className={fieldClass} value={office.entryGrade} onChange={(event) => setOffice({ ...office, entryGrade: event.target.value })} />
            </label>
          </div>
          <label className="apply-field">Documents received and checked by office staff — name
            <Input className={fieldClass} value={office.staffName} onChange={(event) => setOffice({ ...office, staffName: event.target.value })} />
          </label>
          <SignaturePad label="Official signature" value={office.signature} onChange={(signature) => setOffice({ ...office, signature })} />
          <label className="apply-field">Date
            <Input className={fieldClass} type="date" value={office.date} onChange={(event) => setOffice({ ...office, date: event.target.value })} />
          </label>
        </section>
        {status ? <p className="office-status" role="status">{status}</p> : null}
        <div className="admission-actions">
          <Button type="submit">Save office record</Button>
          <Button type="button" variant="outline" disabled={downloading || !number} onClick={() => {
            setDownloading(true);
            void downloadRecordPdf(record).then(() => setDownloading(false), () => { setDownloading(false); setStatus("The PDF could not be prepared."); });
          }}>{downloading ? "Preparing PDF…" : "Download PDF"}</Button>
          <DialogClose render={<Button type="button" variant="outline" />}>Close</DialogClose>
        </div>
      </div>
    </form>
  );
}

function PersonCard({ title, person, optional = false }: { title: string; person: ApplicationPerson; optional?: boolean }) {
  if (optional && !personStarted(person)) {
    return <section className="office-person"><h3>{title}</h3><p>Not completed.</p></section>;
  }
  return (
    <section className="office-person">
      <h3>{title}</h3>
      <dl className="office-facts">
        <Fact label="Name" value={[person.firstName, person.middleName, person.lastName].filter(Boolean).join(" ")} />
        {person.relation ? <Fact label="Relation to child" value={person.relation} /> : null}
        <Fact label="Home address" value={person.address} />
        <Fact label="Telephone" value={[person.homeTel, person.cell, person.workTel].filter(Boolean).join(" · ") || "—"} />
        <Fact label="Workplace" value={[person.workplace, person.workplaceAddress].filter(Boolean).join(", ") || "—"} />
        {person.occupation ? <Fact label="Occupation" value={person.occupation} /> : null}
        <Fact label="ID" value={[person.idType, person.idNumber].filter(Boolean).join(" · ")} />
        <Fact label="Email" value={person.email} />
      </dl>
      {person.signature ? <img className="office-sign" src={person.signature} alt={`${title} signature`} /> : null}
    </section>
  );
}

function Portrait({ fileId, name }: { fileId: string; name: string }) {
  if (!fileId) return <span className="office-portrait">No photograph</span>;
  return <img className="office-portrait" src={`/api/files/${fileId}`} alt={`${name} photograph`} />;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value || "—"}</dd></div>;
}

function longDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso || "—";
  return new Intl.DateTimeFormat("en-JM", { day: "numeric", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
}

function isImageName(name: string) {
  return /\.(png|jpe?g|gif|webp)$/i.test(name);
}

async function downloadRecordPdf(record: ApplicationRow) {
  const declaration = parseDeclaration(record.declaration);
  const saved = parseDocuments(record.documents);
  await downloadApplicationPdf({
    number: String(record.submissionNumber).padStart(4, "0"),
    academicYear: record.academicYear,
    lastName: record.lastName,
    firstName: record.firstName,
    middleName: record.middleName,
    sex: record.sex,
    birthDate: record.birthDate,
    birthMonth: record.birthMonth,
    birthYear: record.birthYear,
    age: record.age,
    birthPlace: record.birthPlace,
    nationality: record.nationality,
    address: record.address,
    nsrn: record.nsrn,
    gradeSeeking: record.gradeSeeking,
    church: record.church,
    pastor: record.pastor,
    entryType: record.entryType,
    lastSchool: record.lastSchool,
    lastGrade: record.lastGrade,
    photo: record.photoFileId ? `/api/files/${record.photoFileId}` : null,
    mother: parsePerson(record.mother),
    father: parsePerson(record.father),
    guardian: parsePerson(record.guardian),
    emergency: parsePerson(record.emergency),
    declaration,
    photoOne: declaration.photoOneId ? `/api/files/${declaration.photoOneId}` : null,
    photoTwo: declaration.photoTwoId ? `/api/files/${declaration.photoTwoId}` : null,
    documents: admissionDocuments.map(([id, label]) => ({ label, attached: id === "application" || saved.some((item) => item.id === id) })),
    uploads: uploadPages(saved.map((item) => ({ ...item, source: `/api/files/${item.fileId}` }))),
    office: parseOffice(record.office),
  });
}

function behaviourForm(value: string) {
  try {
    return cleanBehaviour(JSON.parse(value));
  } catch {
    return cleanBehaviour({});
  }
}

function stampSrc(value: string) {
  const id = behaviourForm(value).stampFileId;
  return id ? `/api/files/${id}` : "";
}

function DeleteApplication({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button type="button" variant="outline" className="awards-remove" />}>Delete</AlertDialogTrigger>
      <AlertDialogPortal>
        <AlertDialogBackdrop />
        <AlertDialogPopup>
          <AlertDialogTitle>Delete this application?</AlertDialogTitle>
          <AlertDialogDescription>The submitted form and its uploaded files will be removed. This cannot be undone.</AlertDialogDescription>
          <div className="mt-6 flex gap-2">
            <AlertDialogClose render={<Button type="button" variant="destructive" onClick={onConfirm} />}>Delete</AlertDialogClose>
            <AlertDialogClose render={<Button type="button" variant="outline" />}>Cancel</AlertDialogClose>
          </div>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
