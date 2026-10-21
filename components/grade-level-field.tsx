"use client";

import { useState } from "react";
import { adminSelectClass } from "@/components/admin-field";

const grades = Array.from({ length: 12 }, (_, index) => String(index + 1));

function readRange(value?: string) {
  const match = value?.match(/^(\d+)\s+to\s+(\d+)$/);
  if (match) return { from: match[1], to: match[2], range: true };
  return { from: value && (grades.includes(value) || value === "All grades") ? value : "", to: "", range: false };
}

export function GradeLevelField({ defaultValue }: { defaultValue?: string }) {
  const initial = readRange(defaultValue);
  const [range, setRange] = useState(initial.range);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const selectClass = `${adminSelectClass} h-11 min-w-0 flex-1 text-base`;
  const choices = range ? grades : [...grades, "All grades"];

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[#0b1f3a]">Grade level</span>
        <label className="flex items-center gap-2 text-sm font-medium text-[#0b1f3a]">
          <input
            type="checkbox"
            className="size-4 accent-[#0d47a1]"
            checked={range}
            onChange={(event) => {
              const checked = event.target.checked;
              setRange(checked);
              if (checked && !grades.includes(from)) setFrom("");
            }}
          />
          Grade to grade
        </label>
      </div>
      <div className="flex items-center gap-2">
        <select name="grade" className={selectClass} value={from} required onChange={(event) => setFrom(event.target.value)}>
          <option value="" disabled>Grade</option>
          {choices.map((grade) => (
            <option key={grade} value={grade}>{grade}</option>
          ))}
        </select>
        {range ? (
          <>
            <span className="shrink-0 text-sm font-medium text-[#0b1f3a]">to</span>
            <select name="gradeTo" className={selectClass} value={to} required onChange={(event) => setTo(event.target.value)}>
              <option value="" disabled>Grade</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </>
        ) : null}
      </div>
    </div>
  );
}
