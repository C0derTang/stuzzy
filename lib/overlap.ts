import { splitByDay } from "./time";
import { DAYS_PER_WEEK, type Interval, type Run } from "./types";

// Boundary sweep per day: between two consecutive boundary minutes the set of free people is
// constant, so each such stretch is a run; touching runs with the same set are merged.

type Edge = { min: number; id: string; delta: 1 | -1 };

/** Per-day runs of minutes where the same non-empty set of `included` users is free. */
export function computeRuns(weekStart: Date, intervals: Record<string, Interval[]>, included: Set<string>): Run[] {
  const edges: Edge[][] = Array.from({ length: DAYS_PER_WEEK }, () => []);
  for (const id of included) {
    for (const interval of intervals[id] ?? []) {
      for (const { day, startMin, endMin } of splitByDay(weekStart, interval)) {
        edges[day].push({ min: startMin, id, delta: 1 }, { min: endMin, id, delta: -1 });
      }
    }
  }

  const runs: Run[] = [];
  for (let day = 0; day < DAYS_PER_WEEK; day++) {
    const dayEdges = edges[day].sort((a, b) => a.min - b.min);
    // Counts, not a set: one user's pieces may overlap or touch (e.g. an unmerged input).
    const active = new Map<string, number>();
    let from = 0;
    for (let i = 0; i < dayEdges.length; i++) {
      const { min } = dayEdges[i];
      if (min > from && active.size > 0) {
        const free = [...active.keys()].sort();
        const prev = runs[runs.length - 1];
        if (prev && prev.day === day && prev.endMin === from && sameIds(prev.free, free)) prev.endMin = min;
        else runs.push({ day, startMin: from, endMin: min, free });
      }
      // Apply every edge at this minute before looking at the next stretch.
      for (; i < dayEdges.length && dayEdges[i].min === min; i++) {
        const { id, delta } = dayEdges[i];
        const n = (active.get(id) ?? 0) + delta;
        if (n > 0) active.set(id, n);
        else active.delete(id);
      }
      i--;
      from = min;
    }
  }
  return runs;
}

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}
