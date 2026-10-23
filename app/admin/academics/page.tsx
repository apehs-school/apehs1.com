import { createAcademicProgram, deleteAcademicProgram, setAcademicProgramPublished, updateAcademicProgram } from "@/actions/admin";
import { AdmissionsEditor } from "@/components/admissions-editor";
import { AwardsEditor } from "@/components/awards-editor";
import { ScholarshipEditor } from "@/components/scholarship-editor";
import { AdminField } from "@/components/admin-field";
import { GradeLevelField } from "@/components/grade-level-field";
import { PageEditors } from "@/components/admin-page-forms";
import { DeleteButton } from "@/components/delete-button";
import { RecordDialog } from "@/components/record-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PagedTable } from "@/components/paged-table";
import { TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDb } from "@/db";
import { pageEntries } from "@/db/schema";
import { AdmissionsPanels } from "@/components/admissions-panels";
import { ApplicationTable } from "@/components/application-table";
import { getAwardPage, listAdmissionApplications, listAdmissionRecords, listScholarshipRecords, listSitePages } from "@/lib/queries";
import { asc, eq } from "drizzle-orm";

const fieldClass = "h-11 text-base";

export default async function AcademicsAdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const pages = await listSitePages("academics");
  const active = pages.find((page) => page.slug === tab)?.slug ?? pages[0]?.slug;
  const db = getDb();
  const programs = active === "academics" && db
    ? await db.select().from(pageEntries).where(eq(pageEntries.section, "academics")).orderBy(asc(pageEntries.createdAt))
    : [];
  const awards = active === "awards" ? await getAwardPage() : null;
  const admissions = active === "admissions" ? await listAdmissionRecords() : null;
  const applications = active === "admissions" ? await listAdmissionApplications() : null;
  const scholarships = active === "scholarship" ? await listScholarshipRecords() : null;
  const structured = active === "academics" || active === "awards" || active === "admissions" || active === "scholarship";

  return (
    <>
      <h1>Academics</h1>
      <p>These pages are the Academics menu and its sub-tabs: the programme, awards, admissions, and scholarships.</p>
      <PageEditors pages={pages} active={active} basePath="/admin/academics" omit={structured && active ? [active] : []} />
      {active === "academics" ? <ProgramTable rows={programs} /> : null}
      {awards ? <AwardsEditor initial={awards} /> : null}
      {admissions && applications ? (
        <AdmissionsPanels
          records={<AdmissionsEditor initial={admissions.records} />}
          applications={<ApplicationTable title="Online Student Admission Application" pageKey="applications" rows={applications.filter((row) => row.entryType !== "behaviour").map(toApplicationRow)} />}
          behaviour={<ApplicationTable title="Online Student Behaviour Assessment" pageKey="behaviour" rows={applications.filter((row) => row.entryType === "behaviour").map(toApplicationRow)} />}
        />
      ) : null}
      {scholarships ? <ScholarshipEditor initial={scholarships} /> : null}
    </>
  );
}

function toApplicationRow(row: Awaited<ReturnType<typeof listAdmissionApplications>>[number]) {
  return {
    id: row.id,
    submissionNumber: row.submissionNumber,
    photoFileId: row.photoFileId ?? "",
    firstName: row.firstName,
    lastName: row.lastName,
    middleName: row.middleName,
    sex: row.sex,
    academicYear: row.academicYear,
    birthDate: row.birthDate,
    birthMonth: row.birthMonth,
    birthYear: row.birthYear,
    age: row.age,
    birthPlace: row.birthPlace,
    nationality: row.nationality,
    address: row.address,
    nsrn: row.nsrn,
    gradeSeeking: row.gradeSeeking,
    church: row.church,
    pastor: row.pastor,
    entryType: row.entryType,
    lastSchool: row.lastSchool,
    lastGrade: row.lastGrade,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    documents: row.documents,
    office: row.office,
    mother: row.mother,
    father: row.father,
    guardian: row.guardian,
    emergency: row.emergency,
    declaration: row.declaration,
    behaviour: row.behaviour ?? "{}",
  };
}

function ProgramTable({ rows }: { rows: { id: string; title: string; body: string; published: boolean }[] }) {
  return (
    <>
      <RecordDialog trigger="Add program" title="Add a program" action={createAcademicProgram}>
        <AdminField label="Subject">
          <Input name="subject" className={fieldClass} required />
        </AdminField>
        <GradeLevelField />
      </RecordDialog>
      <PagedTable
        pageKey="programs"
        tableClassName="table-fixed"
        header={
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Grade level</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-80" />
            </TableRow>
          </TableHeader>
        }
        rows={rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4}>No programs yet.</TableCell>
            </TableRow>
          ) : rows.map((program) => (
            <TableRow key={program.id}>
              <TableCell className="whitespace-normal">
                <strong>{program.title}</strong>
              </TableCell>
              <TableCell className="whitespace-normal">{program.body}</TableCell>
              <TableCell>{program.published ? "Published" : "Draft"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap justify-end gap-2">
                  <RecordDialog trigger="Edit" title="Edit program" action={updateAcademicProgram}>
                    <input type="hidden" name="id" value={program.id} />
                    <AdminField label="Subject">
                      <Input name="subject" className={fieldClass} defaultValue={program.title} required />
                    </AdminField>
                    <GradeLevelField defaultValue={program.body} />
                  </RecordDialog>
                  <form action={setAcademicProgramPublished}>
                    <input type="hidden" name="id" value={program.id} />
                    <input type="hidden" name="published" value={program.published ? "false" : "true"} />
                    <Button variant="outline" type="submit">{program.published ? "Unpublish" : "Publish"}</Button>
                  </form>
                  <DeleteButton action={deleteAcademicProgram} id={program.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
      />
    </>
  );
}
