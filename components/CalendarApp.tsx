"use client";

import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { WeekGrid } from "@/components/grid/WeekGrid";
import { bestTimes } from "@/lib/best-times";
import { computeRuns } from "@/lib/overlap";
import { addWeeks, startOfWeek } from "@/lib/time";
import type { User } from "@/lib/types";
import { useSlots } from "@/lib/useSlots";

const NO_USERS: User[] = [];
const NO_SLOTS: Record<string, number[]> = {};

export function CalendarApp({ me }: { me: User }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  // Explicit checkbox choices; everyone else defaults to "included when active this week".
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [now] = useState(() => Date.now());
  const { data, commit } = useSlots(weekStart, me.id);

  const users = data?.users ?? NO_USERS;
  const slots = data?.slots ?? NO_SLOTS;

  const activeIds = useMemo(
    () => new Set(users.filter((u) => slots[u.id]?.length).map((u) => u.id)),
    [users, slots],
  );
  const included = useMemo(
    () => new Set(users.filter((u) => overrides[u.id] ?? activeIds.has(u.id)).map((u) => u.id)),
    [users, overrides, activeIds],
  );
  const runs = useMemo(() => computeRuns(weekStart, slots, included), [weekStart, slots, included]);
  const best = useMemo(() => bestTimes(runs, weekStart, now), [runs, weekStart, now]);
  const mySlots = useMemo(() => new Set(slots[me.id]), [slots, me.id]);

  return (
    <div className="app-shell">
      <TopBar
        me={me}
        weekStart={weekStart}
        onPrev={() => setWeekStart((w) => addWeeks(w, -1))}
        onNext={() => setWeekStart((w) => addWeeks(w, 1))}
        onToday={() => setWeekStart(startOfWeek(new Date()))}
      />
      <div className="app-body">
        <Sidebar
          me={me}
          users={users}
          included={included}
          activeIds={activeIds}
          onToggle={(id) => setOverrides((o) => ({ ...o, [id]: !included.has(id) }))}
          bestTimes={best}
        />
        <WeekGrid
          weekStart={weekStart}
          me={me}
          users={users}
          included={included}
          runs={runs}
          mySlots={mySlots}
          onCommit={commit}
        />
      </div>
    </div>
  );
}
