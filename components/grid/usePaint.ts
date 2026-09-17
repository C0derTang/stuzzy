import { useEffect, useRef, useState, type PointerEvent } from "react";
import { cellToInstant } from "@/lib/time";
import { DAYS_PER_WEEK, ROWS_PER_DAY, type SlotsPatch } from "@/lib/types";

export type Cell = { day: number; row: number };
export type Draft = { anchor: Cell; current: Cell; mode: "paint" | "erase" };

const TAP_SLOP = 10;

const clamp = (n: number, max: number) => Math.min(max, Math.max(0, n));

/** Grid cell under a viewport point, clamped to the grid. `el` is the day-columns container. */
export function cellAt(el: Element, clientX: number, clientY: number): Cell {
  const rect = el.getBoundingClientRect();
  return {
    day: clamp(Math.floor(((clientX - rect.left) / rect.width) * DAYS_PER_WEEK), DAYS_PER_WEEK - 1),
    row: clamp(Math.floor(((clientY - rect.top) / rect.height) * ROWS_PER_DAY), ROWS_PER_DAY - 1),
  };
}

export function draftBounds({ anchor, current }: Pick<Draft, "anchor" | "current">) {
  return {
    day0: Math.min(anchor.day, current.day),
    day1: Math.max(anchor.day, current.day),
    row0: Math.min(anchor.row, current.row),
    row1: Math.max(anchor.row, current.row),
  };
}

type Options = { weekStart: Date; mySlots: Set<number>; onCommit: (patch: SlotsPatch) => void };

/** when2meet-style rectangle painting for mouse/pen, single-slot tap toggle for touch. */
export function usePaint({ weekStart, mySlots, onCommit }: Options) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const drag = useRef<Draft | null>(null);
  const tap = useRef<{ x: number; y: number } | null>(null);

  const commit = (anchor: Cell, current: Cell, mode: Draft["mode"]) => {
    const { day0, day1, row0, row1 } = draftBounds({ anchor, current });
    const patch: SlotsPatch = { add: [], remove: [] };
    for (let day = day0; day <= day1; day++) {
      for (let row = row0; row <= row1; row++) {
        const ms = cellToInstant(weekStart, day, row);
        if (ms === null) continue;
        if (mode === "paint" && !mySlots.has(ms)) patch.add.push(ms);
        if (mode === "erase" && mySlots.has(ms)) patch.remove.push(ms);
      }
    }
    onCommit(patch);
  };

  const cancel = () => {
    drag.current = null;
    tap.current = null;
    setDraft(null);
  };

  const dragging = draft !== null;
  useEffect(() => {
    if (!dragging) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      drag.current = null;
      setDraft(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dragging]);

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") {
      tap.current = e.isPrimary ? { x: e.clientX, y: e.clientY } : null;
      return;
    }
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const anchor = cellAt(e.currentTarget, e.clientX, e.clientY);
    const ms = cellToInstant(weekStart, anchor.day, anchor.row);
    const next: Draft = { anchor, current: anchor, mode: ms !== null && mySlots.has(ms) ? "erase" : "paint" };
    drag.current = next;
    setDraft(next);
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const current = cellAt(e.currentTarget, e.clientX, e.clientY);
    if (current.day === d.current.day && current.row === d.current.row) return;
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
      const ms = cellToInstant(weekStart, cell.day, cell.row);
      if (ms !== null) commit(cell, cell, mySlots.has(ms) ? "erase" : "paint");
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
