import { useEffect, useRef, useState, type PointerEvent } from "react";
import { covers } from "@/lib/intervals";
import { instantAt } from "@/lib/time";
import { DAYS_PER_WEEK, MINUTES_PER_DAY, SNAP_MIN, type Interval, type SlotsPatch } from "@/lib/types";

/** A day column and wall-clock minutes from its midnight; snapped cells start on a `SNAP_MIN` boundary. */
export type Cell = { day: number; min: number };
export type Draft = { anchor: Cell; current: Cell; mode: "paint" | "erase" };

const TAP_SLOP = 10;

const clamp = (n: number, max: number) => Math.min(max, Math.max(0, n));

/** Exact (unsnapped) day and minute under a viewport point, clamped to the grid. `el` is the day-columns container. */
export function pointAt(el: Element, clientX: number, clientY: number): Cell {
  const rect = el.getBoundingClientRect();
  return {
    day: clamp(Math.floor(((clientX - rect.left) / rect.width) * DAYS_PER_WEEK), DAYS_PER_WEEK - 1),
    min: clamp(Math.floor(((clientY - rect.top) / rect.height) * MINUTES_PER_DAY), MINUTES_PER_DAY - 1),
  };
}

/** The `SNAP_MIN`-minute cell under a viewport point. */
export function cellAt(el: Element, clientX: number, clientY: number): Cell {
  const { day, min } = pointAt(el, clientX, clientY);
  return { day, min: clamp(Math.floor(min / SNAP_MIN) * SNAP_MIN, MINUTES_PER_DAY - SNAP_MIN) };
}

/** The dragged rectangle: inclusive day range, half-open minute range. */
export function draftBounds({ anchor, current }: Pick<Draft, "anchor" | "current">) {
  return {
    day0: Math.min(anchor.day, current.day),
    day1: Math.max(anchor.day, current.day),
    min0: Math.min(anchor.min, current.min),
    min1: Math.max(anchor.min, current.min) + SNAP_MIN,
  };
}

/** One interval per day of the dragged rectangle. */
export function draftIntervals(weekStart: Date, draft: Pick<Draft, "anchor" | "current">): Interval[] {
  const { day0, day1, min0, min1 } = draftBounds(draft);
  const out: Interval[] = [];
  for (let day = day0; day <= day1; day++) {
    const start = instantAt(weekStart, day, min0);
    const end = instantAt(weekStart, day, min1);
    if (start < end) out.push({ start, end });
  }
  return out;
}

type Options = { weekStart: Date; mine: Interval[]; onCommit: (patch: SlotsPatch) => void };

/** when2meet-style rectangle painting for mouse/pen, single-cell tap toggle for touch. */
export function usePaint({ weekStart, mine, onCommit }: Options) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const drag = useRef<Draft | null>(null);
  const tap = useRef<{ x: number; y: number } | null>(null);

  const modeAt = (cell: Cell): Draft["mode"] =>
    covers(mine, instantAt(weekStart, cell.day, cell.min)) ? "erase" : "paint";

  // One patch per gesture; the optimistic layer and the server do the set algebra against what is stored.
  const commit = (anchor: Cell, current: Cell, mode: Draft["mode"]) => {
    const ranges = draftIntervals(weekStart, { anchor, current });
    onCommit(mode === "paint" ? { add: ranges, remove: [] } : { add: [], remove: ranges });
  };

  const cancel = () => {
    drag.current = null;
    tap.current = null;
    setDraft(null);
  };

  const dragging = draft !== null;
  useEffect(() => {
    if (!dragging) return;
    // Capture phase + preventDefault: week shortcuts must not fire mid-drag.
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key !== "Escape") return;
      drag.current = null;
      setDraft(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [dragging]);

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") {
      tap.current = e.isPrimary ? { x: e.clientX, y: e.clientY } : null;
      return;
    }
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const anchor = cellAt(e.currentTarget, e.clientX, e.clientY);
    const next: Draft = { anchor, current: anchor, mode: modeAt(anchor) };
    drag.current = next;
    setDraft(next);
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    if (e.buttons === 0) return cancel(); // the pointerup was lost (e.g. context menu)
    const current = cellAt(e.currentTarget, e.clientX, e.clientY);
    if (current.day === d.current.day && current.min === d.current.min) return;
    const next = { ...d, current };
    drag.current = next;
    setDraft(next);
  };

  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") {
      const start = tap.current;
      tap.current = null;
      if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_SLOP) return;
      const cell = cellAt(e.currentTarget, e.clientX, e.clientY);
      commit(cell, cell, modeAt(cell));
      return;
    }
    const d = drag.current;
    if (!d) return;
    // Clearing the draft and the optimistic cache write land in the same render: no flicker.
    cancel();
    commit(d.anchor, cellAt(e.currentTarget, e.clientX, e.clientY), d.mode);
  };

  return { draft, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: cancel } };
}
