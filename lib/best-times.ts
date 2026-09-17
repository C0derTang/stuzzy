import { cellToInstant } from "./time";
import { SLOT_MS, type BestTime, type Run } from "./types";

const MIN_ROWS = 2;
const MIN_PEOPLE = 2;

/**
 * Top meeting windows of the visible week: at least one hour, at least two people free,
 * not already over at `now`. Ranked by people free (desc), length (desc), start (asc).
 */
export function bestTimes(runs: Run[], weekStart: Date, now: number, limit = 5): BestTime[] {
  const byDay = new Map<number, Run[]>();
  for (const run of runs) {
    const list = byDay.get(run.day);
    if (list) list.push(run);
    else byDay.set(run.day, [run]);
  }

  const windows = new Map<string, BestTime>();
  for (const [day, dayRuns] of byDay) {
    dayRuns.sort((a, b) => a.startRow - b.startRow);
    dayRuns.forEach((seed, i) => {
      if (seed.free.length < MIN_PEOPLE) return;
      // Grow through touching neighbors in which everyone from the seed is still free.
      const covers = (run: Run) => seed.free.every((id) => run.free.includes(id));
      let lo = i;
      let hi = i;
      while (lo > 0 && dayRuns[lo - 1].endRow === dayRuns[lo].startRow && covers(dayRuns[lo - 1])) lo--;
      while (hi < dayRuns.length - 1 && dayRuns[hi].endRow === dayRuns[hi + 1].startRow && covers(dayRuns[hi + 1])) hi++;

      const startRow = dayRuns[lo].startRow;
      const endRow = dayRuns[hi].endRow;
      if (endRow - startRow < MIN_ROWS) return;
      const start = cellToInstant(weekStart, day, startRow);
      const last = cellToInstant(weekStart, day, endRow - 1);
      if (start === null || last === null) return;
      // Midnight and DST-skipped end rows have no instant of their own.
      const end = cellToInstant(weekStart, day, endRow) ?? last + SLOT_MS;
      if (end <= now) return;
      windows.set(`${start}:${end}:${seed.free.length}`, { start, end, free: seed.free });
    });
  }

  // Windows are maximal for their people, so one can only sit inside another that has fewer
  // people; after the keyed de-duplication above there is nothing redundant left to drop.
  return [...windows.values()]
    .sort((a, b) => b.free.length - a.free.length || b.end - b.start - (a.end - a.start) || a.start - b.start)
    .slice(0, limit);
}
