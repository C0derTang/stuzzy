"use client";

import { useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { clip, subtract, union } from "@/lib/intervals";
import { formatHour, formatMinutes, isSameDay, splitByDay, weekDays, weekRange } from "@/lib/time";
import { DAYS_PER_WEEK, MINUTES_PER_DAY, type Interval, type Run, type SlotsPatch, type User } from "@/lib/types";
import { HeatLayer, minuteBox, minutesToPx } from "./HeatLayer";
import { NowLine, useNow } from "./NowLine";
import { SlotPopover, type PopoverAnchor } from "./SlotPopover";
import { draftIntervals, pointAt, usePaint, type Cell, type Draft } from "./usePaint";
import "./grid.css";

export type WeekGridProps = {
  weekStart: Date;
  users: User[];
  /** Users counted in the heatmap; `included.size` is the "everyone" total. */
  included: Set<string>;
  runs: Run[];
  /** The signed-in user's free intervals (sorted, merged; may extend past the week). */
  mine: Interval[];
  /** Called once per finished drag or tap. */
  onCommit: (patch: SlotsPatch) => void;
};

const HOURS = Array.from({ length: 23 }, (_, i) => i + 1);
const FIRST_VISIBLE_MIN = 8 * 60;
/** An own block shows its exact times once it is at least this tall. */
const OWN_LABEL_MIN_PX = 22;

type OwnBlock = { startMin: number; endMin: number; erasing: boolean };

/** Own intervals within the week plus the in-progress draft, as blocks per day. */
function ownBlocks(weekStart: Date, mine: Interval[], draft: Draft | null): OwnBlock[][] {
  const { from, to } = weekRange(weekStart);
  let shown = clip(mine, from, to);
  let erasing: Interval[] = [];
  if (draft) {
    const rect = draftIntervals(weekStart, draft);
    if (draft.mode === "paint") shown = union(shown, rect);
    else {
      const kept = subtract(shown, rect);
      erasing = subtract(shown, kept); // the parts of my time inside the rectangle
      shown = kept;
    }
  }
  const byDay: OwnBlock[][] = Array.from({ length: DAYS_PER_WEEK }, () => []);
  const place = (ranges: Interval[], isErasing: boolean) => {
    for (const range of ranges) {
      for (const { day, startMin, endMin } of splitByDay(weekStart, range)) {
        byDay[day].push({ startMin, endMin, erasing: isErasing });
      }
    }
  };
  place(shown, false);
  place(erasing, true);
  for (const blocks of byDay) blocks.sort((a, b) => a.startMin - b.startMin);
  return byDay;
}

type Hover = Cell & { anchor: PopoverAnchor };

export function WeekGrid({ weekStart, users, included, runs, mine, onCommit }: WeekGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const colsRef = useRef<HTMLDivElement>(null);
  const now = useNow();
  const { draft, handlers } = usePaint({ weekStart, mine, onCommit });
  const [hover, setHover] = useState<Hover | null>(null);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const runsByDay = useMemo(() => days.map((_, day) => runs.filter((r) => r.day === day)), [days, runs]);
  const own = useMemo(() => ownBlocks(weekStart, mine, draft), [weekStart, mine, draft]);
  const ownEmpty = own.every((blocks) => blocks.length === 0);

  const runAt = ({ day, min }: Cell) => runsByDay[day].find((r) => r.startMin <= min && min < r.endMin);
  const hoveredRun = hover && !draft ? runAt(hover) : undefined;

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    const cols = colsRef.current;
    if (!scroller || !cols) return;
    // The sticky header overlays the scrollport, so this puts 8 AM right below it.
    scroller.scrollTop = (cols.getBoundingClientRect().height / MINUTES_PER_DAY) * FIRST_VISIBLE_MIN - 10;
  }, []);

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    handlers.onPointerMove(e);
    if (e.pointerType === "touch" || e.buttons !== 0) return setHover(null);
    const cell = pointAt(e.currentTarget, e.clientX, e.clientY);
    const run = runAt(cell);
    if (!run) return setHover(null);
    const rect = e.currentTarget.getBoundingClientRect();
    const colW = rect.width / DAYS_PER_WEEK;
    const left = rect.left + cell.day * colW;
    const next: Hover = { ...cell, anchor: { left, right: left + colW, y: e.clientY } };
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
              {HOURS.map((hour) => (
                <span key={hour} className="grid-hour" style={{ top: `calc(var(--hour-h) * ${hour})` }}>
                  {formatHour(hour)}
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
                        key={b.startMin}
                        className={b.erasing ? "grid-own grid-own-erasing" : "grid-own"}
                        style={minuteBox(b.startMin, b.endMin)}
                      >
                        {minutesToPx(b.endMin - b.startMin) >= OWN_LABEL_MIN_PX && (
                          <span className="grid-own-time">
                            {formatMinutes(b.startMin)}–{formatMinutes(b.endMin)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <NowLine days={days} now={now} />
            </div>
          </div>
        </div>
      </div>
      {runs.length === 0 && ownEmpty && !draft && (
        <p className="grid-hint">Drag on the calendar to mark when you&apos;re free</p>
      )}
      {hoveredRun && hover && (
        <SlotPopover run={hoveredRun} anchor={hover.anchor} weekStart={weekStart} users={users} included={included} />
      )}
    </section>
  );
}
