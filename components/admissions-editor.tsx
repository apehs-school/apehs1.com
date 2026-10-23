"use client";

import { useState } from "react";
import { deleteAdmission, publishAdmission, saveAdmission, unpublishAdmission } from "@/actions/admissions";
import { adminSelectClass } from "@/components/admin-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PagedTable } from "@/components/paged-table";
import { TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogBackdrop, DialogClose, DialogPopup, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogBackdrop, AlertDialogClose, AlertDialogDescription, AlertDialogPopup, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  admissionDepartments,
  admissionStatus,
  departmentLabel,
  eligibilitySummary,
  formatAdmissionUpdated,
  validateAdmission,
  type AdmissionDepartment,
  type AdmissionRecord,
  type AdmissionStep,
} from "@/lib/admissions";

const fieldClass = "h-11 text-base";

type FormState = {
  title: string;
  department: AdmissionDepartment;
  introduction: string;
  minAge: string;
  maxAge: string;
  gradeRange: string;
  eligibilityNote: string;
  documents: string[];
  steps: AdmissionStep[];
  additional: string;
};

function blankForm(): FormState {
  return {
    title: "",
    department: "both",
    introduction: "",
    minAge: "",
    maxAge: "",
    gradeRange: "",
    eligibilityNote: "",
    documents: [""],
    steps: [{ id: crypto.randomUUID(), title: "", description: "" }],
    additional: "",
  };
}

function fromRecord(record: AdmissionRecord): FormState {
  return {
    title: record.title,
    department: record.department,
    introduction: record.introduction,
    minAge: record.minAge === null ? "" : String(record.minAge),
    maxAge: record.maxAge === null ? "" : String(record.maxAge),
    gradeRange: record.gradeRange,
    eligibilityNote: record.eligibilityNote,
    documents: record.documents.length ? record.documents : [""],
    steps: record.steps.length ? record.steps : [{ id: crypto.randomUUID(), title: "", description: "" }],
    additional: record.additional,
  };
}

export function AdmissionsEditor({ initial }: { initial: AdmissionRecord[] }) {
  const [records, setRecords] = useState(initial);
  const [form, setForm] = useState<FormState>(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  function update(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function payload() {
    return {
      id: editingId ?? undefined,
      title: form.title,
      department: form.department,
      introduction: form.introduction,
      minAge: form.minAge === "" ? null : Number(form.minAge),
      maxAge: form.maxAge === "" ? null : Number(form.maxAge),
      gradeRange: form.gradeRange,
      eligibilityNote: form.eligibilityNote,
      documents: form.documents,
      steps: form.steps,
      additional: form.additional,
    };
  }

  function openNew() {
    setEditingId(null);
    setForm(blankForm());
    setStatus("idle");
    setMessage("");
    setOpen(true);
  }

  function openEdit(record: AdmissionRecord) {
    setEditingId(record.id);
    setForm(fromRecord(record));
    setStatus("idle");
    setMessage("");
    setOpen(true);
  }

  function moveStep(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= form.steps.length) return;
    const steps = [...form.steps];
    const [step] = steps.splice(index, 1);
    steps.splice(next, 0, step);
    update({ steps });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = validateAdmission(payload());
    if (!parsed.ok) {
      setStatus("error");
      setMessage(parsed.error);
      return;
    }
    setStatus("saving");
    setMessage(editingId ? "Saving changes…" : "Saving draft…");
    try {
      const result = await saveAdmission(payload());
      if (!result.ok) {
        setStatus("error");
        setMessage(result.error);
        return;
      }
      setRecords(result.records);
      setStatus("saved");
      setMessage(editingId
        ? result.record.published
          ? "Changes saved. The public page still shows the last published version until you publish these changes."
          : "Changes saved."
        : "Draft saved.");
      setOpen(false);
    } catch {
      setStatus("error");
      setMessage("Could not save. Your entries are still here.");
    }
  }

  async function runRow(action: () => Promise<{ ok: true; records: AdmissionRecord[] } | { ok: false; error: string }>, success: string) {
    setStatus("saving");
    setMessage("Saving…");
    try {
      const result = await action();
      if (!result.ok) {
        setStatus("error");
        setMessage(result.error);
        return;
      }
      setRecords(result.records);
      setStatus("saved");
      setMessage(success);
    } catch {
      setStatus("error");
      setMessage("Could not update the record.");
    }
  }

  return (
    <div className="admission-admin">
      {!open && message ? (
        <div className="awards-save">
          <p role="status" data-state={status}>{message}</p>
        </div>
      ) : null}
      <section className="awards-card">
        <div className="awards-card-head">
          <h2>Saved admission records</h2>
          <Button type="button" onClick={openNew} className="bg-[#0d47a1] text-white hover:bg-[#1565c0]">New draft</Button>
        </div>
        <div className="admission-table">
        <PagedTable
          pageKey="records"
          header={
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Eligibility summary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last updated</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
          }
          rows={records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>No saved admission records yet.</TableCell>
                </TableRow>
              ) : records.map((record) => {
                const state = admissionStatus(record);
                const tone = state === "Draft" ? "draft" : state === "Published" ? "published" : "pending";
                return (
                  <TableRow key={record.id}>
                    <TableCell className="whitespace-normal"><strong>{record.title}</strong></TableCell>
                    <TableCell className="whitespace-normal">{departmentLabel(record.department)}</TableCell>
                    <TableCell className="whitespace-normal">{eligibilitySummary(record) || "—"}</TableCell>
                    <TableCell><span className="admission-status" data-state={tone}>{state}</span></TableCell>
                    <TableCell>{formatAdmissionUpdated(record.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => openEdit(record)}>Edit</Button>
                        {state === "Published" ? (
                          <Button type="button" variant="outline" onClick={() => runRow(() => unpublishAdmission(record.id), "Unpublished. The record stays in this table.")}>Unpublish</Button>
                        ) : (
                          <Button type="button" variant="outline" onClick={() => runRow(() => publishAdmission(record.id), state === "Draft" ? "Published to the admissions page." : "Published changes are now on the admissions page.")}>
                            {state === "Draft" ? "Publish" : "Publish Changes"}
                          </Button>
                        )}
                        {state === "Published · Unpublished changes" ? (
                          <Button type="button" variant="outline" onClick={() => runRow(() => unpublishAdmission(record.id), "Unpublished. The record stays in this table.")}>Unpublish</Button>
                        ) : null}
                        <RemoveAdmission published={record.published} onConfirm={() => runRow(() => deleteAdmission(record.id), "Admission record deleted.")} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
        />
        </div>
      </section>

      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) { setEditingId(null); setForm(blankForm()); } }}>
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup className="w-[min(56rem,calc(100vw-2rem))]">
            <DialogTitle className="mb-6">{editingId ? "Edit admission record" : "Create admission record"}</DialogTitle>
            <form className="admission-admin" onSubmit={onSubmit}>
              <div className="awards-record awards-record-wide">
                <Field label="Title" required>
                  <Input className={fieldClass} value={form.title} required onChange={(event) => update({ title: event.target.value })} />
                </Field>
                <Field label="Department" required>
                  <select className={`${adminSelectClass} h-11 text-base`} value={form.department} required onChange={(event) => update({ department: event.target.value as AdmissionDepartment })}>
                    {admissionDepartments.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Introduction" required>
                <Textarea className="text-base" rows={4} value={form.introduction} required onChange={(event) => update({ introduction: event.target.value })} />
              </Field>
              <div className="awards-record awards-record-wide">
                <Field label="Minimum age (optional)">
                  <Input className={fieldClass} inputMode="numeric" value={form.minAge} onChange={(event) => update({ minAge: event.target.value })} />
                </Field>
                <Field label="Maximum age (optional)">
                  <Input className={fieldClass} inputMode="numeric" value={form.maxAge} onChange={(event) => update({ maxAge: event.target.value })} />
                </Field>
                <Field label="Grade range (optional)">
                  <Input className={fieldClass} value={form.gradeRange} onChange={(event) => update({ gradeRange: event.target.value })} />
                </Field>
                <Field label="Other eligibility information">
                  <Textarea className="text-base" rows={3} value={form.eligibilityNote} onChange={(event) => update({ eligibilityNote: event.target.value })} />
                </Field>
              </div>
              <div className="awards-card-head">
                <h3>Required documents</h3>
                <Button type="button" variant="outline" onClick={() => update({ documents: [...form.documents, ""] })}>+ Add document</Button>
              </div>
              {form.documents.map((document, index) => (
                <div className="admission-line" key={`document-${index}`}>
                  <Input aria-label={`Required document ${index + 1}`} className={fieldClass} value={document} onChange={(event) => update({ documents: form.documents.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} />
                  <Button type="button" variant="outline" className="awards-remove" onClick={() => update({ documents: form.documents.filter((_, itemIndex) => itemIndex !== index) })}>Remove</Button>
                </div>
              ))}
              <div className="awards-card-head">
                <h3>Enrollment steps</h3>
                <Button type="button" variant="outline" onClick={() => update({ steps: [...form.steps, { id: crypto.randomUUID(), title: "", description: "" }] })}>+ Add step</Button>
              </div>
              {form.steps.map((step, index) => (
                <div className="admission-step" key={step.id}>
                  <Field label={`Step ${index + 1} title`}>
                    <Input className={fieldClass} value={step.title} onChange={(event) => update({ steps: form.steps.map((item) => item.id === step.id ? { ...item, title: event.target.value } : item) })} />
                  </Field>
                  <Field label="Description (optional)">
                    <Input className={fieldClass} value={step.description} onChange={(event) => update({ steps: form.steps.map((item) => item.id === step.id ? { ...item, description: event.target.value } : item) })} />
                  </Field>
                  <div className="admission-step-actions">
                    <Button type="button" variant="outline" aria-label={`Move step ${index + 1} up`} disabled={index === 0} onClick={() => moveStep(index, -1)}>Up</Button>
                    <Button type="button" variant="outline" aria-label={`Move step ${index + 1} down`} disabled={index === form.steps.length - 1} onClick={() => moveStep(index, 1)}>Down</Button>
                    <Button type="button" variant="outline" className="awards-remove" onClick={() => update({ steps: form.steps.filter((item) => item.id !== step.id) })}>Remove</Button>
                  </div>
                </div>
              ))}
              <Field label="Additional information">
                <Textarea className="text-base" rows={3} value={form.additional} onChange={(event) => update({ additional: event.target.value })} />
              </Field>
              <div className="awards-save">
                {open && message ? <p role="status" data-state={status}>{message}</p> : null}
                <div className="admission-actions">
                  <Button type="submit" disabled={status === "saving"} className="bg-[#0d47a1] text-white hover:bg-[#1565c0]">
                    {status === "saving" ? "Saving…" : editingId ? "Save Changes" : "Save Draft"}
                  </Button>
                  <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
                </div>
              </div>
            </form>
          </DialogPopup>
        </DialogPortal>
      </Dialog>
    </div>
  );
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="awards-field">
      <span>{label}{required ? <span aria-hidden="true"> *</span> : null}</span>
      {children}
    </label>
  );
}

function RemoveAdmission({ published, onConfirm }: { published: boolean; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button type="button" variant="outline" className="awards-remove" />}>Delete</AlertDialogTrigger>
      <AlertDialogPortal>
        <AlertDialogBackdrop />
        <AlertDialogPopup>
          <AlertDialogTitle>Delete this admission record?</AlertDialogTitle>
          <AlertDialogDescription>
            {published
              ? "This record is on the public Admissions page. Deleting it removes that content from the website. This cannot be undone."
              : "This cannot be undone."}
          </AlertDialogDescription>
          <div className="mt-6 flex gap-2">
            <AlertDialogClose render={<Button type="button" variant="destructive" onClick={onConfirm} />}>Delete</AlertDialogClose>
            <AlertDialogClose render={<Button type="button" variant="outline" />}>Cancel</AlertDialogClose>
          </div>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
