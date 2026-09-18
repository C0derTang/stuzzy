import { instantAt } from "./time";
import type { BestTime, Run } from "./types";

const MIN_MINUTES = 60;
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
    dayRuns.sort((a, b) => a.startMin - b.startMin);
    dayRuns.forEach((seed, i) => {
      if (seed.free.length < MIN_PEOPLE) return;
      // Grow through touching neighbors in which everyone from the seed is still free.
      const covers = (run: Run) => seed.free.every((id) => run.free.includes(id));
      let lo = i;
      let hi = i;
      while (lo > 0 && dayRuns[lo - 1].endMin === dayRuns[lo].startMin && covers(dayRuns[lo - 1])) lo--;
      while (hi < dayRuns.length - 1 && dayRuns[hi].endMin === dayRuns[hi + 1].startMin && covers(dayRuns[hi + 1])) hi++;

      const startMin = dayRuns[lo].startMin;
      const endMin = dayRuns[hi].endMin;
      if (endMin - startMin < MIN_MINUTES) return;
      const start = instantAt(weekStart, day, startMin);
      // endMin may be 1440, which instantAt rolls over to the next midnight.
      const end = instantAt(weekStart, day, endMin);
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
