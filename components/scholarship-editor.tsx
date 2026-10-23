"use client";

import { useState } from "react";
import { deleteScholarship, publishScholarship, saveScholarship, unpublishScholarship } from "@/actions/scholarships";
import { ScholarshipView } from "@/components/scholarship-view";
import { adminSelectClass } from "@/components/admin-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PagedTable } from "@/components/paged-table";
import { TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogBackdrop, DialogClose, DialogPopup, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogBackdrop, AlertDialogClose, AlertDialogDescription, AlertDialogPopup, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { admissionDepartments, departmentLabel, validateScholarship, type AdmissionDepartment, type ScholarshipRecord } from "@/lib/scholarships";

const fieldClass = "h-11 text-base";

type FormState = {
  studentName: string;
  awardName: string;
  year: string;
  grade: string;
  department: AdmissionDepartment;
  organization: string;
  details: string;
};

function blankForm(): FormState {
  return { studentName: "", awardName: "", year: "", grade: "", department: "preparatory", organization: "", details: "" };
}

function fromRecord(record: ScholarshipRecord): FormState {
  return {
    studentName: record.studentName,
    awardName: record.awardName,
    year: String(record.year),
    grade: record.grade,
    department: record.department,
    organization: record.organization,
    details: record.details,
  };
}

export function ScholarshipEditor({ initial }: { initial: ScholarshipRecord[] }) {
  const [records, setRecords] = useState(initial);
  const [form, setForm] = useState<FormState>(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  function update(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function openNew() {
    setEditingId(null);
    setForm(blankForm());
    setStatus("idle");
    setMessage("");
    setOpen(true);
  }

  function openEdit(record: ScholarshipRecord) {
    setEditingId(record.id);
    setForm(fromRecord(record));
    setStatus("idle");
    setMessage("");
    setOpen(true);
  }

  function payload() {
    return {
      id: editingId ?? undefined,
      studentName: form.studentName,
      awardName: form.awardName,
      year: Number(form.year),
      grade: form.grade,
      department: form.department,
      organization: form.organization,
      details: form.details,
    };
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = validateScholarship(payload());
    if (!parsed.ok) {
      setStatus("error");
      setMessage(parsed.error);
      return;
    }
    setStatus("saving");
    setMessage(editingId ? "Saving changes…" : "Saving draft…");
    try {
      const result = await saveScholarship(payload());
      if (!result.ok) {
        setStatus("error");
        setMessage(result.error);
        return;
      }
      setRecords(result.records);
      setStatus("saved");
      setMessage(editingId
        ? result.record.published
          ? "Changes saved and shown on the scholarship page."
          : "Changes saved."
        : "Draft saved. Publish it from the table when it should appear on the scholarship page.");
      setOpen(false);
    } catch {
      setStatus("error");
      setMessage("Could not save. Your entries are still here.");
    }
  }

  async function runRow(action: () => Promise<{ ok: true; records: ScholarshipRecord[] } | { ok: false; error: string }>, success: string) {
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
      <p className="scholarship-lead">Recognize students and manage scholarship announcements.</p>
      {!open && message ? (
        <div className="awards-save">
          <p role="status" data-state={status}>{message}</p>
        </div>
      ) : null}
      <section className="awards-card">
        <div className="awards-card-head">
          <h2>Saved scholarship records</h2>
          <div className="scholarship-actions">
            <p>{records.length === 1 ? "1 record" : `${records.length} records`}</p>
            <Button type="button" onClick={openNew} className="bg-[#0d47a1] text-white hover:bg-[#1565c0]">New draft</Button>
          </div>
        </div>
        <div className="admission-table">
          <PagedTable
            pageKey="scholarships"
            header={
              <TableHeader>
                <TableRow>
                  <TableHead>Student / scholarship</TableHead>
                  <TableHead>Year / department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
            }
            rows={records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>No scholarships saved yet.</TableCell>
                </TableRow>
              ) : records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="whitespace-normal">
                    <strong>{record.studentName}</strong>
                    <span className="scholarship-sub">{record.awardName}</span>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <strong>{record.year}</strong>
                    <span className="scholarship-sub">{departmentLabel(record.department)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="admission-status" data-state={record.published ? "published" : "draft"}>{record.published ? "Published" : "Draft"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => openEdit(record)}>Edit</Button>
                      {record.published ? (
                        <Button type="button" variant="outline" onClick={() => runRow(() => unpublishScholarship(record.id), "Unpublished. The record stays in this table.")}>Unpublish</Button>
                      ) : (
                        <Button type="button" variant="outline" onClick={() => runRow(() => publishScholarship(record.id), "Published to the scholarship page.")}>Publish</Button>
                      )}
                      <RemoveScholarship published={record.published} onConfirm={() => runRow(() => deleteScholarship(record.id), "Scholarship record deleted.")} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          />
        </div>
      </section>

      <section className="awards-card">
        <div className="awards-card-head">
          <h2>Public scholarship page preview</h2>
          <span className="scholarship-live">Published content only</span>
        </div>
        <ScholarshipView records={records} preview />
      </section>

      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) { setEditingId(null); setForm(blankForm()); } }}>
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup className="w-[min(56rem,calc(100vw-2rem))]">
            <DialogTitle className="mb-6">{editingId ? "Edit scholarship record" : "Create scholarship record"}</DialogTitle>
            <form className="admission-admin" onSubmit={onSubmit}>
              <div className="awards-record awards-record-wide">
                <Field label="Student name" required>
                  <Input className={fieldClass} required placeholder="Enter student's name" value={form.studentName} onChange={(event) => update({ studentName: event.target.value })} />
                </Field>
                <Field label="Scholarship / award name" required>
                  <Input className={fieldClass} required placeholder="Enter scholarship name" value={form.awardName} onChange={(event) => update({ awardName: event.target.value })} />
                </Field>
                <Field label="Year awarded" required>
                  <Input className={fieldClass} required inputMode="numeric" placeholder="2026" value={form.year} onChange={(event) => update({ year: event.target.value })} />
                </Field>
                <Field label="Grade / class (optional)">
                  <Input className={fieldClass} placeholder="For example, Grade 6" value={form.grade} onChange={(event) => update({ grade: event.target.value })} />
                </Field>
                <Field label="Department">
                  <select className={`${adminSelectClass} h-11 text-base`} value={form.department} onChange={(event) => update({ department: event.target.value as AdmissionDepartment })}>
                    {admissionDepartments.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </select>
                </Field>
                <Field label="Awarding organization (optional)">
                  <Input className={fieldClass} placeholder="Scholarship sponsor or organization" value={form.organization} onChange={(event) => update({ organization: event.target.value })} />
                </Field>
              </div>
              <Field label="Achievement details (optional)">
                <Textarea className="text-base" rows={4} placeholder="Describe the scholarship and the student's achievement" value={form.details} onChange={(event) => update({ details: event.target.value })} />
              </Field>
              <div className="awards-save">
                {open && message ? <p role="status" data-state={status}>{message}</p> : null}
                <div className="scholarship-actions">
                  <Button type="submit" disabled={status === "saving"} className="bg-[#0d47a1] text-white hover:bg-[#1565c0]">
                    {status === "saving" ? "Saving…" : editingId ? "Save Changes" : "Save Draft"}
                  </Button>
                  <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
                  {editingId ? null : <p>Save first, then publish from the table.</p>}
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

function RemoveScholarship({ published, onConfirm }: { published: boolean; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button type="button" variant="outline" className="awards-remove" />}>Delete</AlertDialogTrigger>
      <AlertDialogPortal>
        <AlertDialogBackdrop />
        <AlertDialogPopup>
          <AlertDialogTitle>Delete this scholarship record?</AlertDialogTitle>
          <AlertDialogDescription>
            {published
              ? "This scholarship is on the public page. Deleting it removes that announcement from the website. This cannot be undone."
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
