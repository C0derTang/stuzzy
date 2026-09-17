import { describe, expect, it } from "vitest";
import { computeRuns } from "./overlap";
import { cellToInstant } from "./time";
import { SLOT_MS } from "./types";

const ws = new Date(2026, 8, 13); // Sun Sep 13 2026, no DST change
const at = (day: number, ...rows: number[]) => rows.map((row) => cellToInstant(ws, day, row)!);

describe("computeRuns", () => {
  it("returns nothing for empty input", () => {
    expect(computeRuns(ws, {}, new Set())).toEqual([]);
    expect(computeRuns(ws, { a: [] }, new Set(["a"]))).toEqual([]);
    expect(computeRuns(ws, {}, new Set(["a"]))).toEqual([]);
  });

  it("merges one user's contiguous slots", () => {
    const runs = computeRuns(ws, { a: at(1, 18, 19, 20, 30) }, new Set(["a"]));
    expect(runs).toEqual([
      { day: 1, startRow: 18, endRow: 21, free: ["a"] },
      { day: 1, startRow: 30, endRow: 31, free: ["a"] },
    ]);
  });

  it("splits when the free set changes and keeps ids sorted", () => {
    const slots = { b: at(2, 10, 11, 12, 13), a: at(2, 12, 13, 14) };
    expect(computeRuns(ws, slots, new Set(["b", "a"]))).toEqual([
      { day: 2, startRow: 10, endRow: 12, free: ["b"] },
      { day: 2, startRow: 12, endRow: 14, free: ["a", "b"] },
      { day: 2, startRow: 14, endRow: 15, free: ["a"] },
    ]);
  });

  it("ignores users that are not included", () => {
    const slots = { a: at(0, 4, 5), b: at(0, 5, 6) };
    expect(computeRuns(ws, slots, new Set(["a"]))).toEqual([{ day: 0, startRow: 4, endRow: 6, free: ["a"] }]);
  });

  it("ignores slots outside the week", () => {
    const slots = { a: [ws.getTime() - SLOT_MS, ...at(6, 47), cellToInstant(ws, 7, 0)!] };
    expect(computeRuns(ws, slots, new Set(["a"]))).toEqual([{ day: 6, startRow: 47, endRow: 48, free: ["a"] }]);
  });

  it("never merges across days and sorts by day then row", () => {
    const slots = { a: [...at(3, 46, 47), ...at(4, 0, 1)], b: at(3, 2) };
    expect(computeRuns(ws, slots, new Set(["a", "b"]))).toEqual([
      { day: 3, startRow: 2, endRow: 3, free: ["b"] },
      { day: 3, startRow: 46, endRow: 48, free: ["a"] },
      { day: 4, startRow: 0, endRow: 2, free: ["a"] },
    ]);
  });
});
