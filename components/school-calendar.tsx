"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SchoolCalendar({ events }: { events: Record<string, string[]> }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);

  const view = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    return {
      year,
      month,
      firstDay: new Date(year, month, 1).getDay(),
      lastDate: new Date(year, month + 1, 0).getDate(),
      label: cursor.toLocaleString("en-JM", { month: "long", year: "numeric" }),
    };
  }, [cursor]);

  const days = Array.from({ length: view.lastDate }, (_, index) => index + 1);
  const titles = selected ? events[selected] : undefined;

  return (
    <section className="mx-auto max-w-3xl px-4 py-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <Button variant="outline" type="button" onClick={() => setCursor(new Date(view.year, view.month - 1, 1))} aria-label="Previous month">
            Previous
          </Button>
          <CardTitle>{view.label}</CardTitle>
          <Button variant="outline" type="button" onClick={() => setCursor(new Date(view.year, view.month + 1, 1))} aria-label="Next month">
            Next
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {Array.from({ length: view.firstDay }, (_, index) => (
              <div key={`blank-${index}`} />
            ))}
            {days.map((day) => {
              const fullDate = `${view.year}-${String(view.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasEvent = Boolean(events[fullDate]);
              return (
                <button
                  key={fullDate}
                  type="button"
                  onClick={() => setSelected(fullDate)}
                  className={cn(
                    "rounded-md py-2 hover:bg-muted",
                    hasEvent && "bg-accent font-semibold text-accent-foreground",
                    selected === fullDate && "ring-2 ring-primary",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <ul className="mt-4 space-y-1 text-sm">
            {titles ? titles.map((title) => <li key={title}>{title}</li>) : <li>{selected ? "No events for this day" : "Select a date to see events"}</li>}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
