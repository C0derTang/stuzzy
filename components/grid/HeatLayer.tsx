import type { CSSProperties } from "react";
import type { Run } from "@/lib/types";

/** CSS box for rows [startRow, endRow) of a day column, inset 1px so stacked blocks stay distinct. */
export function rowBox(startRow: number, endRow: number): CSSProperties {
  return {
    top: `calc(var(--row-h) * ${startRow} + 1px)`,
    height: `calc(var(--row-h) * ${endRow - startRow} - 2px)`,
  };
}

/** Overlap blocks of one day column. `total` is the number of included users. */
export function HeatLayer({ runs, total }: { runs: Run[]; total: number }) {
  return (
    <div className="heat-layer">
      {runs.map((run) => {
        const rows = run.endRow - run.startRow;
        const all = total >= 2 && run.free.length === total;
        const alpha = 0.1 + 0.45 * (run.free.length / Math.max(total, 1));
        return (
          <div
            key={run.startRow}
            className={all ? "heat-block heat-all" : "heat-block"}
            style={{ ...rowBox(run.startRow, run.endRow), "--heat-a": alpha.toFixed(3) } as CSSProperties}
          >
            {all && rows >= 2 && <span className="heat-label">All free</span>}
            {total >= 2 && (
              <span className="heat-count">
                {run.free.length}/{total}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
