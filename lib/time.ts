import { DAYS_PER_WEEK, MINUTE_MS, MINUTES_PER_DAY, type Interval } from "./types";

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

/** Instant of wall-clock `minutes` past midnight on `day` (0-6) of the week. */
export function instantAt(weekStart: Date, day: number, minutes: number): number {
  return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + day, 0, minutes).getTime();
}

/** Day index and wall-clock minutes of an instant inside the visible week, or null when outside it. */
export function dayMinutes(weekStart: Date, ms: number): { day: number; min: number } | null {
  const d = new Date(ms);
  const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  for (let day = 0; day < DAYS_PER_WEEK; day++) {
    if (addDays(weekStart, day).getTime() === midnight) return { day, min: d.getHours() * 60 + d.getMinutes() };
  }
  return null;
}

export type DayPart = { day: number; startMin: number; endMin: number };

/** The pieces of an interval that fall inside the week, one per local day, in wall-clock minutes. */
export function splitByDay(weekStart: Date, { start, end }: Interval): DayPart[] {
  const parts: DayPart[] = [];
  for (let day = 0; day < DAYS_PER_WEEK; day++) {
    const dayStart = instantAt(weekStart, day, 0);
    const dayEnd = instantAt(weekStart, day + 1, 0);
    if (end <= dayStart || start >= dayEnd) continue;
    const startMin = start <= dayStart ? 0 : dayMinutes(weekStart, start)!.min;
    const endMin = end >= dayEnd ? MINUTES_PER_DAY : dayMinutes(weekStart, end)!.min;
    if (startMin < endMin) parts.push({ day, startMin, endMin });
  }
  return parts;
}

export function isMinuteAligned(ms: number): boolean {
  return Number.isInteger(ms) && ms % MINUTE_MS === 0;
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

/** Gutter label for an hour 0-23: "12 AM", "1 PM". */
export function formatHour(hour: number): string {
  return `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? "AM" : "PM"}`;
}

/** "2:05 PM" style label for wall-clock minutes past midnight. */
export function formatMinutes(min: number): string {
  const hour = Math.floor(min / 60) % 24;
  const mm = String(min % 60).padStart(2, "0");
  return `${hour % 12 === 0 ? 12 : hour % 12}:${mm} ${hour < 12 ? "AM" : "PM"}`;
}

/** "Tue 2:00 – 3:30 PM" style label for an instant range within one day. */
export function formatRange(start: number, end: number): string {
  const s = new Date(start);
  const time = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const day = s.toLocaleDateString("en-US", { weekday: "short" });
  return `${day} ${time(s)} – ${time(new Date(end))}`;
}
