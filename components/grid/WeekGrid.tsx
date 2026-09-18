"use client";

import { useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { clip } from "@/lib/intervals";
import { formatHour, formatMinutes, instantAt, isSameDay, splitByDay, weekDays, weekRange } from "@/lib/time";
import { DAYS_PER_WEEK, MINUTES_PER_DAY, type Interval, type Run, type SlotsPatch, type User } from "@/lib/types";
import { HeatLayer, minuteBox, minutesToPx } from "./HeatLayer";
import { NowLine, useNow } from "./NowLine";
import { SlotPopover, type PopoverAnchor } from "./SlotPopover";
import "./grid.css";

export type WeekGridProps = {
  weekStart: Date;
  users: User[];
  /** Users counted in the heatmap; `included.size` is the "everyone" total. */
  included: Set<string>;
  runs: Run[];
  /** The signed-in user's free intervals (sorted, merged; may extend past the week). */
  mine: Interval[];
  /** Called once per removed block. */
  onCommit: (patch: SlotsPatch) => void;
};

const HOURS = Array.from({ length: 23 }, (_, i) => i + 1);
const FIRST_VISIBLE_MIN = 8 * 60;
/** An own block shows its exact times once it is at least this tall. */
const OWN_LABEL_MIN_PX = 22;

/** A day column and wall-clock minutes from its midnight. */
type Cell = { day: number; min: number };
type OwnBlock = { startMin: number; endMin: number };
type Hover = Cell & { anchor: PopoverAnchor };

const clamp = (n: number, max: number) => Math.min(max, Math.max(0, n));

/** Exact day and minute under a viewport point, clamped to the grid. `el` is the day-columns container. */
function pointAt(el: Element, clientX: number, clientY: number): Cell {
  const rect = el.getBoundingClientRect();
  return {
    day: clamp(Math.floor(((clientX - rect.left) / rect.width) * DAYS_PER_WEEK), DAYS_PER_WEEK - 1),
    min: clamp(Math.floor(((clientY - rect.top) / rect.height) * MINUTES_PER_DAY), MINUTES_PER_DAY - 1),
  };
}

/** Own intervals within the week, as blocks per day. */
function ownBlocks(weekStart: Date, mine: Interval[]): OwnBlock[][] {
  const { from, to } = weekRange(weekStart);
  const byDay: OwnBlock[][] = Array.from({ length: DAYS_PER_WEEK }, () => []);
  for (const range of clip(mine, from, to)) {
    for (const { day, startMin, endMin } of splitByDay(weekStart, range)) {
      byDay[day].push({ startMin, endMin });
    }
  }
  for (const blocks of byDay) blocks.sort((a, b) => a.startMin - b.startMin);
  return byDay;
}

export function WeekGrid({ weekStart, users, included, runs, mine, onCommit }: WeekGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const colsRef = useRef<HTMLDivElement>(null);
  const now = useNow();
  const [hover, setHover] = useState<Hover | null>(null);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const runsByDay = useMemo(() => days.map((_, day) => runs.filter((r) => r.day === day)), [days, runs]);
  const own = useMemo(() => ownBlocks(weekStart, mine), [weekStart, mine]);
  const ownEmpty = own.every((blocks) => blocks.length === 0);

  const runAt = ({ day, min }: Cell) => runsByDay[day].find((r) => r.startMin <= min && min < r.endMin);
  const hoveredRun = hover ? runAt(hover) : undefined;

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    const cols = colsRef.current;
    if (!scroller || !cols) return;
    // The sticky header overlays the scrollport, so this puts 8 AM right below it.
    scroller.scrollTop = (cols.getBoundingClientRect().height / MINUTES_PER_DAY) * FIRST_VISIBLE_MIN - 10;
  }, []);

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
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

  const remove = (e: MouseEvent<HTMLButtonElement>, day: number, b: OwnBlock) => {
    e.stopPropagation();
    onCommit({
      add: [],
      remove: [{ start: instantAt(weekStart, day, b.startMin), end: instantAt(weekStart, day, b.endMin) }],
    });
  };

  return (
    <section className="glass grid-panel" aria-label="Week availability grid">
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
              onPointerMove={onPointerMove}
              onPointerLeave={() => setHover(null)}
            >
              {days.map((d, day) => {
                const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
                return (
                  <div key={d.getTime()} className="grid-col">
                    <HeatLayer runs={runsByDay[day]} total={included.size} />
                    <div className="grid-own-layer">
                      {own[day].map((b) => {
                        const label = `${formatMinutes(b.startMin)}–${formatMinutes(b.endMin)}`;
                        return (
                          <div key={b.startMin} className="grid-own" style={minuteBox(b.startMin, b.endMin)}>
                            {minutesToPx(b.endMin - b.startMin) >= OWN_LABEL_MIN_PX && (
                              <span className="grid-own-time">{label}</span>
                            )}
                            <button
                              type="button"
                              className="grid-own-x"
                              aria-label={`Remove ${weekday} ${label}`}
                              title="Remove"
                              onClick={(e) => remove(e, day, b)}
                            >
                              <svg viewBox="0 0 10 10" width="8" height="8" aria-hidden>
                                <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <NowLine days={days} now={now} />
            </div>
          </div>
        </div>
      </div>
      {runs.length === 0 && ownEmpty && (
        <p className="grid-hint">
          <span className="hidden md:inline">Add your free time in the panel on the left</span>
          <span className="md:hidden">Add your free time with the + button</span>
        </p>
      )}
      {hoveredRun && hover && (
        <SlotPopover run={hoveredRun} anchor={hover.anchor} weekStart={weekStart} users={users} included={included} />
      )}
    </section>
  );
}
