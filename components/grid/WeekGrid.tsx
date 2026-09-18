"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";
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
/** How far a touch may travel and still count as a tap rather than a swipe. */
const TAP_SLOP_PX = 8;

/** A day column and wall-clock minutes from its midnight. */
type Cell = { day: number; min: number };
type OwnBlock = { startMin: number; endMin: number };
/** `touch` marks a popover opened by tapping, which only a tap elsewhere dismisses. */
type Hover = Cell & { anchor: PopoverAnchor; touch?: boolean };

const clamp = (n: number, max: number) => Math.min(max, Math.max(0, n));

/** Exact day and minute under a viewport point, clamped to the grid. `el` is the day-columns container. */
function pointAt(el: Element, clientX: number, clientY: number): Cell {
  const rect = el.getBoundingClientRect();
  return {
    day: clamp(Math.floor(((clientX - rect.left) / rect.width) * DAYS_PER_WEEK), DAYS_PER_WEEK - 1),
    min: clamp(Math.floor(((clientY - rect.top) / rect.height) * MINUTES_PER_DAY), MINUTES_PER_DAY - 1),
  };
}

/** Where the popover for a day column should sit: its viewport edges and the pointer's y. */
function anchorAt(el: Element, day: number, clientY: number): PopoverAnchor {
  const rect = el.getBoundingClientRect();
  const colW = rect.width / DAYS_PER_WEEK;
  const left = rect.left + day * colW;
  return { left, right: left + colW, y: clientY };
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
  /** Where the current touch went down, to tell a tap from a swipe. */
  const tapRef = useRef<{ x: number; y: number } | null>(null);
  const now = useNow();
  const [hover, setHover] = useState<Hover | null>(null);
  const tapped = hover?.touch ?? false;

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

  // Phones show three days at a time, so open the week on today (day 0 for any other week).
  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    const cols = colsRef.current;
    if (!scroller || !cols) return;
    const overflow = scroller.scrollWidth - scroller.clientWidth;
    if (overflow <= 0) return;
    const today = days.findIndex((d) => isSameDay(d, new Date()));
    const colW = cols.getBoundingClientRect().width / DAYS_PER_WEEK;
    scroller.scrollLeft = Math.min(Math.max(today, 0) * colW, overflow);
  }, [days]);

  // A popover opened by tapping stays until something outside the grid (or the popover) is touched.
  useEffect(() => {
    if (!tapped) return;
    const dismiss = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (colsRef.current?.contains(target) || target.closest(".grid-popover")) return;
      setHover(null);
    };
    document.addEventListener("pointerdown", dismiss, true);
    return () => document.removeEventListener("pointerdown", dismiss, true);
  }, [tapped]);

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    // Touch drives the popover from pointerup instead; a swipe must not disturb it.
    if (e.pointerType === "touch") return;
    if (e.buttons !== 0) return setHover(null);
    const cell = pointAt(e.currentTarget, e.clientX, e.clientY);
    const run = runAt(cell);
    if (!run) return setHover(null);
    const next: Hover = { ...cell, anchor: anchorAt(e.currentTarget, cell.day, e.clientY) };
    // Only re-render (and re-place the popover) when the pointer enters a different run.
    setHover((prev) => (prev && runAt(prev) === run ? prev : next));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    tapRef.current = e.pointerType === "touch" ? { x: e.clientX, y: e.clientY } : null;
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = tapRef.current;
    tapRef.current = null;
    if (e.pointerType !== "touch" || !start) return;
    // Only a tap that stayed put, and not the one that dismisses an own block.
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_SLOP_PX) return;
    if (e.target instanceof Element && e.target.closest(".grid-own-x")) return;
    const cell = pointAt(e.currentTarget, e.clientX, e.clientY);
    const run = runAt(cell);
    if (!run) return setHover(null);
    const next: Hover = { ...cell, anchor: anchorAt(e.currentTarget, cell.day, e.clientY), touch: true };
    // Tapping the open run again closes it.
    setHover((prev) => (prev && runAt(prev) === run ? null : next));
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
            <div className="grid-corner" />
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
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={() => {
                // The browser took the touch over for scrolling; it is a swipe, not a tap.
                tapRef.current = null;
              }}
              onPointerLeave={(e) => {
                // A touch pointer leaves as soon as it lifts, which would close the popover it just opened.
                if (e.pointerType !== "touch") setHover(null);
              }}
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
