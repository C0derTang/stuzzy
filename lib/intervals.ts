import type { Interval } from "./types";

// Set algebra on half-open ranges. Used by the API (to store merged ranges) and by the client
// (optimistic updates), so both agree on the result of a patch.

/** Sorted, merged (touching ranges joined), empty ranges dropped. */
export function normalize(ranges: Interval[]): Interval[] {
  const sorted = ranges.filter((r) => r.end > r.start).sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r.start <= last.end) last.end = Math.max(last.end, r.end);
    else out.push({ ...r });
  }
  return out;
}

export function union(a: Interval[], b: Interval[]): Interval[] {
  return normalize([...a, ...b]);
}

/** Everything in `a` that is not covered by `b`. */
export function subtract(a: Interval[], b: Interval[]): Interval[] {
  const cuts = normalize(b);
  const out: Interval[] = [];
  for (const r of normalize(a)) {
    let start = r.start;
    for (const c of cuts) {
      if (c.end <= start) continue;
      if (c.start >= r.end) break;
      if (c.start > start) out.push({ start, end: c.start });
      start = Math.max(start, c.end);
      if (start >= r.end) break;
    }
    if (start < r.end) out.push({ start, end: r.end });
  }
  return out;
}

/** Applies a patch: (current ∪ add) − remove. */
export function applyPatch(current: Interval[], patch: { add: Interval[]; remove: Interval[] }): Interval[] {
  return subtract(union(current, patch.add), patch.remove);
}

/** Parts of `ranges` inside [from, to), clipped. */
export function clip(ranges: Interval[], from: number, to: number): Interval[] {
  const out: Interval[] = [];
  for (const r of ranges) {
    const start = Math.max(r.start, from);
    const end = Math.min(r.end, to);
    if (start < end) out.push({ start, end });
  }
  return out;
}

export function covers(ranges: Interval[], ms: number): boolean {
  return ranges.some((r) => r.start <= ms && ms < r.end);
}
