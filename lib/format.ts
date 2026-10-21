export function jamaicaDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatChatTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-JM", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Jamaica",
  }).format(new Date(value));
}

export function formatPublished(value: Date | string) {
  return new Intl.DateTimeFormat("en-JM", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Jamaica",
  }).format(new Date(value));
}

export function eachIsoDate(start: string, end: string) {
  const from = /^(\d{4})-(\d{2})-(\d{2})$/.exec(start);
  const to = /^(\d{4})-(\d{2})-(\d{2})$/.exec(end);
  if (!from || !to) return [];
  const cursor = new Date(Number(from[1]), Number(from[2]) - 1, Number(from[3]));
  const last = new Date(Number(to[1]), Number(to[2]) - 1, Number(to[3]));
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(last.getTime()) || last < cursor) return [];
  const dates: string[] = [];
  while (cursor <= last && dates.length < 400) {
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");
    dates.push(`${cursor.getFullYear()}-${month}-${day}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function activityDayLabel(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const numeric = new Intl.DateTimeFormat("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" }).format(date);
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  return `${numeric} ${weekday}`;
}

export function formatActivityTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return "";
  const hour24 = Number(match[1]);
  if (hour24 > 23) return "";
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour = hour24 % 12 || 12;
  return `${hour}:${match[2]} ${period}`;
}

export function parseActivityTimes(schedule: string, iso: string) {
  const line = schedule.split(/\r?\n/).find((item) => item.startsWith(`${activityDayLabel(iso)} · `));
  const matches = [...(line ?? "").matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi)];
  const value = (match: RegExpMatchArray) => {
    let hour = Number(match[1]) % 12;
    if (/pm/i.test(match[3])) hour += 12;
    return `${String(hour).padStart(2, "0")}:${match[2]}`;
  };
  return { start: matches[0] ? value(matches[0]) : "", end: matches[1] ? value(matches[1]) : "" };
}

export function formatShortDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-JM", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function shortSchedule(schedule: string) {
  const lines = schedule.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return "";
  const first = lines[0];
  if (lines.length === 1) return first;
  return `${first} · +${lines.length - 1} more`;
}

export function formatLongDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-JM", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatJmd(cents: number) {
  return new Intl.NumberFormat("en-JM", {
    style: "currency",
    currency: "JMD",
  }).format(cents / 100);
}

export function dollarsToCents(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}
