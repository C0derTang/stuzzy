import { describe, expect, it } from "vitest";
import { applyPatch, clip, covers, normalize, subtract, union } from "./intervals";

const r = (start: number, end: number) => ({ start, end });

describe("normalize", () => {
  it("sorts, merges overlapping and touching ranges, drops empty ones", () => {
    expect(normalize([r(5, 8), r(0, 2), r(2, 4), r(7, 10), r(12, 12)])).toEqual([r(0, 4), r(5, 10)]);
  });

  it("does not mutate its input", () => {
    const input = [r(0, 2), r(1, 3)];
    normalize(input);
    expect(input).toEqual([r(0, 2), r(1, 3)]);
  });
});

describe("union / subtract", () => {
  it("unions", () => {
    expect(union([r(0, 2)], [r(1, 5), r(8, 9)])).toEqual([r(0, 5), r(8, 9)]);
  });

  it("subtracts from the middle, edges, and across several ranges", () => {
    expect(subtract([r(0, 10)], [r(3, 4)])).toEqual([r(0, 3), r(4, 10)]);
    expect(subtract([r(0, 10)], [r(0, 3), r(8, 12)])).toEqual([r(3, 8)]);
    expect(subtract([r(0, 4), r(6, 10)], [r(2, 8)])).toEqual([r(0, 2), r(8, 10)]);
    expect(subtract([r(0, 4)], [r(0, 4)])).toEqual([]);
    expect(subtract([r(0, 4)], [r(4, 6)])).toEqual([r(0, 4)]);
    expect(subtract([], [r(0, 4)])).toEqual([]);
  });
});

describe("applyPatch / clip / covers", () => {
  it("adds then removes", () => {
    expect(applyPatch([r(0, 5)], { add: [r(5, 8)], remove: [r(2, 3)] })).toEqual([r(0, 2), r(3, 8)]);
  });

  it("clips to a window", () => {
    expect(clip([r(0, 5), r(8, 20), r(30, 40)], 4, 25)).toEqual([r(4, 5), r(8, 20)]);
  });

  it("tests membership with a half-open end", () => {
    expect(covers([r(0, 5)], 4)).toBe(true);
    expect(covers([r(0, 5)], 5)).toBe(false);
  });
});
