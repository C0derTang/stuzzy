"use client";

import { type FormEvent, useEffect, useId, useState } from "react";
import { formatMinutes, instantAt, isSameDay, weekDays } from "@/lib/time";
import type { Interval, SlotsPatch } from "@/lib/types";

export type AddTimeProps = {
  weekStart: Date;
  /** Adds exact minute ranges of the signed-in user's free time in the visible week. */
  onCommit: (patch: SlotsPatch) => void;
  /** Present only in the mobile sheet; call after a successful Add so the sheet can close. */
  onDone?: () => void;
};

const NOTICE_MS = 2000;
const DEFAULT_FROM = "14:00";
const DEFAULT_TO = "16:00";

/** "14:05" → 845; null for an empty or partial value. */
function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** "2:15–3:50 PM" / "11:30 AM–1:00 PM" */
function formatSpan(fromMin: number, toMin: number): string {
  const from = formatMinutes(fromMin);
  const to = formatMinutes(toMin);
  const sameHalf = from.slice(-2) === to.slice(-2);
  return `${sameHalf ? from.slice(0, -3) : from}–${to}`;
}

export function AddTime({ weekStart, onCommit, onDone }: AddTimeProps) {
  const id = useId();
  const [today] = useState(() => new Date());
  const [days, setDays] = useState<number[]>(() => {
    const index = weekDays(weekStart).findIndex((d) => isSameDay(d, today));
    return index >= 0 ? [index] : [];
  });
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(DEFAULT_TO);
  const [notice, setNotice] = useState<{ id: number; text: string } | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const dates = weekDays(weekStart);
  const fromMin = parseTime(from);
  const toMin = parseTime(to);
  const ordered = fromMin !== null && toMin !== null && toMin > fromMin;
  const inverted = fromMin !== null && toMin !== null && toMin <= fromMin;
  const canSubmit = ordered && days.length > 0;

  const toggleDay = (day: number) =>
    setDays((cur) => (cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day].sort((a, b) => a - b)));

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || fromMin === null || toMin === null) return;
    const intervals: Interval[] = days.map((day) => ({
      start: instantAt(weekStart, day, fromMin),
      end: instantAt(weekStart, day, toMin),
    }));
    onCommit({ add: intervals, remove: [] });
    const names = days.map((day) => dates[day].toLocaleDateString("en-US", { weekday: "short" })).join(", ");
    const text = `Added ${names} ${formatSpan(fromMin, toMin)}`;
    setNotice((cur) => ({ id: (cur?.id ?? 0) + 1, text }));
    onDone?.();
  };

  return (
    <form className="flex flex-col gap-2.5" onSubmit={onSubmit} aria-describedby={`${id}-status`}>
      <h2 className="text-[11px] font-semibold tracking-wider text-muted uppercase">Add free time</h2>

      <div className="addtime-days" role="group" aria-label="Days">
        {dates.map((date, day) => {
          const selected = days.includes(day);
          const isToday = isSameDay(date, today);
          return (
            <button
              key={day}
              type="button"
              className={`addtime-chip${isToday ? " is-today" : ""}`}
              aria-pressed={selected}
              aria-label={date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
              onClick={() => toggleDay(day)}
            >
              <span aria-hidden>{date.toLocaleDateString("en-US", { weekday: "narrow" })}</span>
              <span className="addtime-chip-date" aria-hidden>
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label htmlFor={`${id}-from`} className="flex flex-col gap-1 text-[11px] text-muted">
          From
          <input
            id={`${id}-from`}
            type="time"
            step="60"
            required
            className="addtime-input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label htmlFor={`${id}-to`} className="flex flex-col gap-1 text-[11px] text-muted">
          To
          <input
            id={`${id}-to`}
            type="time"
            step="60"
            required
            className="addtime-input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-invalid={inverted || undefined}
          />
        </label>
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={!canSubmit}>
        Add
      </button>

      <p id={`${id}-status`} className="addtime-status text-[12px] text-muted" aria-live="polite">
        {inverted ? (
          "End must be after start"
        ) : notice ? (
          <span key={notice.id} className="addtime-notice">
            {notice.text}
          </span>
        ) : null}
      </p>
    </form>
  );
}
