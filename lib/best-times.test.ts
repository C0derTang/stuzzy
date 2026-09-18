import { describe, expect, it } from "vitest";
import { bestTimes } from "./best-times";
import type { Run } from "./types";

const weekStart = new Date(2026, 8, 13); // Sunday
const at = (day: number, hour: number, minute = 0) => new Date(2026, 8, 13 + day, hour, minute).getTime();
/** Wall-clock minutes past midnight. */
const m = (hour: number, minute = 0) => hour * 60 + minute;
const run = (day: number, startMin: number, endMin: number, free: string[]): Run => ({ day, startMin, endMin, free });
const PAST = 0;

describe("bestTimes", () => {
  it("returns nothing for no runs", () => {
    expect(bestTimes([], weekStart, PAST)).toEqual([]);
  });

  it("excludes single-person runs", () => {
    expect(bestTimes([run(1, m(10), m(14), ["a"])], weekStart, PAST)).toEqual([]);
  });

  it("excludes windows shorter than an hour", () => {
    expect(bestTimes([run(1, m(10), m(10, 59), ["a", "b"])], weekStart, PAST)).toEqual([]);
    expect(bestTimes([run(1, m(10), m(11), ["a", "b"])], weekStart, PAST)).toHaveLength(1);
  });

  it("converts minutes to instants, keeping odd minutes", () => {
    expect(bestTimes([run(2, m(9, 5), m(10, 37), ["a", "b"])], weekStart, PAST)).toEqual([
      { start: at(2, 9, 5), end: at(2, 10, 37), free: ["a", "b"] },
    ]);
  });

  it("ends at the next midnight when the window reaches the end of the day", () => {
    expect(bestTimes([run(0, m(22), 1440, ["a", "b"])], weekStart, PAST)).toEqual([
      { start: at(0, 22), end: at(1, 0), free: ["a", "b"] },
    ]);
  });

  it("extends a seed through touching superset neighbors, in both directions", () => {
    const runs = [
      run(1, m(9), m(10), ["a", "b", "c"]),
      run(1, m(10), m(10, 30), ["a", "b"]),
      run(1, m(10, 30), m(12), ["a", "b", "c"]),
      run(1, m(12), m(13), ["a"]),
    ];
    expect(bestTimes(runs, weekStart, PAST)).toEqual([
      { start: at(1, 10, 30), end: at(1, 12), free: ["a", "b", "c"] },
      { start: at(1, 9), end: at(1, 10), free: ["a", "b", "c"] },
      { start: at(1, 9), end: at(1, 12), free: ["a", "b"] },
    ]);
  });

  it("extends through neighbors that touch at odd minutes", () => {
    const runs = [run(4, m(9, 5), m(9, 47), ["a", "b"]), run(4, m(9, 47), m(10, 12), ["a", "b", "c"])];
    expect(bestTimes(runs, weekStart, PAST)).toEqual([{ start: at(4, 9, 5), end: at(4, 10, 12), free: ["a", "b"] }]);
  });

  it("does not extend across a gap or into another day", () => {
    const runs = [
      run(1, m(9), m(9, 30), ["a", "b"]),
      run(1, m(9, 31), m(10, 1), ["a", "b"]),
      run(2, m(9, 30), m(10), ["a", "b"]),
    ];
    expect(bestTimes(runs, weekStart, PAST)).toEqual([]);
  });

  it("reports one window per stretch, however many seeds reach it", () => {
    const runs = [run(3, m(10), m(11), ["a", "b"]), run(3, m(11), m(11, 30), ["a", "b", "c"]), run(3, m(11, 30), m(13), ["a", "b"])];
    expect(bestTimes(runs, weekStart, PAST)).toEqual([{ start: at(3, 10), end: at(3, 13), free: ["a", "b"] }]);
  });

  it("keeps a bigger group's window inside a longer, smaller group's window", () => {
    const runs = [run(3, m(10), m(11), ["a", "b"]), run(3, m(11), m(13), ["a", "b", "c"])];
    expect(bestTimes(runs, weekStart, PAST)).toEqual([
      { start: at(3, 11), end: at(3, 13), free: ["a", "b", "c"] },
      { start: at(3, 10), end: at(3, 13), free: ["a", "b"] },
    ]);
  });

  it("drops windows that are already over, keeps ones in progress", () => {
    const runs = [run(1, m(9), m(10), ["a", "b"]), run(1, m(14), m(16), ["a", "b"])];
    expect(bestTimes(runs, weekStart, at(1, 10))).toEqual([{ start: at(1, 14), end: at(1, 16), free: ["a", "b"] }]);
    expect(bestTimes(runs, weekStart, at(1, 15))).toHaveLength(1);
    expect(bestTimes(runs, weekStart, at(1, 16))).toEqual([]);
  });

  it("ranks by people, then length, then start", () => {
    const runs = [
      run(0, m(10), m(11), ["a", "b"]),
      run(1, m(10), m(13), ["a", "b"]),
      run(2, m(10), m(11), ["a", "b", "c"]),
      run(3, m(10), m(11), ["a", "b"]),
    ];
    expect(bestTimes(runs, weekStart, PAST).map((w) => w.start)).toEqual([at(2, 10), at(1, 10), at(0, 10), at(3, 10)]);
  });

  it("respects the limit", () => {
    const runs = Array.from({ length: 7 }, (_, day) => run(day, m(10), m(12), ["a", "b"]));
    expect(bestTimes(runs, weekStart, PAST)).toHaveLength(5);
    expect(bestTimes(runs, weekStart, PAST, 2).map((w) => w.start)).toEqual([at(0, 10), at(1, 10)]);
  });
});
