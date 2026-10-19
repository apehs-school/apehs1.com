import { createActivity, deleteActivity, setActivityPublished, updateActivity } from "@/actions/admin";
import { DeleteButton } from "@/components/delete-button";
import { AdminField } from "@/components/admin-field";
import { RecordDialog } from "@/components/record-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getDb } from "@/db";
import { activities } from "@/db/schema";
import { formatLongDate } from "@/lib/format";

const fieldClass = "h-11 text-base";

export default async function ActivityClubsPage() {
  const db = getDb();
  const rows = db ? await db.select().from(activities) : [];

  return (
    <>
      <h1>Clubs</h1>
      <RecordDialog trigger="Add activity" title="Add an activity" action={createActivity}>
        <AdminField label="Activity name">
          <Input name="name" className={fieldClass} required />
        </AdminField>
        <AdminField label="Start date">
          <Input name="startsOn" type="date" className={fieldClass} required />
        </AdminField>
        <AdminField label="End date">
          <Input name="endsOn" type="date" className={fieldClass} required />
        </AdminField>
        <AdminField label="Days and times">
          <Textarea name="schedule" rows={4} className="text-base" required />
        </AdminField>
        <AdminField label="Venue">
          <Input name="venue" className={fieldClass} />
        </AdminField>
        <AdminField label="Staff or coach">
          <Input name="lead" className={fieldClass} />
        </AdminField>
        <AdminField label="Cost">
          <Input name="cost" className={fieldClass} />
        </AdminField>
        <AdminField label="Attire">
          <Input name="attire" className={fieldClass} />
        </AdminField>
        <AdminField label="Note for parents">
          <Textarea name="note" rows={3} className="text-base" />
        </AdminField>
      </RecordDialog>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Activity</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <strong>{item.name}</strong>
                <div className="text-sm text-muted-foreground">{[item.venue, item.lead, item.cost].filter(Boolean).join(" · ")}</div>
              </TableCell>
              <TableCell>
                {formatLongDate(item.startsOn)} – {formatLongDate(item.endsOn)}
              </TableCell>
              <TableCell className="whitespace-pre-line">{item.schedule}</TableCell>
              <TableCell>{item.published ? "Published" : "Draft"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap justify-end gap-2">
                  <RecordDialog trigger="Edit" title="Edit an activity" action={updateActivity}>
                    <input type="hidden" name="id" value={item.id} />
                    <AdminField label="Activity name">
                      <Input name="name" className={fieldClass} defaultValue={item.name} required />
                    </AdminField>
                    <AdminField label="Start date">
                      <Input name="startsOn" type="date" className={fieldClass} defaultValue={item.startsOn} required />
                    </AdminField>
                    <AdminField label="End date">
                      <Input name="endsOn" type="date" className={fieldClass} defaultValue={item.endsOn} required />
                    </AdminField>
                    <AdminField label="Days and times">
                      <Textarea name="schedule" rows={4} className="text-base" defaultValue={item.schedule} required />
                    </AdminField>
                    <AdminField label="Venue">
                      <Input name="venue" className={fieldClass} defaultValue={item.venue} />
                    </AdminField>
                    <AdminField label="Staff or coach">
                      <Input name="lead" className={fieldClass} defaultValue={item.lead} />
                    </AdminField>
                    <AdminField label="Cost">
                      <Input name="cost" className={fieldClass} defaultValue={item.cost} />
                    </AdminField>
                    <AdminField label="Attire">
                      <Input name="attire" className={fieldClass} defaultValue={item.attire} />
                    </AdminField>
                    <AdminField label="Note for parents">
                      <Textarea name="note" rows={3} className="text-base" defaultValue={item.note ?? ""} />
                    </AdminField>
                  </RecordDialog>
                  <form action={setActivityPublished}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="published" value={item.published ? "false" : "true"} />
                    <Button variant="outline" type="submit">{item.published ? "Unpublish" : "Publish"}</Button>
                  </form>
                  <DeleteButton action={deleteActivity} id={item.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
