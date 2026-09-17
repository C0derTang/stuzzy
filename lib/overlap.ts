import type { Run } from "./types";

// STUB (Agent B).
/** Per-day runs of consecutive rows where the same non-empty set of `included` users is free. */
export function computeRuns(weekStart: Date, slots: Record<string, number[]>, included: Set<string>): Run[] {
  void weekStart;
  void slots;
  void included;
  return [];
}
