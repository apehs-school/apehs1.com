export const calendarColors = ["#1b6b4a", "#0d47a1", "#a6843d", "#146c8a", "#2e7d32", "#6a4c93", "#c45c26", "#0f6e56", "#8a3d55", "#3d6b2f"];

export type CalendarEntry = {
  id: string;
  title: string;
  details: string;
  start: string;
  end: string;
  color: string;
  kind: "Event" | "Club" | "Bulletin";
};

export function calendarColor(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) hash = (hash * 33 + id.charCodeAt(index)) >>> 0;
  return calendarColors[hash % calendarColors.length];
}
