"use client";

import { useState } from "react";
import { uploadApplicationFile } from "@/actions/applications";
import { submitBehaviourAssessment } from "@/actions/behaviour";
import { downloadBehaviourPdf } from "@/components/behaviour-pdf";
import { SignaturePad } from "@/components/signature-pad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { behaviourStepError, behaviourSteps, blankBehaviour, cleanBehaviour, conflictOptions, disciplineOptions, emotionalOptions, helpOptions, socialOptions, validateBehaviour, type BehaviourAnswers, type YesNo } from "@/lib/behaviour";
import { ageFromBirth, applicationMonths } from "@/lib/applications";

const fieldClass = "h-11 text-base";

export function BehaviourForm() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [form, setForm] = useState<BehaviourAnswers>(blankBehaviour);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState("");
  const [stampPreview, setStampPreview] = useState("");
  const [downloading, setDownloading] = useState(false);

  function update(patch: Partial<BehaviourAnswers>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function go(nextStep: number) {
    setDirection(nextStep > step ? "next" : "back");
    setStep(nextStep);
    setStatus("idle");
    setMessage("");
  }

  function next() {
    const error = behaviourStepError(step, form);
    if (error) {
      setStatus("error");
      setMessage(error);
      return;
    }
    go(step + 1);
  }

  async function submit() {
    const parsed = validateBehaviour(form);
    if (!parsed.ok) {
      setStatus("error");
      setMessage(parsed.error);
      return;
    }
    setStatus("saving");
    setMessage("Sending the assessment…");
    try {
      const result = await submitBehaviourAssessment(parsed.value);
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
      setMessage("The assessment could not be sent. Your entries are still here.");
    }
  }

  async function chooseStamp(file: File | null) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      setStatus("error");
      setMessage("Use a JPG, PNG, GIF, or WebP image of the school stamp.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setStatus("error");
      setMessage("The stamp image must be 8 MB or smaller.");
      return;
    }
    const body = new FormData();
    body.set("file", file);
    const result = await uploadApplicationFile(body);
    if (!result.ok) {
      setStatus("error");
      setMessage(result.error);
      return;
    }
    setStampPreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    update({ stampFileId: result.fileId });
    setStatus("idle");
    setMessage("");
  }

  async function download() {
    setDownloading(true);
    try {
      await downloadBehaviourPdf(cleanBehaviour(form), stampPreview);
    } catch {
      setStatus("error");
      setMessage("The PDF could not be prepared.");
    } finally {
      setDownloading(false);
    }
  }

  function toggle(key: "emotional" | "emotionalHelp" | "conflict" | "conflictHelp" | "discipline" | "social", option: string) {
    setForm((current) => {
      const selected = current[key];
      return { ...current, [key]: selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option] };
    });
  }

  return (
    <section className="apply-sheet" aria-label="Behaviour assessment form">
      {status !== "saved" ? (
        <div className="apply-progress" aria-hidden="true">
          {behaviourSteps.map((label, index) => <span key={label} data-current={step === index ? "true" : undefined}>{label}</span>)}
        </div>
      ) : null}
      <div key={`${step}-${direction}`} className="apply-slide" data-direction={direction}>
        {status === "saved" ? (
          <div className="apply-thanks" role="status">
            <p className="apply-thanks-kicker">Submission number</p>
            <p className="apply-thanks-number">{receipt}</p>
            <h2 id="behaviour-title">Thank you for submitting this assessment</h2>
            <p>It has been sent to the school’s online applications.</p>
            <Button type="button" variant="outline" disabled={downloading} onClick={() => void download()}>{downloading ? "Preparing PDF…" : "Download PDF"}</Button>
          </div>
        ) : null}
        {status !== "saved" && step === 0 ? <TransferPage form={form} update={update} /> : null}
        {status !== "saved" && step === 1 ? <RecordPage form={form} update={update} /> : null}
        {status !== "saved" && step === 2 ? <ConductPage form={form} update={update} /> : null}
        {status !== "saved" && step === 3 ? <ReportPage form={form} update={update} /> : null}
        {status !== "saved" && step === 4 ? <MaturityPage form={form} toggle={toggle} /> : null}
        {status !== "saved" && step === 5 ? <RatingsPage form={form} toggle={toggle} /> : null}
        {status !== "saved" && step === 6 ? <SignPage form={form} update={update} stampPreview={stampPreview} onStamp={chooseStamp} /> : null}
        {status !== "saved" && step === 7 ? <BehaviourPaper form={cleanBehaviour(form)} stampSrc={stampPreview} /> : null}
      </div>
      {status !== "saved" ? (
        <div className="apply-nav">
          {message ? <p role="status" data-state={status}>{message}</p> : <p>Step {step + 1} of {behaviourSteps.length}</p>}
          <div>
            {step > 0 ? <Button type="button" variant="outline" onClick={() => go(step - 1)}>Back</Button> : null}
            {step < behaviourSteps.length - 1 ? <Button type="button" onClick={next}>Next</Button> : null}
            {step === behaviourSteps.length - 1 ? <Button type="button" variant="outline" disabled={downloading} onClick={() => void download()}>{downloading ? "Preparing PDF…" : "Download PDF"}</Button> : null}
            {step === behaviourSteps.length - 1 ? <Button type="button" disabled={status === "saving"} onClick={() => void submit()}>{status === "saving" ? "Sending…" : "Submit assessment"}</Button> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function TransferPage({ form, update }: { form: BehaviourAnswers; update: (patch: Partial<BehaviourAnswers>) => void }) {
  return (
    <div className="apply-fields">
      <header className="behaviour-letterhead">
        <p className="apply-school">Ardenne Preparatory &amp; Extension High School</p>
        <p>37 Hope Road, Kingston 10</p>
        <p>Telephone: 876-926-7047 / 876-926-7910</p>
        <p><a href="mailto:ardenne.prep.saw@moeschools.edu.jm">ardenne.prep.saw@moeschools.edu.jm</a></p>
        <h2 id="behaviour-title">Behaviour Assessment Form</h2>
        <p className="behaviour-kicker">To the principal or representative</p>
      </header>
      <p>The parent(s) of</p>
      <div className="apply-names">
        <Field label="Child's last name" required><Input className={fieldClass} value={form.lastName} onChange={(event) => update({ lastName: event.target.value })} /></Field>
        <Field label="First" required><Input className={fieldClass} value={form.firstName} onChange={(event) => update({ firstName: event.target.value })} /></Field>
        <Field label="Middle"><Input className={fieldClass} value={form.middleName} onChange={(event) => update({ middleName: event.target.value })} /></Field>
      </div>
      <p>request a transfer from</p>
      <Field label="Full name of the last school" required><Input className={fieldClass} value={form.lastSchool} onChange={(event) => update({ lastSchool: event.target.value })} /></Field>
      <Field label="Address of last school" required><Textarea value={form.lastSchoolAddress} onChange={(event) => update({ lastSchoolAddress: event.target.value })} /></Field>
    </div>
  );
}

function RecordPage({ form, update }: { form: BehaviourAnswers; update: (patch: Partial<BehaviourAnswers>) => void }) {
  return (
    <div className="apply-fields">
      <p>to Ardenne Preparatory and Extension High School. Please fill out the following form and return directly to the Principal of Ardenne Preparatory and Extension High School under <strong>confidential cover</strong>.</p>
      <Numbered n="1" label="Full name of student (as it appears on Birth Certificate)" required><Input className={fieldClass} value={form.fullName} onChange={(event) => update({ fullName: event.target.value })} /></Numbered>
      <Numbered n="2" label="Date of birth and age" required>
        <div className="apply-pair">
          <Input className={fieldClass} type="date" aria-label="Date of birth" max={todayInputValue()} value={form.birthDate} onChange={(event) => update({ birthDate: event.target.value, age: ageFromIso(event.target.value) })} />
          <Input className={fieldClass} aria-label="Age" readOnly aria-readonly="true" placeholder="Filled from the birth date" value={form.age} />
        </div>
      </Numbered>
      <Numbered n="3" label="Full name of mother" required><Input className={fieldClass} value={form.motherName} onChange={(event) => update({ motherName: event.target.value })} /></Numbered>
      <Numbered n="4" label="Full name of father" required><Input className={fieldClass} value={form.fatherName} onChange={(event) => update({ fatherName: event.target.value })} /></Numbered>
      <Numbered n="5" label="Grades to which the student was admitted" required><Input className={fieldClass} value={form.gradesAdmitted} onChange={(event) => update({ gradesAdmitted: event.target.value })} /></Numbered>
      <Numbered n="6" label="Present grade" required><Input className={fieldClass} value={form.presentGrade} onChange={(event) => update({ presentGrade: event.target.value })} /></Numbered>
      <Numbered n="7" label="Areas of academic strength" required><Textarea value={form.academicStrength} onChange={(event) => update({ academicStrength: event.target.value })} /></Numbered>
    </div>
  );
}

function ConductPage({ form, update }: { form: BehaviourAnswers; update: (patch: Partial<BehaviourAnswers>) => void }) {
  return (
    <div className="apply-fields">
      <Numbered n="8" label="Areas of academic weakness" required><Textarea value={form.academicWeakness} onChange={(event) => update({ academicWeakness: event.target.value })} /></Numbered>
      <YesNo n="9" label="Has the student ever been suspended?" value={form.suspended} onChange={(suspended) => update({ suspended })} />
      <Numbered n="10" label="If yes, state how many times."><Input className={fieldClass} value={form.suspendedTimes} onChange={(event) => update({ suspendedTimes: event.target.value })} /></Numbered>
      <YesNo n="11" label="Has the student been involved in disciplinary problems / altercations, etc." value={form.disciplinary} onChange={(disciplinary) => update({ disciplinary })} />
      <Numbered n="12" label="If yes, please state nature of the problems."><Textarea value={form.disciplinaryNature} onChange={(event) => update({ disciplinaryNature: event.target.value })} /></Numbered>
      <YesNo n="13" label="Was student expelled from your school." value={form.expelled} onChange={(expelled) => update({ expelled })} />
      <Numbered n="14" label="If yes, state reason why"><Textarea value={form.expelledReason} onChange={(event) => update({ expelledReason: event.target.value })} /></Numbered>
      <YesNo n="15" label="Has student ever received detentions?" value={form.detentions} onChange={(detentions) => update({ detentions })} />
      <Numbered n="16" label="If yes, give number and circumstances."><Textarea value={form.detentionCircumstances} onChange={(event) => update({ detentionCircumstances: event.target.value })} /></Numbered>
    </div>
  );
}

function ReportPage({ form, update }: { form: BehaviourAnswers; update: (patch: Partial<BehaviourAnswers>) => void }) {
  return (
    <div className="apply-fields">
      <Numbered n="17" label="Is student an active club or society member? If yes, please list." required><Textarea value={form.clubs} onChange={(event) => update({ clubs: event.target.value })} /></Numbered>
      <Numbered n="19" label="Is the student prepared for school and class? Has books and equipment ready?" required><Textarea value={form.prepared} onChange={(event) => update({ prepared: event.target.value })} /></Numbered>
      <Numbered n="20" label="Are the parents active members of the PTA body?" required><Textarea value={form.pta} onChange={(event) => update({ pta: event.target.value })} /></Numbered>
      <Numbered n="21" label="Would you readily re-admit this student to your institution? If yes, state why?" required><Textarea value={form.readmit} onChange={(event) => update({ readmit: event.target.value })} /></Numbered>
      <Numbered n="22" label="Give reasons for considering this transfer from your institution." required><Textarea value={form.transferReasons} onChange={(event) => update({ transferReasons: event.target.value })} /></Numbered>
    </div>
  );
}

function MaturityPage({ form, toggle }: { form: BehaviourAnswers; toggle: (key: "emotional" | "emotionalHelp" | "conflict" | "conflictHelp" | "discipline" | "social", option: string) => void }) {
  return (
    <div className="apply-fields">
      <h2>Part B</h2>
      <p>Please rate him/her in the following areas. You may tick more than one.</p>
      <Rating title="1. Emotional maturity" prompt="How does the applicant deal with setbacks, unfamiliar/challenging situations? The child:" options={emotionalOptions} selected={form.emotional} onToggle={(option) => toggle("emotional", option)} help="seeks help from:" helpSelected={form.emotionalHelp} onHelp={(option) => toggle("emotionalHelp", option)} />
      <Rating title="2. Conflict resolution capacity" prompt="The child:" options={conflictOptions} selected={form.conflict} onToggle={(option) => toggle("conflict", option)} help="seeks aid of:" helpSelected={form.conflictHelp} onHelp={(option) => toggle("conflictHelp", option)} />
    </div>
  );
}

function RatingsPage({ form, toggle }: { form: BehaviourAnswers; toggle: (key: "emotional" | "emotionalHelp" | "conflict" | "conflictHelp" | "discipline" | "social", option: string) => void }) {
  return (
    <div className="apply-fields">
      <h2>Part B, continued</h2>
      <Rating title="3. Academic discipline" prompt="The child:" options={disciplineOptions} selected={form.discipline} onToggle={(option) => toggle("discipline", option)} />
      <Rating title="4. Social integration" prompt="The child:" options={socialOptions} selected={form.social} onToggle={(option) => toggle("social", option)} />
    </div>
  );
}

function Rating({ title, prompt, options, selected, onToggle, help, helpSelected, onHelp }: { title: string; prompt: string; options: readonly string[]; selected: string[]; onToggle: (option: string) => void; help?: string; helpSelected?: string[]; onHelp?: (option: string) => void }) {
  return (
    <section className="behaviour-rate">
      <h3>{title}</h3>
      <p>{prompt}</p>
      <div className="behaviour-grid">
        {options.map((option) => (
          <label key={option}>
            <input type="checkbox" checked={selected.includes(option)} onChange={() => onToggle(option)} />
            {option}
          </label>
        ))}
      </div>
      {help && onHelp ? (
        <div className="behaviour-help">
          <span>{help}</span>
          {helpOptions.map((option) => (
            <label key={option}>
              <input type="checkbox" checked={helpSelected?.includes(option) ?? false} onChange={() => onHelp(option)} />
              {option}
            </label>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function YesNo({ n, label, value, onChange }: { n: string; label: string; value: YesNo; onChange: (value: YesNo) => void }) {
  return (
    <Numbered n={n} label={label} required>
      <div className="apply-choice">
        <label><input type="radio" name={`behaviour-${n}`} checked={value === "yes"} onChange={() => onChange("yes")} /> Yes</label>
        <label><input type="radio" name={`behaviour-${n}`} checked={value === "no"} onChange={() => onChange("no")} /> No</label>
      </div>
    </Numbered>
  );
}

function Numbered({ n, label, required, children }: { n: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="behaviour-row">
      <span>{n}</span>
      <Field label={label} required={required}>{children}</Field>
    </div>
  );
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="apply-field">
      <span>{label}{required ? <span aria-hidden="true"> *</span> : null}</span>
      {children}
    </div>
  );
}

function SignPage({ form, update, stampPreview, onStamp }: { form: BehaviourAnswers; update: (patch: Partial<BehaviourAnswers>) => void; stampPreview: string; onStamp: (file: File | null) => void }) {
  return (
    <div className="apply-fields">
      <h2>Person completing this form</h2>
      <div className="apply-pair">
        <Field label="Person completing this form" required><Input className={fieldClass} value={form.completedBy} onChange={(event) => update({ completedBy: event.target.value })} /></Field>
        <Field label="Date" required><Input className={fieldClass} readOnly aria-readonly="true" placeholder="Filled when the form is signed" value={form.completedDate ? paperDate(form.completedDate) : ""} /></Field>
      </div>
      <SignaturePad label="Signature" value={form.signature} onChange={(signature) => update({ signature, completedDate: signature ? todayInputValue() : "" })} />
      <Field label="Position" required><Input className={fieldClass} value={form.position} onChange={(event) => update({ position: event.target.value })} /></Field>
      <Field label="Address of the school / institution" required><Textarea value={form.institutionAddress} onChange={(event) => update({ institutionAddress: event.target.value })} /></Field>
      <div className="apply-pair">
        <Field label="Telephone #" required><Input className={fieldClass} value={form.telephone} onChange={(event) => update({ telephone: event.target.value })} /></Field>
        <Field label="Email" required><Input className={fieldClass} type="email" value={form.email} onChange={(event) => update({ email: event.target.value })} /></Field>
      </div>
      <Field label="Place institution's / school stamp here">
        <label className="behaviour-stamp-upload">
          {stampPreview ? <img src={stampPreview} alt="School stamp" /> : <span>Add a stamp image</span>}
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={(event) => onStamp(event.target.files?.[0] ?? null)} />
        </label>
      </Field>
      <p className="behaviour-note">The application process will not be complete if this form is not returned under confidential cover. This form is part of the application process. It does not imply automatic entry or acceptance.</p>
    </div>
  );
}

export function BehaviourPaper({ form, stampSrc }: { form: BehaviourAnswers; stampSrc: string }) {
  const child = [form.lastName, form.firstName, form.middleName].filter(Boolean).join(" ");
  const lines: [string, string, string][] = [
    ["1", "Full name of student (as it appears on Birth Certificate)", form.fullName],
    ["2", "Date of birth / Age", [paperDate(form.birthDate), form.age].filter(Boolean).join(" · ")],
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
  return (
    <article className="behaviour-paper">
      <header>
        <h2>Ardenne Preparatory &amp; Extension High School</h2>
        <p>37 Hope Road, Kingston 10 · Telephone: 876-926-7047 / 876-926-7910</p>
        <p>Email: ardenne.prep.saw@moeschools.edu.jm</p>
        <h3>Behaviour assessment form</h3>
        <p>To the principal or representative</p>
      </header>
      <p className="behaviour-paper-line">The parent(s) of <strong>{child}</strong> request a transfer</p>
      <p className="behaviour-paper-line">from <strong>{form.lastSchool}</strong></p>
      <p className="behaviour-paper-address">{form.lastSchoolAddress}</p>
      <p>to Ardenne Preparatory and Extension High School. Please fill out the following form and return directly to the Principal of Ardenne Preparatory and Extension High School under <strong>confidential cover</strong>.</p>
      <table>
        <tbody>
          {lines.map(([number, label, value]) => (
            <tr key={number}>
              <td>{number}</td>
              <td>{label}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Part B: Please rate him/her in the following areas. (You may tick more than one)</h3>
      <RateBlock title="1. Emotional maturity" prompt="How does the applicant deal with setbacks, unfamiliar/challenging situations? The child:" options={emotionalOptions} selected={form.emotional} help="seeks help from:" helpSelected={form.emotionalHelp} />
      <RateBlock title="2. Conflict resolution capacity: The child:" options={conflictOptions} selected={form.conflict} help="seeks aid of:" helpSelected={form.conflictHelp} />
      <RateBlock title="3. Academic discipline: The child:" options={disciplineOptions} selected={form.discipline} />
      <RateBlock title="4. Social integration: The child:" options={socialOptions} selected={form.social} />
      <dl className="behaviour-close">
        <div><dt>Person completing this form</dt><dd>{form.completedBy}</dd></div>
        <div><dt>Date</dt><dd>{paperDate(form.completedDate)}</dd></div>
        <div><dt>Signature</dt><dd>{form.signature ? <img src={form.signature} alt="Signature" /> : null}</dd></div>
        <div><dt>Position</dt><dd>{form.position}</dd></div>
        <div className="behaviour-close-wide"><dt>Address of the school / institution</dt><dd>{form.institutionAddress}</dd></div>
        <div><dt>Telephone #</dt><dd>{form.telephone}</dd></div>
        <div><dt>Email</dt><dd>{form.email}</dd></div>
      </dl>
      <figure className="behaviour-stamp">
        {stampSrc ? <img src={stampSrc} alt="School stamp" /> : <figcaption>Place institution&apos;s / school stamp here</figcaption>}
      </figure>
      <p className="behaviour-paper-note"><strong>Note:</strong> The application process will not be complete if this form is not returned under confidential cover.</p>
      <p className="behaviour-paper-note">This form is part of the application process. It does not imply automatic entry or acceptance.</p>
    </article>
  );
}

function RateBlock({ title, prompt, options, selected, help, helpSelected = [] }: { title: string; prompt?: string; options: readonly string[]; selected: string[]; help?: string; helpSelected?: string[] }) {
  return (
    <section className="behaviour-paper-rate">
      <h4>{title}</h4>
      {prompt ? <p>{prompt}</p> : null}
      <div>
        {options.map((option) => (
          <span key={option}><i data-on={selected.includes(option) ? "true" : "false"} />{option}</span>
        ))}
      </div>
      {help ? (
        <p className="behaviour-paper-help">
          {help}
          {helpOptions.map((option) => <span key={option}><i data-on={helpSelected.includes(option) ? "true" : "false"} />{option}</span>)}
        </p>
      ) : null}
    </section>
  );
}

function labelYes(value: YesNo) {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  return "";
}

function paperDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("en-JM", { day: "numeric", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
}

function ageFromIso(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [year, month, day] = iso.split("-").map(Number);
  const monthName = applicationMonths[month - 1];
  if (!monthName) return "";
  const age = ageFromBirth(day, monthName, year);
  return age === null ? "" : String(age);
}

function todayInputValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}
