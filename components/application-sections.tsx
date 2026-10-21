"use client";

import { useState } from "react";
import { Check, FileText, FolderOpen, Search, Upload } from "lucide-react";
import { uploadApplicationFile } from "@/actions/applications";
import { SignaturePad } from "@/components/signature-pad";
import { Input } from "@/components/ui/input";
import { admissionDocuments, type ApplicationDeclaration, type ApplicationDocument, type ApplicationPerson } from "@/lib/application-people";

const fieldClass = "h-11 text-base";

export function PersonFields({ person, legend, relationLabel, occupation, onChange }: { person: ApplicationPerson; legend: string; relationLabel?: string; occupation: boolean; onChange: (person: ApplicationPerson) => void }) {
  function update(patch: Partial<ApplicationPerson>) {
    onChange({ ...person, ...patch });
  }
  return (
    <div className="apply-fields">
      <h2>{legend}</h2>
      <div className="apply-names">
        <Field label="Last name" required><Input className={fieldClass} value={person.lastName} onChange={(event) => update({ lastName: event.target.value })} /></Field>
        <Field label="First name" required><Input className={fieldClass} value={person.firstName} onChange={(event) => update({ firstName: event.target.value })} /></Field>
        <Field label="Middle name"><Input className={fieldClass} value={person.middleName} onChange={(event) => update({ middleName: event.target.value })} /></Field>
      </div>
      {relationLabel ? <Field label={relationLabel} required><Input className={fieldClass} value={person.relation} onChange={(event) => update({ relation: event.target.value })} /></Field> : null}
      <Field label="Home address" required><Input className={fieldClass} value={person.address} onChange={(event) => update({ address: event.target.value })} /></Field>
      <div className="apply-names">
        <Field label="Home telephone"><Input className={fieldClass} value={person.homeTel} onChange={(event) => update({ homeTel: event.target.value })} /></Field>
        <Field label="Cell"><Input className={fieldClass} value={person.cell} onChange={(event) => update({ cell: event.target.value })} /></Field>
        <Field label="Work"><Input className={fieldClass} value={person.workTel} onChange={(event) => update({ workTel: event.target.value })} /></Field>
      </div>
      {occupation ? (
        <>
          <Field label="Workplace name" required><Input className={fieldClass} value={person.workplace} onChange={(event) => update({ workplace: event.target.value })} /></Field>
          <Field label="Workplace address" required><Input className={fieldClass} value={person.workplaceAddress} onChange={(event) => update({ workplaceAddress: event.target.value })} /></Field>
          <Field label="Occupation" required><Input className={fieldClass} value={person.occupation} onChange={(event) => update({ occupation: event.target.value })} /></Field>
        </>
      ) : (
        <>
          <Field label="Workplace name"><Input className={fieldClass} value={person.workplace} onChange={(event) => update({ workplace: event.target.value })} /></Field>
          <Field label="Workplace address"><Input className={fieldClass} value={person.workplaceAddress} onChange={(event) => update({ workplaceAddress: event.target.value })} /></Field>
        </>
      )}
      <SignaturePad label="Signature" value={person.signature} onChange={(signature) => update({ signature })} />
      <div className="apply-pair">
        <Field label="ID type" required><Input className={fieldClass} value={person.idType} onChange={(event) => update({ idType: event.target.value })} /></Field>
        <Field label="ID number" required><Input className={fieldClass} value={person.idNumber} onChange={(event) => update({ idNumber: event.target.value })} /></Field>
      </div>
      <Field label="Email address" required><Input className={fieldClass} type="email" value={person.email} onChange={(event) => update({ email: event.target.value })} /></Field>
    </div>
  );
}

export function DeclarationFields({ declaration, previews, onChange, onPreview, onError }: { declaration: ApplicationDeclaration; previews: Record<string, string>; onChange: (value: ApplicationDeclaration) => void; onPreview: (fileId: string, preview: string) => void; onError: (message: string) => void }) {
  return (
    <div className="apply-fields">
      <h2>Photographs and signatures</h2>
      <p className="apply-highlight">I herewith enclose all documents so required for registration prior to admission. I agree to pay all the required fees prior to admission, inclusive of registration fees. Registration fees are non-refundable, non-negotiable.</p>
      <div className="apply-pair">
        <PhotoBox label="Parent or guardian photograph 1" fileId={declaration.photoOneId} preview={previews[declaration.photoOneId] ?? ""} onError={onError} onSaved={(photoOneId, preview) => { onChange({ ...declaration, photoOneId }); onPreview(photoOneId, preview); }} />
        <PhotoBox label="Parent or guardian photograph 2" fileId={declaration.photoTwoId} preview={previews[declaration.photoTwoId] ?? ""} onError={onError} onSaved={(photoTwoId, preview) => { onChange({ ...declaration, photoTwoId }); onPreview(photoTwoId, preview); }} />
      </div>
      <div className="apply-pair">
        <Field label="Parent or guardian 1 last name" required><Input className={fieldClass} value={declaration.firstLastName} onChange={(event) => onChange({ ...declaration, firstLastName: event.target.value })} /></Field>
        <Field label="Parent or guardian 1 first name" required><Input className={fieldClass} value={declaration.firstFirstName} onChange={(event) => onChange({ ...declaration, firstFirstName: event.target.value })} /></Field>
      </div>
      <SignaturePad label="Signature (1)" value={declaration.signatureOne} onChange={(signatureOne) => onChange(signedDeclaration(declaration, { signatureOne }))} />
      <div className="apply-pair">
        <Field label="Parent or guardian 2 last name" required><Input className={fieldClass} value={declaration.secondLastName} onChange={(event) => onChange({ ...declaration, secondLastName: event.target.value })} /></Field>
        <Field label="Parent or guardian 2 first name" required><Input className={fieldClass} value={declaration.secondFirstName} onChange={(event) => onChange({ ...declaration, secondFirstName: event.target.value })} /></Field>
      </div>
      <SignaturePad label="Signature (2)" value={declaration.signatureTwo} onChange={(signatureTwo) => onChange(signedDeclaration(declaration, { signatureTwo }))} />
      <Field label="Date">
        <Input className={fieldClass} readOnly aria-readonly="true" placeholder="Filled when a signature is signed" value={declaration.date ? signedDateLabel(declaration.date) : ""} />
      </Field>
    </div>
  );
}

export function DocumentFields({ checked, documents, onCheck, onUpload, onRemove, onError }: { checked: Record<string, boolean>; documents: ApplicationDocument[]; onCheck: (id: string, value: boolean) => void; onUpload: (document: ApplicationDocument) => void; onRemove: (fileId: string) => void; onError: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState("");
  const [viewing, setViewing] = useState("");
  const attached = admissionDocuments.filter(([id]) => documents.some((item) => item.id === id)).length;
  const needle = query.trim().toLowerCase();
  const visible = admissionDocuments.filter(([, label]) => label.toLowerCase().includes(needle));
  return (
    <div className="apply-docs">
      <header className="apply-docs-head">
        <span className="apply-docs-mark" aria-hidden="true"><FolderOpen /></span>
        <div>
          <h2>Documents</h2>
          <p>Tick each document you are sending and upload the images.</p>
        </div>
      </header>
      <p className="apply-docs-count" role="status">{attached} of {admissionDocuments.length} attached</p>
      <label className="apply-doc-search">
        <Search aria-hidden="true" />
        <input type="search" value={query} placeholder="Search documents" aria-label="Search documents" onChange={(event) => setQuery(event.target.value)} />
      </label>
      {visible.length === 0 ? <p className="apply-docs-empty">No document matches that search.</p> : null}
      <ul className="apply-doc-list">
        {visible.map(([id, label]) => {
          const index = admissionDocuments.findIndex(([itemId]) => itemId === id);
          const saved = documents.filter((item) => item.id === id);
          const selected = Boolean(checked[id]);
          return (
            <li className="apply-doc" data-ready={saved.length ? "true" : undefined} key={id} style={{ animationDelay: `${index * 35}ms` }}>
              <label className="apply-doc-check">
                <input type="checkbox" checked={selected} onChange={(event) => onCheck(id, event.target.checked)} />
                <span className="apply-doc-box" aria-hidden="true">{selected ? <Check /> : index + 1}</span>
                <span className="apply-doc-label"><FileText aria-hidden="true" />{label}</span>
              </label>
              {selected ? (
                <div className="apply-doc-files">
                  {saved.map((file) => (
                    <figure key={file.fileId}>
                      {file.preview ? (
                        <button type="button" className="apply-doc-thumb" onClick={() => setViewing(file.preview ?? "")}>
                          <img src={file.preview} alt="" />
                        </button>
                      ) : (
                        <span className="apply-doc-file"><FileText aria-hidden="true" /></span>
                      )}
                      <figcaption>{file.filename}</figcaption>
                      <button type="button" onClick={() => onRemove(file.fileId)}>Remove</button>
                    </figure>
                  ))}
                  <label className="apply-upload">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                      multiple
                      disabled={busyId === id}
                      onChange={(event) => {
                        const files = event.target.files ? [...event.target.files] : [];
                        event.target.value = "";
                        void addDocuments(files, id, saved.length, setBusyId, onUpload, onError);
                      }}
                    />
                    <Upload aria-hidden="true" />
                    <span>{busyId === id ? "Uploading…" : saved.length ? "Add more images" : "Upload images"}</span>
                  </label>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {viewing ? (
        <button type="button" className="apply-doc-lightbox" aria-label="Close image preview" onClick={() => setViewing("")}>
          <img src={viewing} alt="" />
        </button>
      ) : null}
    </div>
  );
}

function PhotoBox({ label, fileId, preview, onSaved, onError }: { label: string; fileId: string; preview: string; onSaved: (fileId: string, preview: string) => void; onError: (message: string) => void }) {
  const [local, setLocal] = useState("");
  const shown = local || preview;
  return (
    <label className="apply-photo">
      {shown ? <img src={shown} alt="" /> : <span>{label}</span>}
      <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(event) => choosePhoto(event.target.files?.[0] ?? null, setLocal, onSaved, onError)} />
      <span>{fileId ? "Change photograph" : "Add photograph"}</span>
    </label>
  );
}

async function choosePhoto(file: File | null, setPreview: (value: string) => void, onSaved: (fileId: string, preview: string) => void, onError: (message: string) => void) {
  if (!file) return;
  const result = await sendFile(file);
  if (!result.ok) {
    onError(result.error);
    return;
  }
  const preview = URL.createObjectURL(file);
  setPreview(preview);
  onSaved(result.fileId, preview);
  onError("");
}

async function addDocuments(files: File[], id: string, existing: number, setBusyId: (value: string) => void, onUpload: (document: ApplicationDocument) => void, onError: (message: string) => void) {
  if (!files.length) return;
  if (existing + files.length > 8) {
    onError("Each document can include up to 8 files.");
    return;
  }
  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]);
  if (files.some((file) => !allowed.has(file.type))) {
    onError("Use a JPG, PNG, WebP, GIF, or PDF file.");
    return;
  }
  if (files.some((file) => file.size > 8 * 1024 * 1024)) {
    onError("Each file must be 8 MB or smaller.");
    return;
  }
  setBusyId(id);
  for (const file of files) {
    const result = await sendFile(file);
    if (!result.ok) {
      setBusyId("");
      onError(result.error);
      return;
    }
    const source = URL.createObjectURL(file);
    onUpload({ id, fileId: result.fileId, filename: file.name, preview: file.type.startsWith("image/") ? source : "", source });
  }
  setBusyId("");
  onError("");
}

async function sendFile(file: File) {
  const formData = new FormData();
  formData.set("file", file);
  return uploadApplicationFile(formData);
}

function signedDeclaration(declaration: ApplicationDeclaration, patch: Partial<ApplicationDeclaration>): ApplicationDeclaration {
  const next = { ...declaration, ...patch };
  if (patch.signatureOne || patch.signatureTwo) next.date = todayInputValue();
  else if (!next.signatureOne && !next.signatureTwo) next.date = "";
  return next;
}

function todayInputValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function signedDateLabel(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Intl.DateTimeFormat("en-JM", { day: "numeric", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="apply-field">
      <span>{label}{required ? <span aria-hidden="true"> *</span> : null}</span>
      {children}
    </label>
  );
}
