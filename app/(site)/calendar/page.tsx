import { SchoolCalendar } from "@/components/school-calendar";
import { formatLongDate } from "@/lib/format";
import { getCalendarEvents, getUpcomingEvents } from "@/lib/queries";

export default async function CalendarPage() {
  const [events, upcoming] = await Promise.all([getCalendarEvents(), getUpcomingEvents()]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-4 text-3xl font-semibold text-primary">Calendar of events</h1>
      <SchoolCalendar events={events} />
      <h2 className="mt-8 mb-3 text-xl font-semibold">Coming up</h2>
      <ul className="space-y-2">
        {upcoming.map((item) => (
          <li key={`${item.date}-${item.title}`}>
            {formatLongDate(item.date)} — {item.title}
            {item.details ? ` (${item.details})` : ""}
          </li>
        ))}
      </ul>
    </main>
  );
}
