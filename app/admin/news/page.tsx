import { createNews, deleteNews, setNewsPublished, updateNews } from "@/actions/admin";
import { DeleteButton } from "@/components/delete-button";
import { AdminField } from "@/components/admin-field";
import { RecordDialog } from "@/components/record-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getDb } from "@/db";
import { news } from "@/db/schema";
import { formatLongDate } from "@/lib/format";
import { desc } from "drizzle-orm";

const fieldClass = "h-11 text-base";

export default async function NewsAdminPage() {
  const db = getDb();
  const rows = db ? await db.select().from(news).orderBy(desc(news.eventDate)) : [];

  return (
    <>
      <h1>News</h1>
      <RecordDialog trigger="Add news" title="Add a news item" action={createNews}>
        <AdminField label="Title">
          <Input name="title" className={fieldClass} required />
        </AdminField>
        <AdminField label="Details">
          <Textarea name="body" rows={6} className="text-base" required />
        </AdminField>
        <AdminField label="Start date">
          <Input name="startsOn" type="date" className={fieldClass} required />
        </AdminField>
        <AdminField label="End date">
          <Input name="endsOn" type="date" className={fieldClass} required />
        </AdminField>
      </RecordDialog>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {formatLongDate(item.eventDate)} – {formatLongDate(item.endsOn)}
              </TableCell>
              <TableCell>
                <strong>{item.title}</strong>
                <div className="text-sm text-muted-foreground">{item.body}</div>
              </TableCell>
              <TableCell>{item.published ? "Published" : "Draft"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap justify-end gap-2">
                  <RecordDialog trigger="Edit" title="Edit news item" action={updateNews}>
                    <input type="hidden" name="id" value={item.id} />
                    <AdminField label="Title">
                      <Input name="title" className={fieldClass} defaultValue={item.title} required />
                    </AdminField>
                    <AdminField label="Details">
                      <Textarea name="body" rows={6} className="text-base" defaultValue={item.body} required />
                    </AdminField>
                    <AdminField label="Start date">
                      <Input name="startsOn" type="date" className={fieldClass} defaultValue={item.eventDate} required />
                    </AdminField>
                    <AdminField label="End date">
                      <Input name="endsOn" type="date" className={fieldClass} defaultValue={item.endsOn} required />
                    </AdminField>
                  </RecordDialog>
                  <form action={setNewsPublished}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="published" value={item.published ? "false" : "true"} />
                    <Button variant="outline" type="submit">{item.published ? "Unpublish" : "Publish"}</Button>
                  </form>
                  <DeleteButton action={deleteNews} id={item.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
