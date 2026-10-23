"use client";

import { useMemo, useState } from "react";
import type { CalendarEntry } from "@/lib/calendar";
import { formatLongDate } from "@/lib/format";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function covers(entry: CalendarEntry, date: string) {
  return entry.start <= date && entry.end >= date;
}

function pageOf<T>(items: T[], page: number, size: number) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pages - 1);
  const start = current * size;
  return { pages, current, items: items.slice(start, start + size) };
}

function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="lawn-pager">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 0}>Previous</button>
      <span>{page + 1} of {pages}</span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= pages - 1}>Next</button>
    </div>
  );
}

export function SchoolCalendar({ entries, today, heading = "Calendar of events" }: { entries: CalendarEntry[]; today: string; heading?: string }) {
  const [cursor, setCursor] = useState(() => {
    const [year, month] = today.split("-").map(Number);
    return new Date(year, (month || 1) - 1, 1);
  });
  const [selected, setSelected] = useState(today);
  const [focusId, setFocusId] = useState("");
  const [keyPage, setKeyPage] = useState(0);
  const [soonPage, setSoonPage] = useState(0);
  const [viewPage, setViewPage] = useState(0);

  const view = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    return {
      year,
      month,
      firstDay: new Date(year, month, 1).getDay(),
      lastDate: new Date(year, month + 1, 0).getDate(),
      label: cursor.toLocaleString("en-JM", { month: "long", year: "numeric" }),
      monthStart: isoDate(year, month, 1),
      monthEnd: isoDate(year, month, new Date(year, month + 1, 0).getDate()),
    };
  }, [cursor]);

  const visible = entries.filter((entry) => entry.start <= view.monthEnd && entry.end >= view.monthStart);
  const chosen = entries.filter((entry) => covers(entry, selected));
  const focused = entries.find((entry) => entry.id === focusId);
  const viewing = focused ? [focused, ...chosen.filter((entry) => entry.id !== focused.id)] : chosen;
  const upcoming = entries.filter((entry) => entry.end >= today);
  const keyList = pageOf(visible, keyPage, 4);
  const soonList = pageOf(upcoming, soonPage, 4);
  const viewList = pageOf(viewing, viewPage, 1);
  const days = Array.from({ length: view.lastDate }, (_, index) => index + 1);

  function openEntry(entry: CalendarEntry) {
    const [year, month] = entry.start.split("-").map(Number);
    setCursor(new Date(year, month - 1, 1));
    setSelected(entry.start);
    setFocusId(entry.id);
    setViewPage(0);
  }

  function openDay(date: string) {
    setSelected(date);
    setFocusId("");
    setViewPage(0);
  }

  return (
    <section className="lawn-calendar" aria-labelledby="lawn-calendar-title">
      <div className="lawn-legend">
        <h3>Key</h3>
        {visible.length === 0 ? <p>No events this month.</p> : (
          <ul>
            {keyList.items.map((entry) => (
              <li key={entry.id}>
                <button type="button" className={focusId === entry.id ? "is-open" : ""} onClick={() => openEntry(entry)}>
                  <i style={{ background: entry.color }} />
                  <span>
                    <strong>{entry.title}</strong>
                    <small>{entry.kind}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Pager page={keyList.current} pages={keyList.pages} onChange={setKeyPage} />
      </div>
      <div className="lawn-main">
        <header className="lawn-calendar-banner">
          <div>
            <p>Ardenne Preparatory &amp; Extension High School</p>
            <h2 id="lawn-calendar-title">{heading}</h2>
          </div>
          <div className="lawn-calendar-nav">
            <button type="button" onClick={() => setCursor(new Date(view.year, view.month - 1, 1))} aria-label="Previous month">Previous</button>
            <strong>{view.label}</strong>
            <button type="button" onClick={() => setCursor(new Date(view.year, view.month + 1, 1))} aria-label="Next month">Next</button>
          </div>
        </header>
        <div className="lawn-board" key={view.label}>
          {weekdays.map((day) => <span key={day}>{day}</span>)}
          {Array.from({ length: view.firstDay }, (_, index) => <span key={`blank-${index}`} className="is-blank" />)}
          {days.map((day) => {
            const date = isoDate(view.year, view.month, day);
            const matches = entries.filter((entry) => covers(entry, date));
            return (
              <button
                key={date}
                type="button"
                aria-pressed={selected === date}
                aria-label={matches.length ? `${formatLongDate(date)}: ${matches.map((entry) => entry.title).join(", ")}` : formatLongDate(date)}
                className={selected === date ? "is-selected" : ""}
                data-today={date === today ? "true" : undefined}
                onClick={() => openDay(date)}
              >
                <b>{day}</b>
                <span className="lawn-bars">
                  {matches.slice(0, 3).map((entry) => <i key={entry.id} style={{ background: entry.color }} />)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="lawn-upcoming">
        <h3>Coming up</h3>
        {upcoming.length === 0 ? <p>Nothing further is scheduled.</p> : (
          <ul>
            {soonList.items.map((entry) => (
              <li key={entry.id}>
                <button type="button" className={focusId === entry.id ? "is-open" : ""} onClick={() => openEntry(entry)}>
                  <i style={{ background: entry.color }} />
                  <span>
                    <strong>{entry.title}</strong>
                    <small>{formatLongDate(entry.start)}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Pager page={soonList.current} pages={soonList.pages} onChange={setSoonPage} />
      </div>
      <div className="lawn-selected" aria-live="polite">
        <h3>{selected === today ? "Today" : "Opened"}<span>{formatLongDate(selected)}</span></h3>
        {viewing.length === 0 ? (
          <p>No events on this day.</p>
        ) : (
          <div>
            {viewList.items.map((entry) => (
              <article key={entry.id} style={{ borderColor: entry.color }}>
                <p><i style={{ background: entry.color }} />{entry.kind}</p>
                <h4>{entry.title}</h4>
                <time>{formatLongDate(entry.start)}{entry.end !== entry.start ? ` – ${formatLongDate(entry.end)}` : ""}</time>
                {entry.details ? <pre>{entry.details}</pre> : null}
              </article>
            ))}
          </div>
        )}
        <Pager page={viewList.current} pages={viewList.pages} onChange={setViewPage} />
      </div>
    </section>
  );
}
