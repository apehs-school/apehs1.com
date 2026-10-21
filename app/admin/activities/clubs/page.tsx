import { createActivity, deleteActivity, setActivityPublished, updateActivity } from "@/actions/admin";
import { ActivityDates } from "@/components/activity-dates";
import { DeleteButton } from "@/components/delete-button";
import { AdminField } from "@/components/admin-field";
import { RecordDialog } from "@/components/record-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getDb } from "@/db";
import { activities } from "@/db/schema";
import { formatShortDate, jamaicaDate, shortSchedule } from "@/lib/format";
import { retireEndedActivities } from "@/lib/queries";

const fieldClass = "h-11 text-base";

export default async function ActivityClubsPage() {
  await retireEndedActivities();
  const db = getDb();
  const today = jamaicaDate();
  const rows = db ? await db.select().from(activities) : [];

  return (
    <>
      <h1>Clubs</h1>
      <RecordDialog trigger="Add activity" title="Add an activity" action={createActivity}>
        <AdminField label="Activity name">
          <Input name="name" className={fieldClass} required />
        </AdminField>
        <ActivityDates />
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
          {rows.map((item) => {
            const ended = item.endsOn < today;
            const tone = ended ? "bg-[#fde8e8] hover:bg-[#fde8e8]" : item.published ? "bg-[#e7f6ee] hover:bg-[#e7f6ee]" : "bg-[#fff1e0] hover:bg-[#fff1e0]";
            return (
            <TableRow key={item.id} className={tone}>
              <TableCell>
                <strong>{item.name}</strong>
                <div className="text-sm text-muted-foreground">{[item.venue, item.lead, item.cost].filter(Boolean).join(" · ")}</div>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatShortDate(item.startsOn)} – {formatShortDate(item.endsOn)}
              </TableCell>
              <TableCell className="max-w-xs">{shortSchedule(item.schedule)}</TableCell>
              <TableCell>{ended ? "Ended" : item.published ? "Published" : "Draft"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap justify-end gap-2">
                  <RecordDialog trigger="Edit" title="Edit an activity" action={updateActivity}>
                    <input type="hidden" name="id" value={item.id} />
                    <AdminField label="Activity name">
                      <Input name="name" className={fieldClass} defaultValue={item.name} required />
                    </AdminField>
                    <ActivityDates startsOn={item.startsOn} endsOn={item.endsOn} schedule={item.schedule} />
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
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
