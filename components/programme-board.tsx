"use client";

import { useState } from "react";

const pageSize = 6;

function gradeLabel(value: string) {
  if (value === "All grades") return value;
  if (/^\d+$/.test(value)) return `Grade ${value}`;
  const range = value.match(/^(\d+) to (\d+)$/);
  return range ? `Grade ${range[1]} to ${range[2]}` : value;
}

export function ProgrammeBoard({ entries }: { entries: { id: string; title: string; body: string }[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const needle = query.trim().toLowerCase();
  const filtered = entries.filter((entry) => {
    if (!needle) return true;
    return entry.title.toLowerCase().includes(needle) || gradeLabel(entry.body).toLowerCase().includes(needle);
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const start = (current - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);
  const from = filtered.length === 0 ? 0 : start + 1;
  const to = Math.min(start + pageSize, filtered.length);

  return (
    <section className="program-board" aria-label="Academic programme">
      <div className="program-head">
        <span>Subject</span>
        <span>Grade level</span>
      </div>
      <form className="program-search" onSubmit={(event) => event.preventDefault()}>
        <label>
          Search
          <input
            type="search"
            value={query}
            placeholder="Search subject or grade"
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </label>
      </form>
      <ul className="program-list">
        {rows.length === 0 ? (
          <li className="program-empty">No subjects match that search.</li>
        ) : rows.map((entry, index) => (
          <li key={entry.id} style={{ animationDelay: `${index * 70}ms` }}>
            <strong>{entry.title}</strong>
            <span>{gradeLabel(entry.body)}</span>
          </li>
        ))}
      </ul>
      <div className="program-pager">
        <p>{filtered.length === 0 ? "0 subjects" : `${from}–${to} of ${filtered.length}`}</p>
        <div>
          <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)}>Previous</button>
          <span>{current} / {pages}</span>
          <button type="button" disabled={current >= pages} onClick={() => setPage(current + 1)}>Next</button>
        </div>
      </div>
    </section>
  );
}
