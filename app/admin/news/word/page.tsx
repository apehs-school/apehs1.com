import { createDevotional, deleteDevotional, setDevotionalPublished, updateDevotional } from "@/actions/admin";
import { DeleteButton } from "@/components/delete-button";
import { AdminField } from "@/components/admin-field";
import { RecordDialog } from "@/components/record-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getDb } from "@/db";
import { devotionals } from "@/db/schema";
import { formatLongDate } from "@/lib/format";
import { desc } from "drizzle-orm";

const fieldClass = "h-11 text-base";

export default async function WordAdminPage() {
  const db = getDb();
  const rows = db ? await db.select().from(devotionals).orderBy(desc(devotionals.activeDate)) : [];

  return (
    <>
      <h1>Word for today</h1>
      <RecordDialog trigger="Add devotional" title="Add a word for today" action={createDevotional}>
        <AdminField label="Start date">
          <Input name="startsOn" type="date" className={fieldClass} required />
        </AdminField>
        <AdminField label="End date">
          <Input name="endsOn" type="date" className={fieldClass} required />
        </AdminField>
        <AdminField label="Verse">
          <Textarea name="verse" rows={4} className="text-base" required />
        </AdminField>
        <AdminField label="Reference">
          <Input name="reference" className={fieldClass} required />
        </AdminField>
        <AdminField label="Prayer">
          <Textarea name="prayer" rows={6} className="text-base" required />
        </AdminField>
      </RecordDialog>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead>Verse</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {formatLongDate(item.activeDate)} – {formatLongDate(item.endsOn)}
              </TableCell>
              <TableCell>
                <strong>{item.reference}</strong>
                <div className="text-sm text-muted-foreground">{item.verse}</div>
              </TableCell>
              <TableCell>{item.published ? "Published" : "Draft"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap justify-end gap-2">
                  <RecordDialog trigger="Edit" title="Edit word for today" action={updateDevotional}>
                    <input type="hidden" name="id" value={item.id} />
                    <AdminField label="Start date">
                      <Input name="startsOn" type="date" className={fieldClass} defaultValue={item.activeDate} required />
                    </AdminField>
                    <AdminField label="End date">
                      <Input name="endsOn" type="date" className={fieldClass} defaultValue={item.endsOn} required />
                    </AdminField>
                    <AdminField label="Verse">
                      <Textarea name="verse" rows={4} className="text-base" defaultValue={item.verse} required />
                    </AdminField>
                    <AdminField label="Reference">
                      <Input name="reference" className={fieldClass} defaultValue={item.reference} required />
                    </AdminField>
                    <AdminField label="Prayer">
                      <Textarea name="prayer" rows={6} className="text-base" defaultValue={item.prayer} required />
                    </AdminField>
                  </RecordDialog>
                  <form action={setDevotionalPublished}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="published" value={item.published ? "false" : "true"} />
                    <Button variant="outline" type="submit">{item.published ? "Unpublish" : "Publish"}</Button>
                  </form>
                  <DeleteButton action={deleteDevotional} id={item.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
