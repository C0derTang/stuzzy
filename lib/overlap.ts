import { instantToCell } from "./time";
import { DAYS_PER_WEEK, ROWS_PER_DAY, type Run } from "./types";

/** Per-day runs of consecutive rows where the same non-empty set of `included` users is free. */
export function computeRuns(weekStart: Date, slots: Record<string, number[]>, included: Set<string>): Run[] {
  // free[day][row] = ids free in that cell. Ids are visited in sorted order, so each list is sorted.
  const free: string[][][] = Array.from({ length: DAYS_PER_WEEK }, () =>
    Array.from({ length: ROWS_PER_DAY }, () => []),
  );
  for (const id of [...included].sort()) {
    for (const ms of slots[id] ?? []) {
      const cell = instantToCell(weekStart, ms);
      if (!cell) continue;
      const ids = free[cell.day][cell.row];
      if (ids[ids.length - 1] !== id) ids.push(id);
    }
  }

  const runs: Run[] = [];
  for (let day = 0; day < DAYS_PER_WEEK; day++) {
    let open: Run | null = null;
    let openKey = "";
    for (let row = 0; row < ROWS_PER_DAY; row++) {
      const ids = free[day][row];
      const key = ids.join("\n");
      if (open && key === openKey) {
        open.endRow = row + 1;
        continue;
      }
      open = ids.length ? { day, startRow: row, endRow: row + 1, free: ids } : null;
      openKey = key;
      if (open) runs.push(open);
    }
  }
  return runs;
}
