import { createPageEntry, deleteAboutPage, deletePageEntry, deleteStaffMember, savePage, setAboutPagePublished, setPageEntryPublished, setStaffPublished, updatePageEntry } from "@/actions/admin";
import { DeleteButton } from "@/components/delete-button";
import { AdminField } from "@/components/admin-field";
import { RecordDialog } from "@/components/record-dialog";
import { RecordParagraphs } from "@/components/record-paragraphs";
import { StaffDialog, type StaffDraft } from "@/components/staff-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDb } from "@/db";
import { pageEntries, sitePages, staffMembers } from "@/db/schema";
import { sitePageDefaults } from "@/lib/site-content";
import { formatStaffAssignment, parseStaffAssignments } from "@/lib/staff";
import { publicObjectUrl } from "@/lib/storage";
import { asc, eq } from "drizzle-orm";

const fieldClass = "h-11 text-base";

export default async function AboutAdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const pages = sitePageDefaults.filter((page) => page.group === "about");
  const active = pages.find((page) => page.slug === tab)?.slug ?? pages[0]?.slug ?? "about";
  const current = pages.find((page) => page.slug === active) ?? pages[0];
  const db = getDb();
  const saved = db ? await db.select().from(sitePages).where(eq(sitePages.slug, active)) : [];
  const stored = saved[0];
  const entries = active === "staff" || !db ? [] : await db.select().from(pageEntries).where(eq(pageEntries.section, active)).orderBy(asc(pageEntries.createdAt));
  const staff = active === "staff" && db ? await db.select().from(staffMembers).orderBy(asc(staffMembers.createdAt)) : [];
  const builtin = stored?.group === "hidden" || !current
    ? null
    : {
        title: stored?.title ?? current.title,
        body: stored?.body ?? current.body,
        published: stored && stored.group === "about" ? stored.published : true,
      };

  return (
    <div className="space-y-6">
      <h1>About us</h1>
      <div className="flex flex-wrap gap-2 border-b border-[#d9e0ea]">
        {pages.map((page) => {
          const selected = page.slug === active;
          return (
            <a
              key={page.slug}
              href={`/admin/about?tab=${page.slug}`}
              aria-current={selected ? "page" : undefined}
              className={`border-b-2 px-3 py-2 text-sm font-medium ${
                selected ? "border-[#0d47a1] text-[#0d47a1]" : "border-transparent text-[#24344d]"
              }`}
            >
              {page.title}
            </a>
          );
        })}
      </div>
      {active === "staff" ? <StaffTable rows={staff} /> : <PageRecordTable active={active} currentTitle={current?.title ?? "this page"} builtin={builtin} entries={entries} />}
    </div>
  );
}

function StaffTable({ rows }: { rows: { id: string; name: string; role: string; title: string; assignments: string; note: string; imageKey: string | null; published: boolean }[] }) {
  return (
    <>
      <StaffDialog />
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Photo</TableHead>
            <TableHead className="w-[22%]">Staff</TableHead>
            <TableHead>Grade and subject</TableHead>
            <TableHead className="w-28">Status</TableHead>
            <TableHead className="w-80" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5}>No staff records yet.</TableCell>
            </TableRow>
          ) : rows.map((member) => {
            const assignments = parseStaffAssignments(member.assignments);
            const draft: StaffDraft = {
              id: member.id,
              name: member.name,
              role: member.role,
              title: member.title,
              assignments,
              note: member.note,
              imageUrl: member.imageKey ? publicObjectUrl("images", member.imageKey) : null,
            };
            return (
              <TableRow key={member.id}>
                <TableCell>
                  {draft.imageUrl ? <img src={draft.imageUrl} alt="" className="h-12 w-12 rounded-md object-cover" /> : null}
                </TableCell>
                <TableCell className="whitespace-normal">
                  <strong>{member.name}</strong>
                  <div className="text-sm text-muted-foreground">{member.title}</div>
                  {member.note ? <p className="line-clamp-2 text-sm">{member.note}</p> : null}
                </TableCell>
                <TableCell className="whitespace-normal">
                  {assignments.map(formatStaffAssignment).filter(Boolean).join(", ")}
                </TableCell>
                <TableCell>{member.published ? "Published" : "Draft"}</TableCell>
                <TableCell className="whitespace-normal">
                  <div className="flex flex-wrap justify-end gap-2">
                    <StaffDialog staff={draft} />
                    <form action={setStaffPublished}>
                      <input type="hidden" name="id" value={member.id} />
                      <input type="hidden" name="published" value={member.published ? "false" : "true"} />
                      <Button variant="outline" type="submit">{member.published ? "Unpublish" : "Publish"}</Button>
                    </form>
                    <DeleteButton action={deleteStaffMember} id={member.id} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}

function PageRecordTable({
  active,
  currentTitle,
  builtin,
  entries,
}: {
  active: string;
  currentTitle: string;
  builtin: { title: string; body: string; published: boolean } | null;
  entries: { id: string; title: string; body: string; imageKey: string | null; published: boolean }[];
}) {
  const titleLabel = active === "principal" ? "Message title" : "Title";
  const bodyLabel = active === "principal" ? "Message paragraph" : "Paragraph";
  const withImage = active !== "principal";

  return (
    <>
      <p className="text-sm text-muted-foreground">Each paragraph appears on its own on the public page. Use Add paragraph for another one.</p>
      <RecordDialog trigger="Add record" title={`Add a record to ${currentTitle}`} action={createPageEntry}>
        <input type="hidden" name="section" value={active} />
        <AdminField label={titleLabel}>
          <Input name="title" className={fieldClass} required />
        </AdminField>
        <RecordParagraphs label={bodyLabel} titleLabel={titleLabel} />
        {withImage ? (
          <AdminField label="Image">
            <Input name="image" type="file" accept="image/*" className={fieldClass} />
          </AdminField>
        ) : null}
      </RecordDialog>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            {withImage ? <TableHead className="w-20">Image</TableHead> : null}
            <TableHead className="w-[18%]">{titleLabel}</TableHead>
            <TableHead>{bodyLabel}</TableHead>
            <TableHead className="w-28">Status</TableHead>
            <TableHead className="w-80" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {!builtin && entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={withImage ? 5 : 4}>No records on this tab yet.</TableCell>
            </TableRow>
          ) : null}
          {builtin ? (
            <TableRow>
              {withImage ? <TableCell /> : null}
              <TableCell className="whitespace-normal">
                <strong>{builtin.title}</strong>
              </TableCell>
              <TableCell className="whitespace-normal">
                <p className="line-clamp-2">{builtin.body}</p>
              </TableCell>
              <TableCell>{builtin.published ? "Published" : "Draft"}</TableCell>
              <TableCell className="whitespace-normal">
                <div className="flex flex-wrap justify-end gap-2">
                  <RecordDialog trigger="Edit" title="Edit record" action={savePage}>
                    <input type="hidden" name="slug" value={active} />
                    <AdminField label={titleLabel}>
                      <Input name="title" className={fieldClass} defaultValue={builtin.title} required />
                    </AdminField>
                    <RecordParagraphs label={bodyLabel} titleLabel={titleLabel} defaultBody={builtin.body} />
                  </RecordDialog>
                  <form action={setAboutPagePublished}>
                    <input type="hidden" name="slug" value={active} />
                    <input type="hidden" name="published" value={builtin.published ? "false" : "true"} />
                    <Button variant="outline" type="submit">{builtin.published ? "Unpublish" : "Publish"}</Button>
                  </form>
                  <DeleteButton action={deleteAboutPage} id={active} name="slug" />
                </div>
              </TableCell>
            </TableRow>
          ) : null}
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              {withImage ? (
                <TableCell>
                  {entry.imageKey ? <img src={publicObjectUrl("images", entry.imageKey) ?? ""} alt="" className="h-12 w-12 rounded-md object-cover" /> : null}
                </TableCell>
              ) : null}
              <TableCell className="whitespace-normal">
                <strong>{entry.title}</strong>
              </TableCell>
              <TableCell className="whitespace-normal">
                <p className="line-clamp-2">{entry.body}</p>
              </TableCell>
              <TableCell>{entry.published ? "Published" : "Draft"}</TableCell>
              <TableCell className="whitespace-normal">
                <div className="flex flex-wrap justify-end gap-2">
                  <RecordDialog trigger="Edit" title="Edit record" action={updatePageEntry}>
                    <input type="hidden" name="id" value={entry.id} />
                    <input type="hidden" name="section" value={active} />
                    <AdminField label={titleLabel}>
                      <Input name="title" className={fieldClass} defaultValue={entry.title} required />
                    </AdminField>
                    <RecordParagraphs label={bodyLabel} titleLabel={titleLabel} defaultBody={entry.body} existingImageUrl={entry.imageKey ? publicObjectUrl("images", entry.imageKey) : null} />
                    {withImage ? (
                      <AdminField label="Image">
                        <Input name="image" type="file" accept="image/*" className={fieldClass} />
                      </AdminField>
                    ) : null}
                    {withImage && entry.imageKey ? <img src={publicObjectUrl("images", entry.imageKey) ?? ""} alt="" className="h-28 w-28 rounded-md object-cover" /> : null}
                  </RecordDialog>
                  <form action={setPageEntryPublished}>
                    <input type="hidden" name="id" value={entry.id} />
                    <input type="hidden" name="section" value={active} />
                    <input type="hidden" name="published" value={entry.published ? "false" : "true"} />
                    <Button variant="outline" type="submit">{entry.published ? "Unpublish" : "Publish"}</Button>
                  </form>
                  <DeleteButton action={deletePageEntry} id={entry.id} fields={{ section: active }} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
