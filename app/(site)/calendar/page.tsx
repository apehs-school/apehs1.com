import { SchoolCalendar } from "@/components/school-calendar";
import { jamaicaDate } from "@/lib/format";
import { listCalendarEntries } from "@/lib/queries";

export default async function CalendarPage() {
  const entries = await listCalendarEntries();

  return (
    <main className="bg-[#f4f6f8] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <SchoolCalendar entries={entries} today={jamaicaDate()} />
      </div>
    </main>
  );
}
