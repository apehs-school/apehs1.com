"use client";

import { useEffect, useState } from "react";
import { submitAdmissionApplication } from "@/actions/applications";
import { BehaviourForm } from "@/components/behaviour-apply";
import { downloadApplicationPdf, uploadPages } from "@/components/application-pdf";
import { DeclarationFields, DocumentFields, PersonFields } from "@/components/application-sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { admissionDocuments, blankDeclaration, blankPerson, personStarted, validateDeclaration, validateDocuments, validateEmergency, validatePerson, type ApplicationDeclaration, type ApplicationDocument, type ApplicationPerson } from "@/lib/application-people";
import { ageFromBirth, applicationEntryTypes, applicationMonths, birthdayInputValue, validateApplication } from "@/lib/applications";
import { worldCountries } from "@/lib/countries";

const fieldClass = "h-11 text-base";
const stepLabels = ["Introduction", "Student details", "Type of entry", "Mother", "Father", "Guardian", "Emergency contact", "Photographs and signatures", "Documents", "Review"];

type Details = {
  academicYear: string;
  lastName: string;
  firstName: string;
  middleName: string;
  sex: "" | "male" | "female";
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
  entryType: "" | "pep" | "transfer" | "other";
  lastSchool: string;
  lastGrade: string;
};

const blank: Details = {
  academicYear: "",
  lastName: "",
  firstName: "",
  middleName: "",
  sex: "",
  birthDate: "",
  birthMonth: "",
  birthYear: "",
  age: "",
  birthPlace: "",
  nationality: "",
  address: "",
  nsrn: "",
  gradeSeeking: "",
  church: "",
  pastor: "",
  entryType: "",
  lastSchool: "",
  lastGrade: "",
};

export function AdmissionApply() {
  const [open, setOpen] = useState(false);
  const [behaviourOpen, setBehaviourOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [details, setDetails] = useState<Details>(blank);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [mother, setMother] = useState<ApplicationPerson>(blankPerson);
  const [father, setFather] = useState<ApplicationPerson>(blankPerson);
  const [guardian, setGuardian] = useState<ApplicationPerson>(blankPerson);
  const [emergency, setEmergency] = useState<ApplicationPerson>(blankPerson);
  const [declaration, setDeclaration] = useState<ApplicationDeclaration>(blankDeclaration);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function update(patch: Partial<Details>) {
    setDetails((current) => ({ ...current, ...patch }));
  }

  function go(nextStep: number) {
    setDirection(nextStep > step ? "next" : "back");
    setStep(nextStep);
    setStatus("idle");
    setMessage("");
  }

  function choosePhoto(file: File | null) {
    if (!file) {
      setPhoto(null);
      return;
    }
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      setStatus("error");
      setMessage("Use a JPG, PNG, GIF, or WebP photograph.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setStatus("error");
      setMessage("The photograph must be 8 MB or smaller.");
      return;
    }
    setPhoto(file);
    setStatus("idle");
    setMessage("");
  }

  function nextFromCover() {
    if (!photo) {
      setStatus("error");
      setMessage("Add a photograph of the student.");
      return;
    }
    go(1);
  }

  function nextFromDetails() {
    const parsed = validateApplication({ ...details, entryType: "pep", lastSchool: "Pending", lastGrade: "Pending" });
    if (!parsed.ok && parsed.error !== "Choose PEP, transfer, or other." && parsed.error !== "Enter the name of the last school." && parsed.error !== "Enter the last grade or class.") {
      setStatus("error");
      setMessage(parsed.error);
      return;
    }
    if (!details.academicYear || !details.lastName || !details.firstName || !details.sex || !details.birthDate || !details.birthMonth || !details.birthYear || !details.age || !details.birthPlace || !details.nationality || !details.address || !details.gradeSeeking) {
      setStatus("error");
      setMessage("Complete the student details before continuing.");
      return;
    }
    go(2);
  }

  function stepError(current: number) {
    if (current === 2) {
      const parsed = validateApplication(details);
      return parsed.ok ? "" : parsed.error;
    }
    if (current === 3) {
      const parsed = validatePerson(mother, "mother", { required: true, occupation: true, relation: false });
      return parsed.ok ? "" : parsed.error;
    }
    if (current === 4) {
      const parsed = validatePerson(father, "father", { required: true, occupation: true, relation: false });
      return parsed.ok ? "" : parsed.error;
    }
    if (current === 5) {
      const parsed = validatePerson(guardian, "guardian", { required: false, occupation: true, relation: true });
      return parsed.ok ? "" : parsed.error;
    }
    if (current === 6) {
      const parsed = validateEmergency(emergency, [mother, father, guardian]);
      return parsed.ok ? "" : parsed.error;
    }
    if (current === 7) {
      const parsed = validateDeclaration(declaration);
      return parsed.ok ? "" : parsed.error;
    }
    if (current === 8) {
      const selected = documents.filter((item) => checkedDocs[item.id]);
      if (Object.entries(checkedDocs).some(([id, value]) => value && !documents.some((item) => item.id === id))) return "Upload a file for each document you ticked.";
      const parsed = validateDocuments(selected);
      return parsed.ok ? "" : parsed.error;
    }
    return "";
  }

  function downloadForm() {
    setDownloading(true);
    void downloadApplicationPdf({
      number: receipt,
      academicYear: details.academicYear,
      lastName: details.lastName,
      firstName: details.firstName,
      middleName: details.middleName,
      sex: details.sex,
      birthDate: details.birthDate,
      birthMonth: details.birthMonth,
      birthYear: details.birthYear,
      age: details.age,
      birthPlace: details.birthPlace,
      nationality: details.nationality,
      address: details.address,
      nsrn: details.nsrn,
      gradeSeeking: details.gradeSeeking,
      church: details.church,
      pastor: details.pastor,
      entryType: details.entryType,
      lastSchool: details.lastSchool,
      lastGrade: details.lastGrade,
      photo,
      mother,
      father,
      guardian,
      emergency,
      declaration,
      photoOne: photoPreviews[declaration.photoOneId] ?? null,
      photoTwo: photoPreviews[declaration.photoTwoId] ?? null,
      documents: admissionDocuments.map(([id, label]) => ({ label, attached: id === "application" || (Boolean(checkedDocs[id]) && documents.some((item) => item.id === id)) })),
      uploads: uploadPages(documents.filter((item) => checkedDocs[item.id])),
      office: null,
    }).then(() => setDownloading(false), () => setDownloading(false));
  }

  async function submit() {
    const parsed = validateApplication(details);
    const packetError = [3, 4, 5, 6, 7, 8].map(stepError).find(Boolean) ?? "";
    if (!parsed.ok || packetError) {
      setStatus("error");
      setMessage(!parsed.ok ? parsed.error : packetError);
      return;
    }
    if (!photo) {
      setStatus("error");
      setMessage("Add a photograph of the student.");
      setStep(0);
      return;
    }
    setStatus("saving");
    setMessage("Sending the application…");
    const formData = new FormData();
    formData.set("photo", photo);
    for (const [key, value] of Object.entries(details)) formData.set(key, value);
    formData.set("mother", JSON.stringify(mother));
    formData.set("father", JSON.stringify(father));
    formData.set("guardian", JSON.stringify(guardian));
    formData.set("emergency", JSON.stringify(emergency));
    formData.set("declaration", JSON.stringify(declaration));
    formData.set("documents", JSON.stringify(documents.filter((item) => checkedDocs[item.id]).map(({ id, fileId, filename }) => ({ id, fileId, filename }))));
    try {
      const result = await submitAdmissionApplication(formData);
      if (!result.ok) {
        setStatus("error");
        setMessage(result.error);
        return;
      }
      setReceipt(result.number);
      setStatus("saved");
      setMessage("");
    } catch {
      setStatus("error");
      setMessage("The application could not be sent. Your entries are still here.");
    }
  }

  return (
    <div className="admission-apply">
      <div className="admission-action-row">
        <section className="admission-action-group" aria-labelledby="student-admission-category">
          <h2 id="student-admission-category">Student admission</h2>
          <div>
            <Button type="button" className="h-auto whitespace-normal" onClick={() => { setBehaviourOpen(false); setOpen(true); setStep(0); setStatus("idle"); setMessage(""); setReceipt(""); }}>Student Online Admission Application</Button>
            <Button nativeButton={false} variant="outline" className="h-auto whitespace-normal" render={<a href="/Documents/APEHS - STUDENT ADMISSION FORM.pdf" />}>Student Admission Form PDF</Button>
          </div>
        </section>
        <section className="admission-action-group" aria-labelledby="behaviour-admission-category">
          <h2 id="behaviour-admission-category">Behaviour assessment</h2>
          <div>
            <Button type="button" className="h-auto whitespace-normal" onClick={() => { setOpen(false); setBehaviourOpen(true); }}>Online Behaviour Applicant</Button>
            <Button nativeButton={false} variant="outline" className="h-auto whitespace-normal" render={<a href="/Documents/APEHS - NEW STUDENT BEHAVIOUR ASSESSMENT FORM.pdf" />}>Behaviour Assessment Form PDF</Button>
          </div>
        </section>
      </div>
      {behaviourOpen ? <BehaviourForm key="behaviour" /> : null}
      {open ? (
        <section className="apply-sheet" aria-labelledby="apply-title">
          {status !== "saved" ? (
            <div className="apply-progress" aria-hidden="true">
              {stepLabels.map((label, index) => <span key={label} data-current={step === index ? "true" : undefined}>{label}</span>)}
            </div>
          ) : null}
          <div key={`${step}-${direction}`} className="apply-slide" data-direction={direction}>
            {status === "saved" ? (
              <div className="apply-thanks" role="status">
                <p className="apply-thanks-kicker">Submission number</p>
                <p className="apply-thanks-number">{receipt}</p>
                <h2 id="apply-title">Thank you for submitting your application</h2>
                <p>Staff will contact you after your application has been reviewed.</p>
                <Button type="button" variant="outline" disabled={downloading} onClick={downloadForm}>{downloading ? "Preparing PDF…" : "Download PDF"}</Button>
              </div>
            ) : null}
            {status !== "saved" && step === 0 ? <Cover preview={preview} onPhoto={choosePhoto} /> : null}
            {status !== "saved" && step === 1 ? <DetailsForm details={details} update={update} /> : null}
            {status !== "saved" && step === 2 ? <EntryForm details={details} update={update} /> : null}
            {status !== "saved" && step === 3 ? <PersonFields person={mother} legend="Mother" occupation onChange={setMother} /> : null}
            {status !== "saved" && step === 4 ? <PersonFields person={father} legend="Father" occupation onChange={setFather} /> : null}
            {status !== "saved" && step === 5 ? (
              <div className="apply-fields">
                <p className="apply-highlight">To be completed if applicable.</p>
                <PersonFields person={guardian} legend="Guardian" occupation relationLabel="Relation to child" onChange={setGuardian} />
              </div>
            ) : null}
            {status !== "saved" && step === 6 ? (
              <div className="apply-fields">
                <p className="apply-highlight">Must be different from the parents and guardian. This is mandatory.</p>
                <PersonFields person={emergency} legend="Emergency contact" occupation={false} relationLabel="Relationship to child" onChange={setEmergency} />
              </div>
            ) : null}
            {status !== "saved" && step === 7 ? <DeclarationFields declaration={declaration} previews={photoPreviews} onChange={setDeclaration} onPreview={(fileId, url) => setPhotoPreviews((current) => ({ ...current, [fileId]: url }))} onError={(value) => { setStatus(value ? "error" : "idle"); setMessage(value); }} /> : null}
            {status !== "saved" && step === 8 ? (
              <DocumentFields
                checked={checkedDocs}
                documents={documents}
                onCheck={(id, value) => setCheckedDocs((current) => ({ ...current, [id]: value }))}
                onUpload={(document) => setDocuments((current) => current.some((item) => item.fileId === document.fileId) ? current : [...current, document])}
                onRemove={(fileId) => {
                  const item = documents.find((document) => document.fileId === fileId);
                  if (item?.preview?.startsWith("blob:")) URL.revokeObjectURL(item.preview);
                  if (item?.source?.startsWith("blob:") && item.source !== item.preview) URL.revokeObjectURL(item.source);
                  setDocuments((current) => current.filter((document) => document.fileId !== fileId));
                }}
                onError={(value) => { setStatus(value ? "error" : "idle"); setMessage(value); }}
              />
            ) : null}
            {status !== "saved" && step === 9 ? (
              <ApplicationReview details={details} preview={preview} mother={mother} father={father} guardian={guardian} emergency={emergency} declaration={declaration} photoPreviews={photoPreviews} documents={documents} checked={checkedDocs} />
            ) : null}
          </div>
          {status !== "saved" ? (
            <div className="apply-nav">
              {message ? <p role="status" data-state={status}>{message}</p> : <p>Step {step + 1} of {stepLabels.length}</p>}
              <div>
                {step > 0 ? <Button type="button" variant="outline" onClick={() => go(step - 1)}>Back</Button> : null}
                {step === 0 ? <Button type="button" onClick={nextFromCover}>Next</Button> : null}
                {step === 1 ? <Button type="button" onClick={nextFromDetails}>Next</Button> : null}
                {step > 1 && step < 9 ? <Button type="button" onClick={() => { const error = stepError(step); if (error) { setStatus("error"); setMessage(error); return; } go(step + 1); }}>Next</Button> : null}
                {step === 9 ? <Button type="button" variant="outline" disabled={downloading} onClick={downloadForm}>{downloading ? "Preparing PDF…" : "Download PDF"}</Button> : null}
                {step === 9 ? <Button type="button" disabled={status === "saving"} onClick={submit}>{status === "saving" ? "Sending…" : "Submit application"}</Button> : null}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function ApplicationReview({ details, preview, mother, father, guardian, emergency, declaration, photoPreviews, documents, checked }: { details: Details; preview: string; mother: ApplicationPerson; father: ApplicationPerson; guardian: ApplicationPerson; emergency: ApplicationPerson; declaration: ApplicationDeclaration; photoPreviews: Record<string, string>; documents: ApplicationDocument[]; checked: Record<string, boolean> }) {
  const entry = applicationEntryTypes.find(([id]) => id === details.entryType)?.[1] ?? "";
  const sent = admissionDocuments.flatMap(([id, label]) => {
    if (!checked[id]) return [];
    return [{ id, label, files: documents.filter((item) => item.id === id) }];
  });
  return (
    <article className="apply-review">
      <header className="apply-review-head">
        <div>
          <p className="apply-school">Ardenne Preparatory &amp; Extension High School</p>
          <p>37 Hope Road, Kingston 10</p>
          <p>Telephone: 876-926-7047 / 876-968-7643</p>
          <p>Email: ardenne.prep.saw@moeschools.edu.jm</p>
          <h2 id="apply-title">Student application form</h2>
          <p>Use block letters in blue or black ink, or type.</p>
          <p className="apply-highlight">This is an application form only. It does not imply automatic entry. Registration fees are non-refundable.</p>
        </div>
        <figure className="apply-review-photo">
          {preview ? <img src={preview} alt="Student photograph" /> : <span>Student&apos;s photograph</span>}
          <figcaption>Write the student&apos;s full name on the back of the photo.</figcaption>
        </figure>
      </header>
      <dl className="apply-review-grid">
        <Line label="Academic year applying for" value={details.academicYear} />
        <Line label="Last name" value={details.lastName} />
        <Line label="First name" value={details.firstName} />
        <Line label="Middle name" value={details.middleName || "—"} />
        <Line label="Sex" value={details.sex === "male" ? "Male" : details.sex === "female" ? "Female" : ""} />
        <Line label="Date of birth" value={[details.birthDate, details.birthMonth, details.birthYear].filter(Boolean).join(" ")} />
        <Line label="Age" value={details.age} />
        <Line label="Place of birth / country" value={details.birthPlace} />
        <Line label="Nationality" value={details.nationality} />
        <Line label="Current address" value={details.address} />
        <Line label="Student NSRN" value={details.nsrn || "—"} />
        <Line label="Grade seeking entry into" value={details.gradeSeeking} />
        <Line label="Church to which the student belongs" value={details.church || "—"} />
        <Line label="Pastor's name" value={details.pastor || "—"} />
        <Line label="Type of entry" value={entry} />
        <Line label="Name of last school" value={details.lastSchool} />
        <Line label="Last grade / class" value={details.lastGrade} />
      </dl>
      <PersonReview title="Mother" person={mother} />
      <PersonReview title="Father" person={father} />
      <PersonReview title="Guardian" person={guardian} empty="Not completed." />
      <PersonReview title="Emergency contact" person={emergency} />
      <section>
        <h3>Photographs and signatures</h3>
        <p>I herewith enclose all documents so required for registration prior to admission. I agree to pay all the required fees prior to admission, inclusive of registration fees. Registration fees are non-refundable, non-negotiable.</p>
        <div className="apply-review-photos">
          <PhotoLine label="Parent or guardian photograph 1" src={photoPreviews[declaration.photoOneId] ?? ""} name={`${declaration.firstFirstName} ${declaration.firstLastName}`.trim()} signature={declaration.signatureOne} />
          <PhotoLine label="Parent or guardian photograph 2" src={photoPreviews[declaration.photoTwoId] ?? ""} name={`${declaration.secondFirstName} ${declaration.secondLastName}`.trim()} signature={declaration.signatureTwo} />
        </div>
        <dl className="apply-review-grid"><Line label="Date" value={longDate(declaration.date)} /></dl>
      </section>
      <section>
        <h3>Documents</h3>
        {sent.length === 0 ? <p>No documents attached.</p> : (
          <ul className="apply-review-docs">
            {sent.map((item) => (
              <li key={item.id}>
                <strong>{item.label}</strong>
                <div>
                  {item.files.map((file) => file.preview ? <img key={file.fileId} src={file.preview} alt={file.filename} /> : <span key={file.fileId}>{file.filename}</span>)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="apply-review-note">Check this copy, then submit it to the school.</p>
    </article>
  );
}

function PersonReview({ title, person, empty }: { title: string; person: ApplicationPerson; empty?: string }) {
  if (empty && !personStarted(person)) {
    return <section><h3>{title}</h3><p>{empty}</p></section>;
  }
  return (
    <section>
      <h3>{title}</h3>
      <dl className="apply-review-grid">
        <Line label="Name" value={[person.lastName, person.firstName, person.middleName].filter(Boolean).join(" ")} />
        {person.relation ? <Line label="Relation to child" value={person.relation} /> : null}
        <Line label="Home address" value={person.address} />
        <Line label="Home telephone" value={person.homeTel || "—"} />
        <Line label="Cell" value={person.cell || "—"} />
        <Line label="Work" value={person.workTel || "—"} />
        <Line label="Workplace name" value={person.workplace || "—"} />
        <Line label="Workplace address" value={person.workplaceAddress || "—"} />
        {person.occupation ? <Line label="Occupation" value={person.occupation} /> : null}
        <Line label="ID type" value={person.idType} />
        <Line label="ID number" value={person.idNumber} />
        <Line label="Email address" value={person.email} />
      </dl>
      {person.signature ? <img className="apply-review-sign" src={person.signature} alt={`${title} signature`} /> : null}
    </section>
  );
}

function PhotoLine({ label, src, name, signature }: { label: string; src: string; name: string; signature: string }) {
  return (
    <figure>
      {src ? <img src={src} alt="" /> : <span>{label}</span>}
      <figcaption>
        <strong>{name}</strong>
        {signature ? <img className="apply-review-sign" src={signature} alt="" /> : null}
      </figcaption>
    </figure>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function longDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("en-JM", { day: "numeric", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
}

function Cover({ preview, onPhoto }: { preview: string; onPhoto: (file: File | null) => void }) {
  return (
    <div className="apply-cover">
      <div>
        <p className="apply-school">Ardenne Preparatory & Extension High School</p>
        <p>37 Hope Road, Kingston 10</p>
        <p>Telephone: 876-926-7047 / 876-968-7643</p>
        <p>Email: <a href="mailto:ardenne.prep.saw@moeschools.edu.jm">ardenne.prep.saw@moeschools.edu.jm</a></p>
        <h2 id="apply-title">Student application form</h2>
        <p>Use block letters in blue or black ink, or type.</p>
        <p className="apply-highlight">This is an application form only. It does not imply automatic entry. Registration fees are non-refundable.</p>
      </div>
      <label className="apply-photo">
        {preview ? <img src={preview} alt="Selected student photograph" /> : <span>Student&apos;s photograph</span>}
        <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(event) => onPhoto(event.target.files?.[0] ?? null)} />
        <span>{preview ? "Change photograph" : "Add student photograph"}</span>
      </label>
    </div>
  );
}

function DetailsForm({ details, update }: { details: Details; update: (patch: Partial<Details>) => void }) {
  return (
    <div className="apply-fields">
      <Field label="Academic year applying for" required>
        <Input className={fieldClass} value={details.academicYear} onChange={(event) => update({ academicYear: event.target.value })} />
      </Field>
      <div className="apply-names">
        <Field label="Last name" required>
          <Input className={fieldClass} value={details.lastName} onChange={(event) => update({ lastName: event.target.value })} />
        </Field>
        <Field label="First name" required>
          <Input className={fieldClass} value={details.firstName} onChange={(event) => update({ firstName: event.target.value })} />
        </Field>
        <Field label="Middle name">
          <Input className={fieldClass} value={details.middleName} onChange={(event) => update({ middleName: event.target.value })} />
        </Field>
      </div>
      <fieldset className="apply-choice">
        <legend>Sex</legend>
        <label><input type="radio" name="sex" checked={details.sex === "male"} onChange={() => update({ sex: "male" })} /> Male</label>
        <label><input type="radio" name="sex" checked={details.sex === "female"} onChange={() => update({ sex: "female" })} /> Female</label>
      </fieldset>
      <div className="apply-pair">
        <Field label="Date of birth" required>
          <Input
            className={fieldClass}
            type="date"
            max={todayInputValue()}
            value={birthdayInputValue(details.birthDate, details.birthMonth, details.birthYear)}
            onClick={(event) => openCalendar(event.currentTarget)}
            onChange={(event) => update(birthdayChange(event.target.value))}
          />
        </Field>
        <Field label="Age">
          <Input className={fieldClass} readOnly aria-readonly="true" placeholder="Filled from the birthday" value={details.age} />
        </Field>
      </div>
      <div className="apply-pair">
        <Field label="Place of birth / country" required>
          <select className={fieldClass} value={details.birthPlace} onChange={(event) => update({ birthPlace: event.target.value })}>
            <option value="">Select a country</option>
            {worldCountries.map((country) => <option key={country} value={country}>{country}</option>)}
          </select>
        </Field>
        <Field label="Nationality" required>
          <Input className={fieldClass} value={details.nationality} onChange={(event) => update({ nationality: event.target.value })} />
        </Field>
      </div>
      <Field label="Current address" required>
        <Input className={fieldClass} value={details.address} onChange={(event) => update({ address: event.target.value })} />
      </Field>
      <div className="apply-pair">
        <Field label="Student NSRN">
          <Input className={fieldClass} value={details.nsrn} onChange={(event) => update({ nsrn: event.target.value })} />
        </Field>
        <Field label="Grade seeking entry into" required>
          <Input className={fieldClass} value={details.gradeSeeking} onChange={(event) => update({ gradeSeeking: event.target.value })} />
        </Field>
      </div>
      <div className="apply-pair">
        <Field label="Church to which the student belongs">
          <Input className={fieldClass} value={details.church} onChange={(event) => update({ church: event.target.value })} />
        </Field>
        <Field label="Pastor's name">
          <Input className={fieldClass} value={details.pastor} onChange={(event) => update({ pastor: event.target.value })} />
        </Field>
      </div>
    </div>
  );
}

function EntryForm({ details, update }: { details: Details; update: (patch: Partial<Details>) => void }) {
  return (
    <fieldset className="apply-entries">
      <legend>Type of entry</legend>
      {applicationEntryTypes.map(([id, label]) => {
        const selected = details.entryType === id;
        return (
          <div className="apply-entry" key={id} data-selected={selected ? "true" : undefined}>
            <label><input type="radio" name="entryType" checked={selected} onChange={() => update({ entryType: id })} /> {label}</label>
            <Field label="Name of last school">
              <Input className={fieldClass} disabled={!selected} value={selected ? details.lastSchool : ""} onChange={(event) => update({ lastSchool: event.target.value })} />
            </Field>
            <Field label="Last grade / class">
              <Input className={fieldClass} disabled={!selected} value={selected ? details.lastGrade : ""} onChange={(event) => update({ lastGrade: event.target.value })} />
            </Field>
          </div>
        );
      })}
    </fieldset>
  );
}

function birthdayChange(iso: string): Partial<Details> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return { birthDate: "", birthMonth: "", birthYear: "", age: "" };
  const [year, month, day] = iso.split("-").map(Number);
  const monthName = applicationMonths[month - 1] ?? "";
  const age = ageFromBirth(day, monthName, year);
  return { birthDate: String(day), birthMonth: monthName, birthYear: String(year), age: age === null ? "" : String(age) };
}

function todayInputValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function openCalendar(input: HTMLInputElement) {
  try {
    input.showPicker();
  } catch {
    input.focus();
  }
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="apply-field">
      <span>{label}{required ? <span aria-hidden="true"> *</span> : null}</span>
      {children}
    </label>
  );
}
