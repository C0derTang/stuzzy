import { useSyncExternalStore } from "react";
import { isSameDay } from "@/lib/time";
import { DAYS_PER_WEEK } from "@/lib/types";
import { minuteTop } from "./HeatLayer";

const MINUTE = 60_000;

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, MINUTE / 4);
  return () => clearInterval(id);
}
const getNow = () => Math.floor(Date.now() / MINUTE) * MINUTE;
const getServerNow = () => null;

/**
 * Current time, minute precision. Null on the server and while hydrating: the server's clock
 * and time zone are not the viewer's, so nothing time-dependent may be in the server HTML.
 */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getNow, getServerNow);
}

/** Current-time marker; renders only when today is one of `days`. Lives inside the day-columns container. */
export function NowLine({ days, now }: { days: Date[]; now: number | null }) {
  if (now === null) return null;
  const date = new Date(now);
  const day = days.findIndex((d) => isSameDay(d, date));
  if (day < 0) return null;
  const minutes = date.getHours() * 60 + date.getMinutes();
  return (
    <div
      className="grid-now"
      style={{
        top: minuteTop(minutes),
        left: `${(day / DAYS_PER_WEEK) * 100}%`,
        width: `${100 / DAYS_PER_WEEK}%`,
      }}
    />
  );
}
