"use client";

import { AddTime } from "@/components/AddTime";
import { BestTimes } from "@/components/BestTimes";
import { Legend } from "@/components/Legend";
import { PeoplePanel } from "@/components/PeoplePanel";
import { Section } from "@/components/Section";
import { YourTimes } from "@/components/YourTimes";
import type { BestTime, Interval, SlotsPatch, User } from "@/lib/types";

export type SidebarProps = {
  me: User;
  users: User[];
  /** Users currently counted in the heatmap. */
  included: Set<string>;
  /** Users with at least one free slot in the visible week. */
  activeIds: Set<string>;
  onToggle: (userId: string) => void;
  bestTimes: BestTime[];
  /** For the AddTime and YourTimes panels at the top of the sidebar. */
  weekStart: Date;
  /** The signed-in user's free intervals in the visible week. */
  mine: Interval[];
  onCommit: (patch: SlotsPatch) => void;
};

export function Sidebar({
  me,
  users,
  included,
  activeIds,
  onToggle,
  bestTimes,
  weekStart,
  mine,
  onCommit,
}: SidebarProps) {
  return (
    <aside className="hidden w-[260px] shrink-0 flex-col gap-3 overflow-y-auto md:flex">
      {/* Each panel carries its own heading, styled like the section titles below. */}
      <div className="glass shrink-0 p-4">
        <AddTime weekStart={weekStart} onCommit={onCommit} />
      </div>

      <div className="glass shrink-0 p-4">
        <YourTimes weekStart={weekStart} mine={mine} onCommit={onCommit} />
      </div>

      <div className="glass flex shrink-0 flex-col gap-6 p-4">
        <PeoplePanel me={me} users={users} included={included} activeIds={activeIds} onToggle={onToggle} />

        <Section title="Best times">
          <BestTimes items={bestTimes} users={users} total={included.size} />
        </Section>

        <Legend />
      </div>
    </aside>
  );
}
