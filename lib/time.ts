import { DAYS_PER_WEEK, SLOT_MS } from "./types";

// All calendar math goes through local-time Date constructors and setDate so that
// 23- and 25-hour DST days stay correct. Never add milliseconds to move between days.

/** Local midnight of the Sunday on or before `date`. */
export function startOfWeek(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function addWeeks(weekStart: Date, weeks: number): Date {
  return addDays(weekStart, weeks * DAYS_PER_WEEK);
}

/** The seven local-midnight dates of the week. */
export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: DAYS_PER_WEEK }, (_, i) => addDays(weekStart, i));
}

/** Half-open [from, to) instant range covering the week, for the API query. */
export function weekRange(weekStart: Date): { from: number; to: number } {
  return { from: weekStart.getTime(), to: addWeeks(weekStart, 1).getTime() };
}

/**
 * Instant of grid cell (`day`, `row`), or null when that wall-clock time does not exist
 * (the skipped hour on a spring-forward day). Such cells are inert.
 */
export function cellToInstant(weekStart: Date, day: number, row: number): number | null {
  const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + day, 0, 30 * row);
  if (d.getHours() * 2 + d.getMinutes() / 30 !== row) return null;
  return d.getTime();
}

/**
 * Grid cell of an instant within the visible week, or null when it is outside the week or
 * not reachable from the grid (the repeated hour on a fall-back day).
 */
export function instantToCell(weekStart: Date, ms: number): { day: number; row: number } | null {
  const d = new Date(ms);
  const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  for (let day = 0; day < DAYS_PER_WEEK; day++) {
    if (addDays(weekStart, day).getTime() !== midnight.getTime()) continue;
    const row = d.getHours() * 2 + Math.floor(d.getMinutes() / 30);
    return cellToInstant(weekStart, day, row) === ms ? { day, row } : null;
  }
  return null;
}

export function isAligned(ms: number): boolean {
  return Number.isInteger(ms) && ms % SLOT_MS === 0;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Sep 13 – 19, 2026" / "Sep 27 – Oct 3, 2026" / "Dec 27, 2026 – Jan 2, 2027" */
export function formatWeekLabel(weekStart: Date): string {
  const end = addDays(weekStart, DAYS_PER_WEEK - 1);
  const month = (d: Date) => d.toLocaleDateString("en-US", { month: "short" });
  if (weekStart.getFullYear() !== end.getFullYear()) {
    return `${month(weekStart)} ${weekStart.getDate()}, ${weekStart.getFullYear()} – ${month(end)} ${end.getDate()}, ${end.getFullYear()}`;
  }
  const tail = weekStart.getMonth() === end.getMonth() ? `${end.getDate()}` : `${month(end)} ${end.getDate()}`;
  return `${month(weekStart)} ${weekStart.getDate()} – ${tail}, ${end.getFullYear()}`;
}

/** Row label for the time gutter: "12 AM", "1 PM". Meant for even (on-the-hour) rows. */
export function formatRow(row: number): string {
  const hour = Math.floor(row / 2) % 24;
  const minutes = row % 2 ? ":30" : "";
  return `${hour % 12 === 0 ? 12 : hour % 12}${minutes} ${hour < 12 ? "AM" : "PM"}`;
}

/** "Tue 2:00 – 3:30 PM" style label for an instant range within one day. */
export function formatRange(start: number, end: number): string {
  const s = new Date(start);
  const time = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const day = s.toLocaleDateString("en-US", { weekday: "short" });
  return `${day} ${time(s)} – ${time(new Date(end))}`;
}
