"use client";

import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { cellToInstant, formatRow, instantToCell, isSameDay, weekDays } from "@/lib/time";
import { DAYS_PER_WEEK, ROWS_PER_DAY, type Run, type SlotsPatch, type User } from "@/lib/types";
import { HeatLayer, rowBox } from "./HeatLayer";
import { NowLine, useNow } from "./NowLine";
import { SlotPopover, type PopoverAnchor } from "./SlotPopover";
import { cellAt, draftBounds, usePaint, type Cell, type Draft } from "./usePaint";
import "./grid.css";

export type WeekGridProps = {
  weekStart: Date;
  me: User;
  users: User[];
  /** Users counted in the heatmap; `included.size` is the "everyone" total. */
  included: Set<string>;
  runs: Run[];
  /** The signed-in user's free slots (epoch ms) in the visible week. */
  mySlots: Set<number>;
  /** Called once per finished drag or tap. */
  onCommit: (patch: SlotsPatch) => void;
};

const HOUR_ROWS = Array.from({ length: ROWS_PER_DAY / 2 - 1 }, (_, i) => (i + 1) * 2);
const FIRST_VISIBLE_ROW = 16; // 8 AM

type OwnBlock = { startRow: number; endRow: number; erasing: boolean };

/** Own slots plus the in-progress draft, merged into blocks per day. */
function ownBlocks(weekStart: Date, mySlots: Set<number>, draft: Draft | null): OwnBlock[][] {
  // 0 = not mine, 1 = mine (or being painted), 2 = mine but being erased
  const state = Array.from({ length: DAYS_PER_WEEK }, () => new Uint8Array(ROWS_PER_DAY));
  for (const ms of mySlots) {
    const cell = instantToCell(weekStart, ms);
    if (cell) state[cell.day][cell.row] = 1;
  }
  if (draft) {
    const { day0, day1, row0, row1 } = draftBounds(draft);
    for (let day = day0; day <= day1; day++) {
      for (let row = row0; row <= row1; row++) {
        if (draft.mode === "erase") state[day][row] *= 2;
        else if (cellToInstant(weekStart, day, row) !== null) state[day][row] = 1;
      }
    }
  }
  return state.map((rows) => {
    const blocks: OwnBlock[] = [];
    for (let row = 0; row < ROWS_PER_DAY; row++) {
      if (!rows[row]) continue;
      const prev = blocks[blocks.length - 1];
      const erasing = rows[row] === 2;
      if (prev && prev.endRow === row && prev.erasing === erasing) prev.endRow = row + 1;
      else blocks.push({ startRow: row, endRow: row + 1, erasing });
    }
    return blocks;
  });
}

export function WeekGrid({ weekStart, users, included, runs, mySlots, onCommit }: WeekGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const colsRef = useRef<HTMLDivElement>(null);
  const now = useNow();
  const { draft, handlers } = usePaint({ weekStart, mySlots, onCommit });
  const [hover, setHover] = useState<(Cell & { anchor: PopoverAnchor }) | null>(null);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const runsByDay = useMemo(() => days.map((_, day) => runs.filter((r) => r.day === day)), [days, runs]);
  const own = useMemo(() => ownBlocks(weekStart, mySlots, draft), [weekStart, mySlots, draft]);

  const runAt = ({ day, row }: Cell) => runsByDay[day].find((r) => r.startRow <= row && row < r.endRow);
  const hoveredRun = hover && !draft ? runAt(hover) : undefined;

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    const cols = colsRef.current;
    if (!scroller || !cols) return;
    // The sticky header overlays the scrollport, so this puts 8 AM right below it.
    scroller.scrollTop = (cols.getBoundingClientRect().height / ROWS_PER_DAY) * FIRST_VISIBLE_ROW - 10;
  }, []);

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    handlers.onPointerMove(e);
    if (e.pointerType === "touch" || e.buttons !== 0) return setHover(null);
    const cell = cellAt(e.currentTarget, e.clientX, e.clientY);
    const run = runAt(cell);
    if (!run) return setHover(null);
    const rect = e.currentTarget.getBoundingClientRect();
    const colW = rect.width / DAYS_PER_WEEK;
    const left = rect.left + cell.day * colW;
    const next = { ...cell, anchor: { left, right: left + colW, y: e.clientY } };
    // Only re-render (and re-place the popover) when the pointer enters a different run.
    setHover((prev) => (prev && runAt(prev) === run ? prev : next));
  };

  return (
    <section className="glass grid-panel" aria-label="Week availability grid; drag to mark when you are free">
      <div className="grid-scroll" ref={scrollRef} onScroll={() => setHover(null)}>
        <div className="grid-inner">
          <div className="grid-head">
            <div />
            <div className="grid-days">
              {days.map((d) => {
                const today = now !== null && isSameDay(d, new Date(now));
                return (
                  <div
                    key={d.getTime()}
                    className={today ? "grid-dayhead grid-today" : "grid-dayhead"}
                    aria-current={today ? "date" : undefined}
                  >
                    <span>{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
                    <span className="grid-daynum">{d.getDate()}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid-body">
            <div className="grid-gutter" aria-hidden>
              {HOUR_ROWS.map((row) => (
                <span key={row} className="grid-hour" style={{ top: `calc(var(--row-h) * ${row})` }}>
                  {formatRow(row)}
                </span>
              ))}
            </div>
            <div
              ref={colsRef}
              className="grid-cols"
              {...handlers}
              onPointerMove={onPointerMove}
              onPointerLeave={() => setHover(null)}
            >
              {days.map((d, day) => (
                <div key={d.getTime()} className="grid-col">
                  <HeatLayer runs={runsByDay[day]} total={included.size} />
                  <div className="grid-own-layer">
                    {own[day].map((b) => (
                      <div
                        key={b.startRow}
                        className={b.erasing ? "grid-own grid-own-erasing" : "grid-own"}
                        style={rowBox(b.startRow, b.endRow)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <NowLine days={days} now={now} />
            </div>
          </div>
        </div>
      </div>
      {runs.length === 0 && mySlots.size === 0 && !draft && (
        <p className="grid-hint">Drag on the calendar to mark when you&apos;re free</p>
      )}
      {hoveredRun && hover && (
        <SlotPopover run={hoveredRun} anchor={hover.anchor} weekStart={weekStart} users={users} included={included} />
      )}
    </section>
  );
}
