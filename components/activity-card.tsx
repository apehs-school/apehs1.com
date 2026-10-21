"use client";

import { Dialog, DialogBackdrop, DialogClose, DialogPopup, DialogPortal, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, MapPin, Shirt, UserRound, Wallet } from "lucide-react";
import { useState } from "react";

const weekdayTones = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function sessions(schedule: string) {
  return schedule.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function splitSession(line: string) {
  const divider = line.indexOf(" · ");
  if (divider === -1) return { when: line, time: "" };
  return { when: line.slice(0, divider), time: line.slice(divider + 3) };
}

function dayTone(when: string) {
  return weekdayTones.find((day) => when.toLowerCase().includes(day)) ?? "day";
}

function SessionList({ lines }: { lines: string[] }) {
  return (
    <ol className="activity-sessions">
      {lines.map((line, index) => {
        const session = splitSession(line);
        return (
          <li key={`${line}-${index}`} data-day={dayTone(session.when)}>
            <span>{session.when}</span>
            {session.time ? <time>{session.time}</time> : null}
          </li>
        );
      })}
    </ol>
  );
}

export type ActivityInfo = {
  id: string;
  name: string;
  period: string;
  schedule: string;
  venue: string;
  lead: string;
  cost: string;
  attire: string;
  note: string;
};

export function ActivityBoard({ items }: { items: ActivityInfo[] }) {
  const [selected, setSelected] = useState<string | null>(items[0]?.id ?? null);
  const current = items.find((item) => item.id === selected) ?? null;

  return (
    <div className="activity-layout">
      <aside className="activity-side">
        <strong>Activities</strong>
        <nav aria-label="Activities">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="activity-open"
              aria-pressed={item.id === selected}
              onClick={() => setSelected((currentId) => (currentId === item.id ? null : item.id))}
            >
              {item.name}
            </button>
          ))}
        </nav>
      </aside>
      {current ? <ActivityDetail item={current} /> : null}
    </div>
  );
}

function ActivityDetail({ item }: { item: ActivityInfo }) {
  const { name, period, schedule, venue, lead, cost, attire, note } = item;
  const lines = sessions(schedule);
  const preview = lines.slice(0, 7);

  return (
    <article className="activity-card">
      <header>
        <p className="activity-kicker">Extracurricular</p>
        <h2>{name}</h2>
      </header>
      {period ? (
        <p className="activity-period">
          <span>Dates</span>
          {period}
        </p>
      ) : null}
      {lines.length > 0 ? (
        <div className="activity-schedule">
          <p><Clock aria-hidden="true" />Schedule</p>
          <SessionList lines={preview} />
          {lines.length > 7 ? (
            <Dialog>
              <DialogTrigger className="activity-more">See more</DialogTrigger>
              <DialogPortal>
                <DialogBackdrop />
                <DialogPopup className="activity-sheet">
                  <p className="activity-kicker">Full schedule</p>
                  <DialogTitle>{name}</DialogTitle>
                  {period ? <p className="activity-period">{period}</p> : null}
                  <SessionList lines={lines} />
                  <DialogClose className="activity-close">Close</DialogClose>
                </DialogPopup>
              </DialogPortal>
            </Dialog>
          ) : null}
        </div>
      ) : null}
      <dl className="activity-facts">
        {venue ? <div data-tone="place"><dt><MapPin aria-hidden="true" />Venue</dt><dd>{venue}</dd></div> : null}
        {lead ? <div data-tone="staff"><dt><UserRound aria-hidden="true" />Staff</dt><dd>{lead}</dd></div> : null}
        {cost ? <div data-tone="cost"><dt><Wallet aria-hidden="true" />Cost</dt><dd>{cost}</dd></div> : null}
        {attire ? <div data-tone="attire"><dt><Shirt aria-hidden="true" />Attire</dt><dd>{attire}</dd></div> : null}
      </dl>
      {note ? <p className="activity-note">{note}</p> : null}
    </article>
  );
}
