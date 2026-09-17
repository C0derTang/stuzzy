import type { BestTime, Run } from "./types";

// STUB (Agent C).
/**
 * Top meeting windows of the visible week: at least one hour, at least two people free,
 * not already over at `now`. Ranked by people free (desc), length (desc), start (asc).
 */
export function bestTimes(runs: Run[], weekStart: Date, now: number, limit = 5): BestTime[] {
  void runs;
  void weekStart;
  void now;
  void limit;
  return [];
}
