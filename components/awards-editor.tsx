"use client";

import { useEffect, useState } from "react";
import { saveAwards } from "@/actions/admin";
import { AwardsView } from "@/components/awards-view";
import { adminSelectClass } from "@/components/admin-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBackdrop, DialogClose, DialogPopup, DialogPortal, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogBackdrop, AlertDialogClose, AlertDialogDescription, AlertDialogPopup, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { awardCategories, awardsAverage, isPublished, validateAwards, type AwardsDocument, type GradeAssessment, type PepResult, type RecognitionAward } from "@/lib/awards";

const fieldClass = "h-11 text-base";
const sectionTabs = [
  ["pep", "PEP results"],
  ["assessments", "Grade assessments"],
  ["recognition", "Awards and recognition"],
] as const;

function tabForError(error: string) {
  if (error.includes("assessment") || error.includes("Grade")) return "assessments";
  if (error.includes("award") || error.includes("category")) return "recognition";
  if (error.includes("PEP") || error.includes("year")) return "pep";
  return null;
}

export function AwardsEditor({ initial }: { initial: AwardsDocument }) {
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [section, setSection] = useState<(typeof sectionTabs)[number][0]>("pep");
  const dirty = JSON.stringify(draft) !== saved;
  const average = awardsAverage(draft.pepResults.filter(isPublished).map((row) => row.result));
  const problems = validateAwards(draft);

  async function commit(next: AwardsDocument) {
    const parsed = validateAwards({ ...next, introduction: "" });
    if (!parsed.ok) {
      const tab = tabForError(parsed.error);
      if (tab) setSection(tab);
      setStatus("error");
      setMessage(parsed.error);
      return parsed.error;
    }
    setStatus("saving");
    setMessage("Saving Awards and Achievements…");
    try {
      const result = await saveAwards(parsed.value);
      if (!result.ok) {
        setStatus("error");
        setMessage(result.error);
        return result.error;
      }
      setDraft(result.value);
      setSaved(JSON.stringify(result.value));
      setStatus("saved");
      setMessage("Saved. The public page is updated.");
      return null;
    } catch {
      setStatus("error");
      setMessage("Could not save. Your entries are still here.");
      return "Could not save. Your entries are still here.";
    }
  }

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!problems.ok) {
      setAttempted(true);
      const next = tabForError(problems.error);
      if (next) setSection(next);
      setStatus("error");
      setMessage(problems.error);
      return;
    }
    setStatus("saving");
    setMessage("Saving Awards and Achievements…");
    try {
      const result = await saveAwards({ ...problems.value, introduction: "" });
      if (!result.ok) {
        setStatus("error");
        setMessage(result.error);
        return;
      }
      setDraft(result.value);
      setSaved(JSON.stringify(result.value));
      setStatus("saved");
      setMessage("Awards and Achievements saved. The public page is updated.");
    } catch {
      setStatus("error");
      setMessage("Could not save. Your entries are still here.");
    }
  }

  return (
    <div className="awards-studio">
      <form className="awards-form" onSubmit={onSubmit}>
        <section className="awards-card">
          <h2>Page details</h2>
          <p>Set the heading visitors will see.</p>
          <Field label="Page title" required error={attempted && !draft.title.trim() ? "Page title is required." : ""}>
            <Input className={fieldClass} value={draft.title} required aria-required="true" onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
          </Field>
        </section>

        <div className="awards-tabs" role="tablist" aria-label="Awards sections">
          {sectionTabs.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={section === id} onClick={() => setSection(id)}>
              {label}
            </button>
          ))}
        </div>

        {section === "pep" ? (
          <section className="awards-card">
            <div className="awards-card-head">
              <h2>PEP results</h2>
              <PepDialog trigger="Add year" onSave={(row) => commit({ ...draft, pepResults: [...draft.pepResults, row] })} />
            </div>
            <RecordTable
              empty="No years yet."
              columns={["Year", "Result", "Status"]}
              rows={draft.pepResults.map((row) => ({
                id: row.id,
                cells: [row.year, `${row.result}%`, isPublished(row) ? "Published" : "Draft"],
                actions: (
                  <>
                    <PepDialog row={row} trigger="Edit" onSave={(next) => commit({ ...draft, pepResults: draft.pepResults.map((item) => item.id === row.id ? next : item) })} />
                    <Button type="button" variant="outline" onClick={() => commit({ ...draft, pepResults: draft.pepResults.map((item) => item.id === row.id ? { ...item, published: !isPublished(item) } : item) })}>
                      {isPublished(row) ? "Unpublish" : "Publish"}
                    </Button>
                    <RemoveRecord label="Delete this year?" onConfirm={() => commit({ ...draft, pepResults: draft.pepResults.filter((item) => item.id !== row.id) })} />
                  </>
                ),
              }))}
            />
            <p className="awards-mean">{average ? <>Average across published years: <strong>{average.percent}%</strong></> : "Publish a year to calculate the average."}</p>
          </section>
        ) : null}

        {section === "assessments" ? (
          <section className="awards-card">
            <div className="awards-card-head">
              <h2>Grade assessments</h2>
              <AssessmentDialog trigger="Add assessment" onSave={(row) => commit({ ...draft, assessments: [...draft.assessments, row] })} />
            </div>
            <RecordTable
              empty="No assessments yet."
              columns={["Grade", "Assessment", "Result", "Status"]}
              rows={draft.assessments.map((row) => ({
                id: row.id,
                cells: [row.grade, row.name, `${row.result}%`, isPublished(row) ? "Published" : "Draft"],
                actions: (
                  <>
                    <AssessmentDialog row={row} trigger="Edit" onSave={(next) => commit({ ...draft, assessments: draft.assessments.map((item) => item.id === row.id ? next : item) })} />
                    <Button type="button" variant="outline" onClick={() => commit({ ...draft, assessments: draft.assessments.map((item) => item.id === row.id ? { ...item, published: !isPublished(item) } : item) })}>
                      {isPublished(row) ? "Unpublish" : "Publish"}
                    </Button>
                    <RemoveRecord label="Delete this assessment?" onConfirm={() => commit({ ...draft, assessments: draft.assessments.filter((item) => item.id !== row.id) })} />
                  </>
                ),
              }))}
            />
          </section>
        ) : null}

        {section === "recognition" ? (
          <section className="awards-card">
            <div className="awards-card-head">
              <h2>Awards and recognition</h2>
              <AwardDialog trigger="Add award" onSave={(row) => commit({ ...draft, awards: [...draft.awards, row] })} />
            </div>
            <RecordTable
              empty="No awards yet."
              columns={["Category", "Title", "Year", "Status"]}
              rows={draft.awards.map((row) => ({
                id: row.id,
                cells: [row.category, row.title, row.year, isPublished(row) ? "Published" : "Draft"],
                actions: (
                  <>
                    <AwardDialog row={row} trigger="Edit" onSave={(next) => commit({ ...draft, awards: draft.awards.map((item) => item.id === row.id ? next : item) })} />
                    <Button type="button" variant="outline" onClick={() => commit({ ...draft, awards: draft.awards.map((item) => item.id === row.id ? { ...item, published: !isPublished(item) } : item) })}>
                      {isPublished(row) ? "Unpublish" : "Publish"}
                    </Button>
                    <RemoveRecord label="Delete this award?" onConfirm={() => commit({ ...draft, awards: draft.awards.filter((item) => item.id !== row.id) })} />
                  </>
                ),
              }))}
            />
          </section>
        ) : null}

        <div className="awards-save">
          <p role="status" data-state={status}>{message}</p>
          {dirty ? <p className="awards-dirty">You have unsaved changes.</p> : null}
          <Button type="submit" disabled={status === "saving"} className="bg-[#0d47a1] text-white hover:bg-[#1565c0]">
            {status === "saving" ? "Saving…" : "Save Awards and Achievements"}
          </Button>
        </div>
      </form>
      <aside className="awards-preview" aria-label="Public page preview">
        <AwardsView document={{ ...draft, introduction: "" }} preview />
      </aside>
    </div>
  );
}

function Field({ label, required = false, error = "", children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <label className="awards-field">
      <span>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      {children}
      {error ? <small>{error}</small> : null}
    </label>
  );
}

function RecordTable({ columns, rows, empty }: { columns: string[]; rows: { id: string; cells: string[]; actions: React.ReactNode }[]; empty: string }) {
  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          {columns.map((column) => <TableHead key={column}>{column}</TableHead>)}
          <TableHead className="w-72" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length + 1}>{empty}</TableCell>
          </TableRow>
        ) : rows.map((row) => (
          <TableRow key={row.id}>
            {row.cells.map((cell, index) => (
              <TableCell key={`${row.id}-${index}`} className="whitespace-normal">{index === 0 ? <strong>{cell}</strong> : cell}</TableCell>
            ))}
            <TableCell>
              <div className="flex flex-wrap justify-end gap-2">{row.actions}</div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RemoveRecord({ label, onConfirm }: { label: string; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button type="button" variant="outline" />}>Delete</AlertDialogTrigger>
      <AlertDialogPortal>
        <AlertDialogBackdrop />
        <AlertDialogPopup>
          <AlertDialogTitle>{label}</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          <div className="mt-6 flex gap-2">
            <AlertDialogClose render={<Button type="button" variant="destructive" onClick={onConfirm} />}>Delete</AlertDialogClose>
            <AlertDialogClose render={<Button type="button" variant="outline" />}>Cancel</AlertDialogClose>
          </div>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  );
}

function FormDialog({ trigger, title, error, onOpen, onSubmit, children }: { trigger: string; title: string; error: string; onOpen?: () => void; onSubmit: () => Promise<string | null>; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [localError, setLocalError] = useState("");
  const editing = trigger === "Edit";
  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) { setLocalError(""); onOpen?.(); } }}>
      <DialogTrigger render={<Button type="button" variant={editing ? "outline" : "default"} />}>{editing ? "Edit" : trigger}</DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle className="mb-6">{title}</DialogTitle>
          <form className="grid gap-5" onSubmit={async (event) => {
            event.preventDefault();
            const message = await onSubmit();
            if (message) {
              setLocalError(message);
              return;
            }
            setOpen(false);
          }}>
            {children}
            {localError || error ? <p className="text-sm font-semibold text-[#b42318]">{localError || error}</p> : null}
            <div className="flex gap-3 border-t border-[#e6ebf2] pt-4">
              <Button type="submit" className="bg-[#0d47a1] text-white hover:bg-[#1565c0]">{editing ? "Save changes" : trigger}</Button>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            </div>
          </form>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}

function PepDialog({ row, trigger, onSave }: { row?: PepResult; trigger: string; onSave: (row: PepResult) => Promise<string | null> }) {
  const [year, setYear] = useState(row?.year ?? "");
  const [result, setResult] = useState(row?.result ?? "");
  return (
    <FormDialog trigger={trigger} title={row ? "Edit year" : "Add a year"} error="" onOpen={() => { setYear(row?.year ?? ""); setResult(row?.result ?? ""); }} onSubmit={() => onSave({ id: row?.id ?? crypto.randomUUID(), year, result, published: row ? isPublished(row) : false })}>
      <Field label="Year" required>
        <Input className={fieldClass} inputMode="numeric" value={year} required onChange={(event) => setYear(event.target.value)} />
      </Field>
      <Field label="Result (%)" required>
        <Input className={fieldClass} inputMode="decimal" value={result} required onChange={(event) => setResult(event.target.value)} />
      </Field>
    </FormDialog>
  );
}

function AssessmentDialog({ row, trigger, onSave }: { row?: GradeAssessment; trigger: string; onSave: (row: GradeAssessment) => Promise<string | null> }) {
  const [grade, setGrade] = useState(row?.grade ?? "");
  const [academicYear, setAcademicYear] = useState(row?.academicYear ?? "");
  const [name, setName] = useState(row?.name ?? "");
  const [subjects, setSubjects] = useState(row?.subjects ?? "");
  const [result, setResult] = useState(row?.result ?? "");
  return (
    <FormDialog trigger={trigger} title={row ? "Edit assessment" : "Add an assessment"} error="" onOpen={() => { setGrade(row?.grade ?? ""); setAcademicYear(row?.academicYear ?? ""); setName(row?.name ?? ""); setSubjects(row?.subjects ?? ""); setResult(row?.result ?? ""); }} onSubmit={() => onSave({ id: row?.id ?? crypto.randomUUID(), grade, academicYear, name, subjects, result, published: row ? isPublished(row) : false })}>
      <div className="awards-record awards-record-wide">
        <Field label="Grade" required>
          <Input className={fieldClass} value={grade} required onChange={(event) => setGrade(event.target.value)} />
        </Field>
        <Field label="Academic year">
          <Input className={fieldClass} value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} />
        </Field>
        <Field label="Assessment name" required>
          <Input className={fieldClass} value={name} required onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Result (%)" required>
          <Input className={fieldClass} inputMode="decimal" value={result} required onChange={(event) => setResult(event.target.value)} />
        </Field>
      </div>
      <Field label="Subjects / competencies">
        <Input className={fieldClass} value={subjects} onChange={(event) => setSubjects(event.target.value)} />
      </Field>
    </FormDialog>
  );
}

function AwardDialog({ row, trigger, onSave }: { row?: RecognitionAward; trigger: string; onSave: (row: RecognitionAward) => Promise<string | null> }) {
  const [category, setCategory] = useState(row?.category ?? "Dance");
  const [year, setYear] = useState(row?.year ?? "");
  const [body, setBody] = useState(row?.body ?? "");
  const [title, setTitle] = useState(row?.title ?? "");
  const [details, setDetails] = useState(row?.details ?? "");
  return (
    <FormDialog trigger={trigger} title={row ? "Edit award" : "Add an award"} error="" onOpen={() => { setCategory(row?.category ?? "Dance"); setYear(row?.year ?? ""); setBody(row?.body ?? ""); setTitle(row?.title ?? ""); setDetails(row?.details ?? ""); }} onSubmit={() => onSave({ id: row?.id ?? crypto.randomUUID(), category, year, body, title, details, published: row ? isPublished(row) : false })}>
      <div className="awards-record awards-record-wide">
        <Field label="Category" required>
          <select className={`${adminSelectClass} h-11 text-base`} value={category} required onChange={(event) => setCategory(event.target.value)}>
            {awardCategories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Year / academic year" required>
          <Input className={fieldClass} value={year} required onChange={(event) => setYear(event.target.value)} />
        </Field>
      </div>
      <Field label="Awarding body / competition">
        <Input className={fieldClass} value={body} onChange={(event) => setBody(event.target.value)} />
      </Field>
      <Field label="Award title" required>
        <Input className={fieldClass} value={title} required onChange={(event) => setTitle(event.target.value)} />
      </Field>
      <Field label="Recipient / achievement details">
        <Input className={fieldClass} value={details} onChange={(event) => setDetails(event.target.value)} />
      </Field>
    </FormDialog>
  );
}
