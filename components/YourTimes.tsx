"use client";

import { clip } from "@/lib/intervals";
import { type DayPart, formatMinutes, instantAt, splitByDay, weekDays, weekRange } from "@/lib/time";
import type { Interval, SlotsPatch } from "@/lib/types";

export type YourTimesProps = {
  weekStart: Date;
  /** The signed-in user's free intervals (any that overlap the visible week). */
  mine: Interval[];
  onCommit: (patch: SlotsPatch) => void;
};

/** The user's free time in the visible week as one row per day piece, in week order. */
function dayParts(weekStart: Date, mine: Interval[]): DayPart[] {
  const { from, to } = weekRange(weekStart);
  return clip(mine, from, to)
    .flatMap((interval) => splitByDay(weekStart, interval))
    .sort((a, b) => a.day - b.day || a.startMin - b.startMin);
}

export function YourTimes({ weekStart, mine, onCommit }: YourTimesProps) {
  const parts = dayParts(weekStart, mine);
  const names = weekDays(weekStart).map((d) => d.toLocaleDateString("en-US", { weekday: "short" }));

  const remove = ({ day, startMin, endMin }: DayPart) =>
    onCommit({
      add: [],
      remove: [
        {
          start: instantAt(weekStart, day, startMin),
          end: instantAt(weekStart, day, endMin),
        },
      ],
    });

  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-[11px] font-semibold tracking-wider text-muted uppercase">Your times</h2>
      {parts.length === 0 ? (
        <p className="text-[13px] text-muted">Nothing yet this week</p>
      ) : (
        <ul className="yourtimes-list">
          {parts.map((part) => {
            const span = `${formatMinutes(part.startMin)}–${formatMinutes(part.endMin)}`;
            return (
              <li key={`${part.day}-${part.startMin}`} className="yourtimes-row">
                <span className="yourtimes-day">{names[part.day]}</span>
                <span className="yourtimes-span">{span}</span>
                <button
                  type="button"
                  className="btn btn-ghost yourtimes-remove"
                  aria-label={`Remove ${names[part.day]} ${span}`}
                  onClick={() => remove(part)}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                    <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
