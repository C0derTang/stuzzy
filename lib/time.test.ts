import { describe, expect, it } from "vitest";
import {
  addWeeks,
  dayMinutes,
  formatHour,
  formatMinutes,
  formatWeekLabel,
  instantAt,
  isMinuteAligned,
  splitByDay,
  startOfWeek,
  weekRange,
} from "./time";
import { MINUTE_MS } from "./types";

// vitest.config.ts pins TZ=America/Los_Angeles so DST cases are deterministic.
const H = 3600_000;

describe("week math", () => {
  it("starts weeks on local Sunday midnight", () => {
    const ws = startOfWeek(new Date(2026, 8, 16, 22, 15)); // Wed Sep 16 2026
    expect([ws.getFullYear(), ws.getMonth(), ws.getDate(), ws.getHours()]).toEqual([2026, 8, 13, 0]);
  });

  it("moves by calendar weeks across a DST change", () => {
    const ws = startOfWeek(new Date(2026, 9, 28));
    const next = addWeeks(ws, 1); // week containing Nov 1 fall-back
    expect([next.getDate(), next.getHours()]).toEqual([1, 0]);
    const { from, to } = weekRange(next);
    expect(to - from).toBe(7 * 24 * H + H); // 25-hour day inside
  });

  it("labels", () => {
    expect(formatWeekLabel(new Date(2026, 8, 13))).toBe("Sep 13 – 19, 2026");
    expect(formatWeekLabel(new Date(2026, 8, 27))).toBe("Sep 27 – Oct 3, 2026");
    expect(formatWeekLabel(new Date(2026, 11, 27))).toBe("Dec 27, 2026 – Jan 2, 2027");
    expect([0, 1, 12, 23].map(formatHour)).toEqual(["12 AM", "1 AM", "12 PM", "11 PM"]);
    expect([0, 65, 12 * 60 + 5, 23 * 60 + 59].map(formatMinutes)).toEqual(["12:00 AM", "1:05 AM", "12:05 PM", "11:59 PM"]);
  });
});

describe("instants and minutes", () => {
  const ws = new Date(2026, 8, 13);

  it("round-trips minutes on a normal week", () => {
    for (const [day, min] of [
      [0, 0],
      [3, 14 * 60 + 17],
      [6, 23 * 60 + 59],
    ]) {
      const ms = instantAt(ws, day, min);
      expect(isMinuteAligned(ms)).toBe(true);
      expect(dayMinutes(ws, ms)).toEqual({ day, min });
    }
    expect(dayMinutes(ws, ws.getTime() - MINUTE_MS)).toBeNull();
    expect(dayMinutes(ws, addWeeks(ws, 1).getTime())).toBeNull();
  });

  it("splits an interval by local day and clips to the week", () => {
    const start = instantAt(ws, 1, 22 * 60); // Mon 10 PM
    const end = instantAt(ws, 3, 90); // Wed 1:30 AM
    expect(splitByDay(ws, { start, end })).toEqual([
      { day: 1, startMin: 22 * 60, endMin: 1440 },
      { day: 2, startMin: 0, endMin: 1440 },
      { day: 3, startMin: 0, endMin: 90 },
    ]);
    expect(splitByDay(ws, { start: ws.getTime() - H, end: instantAt(ws, 0, 30) })).toEqual([{ day: 0, startMin: 0, endMin: 30 }]);
    expect(splitByDay(ws, { start: addWeeks(ws, 1).getTime(), end: addWeeks(ws, 1).getTime() + H })).toEqual([]);
  });

  it("keeps wall-clock minutes across the fall-back day (Nov 1 2026)", () => {
    const fall = new Date(2026, 10, 1);
    const eight = instantAt(fall, 0, 8 * 60);
    expect(eight - fall.getTime()).toBe(9 * H); // 25-hour day: 8 AM is 9 real hours after midnight
    expect(dayMinutes(fall, eight)).toEqual({ day: 0, min: 8 * 60 });
    expect(splitByDay(fall, { start: fall.getTime(), end: instantAt(fall, 1, 0) })).toEqual([{ day: 0, startMin: 0, endMin: 1440 }]);
  });

  it("maps the skipped hour forward on spring-forward (Mar 8 2026)", () => {
    const spring = new Date(2026, 2, 8);
    expect(instantAt(spring, 0, 2 * 60 + 30)).toBe(instantAt(spring, 0, 3 * 60 + 30));
    expect(dayMinutes(spring, instantAt(spring, 0, 2 * 60))).toEqual({ day: 0, min: 3 * 60 });
  });

  it("checks minute alignment", () => {
    expect(isMinuteAligned(MINUTE_MS * 7)).toBe(true);
    expect(isMinuteAligned(MINUTE_MS * 7 + 1)).toBe(false);
  });
});
