"use client";

import { activityDayLabel, eachIsoDate, parseActivityTimes } from "@/lib/format";
import { useMemo, useState } from "react";

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayLimit = 90;

function weekdayIndex(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

function shortDate(iso: string) {
  return activityDayLabel(iso).split(" ")[0];
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function isoFromParts(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function ActivityDates({
  startsOn = "",
  endsOn = "",
  schedule = "",
}: {
  startsOn?: string;
  endsOn?: string;
  schedule?: string;
}) {
  const initialDays = startsOn && endsOn ? eachIsoDate(startsOn, endsOn) : [];
  const initialFits = initialDays.length > 0 && initialDays.length <= dayLimit;
  const [month, setMonth] = useState(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(startsOn)) {
      const [year, monthNumber] = startsOn.split("-").map(Number);
      return new Date(year, monthNumber - 1, 1);
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [start, setStart] = useState(initialFits ? startsOn : "");
  const [end, setEnd] = useState(initialFits ? endsOn : "");
  const [times, setTimes] = useState<Record<string, { start: string; end: string }>>(() => {
    if (!initialFits) return {};
    return Object.fromEntries(initialDays.map((iso) => [iso, parseActivityTimes(schedule, iso)]));
  });
  const [omitted, setOmitted] = useState<string[]>(() => {
    if (!initialFits) return [];
    const parsed = initialDays.map((iso) => parseActivityTimes(schedule, iso));
    if (!parsed.some((item) => item.start)) return [];
    return initialDays.filter((_, index) => !parsed[index].start);
  });
  const [showTimes, setShowTimes] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [omitOpen, setOmitOpen] = useState(false);
  const [groupDay, setGroupDay] = useState("1");
  const [groupStart, setGroupStart] = useState("");
  const [groupEnd, setGroupEnd] = useState("");
  const [omitKind, setOmitKind] = useState<"single" | "weekday">("single");
  const [omitDate, setOmitDate] = useState(initialFits ? startsOn : "");
  const [omitWeekday, setOmitWeekday] = useState("0");

  const days = useMemo(() => (start ? eachIsoDate(start, end || start) : []), [start, end]);
  const ready = days.length > 0 && days.length <= dayLimit;
  const included = days.filter((iso) => !omitted.includes(iso));
  const missingTime = included.some((iso) => !times[iso]?.start || !times[iso]?.end);
  const keepSaved = !start && Boolean(startsOn && endsOn && schedule);

  function choose(iso: string) {
    setShowTimes(false);
    if (!start || end) {
      setStart(iso);
      setEnd("");
      setOmitted([]);
      return;
    }
    if (iso < start) {
      setEnd(start);
      setStart(iso);
      return;
    }
    setEnd(iso);
  }

  function applyGroup() {
    if (!groupStart || !groupEnd) return;
    const day = Number(groupDay);
    setTimes((current) => {
      const next = { ...current };
      for (const iso of days) {
        if (weekdayIndex(iso) === day && !omitted.includes(iso)) next[iso] = { start: groupStart, end: groupEnd };
      }
      return next;
    });
  }

  function applyOmit() {
    if (omitKind === "single") {
      const target = included.includes(omitDate) ? omitDate : included[0];
      if (!target) return;
      setOmitted((current) => (current.includes(target) ? current : [...current, target]));
      return;
    }
    const day = Number(omitWeekday);
    setOmitted((current) => {
      const next = new Set(current);
      for (const iso of days) {
        if (weekdayIndex(iso) === day) next.add(iso);
      }
      return [...next];
    });
  }

  function restoreWeekday(day: number) {
    setOmitted((current) => current.filter((iso) => weekdayIndex(iso) !== day || !days.includes(iso)));
  }

  function shiftMonth(amount: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const leading = new Date(year, monthIndex, 1).getDay();
  const count = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [...Array(leading).fill(""), ...Array.from({ length: count }, (_, index) => isoFromParts(year, monthIndex, index + 1))];

  return (
    <div className="activity-dates">
      <span>Date</span>
      <p>Select the first day, then the last day.</p>
      <div className="activity-calendar">
        <div className="activity-calendar-head">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
          <strong>{monthLabel(month)}</strong>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
        </div>
        <div className="activity-calendar-grid" aria-hidden="true">
          {weekdays.map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="activity-calendar-grid">
          {cells.map((iso, index) => {
            if (!iso) return <span key={`empty-${index}`} />;
            const skipped = days.includes(iso) && omitted.includes(iso);
            const chosen = !skipped && (iso === start || iso === end);
            const between = !skipped && Boolean(start && end && iso > start && iso < end);
            return (
              <button
                key={iso}
                type="button"
                className={skipped ? "is-omitted" : chosen ? "is-chosen" : between ? "is-between" : undefined}
                aria-pressed={chosen || between}
                aria-label={activityDayLabel(iso)}
                onClick={() => choose(iso)}
              >
                {Number(iso.slice(-2))}
              </button>
            );
          })}
        </div>
      </div>
      {ready ? (
        <div className="activity-date-toolbar">
          <p className="activity-date-range">{shortDate(start)}{end && end !== start ? ` – ${shortDate(end)}` : ""}</p>
          <div className="activity-date-actions">
            <button type="button" className={showTimes ? "is-on" : undefined} onClick={() => setShowTimes((open) => !open)}>Set time</button>
            <button type="button" className={groupOpen ? "is-on" : undefined} onClick={() => { setGroupOpen((open) => !open); setOmitOpen(false); }}>Group days</button>
          </div>
          <button type="button" className={omitOpen ? "is-on" : undefined} onClick={() => { setOmitOpen((open) => !open); setGroupOpen(false); }}>Omit</button>
        </div>
      ) : null}
      {groupOpen && ready ? (
        <div className="activity-tool">
          <select value={groupDay} onChange={(event) => setGroupDay(event.target.value)} aria-label="Weekday group">
            {weekdayNames.map((name, index) => <option key={name} value={index}>{name}</option>)}
          </select>
          <label className="activity-slot">Start<input type="time" aria-label="Group start time" value={groupStart} onChange={(event) => setGroupStart(event.target.value)} /></label>
          <label className="activity-slot">End<input type="time" aria-label="Group end time" value={groupEnd} onChange={(event) => setGroupEnd(event.target.value)} /></label>
          <button type="button" onClick={applyGroup}>Set group time</button>
        </div>
      ) : null}
      {omitOpen && ready ? (
        <div className="activity-tool">
          <select value={omitKind} onChange={(event) => setOmitKind(event.target.value as "single" | "weekday")} aria-label="Omit one date or a weekday">
            <option value="single">One date</option>
            <option value="weekday">All of one weekday</option>
          </select>
          {omitKind === "single" ? (
            <select value={included.includes(omitDate) ? omitDate : included[0] ?? ""} onChange={(event) => setOmitDate(event.target.value)} aria-label="Date to omit">
              {included.map((iso) => <option key={iso} value={iso}>{activityDayLabel(iso)}</option>)}
            </select>
          ) : (
            <select value={omitWeekday} onChange={(event) => setOmitWeekday(event.target.value)} aria-label="Weekday to omit">
              {weekdayNames.map((name, index) => <option key={name} value={index}>{name}</option>)}
            </select>
          )}
          <button type="button" onClick={applyOmit}>Omit</button>
        </div>
      ) : null}
      {ready && omitted.some((iso) => days.includes(iso)) ? (
        <div className="activity-omitted">
          {weekdayNames.map((name, index) => {
            const matches = days.filter((iso) => weekdayIndex(iso) === index);
            const hidden = matches.filter((iso) => omitted.includes(iso));
            if (matches.length === 0 || hidden.length !== matches.length) return null;
            return <button key={name} type="button" onClick={() => restoreWeekday(index)}>All {name}s omitted · Restore</button>;
          })}
          {omitted.filter((iso) => days.includes(iso) && omitted.filter((item) => days.includes(item) && weekdayIndex(item) === weekdayIndex(iso)).length !== days.filter((item) => weekdayIndex(item) === weekdayIndex(iso)).length).map((iso) => (
            <button key={iso} type="button" onClick={() => setOmitted((current) => current.filter((item) => item !== iso))}>{activityDayLabel(iso)} · Restore</button>
          ))}
        </div>
      ) : null}
      {days.length > dayLimit ? <p className="activity-date-note">Choose 90 days or fewer so each day can have a time.</p> : null}
      {ready ? (
        <div className={showTimes ? "activity-time-list" : "activity-time-list is-hidden"}>
          {included.map((iso) => (
            <div key={iso} className="activity-day">
              <span>{activityDayLabel(iso)}</span>
              <input type="hidden" name="sessionDate" value={iso} />
              <label className="activity-slot">
                Start
                <input
                  type="time"
                  name="sessionStart"
                  aria-label={`Start time for ${activityDayLabel(iso)}`}
                  required={showTimes}
                  value={times[iso]?.start ?? ""}
                  onChange={(event) => setTimes((current) => ({ ...current, [iso]: { start: event.target.value, end: current[iso]?.end ?? "" } }))}
                />
              </label>
              <label className="activity-slot">
                End
                <input
                  type="time"
                  name="sessionEnd"
                  aria-label={`End time for ${activityDayLabel(iso)}`}
                  required={showTimes}
                  value={times[iso]?.end ?? ""}
                  onChange={(event) => setTimes((current) => ({ ...current, [iso]: { start: current[iso]?.start ?? "", end: event.target.value } }))}
                />
              </label>
            </div>
          ))}
        </div>
      ) : null}
      {ready ? (
        <>
          <input type="hidden" name="startsOn" value={start} />
          <input type="hidden" name="endsOn" value={end || start} />
        </>
      ) : null}
      {keepSaved ? (
        <>
          <input type="hidden" name="startsOn" value={startsOn} />
          <input type="hidden" name="endsOn" value={endsOn} />
          <input type="hidden" name="schedule" value={schedule} />
        </>
      ) : null}
      {(!ready && !keepSaved) || (ready && included.length === 0) || (ready && missingTime && !showTimes) ? (
        <input
          className="activity-date-required"
          required
          value=""
          aria-label="Date range"
          onChange={() => undefined}
          onInvalid={(event) => {
            const message = days.length > dayLimit
              ? "Choose 90 days or fewer."
              : ready && included.length === 0
                ? "Keep at least one day in the schedule."
                : ready && missingTime
                  ? "Set a time for each day, or omit the days you do not need."
                  : "Select a start date and an end date.";
            event.currentTarget.setCustomValidity(message);
            if (ready && missingTime) setShowTimes(true);
          }}
        />
      ) : null}
    </div>
  );
}
