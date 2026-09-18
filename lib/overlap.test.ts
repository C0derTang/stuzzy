import { describe, expect, it } from "vitest";
import { computeRuns } from "./overlap";
import { instantAt } from "./time";
import { MINUTE_MS, MINUTES_PER_DAY, type Interval } from "./types";

const ws = new Date(2026, 8, 13); // Sun Sep 13 2026, no DST change
const span = (day: number, startMin: number, endMin: number): Interval => ({
  start: instantAt(ws, day, startMin),
  end: instantAt(ws, day, endMin),
});

describe("computeRuns", () => {
  it("returns nothing for empty input", () => {
    expect(computeRuns(ws, {}, new Set())).toEqual([]);
    expect(computeRuns(ws, { a: [] }, new Set(["a"]))).toEqual([]);
    expect(computeRuns(ws, {}, new Set(["a"]))).toEqual([]);
    expect(computeRuns(ws, { a: [span(1, 540, 600)] }, new Set())).toEqual([]);
  });

  it("merges one user's touching and overlapping pieces", () => {
    const a = [span(1, 540, 600), span(1, 600, 630), span(1, 615, 660), span(1, 900, 930)];
    expect(computeRuns(ws, { a }, new Set(["a"]))).toEqual([
      { day: 1, startMin: 540, endMin: 660, free: ["a"] },
      { day: 1, startMin: 900, endMin: 930, free: ["a"] },
    ]);
  });

  it("splits at odd minutes when the free set changes and keeps ids sorted", () => {
    // b: 9:00–11:00, a: 9:05–10:40
    const intervals = { b: [span(2, 540, 660)], a: [span(2, 545, 640)] };
    expect(computeRuns(ws, intervals, new Set(["b", "a"]))).toEqual([
      { day: 2, startMin: 540, endMin: 545, free: ["b"] },
      { day: 2, startMin: 545, endMin: 640, free: ["a", "b"] },
      { day: 2, startMin: 640, endMin: 660, free: ["b"] },
    ]);
  });

  it("does not split when the set stays the same across a boundary", () => {
    const intervals = { a: [span(0, 60, 120), span(0, 120, 180)], b: [span(0, 60, 180)] };
    expect(computeRuns(ws, intervals, new Set(["a", "b"]))).toEqual([
      { day: 0, startMin: 60, endMin: 180, free: ["a", "b"] },
    ]);
  });

  it("ignores users that are not included", () => {
    const intervals = { a: [span(0, 120, 180)], b: [span(0, 150, 200)] };
    expect(computeRuns(ws, intervals, new Set(["a"]))).toEqual([{ day: 0, startMin: 120, endMin: 180, free: ["a"] }]);
  });

  it("ignores intervals outside the week and clips those crossing its edges", () => {
    const before = { start: ws.getTime() - 60 * MINUTE_MS, end: ws.getTime() - MINUTE_MS };
    const after = { start: instantAt(ws, 7, 0), end: instantAt(ws, 7, 30) };
    const crossingEnd = { start: instantAt(ws, 6, 1410), end: instantAt(ws, 7, 20) };
    expect(computeRuns(ws, { a: [before, crossingEnd, after] }, new Set(["a"]))).toEqual([
      { day: 6, startMin: 1410, endMin: MINUTES_PER_DAY, free: ["a"] },
    ]);
  });

  it("never crosses midnight and sorts by day then start", () => {
    const intervals = { a: [span(3, 1380, 1440 + 90)], b: [span(3, 60, 75)] };
    expect(computeRuns(ws, intervals, new Set(["a", "b"]))).toEqual([
      { day: 3, startMin: 60, endMin: 75, free: ["b"] },
      { day: 3, startMin: 1380, endMin: MINUTES_PER_DAY, free: ["a"] },
      { day: 4, startMin: 0, endMin: 90, free: ["a"] },
    ]);
  });

  it("keeps wall-clock minutes 0–1440 across DST changes", () => {
    const fallBack = new Date(2026, 10, 1); // Sun Nov 1 2026: 25-hour day
    const springForward = new Date(2026, 2, 8); // Sun Mar 8 2026: 23-hour day
    for (const week of [fallBack, springForward]) {
      const wholeDay = { start: instantAt(week, 0, 0), end: instantAt(week, 1, 0) };
      const afternoon = { start: instantAt(week, 0, 13 * 60 + 5), end: instantAt(week, 0, 15 * 60 + 50) };
      expect(computeRuns(week, { a: [wholeDay], b: [afternoon] }, new Set(["a", "b"]))).toEqual([
        { day: 0, startMin: 0, endMin: 785, free: ["a"] },
        { day: 0, startMin: 785, endMin: 950, free: ["a", "b"] },
        { day: 0, startMin: 950, endMin: MINUTES_PER_DAY, free: ["a"] },
      ]);
    }
  });
});
