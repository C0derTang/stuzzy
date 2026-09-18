"use client";

import { useMemo, useState } from "react";
import { AddTime } from "@/components/AddTime";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { WeekGrid } from "@/components/grid/WeekGrid";
import { bestTimes } from "@/lib/best-times";
import { computeRuns } from "@/lib/overlap";
import { addWeeks, startOfWeek } from "@/lib/time";
import type { Interval, User } from "@/lib/types";
import { useSlots } from "@/lib/useSlots";

const NO_USERS: User[] = [];
const NO_INTERVALS: Record<string, Interval[]> = {};
const NONE: Interval[] = [];

export function CalendarApp({ me }: { me: User }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  // Explicit checkbox choices; everyone else defaults to "included when active this week".
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [now] = useState(() => Date.now());
  // Mobile only: the sidebar is hidden, so the input box opens as a sheet.
  const [addOpen, setAddOpen] = useState(false);
  const { data, commit } = useSlots(weekStart, me.id);

  const users = data?.users ?? NO_USERS;
  const intervals = data?.intervals ?? NO_INTERVALS;

  const activeIds = useMemo(
    () => new Set(users.filter((u) => intervals[u.id]?.length).map((u) => u.id)),
    [users, intervals],
  );
  const included = useMemo(
    () => new Set(users.filter((u) => overrides[u.id] ?? activeIds.has(u.id)).map((u) => u.id)),
    [users, overrides, activeIds],
  );
  const runs = useMemo(() => computeRuns(weekStart, intervals, included), [weekStart, intervals, included]);
  const best = useMemo(() => bestTimes(runs, weekStart, now), [runs, weekStart, now]);
  const mine = intervals[me.id] ?? NONE;

  return (
    <div className="app-shell">
      <TopBar
        me={me}
        weekStart={weekStart}
        onPrev={() => setWeekStart((w) => addWeeks(w, -1))}
        onNext={() => setWeekStart((w) => addWeeks(w, 1))}
        onToday={() => setWeekStart(startOfWeek(new Date()))}
        onAdd={() => setAddOpen((o) => !o)}
      />
      <div className="app-body">
        <Sidebar
          me={me}
          users={users}
          included={included}
          activeIds={activeIds}
          onToggle={(id) => setOverrides((o) => ({ ...o, [id]: !included.has(id) }))}
          bestTimes={best}
          weekStart={weekStart}
          onCommit={commit}
        />
        <WeekGrid
          weekStart={weekStart}
          users={users}
          included={included}
          runs={runs}
          mine={mine}
          onCommit={commit}
        />
      </div>
      {addOpen && (
        <div className="add-sheet md:hidden" role="dialog" aria-label="Add free time">
          <AddTime weekStart={weekStart} onCommit={commit} onDone={() => setAddOpen(false)} />
        </div>
      )}
    </div>
  );
}
