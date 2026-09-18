import type { CSSProperties } from "react";
import type { Run } from "@/lib/types";

/** Pixels per hour; mirrors `--hour-h` in grid.css. Used only to decide whether labels fit. */
export const HOUR_PX = 48;
/** A block shows its labels once it is at least this tall. */
const LABEL_MIN_PX = 40;

export function minutesToPx(minutes: number): number {
  return (minutes / 60) * HOUR_PX;
}

/** Vertical CSS offset of a wall-clock minute within a day column. */
export function minuteTop(min: number): string {
  return `calc(var(--hour-h) * ${(min / 60).toFixed(4)})`;
}

/** CSS box for minutes [startMin, endMin) of a day column, inset 1px so stacked blocks stay distinct. */
export function minuteBox(startMin: number, endMin: number): CSSProperties {
  return {
    top: `calc(${minuteTop(startMin)} + 1px)`,
    height: `max(2px, calc(${minuteTop(endMin - startMin)} - 2px))`,
  };
}

/** Overlap blocks of one day column. `total` is the number of included users. */
export function HeatLayer({ runs, total }: { runs: Run[]; total: number }) {
  return (
    <div className="heat-layer">
      {runs.map((run) => {
        const tall = minutesToPx(run.endMin - run.startMin) >= LABEL_MIN_PX;
        const all = total >= 2 && run.free.length === total;
        const alpha = 0.1 + 0.45 * (run.free.length / Math.max(total, 1));
        return (
          <div
            key={run.startMin}
            className={all ? "heat-block heat-all" : "heat-block"}
            style={{ ...minuteBox(run.startMin, run.endMin), "--heat-a": alpha.toFixed(3) } as CSSProperties}
          >
            {all && tall && <span className="heat-label">All free</span>}
            {total >= 2 && tall && (
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
