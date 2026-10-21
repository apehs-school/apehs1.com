"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBackdrop, DialogClose, DialogPopup, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { conflictOptions, disciplineOptions, emotionalOptions, helpOptions, socialOptions, type BehaviourAnswers } from "@/lib/behaviour";

export type BehaviourRow = {
  id: string;
  lastName: string;
  firstName: string;
  middleName: string;
  lastSchool: string;
  createdAt: string;
  answers: BehaviourAnswers;
};

export function BehaviourTable({ rows }: { rows: BehaviourRow[] }) {
  const [open, setOpen] = useState<BehaviourRow | null>(null);
  return (
    <section className="awards-card">
      <div className="awards-card-head">
        <h2>Behaviour assessments</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Last school</TableHead>
            <TableHead>Received</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={4}>No behaviour assessments yet.</TableCell></TableRow>
          ) : rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{[row.lastName, row.firstName, row.middleName].filter(Boolean).join(" ")}</TableCell>
              <TableCell>{row.lastSchool}</TableCell>
              <TableCell>{received(row.createdAt)}</TableCell>
              <TableCell><Button type="button" variant="outline" onClick={() => setOpen(row)}>View</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={Boolean(open)} onOpenChange={(value) => { if (!value) setOpen(null); }}>
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup className="w-[min(46rem,calc(100vw-2rem))] max-h-[min(92vh,52rem)] overflow-auto">
            {open ? <BehaviourRecord row={open} /> : null}
          </DialogPopup>
        </DialogPortal>
      </Dialog>
    </section>
  );
}

function BehaviourRecord({ row }: { row: BehaviourRow }) {
  const form = row.answers;
  return (
    <div className="apply-fields">
      <DialogTitle>{[form.firstName, form.lastName].filter(Boolean).join(" ")}</DialogTitle>
      <p>{form.lastSchool}</p>
      <p>{form.lastSchoolAddress}</p>
      <dl className="apply-review-grid">
        <Line label="Full name" value={form.fullName} />
        <Line label="Date of birth" value={form.birthDate} />
        <Line label="Age" value={form.age} />
        <Line label="Mother" value={form.motherName} />
        <Line label="Father" value={form.fatherName} />
        <Line label="Grades admitted" value={form.gradesAdmitted} />
        <Line label="Present grade" value={form.presentGrade} />
        <Line label="Academic strength" value={form.academicStrength} />
        <Line label="Academic weakness" value={form.academicWeakness} />
        <Line label="Suspended" value={answer(form.suspended, form.suspendedTimes)} />
        <Line label="Disciplinary problems" value={answer(form.disciplinary, form.disciplinaryNature)} />
        <Line label="Expelled" value={answer(form.expelled, form.expelledReason)} />
        <Line label="Detentions" value={answer(form.detentions, form.detentionCircumstances)} />
        <Line label="Clubs or societies" value={form.clubs} />
        <Line label="Prepared for school" value={form.prepared} />
        <Line label="Parents in the PTA" value={form.pta} />
        <Line label="Would re-admit" value={form.readmit} />
        <Line label="Reasons for transfer" value={form.transferReasons} />
        <Line label="Emotional maturity" value={picked(form.emotional, emotionalOptions, form.emotionalHelp)} />
        <Line label="Conflict resolution" value={picked(form.conflict, conflictOptions, form.conflictHelp)} />
        <Line label="Academic discipline" value={form.discipline.join(", ")} />
        <Line label="Social integration" value={form.social.join(", ")} />
      </dl>
      <DialogClose render={<Button type="button" variant="outline" />}>Close</DialogClose>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value || "—"}</dd></div>;
}

function answer(value: string, detail: string) {
  if (value === "yes") return detail ? `Yes. ${detail}` : "Yes";
  if (value === "no") return "No";
  return "";
}

function picked(values: string[], options: readonly string[], help: string[]) {
  const marks = options.filter((option) => values.includes(option));
  const helpers = helpOptions.filter((option) => help.includes(option));
  return [...marks, helpers.length ? `seeks help from ${helpers.join(", ")}` : ""].filter(Boolean).join("; ");
}

function received(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-JM", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
