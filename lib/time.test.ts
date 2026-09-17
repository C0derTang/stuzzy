import { describe, expect, it } from "vitest";
import { addWeeks, cellToInstant, formatRow, formatWeekLabel, instantToCell, isAligned, startOfWeek, weekRange } from "./time";
import { SLOT_MS } from "./types";

// vitest.config.ts pins TZ=America/Los_Angeles so DST cases are deterministic.

describe("week math", () => {
  it("starts weeks on local Sunday midnight", () => {
    const ws = startOfWeek(new Date(2026, 8, 16, 22, 15)); // Wed Sep 16 2026
    expect([ws.getFullYear(), ws.getMonth(), ws.getDate(), ws.getHours()]).toEqual([2026, 8, 13, 0]);
  });

  it("moves by calendar weeks across a DST change", () => {
    const ws = startOfWeek(new Date(2026, 9, 28)); // week containing Nov 1 fall-back
    const next = addWeeks(ws, 1);
    expect(next.getHours()).toBe(0);
    expect(next.getDate()).toBe(1);
    const { from, to } = weekRange(next);
    expect(to - from).toBe(7 * 24 * 3600_000 + 3600_000); // 25-hour day inside
  });

  it("labels weeks", () => {
    expect(formatWeekLabel(new Date(2026, 8, 13))).toBe("Sep 13 – 19, 2026");
    expect(formatWeekLabel(new Date(2026, 8, 27))).toBe("Sep 27 – Oct 3, 2026");
    expect(formatWeekLabel(new Date(2026, 11, 27))).toBe("Dec 27, 2026 – Jan 2, 2027");
  });

  it("labels rows", () => {
    expect([0, 2, 24, 27, 46].map(formatRow)).toEqual(["12 AM", "1 AM", "12 PM", "1:30 PM", "11 PM"]);
  });
});

describe("cells and instants", () => {
  const ws = new Date(2026, 8, 13);

  it("round-trips every cell of a normal week", () => {
    for (let day = 0; day < 7; day++) {
      for (let row = 0; row < 48; row++) {
        const ms = cellToInstant(ws, day, row)!;
        expect(isAligned(ms)).toBe(true);
        expect(instantToCell(ws, ms)).toEqual({ day, row });
      }
    }
  });

  it("returns null outside the week", () => {
    expect(instantToCell(ws, ws.getTime() - SLOT_MS)).toBeNull();
    expect(instantToCell(ws, addWeeks(ws, 1).getTime())).toBeNull();
  });

  it("makes the skipped hour inert on spring-forward (Mar 8 2026)", () => {
    const spring = new Date(2026, 2, 8);
    expect(cellToInstant(spring, 0, 4)).toBeNull(); // 2:00
    expect(cellToInstant(spring, 0, 5)).toBeNull(); // 2:30
    const three = cellToInstant(spring, 0, 6)!;
    expect(three - cellToInstant(spring, 0, 3)!).toBe(SLOT_MS); // 1:30 -> 3:00 is one slot
    expect(instantToCell(spring, three)).toEqual({ day: 0, row: 6 });
  });

  it("maps the repeated hour once on fall-back (Nov 1 2026)", () => {
    const fall = new Date(2026, 10, 1);
    const first1am = cellToInstant(fall, 0, 2)!;
    expect(instantToCell(fall, first1am)).toEqual({ day: 0, row: 2 });
    expect(instantToCell(fall, first1am + 2 * SLOT_MS)).toBeNull(); // second 1:00 is unreachable
    expect(cellToInstant(fall, 0, 4)! - first1am).toBe(4 * SLOT_MS); // 2:00 is two real hours later
  });

  it("checks slot alignment", () => {
    expect(isAligned(1_800_000 * 7)).toBe(true);
    expect(isAligned(1_800_000 * 7 + 1)).toBe(false);
    expect(isAligned(1.5)).toBe(false);
  });
});
