import { createActivityPage, deleteActivityPage, savePage, setActivityPagePublished } from "@/actions/admin";
import { DeleteButton } from "@/components/delete-button";
import { AdminField } from "@/components/admin-field";
import { RecordDialog } from "@/components/record-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getDb } from "@/db";
import { sitePages } from "@/db/schema";
import { sitePageDefaults } from "@/lib/site-content";

const fieldClass = "h-11 text-base";

export default async function ActivitiesPageAdmin() {
  const db = getDb();
  const defaults = sitePageDefaults.filter((page) => page.group === "activities");
  const saved = db ? await db.select().from(sitePages) : [];
  const hidden = new Set(saved.filter((page) => page.group === "hidden").map((page) => page.slug));
  const activityPages = saved.filter((page) => page.group === "activities");
  const savedBySlug = new Map(activityPages.map((page) => [page.slug, page]));
  const rows = [
    ...defaults
      .filter((page) => !hidden.has(page.slug))
      .map((page) => {
        const stored = savedBySlug.get(page.slug);
        return {
          slug: page.slug,
          title: stored?.title ?? page.title,
          body: stored?.body ?? page.body,
          published: stored?.published ?? true,
        };
      }),
    ...activityPages
      .filter((page) => !defaults.some((item) => item.slug === page.slug))
      .map((page) => ({ slug: page.slug, title: page.title, body: page.body, published: page.published })),
  ];

  return (
    <>
      <RecordDialog trigger="Add heading" title="Add a heading" action={createActivityPage}>
        <AdminField label="Title">
          <Input name="title" className={fieldClass} required />
        </AdminField>
        <AdminField label="Description">
          <Textarea name="body" className="text-base" rows={14} required />
        </AdminField>
      </RecordDialog>
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[18%]">Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-28">Status</TableHead>
            <TableHead className="w-72" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((page) => (
            <TableRow key={page.slug}>
              <TableCell className="whitespace-normal">
                <strong>{page.title}</strong>
              </TableCell>
              <TableCell className="whitespace-normal">
                <p className="line-clamp-2">{page.body}</p>
              </TableCell>
              <TableCell>{page.published ? "Published" : "Draft"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap justify-end gap-2">
                  <RecordDialog trigger="Edit" title="Edit heading" action={savePage}>
                    <input type="hidden" name="slug" value={page.slug} />
                    <AdminField label="Title">
                      <Input name="title" className={fieldClass} defaultValue={page.title} required />
                    </AdminField>
                    <AdminField label="Description">
                      <Textarea name="body" className="text-base" defaultValue={page.body} rows={14} required />
                    </AdminField>
                  </RecordDialog>
                  <form action={setActivityPagePublished}>
                    <input type="hidden" name="slug" value={page.slug} />
                    <input type="hidden" name="published" value={page.published ? "false" : "true"} />
                    <Button variant="outline" type="submit">{page.published ? "Unpublish" : "Publish"}</Button>
                  </form>
                  <DeleteButton action={deleteActivityPage} id={page.slug} name="slug" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
