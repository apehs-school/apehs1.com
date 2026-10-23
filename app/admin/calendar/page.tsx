import { createEvent, deleteEvent, setEventPublished, updateEvent } from "@/actions/admin";
import { DeleteButton } from "@/components/delete-button";
import { AdminField } from "@/components/admin-field";
import { RecordDialog } from "@/components/record-dialog";
import { SchoolCalendar } from "@/components/school-calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PagedTable } from "@/components/paged-table";
import { TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { formatLongDate, jamaicaDate } from "@/lib/format";
import { listCalendarEntries } from "@/lib/queries";
import { desc } from "drizzle-orm";

const fieldClass = "h-11 text-base";

export default async function CalendarAdminPage() {
  const db = getDb();
  const [rows, entries] = await Promise.all([
    db ? db.select().from(events).orderBy(desc(events.eventDate)) : Promise.resolve([]),
    listCalendarEntries(),
  ]);

  return (
    <div className="calendar-admin">
      <div className="calendar-admin-head">
        <div>
          <h1>School calendar</h1>
          <p>Published dates are marked on the diary. Select a day to read the notice.</p>
        </div>
        <RecordDialog trigger="Add event" title="Add a calendar event" action={createEvent}>
        <AdminField label="Event title">
          <Input name="title" className={fieldClass} required />
        </AdminField>
        <AdminField label="Start date">
          <Input name="startsOn" type="date" className={fieldClass} required />
        </AdminField>
        <AdminField label="End date">
          <Input name="endsOn" type="date" className={fieldClass} required />
        </AdminField>
        <AdminField label="Details">
          <Textarea name="details" rows={5} className="text-base" />
        </AdminField>
      </RecordDialog>
      </div>
      <SchoolCalendar entries={entries} today={jamaicaDate()} heading="Published dates" />
      <section className="calendar-admin-records">
      <h2>Manage events</h2>
      <PagedTable
        pageKey="events"
        header={
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
        }
        rows={rows.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {formatLongDate(item.eventDate)} – {formatLongDate(item.endsOn)}
              </TableCell>
              <TableCell>
                <strong>{item.title}</strong>
                {item.details ? <div className="text-sm text-muted-foreground">{item.details}</div> : null}
              </TableCell>
              <TableCell>{item.published ? "Published" : "Draft"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap justify-end gap-2">
                  <RecordDialog trigger="Edit" title="Edit calendar event" action={updateEvent}>
                    <input type="hidden" name="id" value={item.id} />
                    <AdminField label="Event title">
                      <Input name="title" className={fieldClass} defaultValue={item.title} required />
                    </AdminField>
                    <AdminField label="Start date">
                      <Input name="startsOn" type="date" className={fieldClass} defaultValue={item.eventDate} required />
                    </AdminField>
                    <AdminField label="End date">
                      <Input name="endsOn" type="date" className={fieldClass} defaultValue={item.endsOn} required />
                    </AdminField>
                    <AdminField label="Details">
                      <Textarea name="details" rows={5} className="text-base" defaultValue={item.details ?? ""} />
                    </AdminField>
                  </RecordDialog>
                  <form action={setEventPublished}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="published" value={item.published ? "false" : "true"} />
                    <Button variant="outline" type="submit">{item.published ? "Unpublish" : "Publish"}</Button>
                  </form>
                  <DeleteButton action={deleteEvent} id={item.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
      />
      </section>
    </div>
  );
}
