import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/Avatar";
import { cellToInstant, formatRange } from "@/lib/time";
import { SLOT_MS, type Run, type User } from "@/lib/types";

/** Viewport coordinates: the hovered day column's horizontal edges and the pointer's y. */
export type PopoverAnchor = { left: number; right: number; y: number };

type Props = { run: Run; anchor: PopoverAnchor; weekStart: Date; users: User[]; included: Set<string> };

const GAP = 10;
const EDGE = 8;

/** Who is free in the hovered run. Portaled to <body>: backdrop-filter does not nest inside the glass panel. */
export function SlotPopover({ run, anchor, weekStart, users, included }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Its size depends on content, so place it after layout: beside the column, flipped and clamped to the viewport.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const fitsRight = anchor.right + GAP + width <= window.innerWidth - EDGE;
    const left = fitsRight ? anchor.right + GAP : Math.max(EDGE, anchor.left - GAP - width);
    const top = Math.max(EDGE, Math.min(anchor.y - 24, window.innerHeight - height - EDGE));
    el.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    el.style.visibility = "visible";
  }, [anchor, run]);

  const start = cellToInstant(weekStart, run.day, run.startRow);
  const last = cellToInstant(weekStart, run.day, run.endRow - 1);
  if (start === null || last === null) return null;

  const isFree = new Set(run.free);
  const free = users.filter((u) => isFree.has(u.id));
  const busy = users.filter((u) => included.has(u.id) && !isFree.has(u.id));

  return createPortal(
    <div ref={ref} className="glass-strong grid-popover" role="tooltip">
      <div className="grid-popover-time">{formatRange(start, last + SLOT_MS)}</div>
      <div className="grid-popover-group">Free · {free.length}</div>
      <ul className="grid-popover-list">
        {free.map((u) => (
          <li key={u.id}>
            <Avatar user={u} size={20} />
            <span className="grid-popover-name">{u.name}</span>
          </li>
        ))}
      </ul>
      {busy.length > 0 && (
        <>
          <div className="grid-popover-group">Busy · {busy.length}</div>
          <ul className="grid-popover-list grid-popover-busy">
            {busy.map((u) => (
              <li key={u.id}>
                <Avatar user={u} size={20} dimmed />
                <span className="grid-popover-name">{u.name}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>,
    document.body,
  );
}
