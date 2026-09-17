"use client";

import type { CSSProperties, ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { BestTimes } from "@/components/BestTimes";
import type { BestTime, User } from "@/lib/types";

export type SidebarProps = {
  me: User;
  users: User[];
  /** Users currently counted in the heatmap. */
  included: Set<string>;
  /** Users with at least one free slot in the visible week. */
  activeIds: Set<string>;
  onToggle: (userId: string) => void;
  bestTimes: BestTime[];
};

// Mirrors HeatLayer: alpha = 0.1 + 0.45 * (free / total).
const RAMP = [0.2, 0.32, 0.44, 0.55];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-[11px] font-semibold tracking-wider text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

function LegendRow({ swatch, label }: { swatch: CSSProperties; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-muted">
      <span className="h-4 w-7 shrink-0 rounded-[5px]" style={swatch} />
      {label}
    </div>
  );
}

export function Sidebar({ me, users, included, activeIds, onToggle, bestTimes }: SidebarProps) {
  const people = [...users.filter((u) => u.id === me.id), ...users.filter((u) => u.id !== me.id)];

  return (
    <aside className="glass hidden w-[260px] shrink-0 flex-col gap-6 overflow-y-auto p-4 md:flex">
      <Section title="People">
        {people.length === 0 ? (
          <p className="text-[13px] text-muted">No one here yet</p>
        ) : (
          <ul className="-mx-1.5 flex flex-col">
            {people.map((user) => {
              const active = activeIds.has(user.id);
              return (
                <li key={user.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-control">
                    <input
                      type="checkbox"
                      className="check"
                      checked={included.has(user.id)}
                      onChange={() => onToggle(user.id)}
                    />
                    <Avatar user={user} size={24} dimmed={!active} />
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-[13px] font-medium" title={user.name}>
                        {user.id === me.id ? "You" : user.name}
                      </span>
                      {!active && <span className="text-[11px] text-muted">no times this week</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Best times">
        <BestTimes items={bestTimes} users={users} total={included.size} />
      </Section>

      <Section title="Legend">
        <div className="flex flex-col gap-1">
          <div className="flex gap-0.5">
            {RAMP.map((alpha) => (
              <span
                key={alpha}
                className="h-4 flex-1 first:rounded-l-[5px] last:rounded-r-[5px]"
                style={{ background: `rgb(var(--heat-rgb) / ${alpha})` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-muted">
            <span>1 free</span>
            <span>most</span>
          </div>
        </div>
        <LegendRow
          label="Everyone free"
          swatch={{
            background: "rgb(var(--accent-rgb) / 0.85)",
            boxShadow: "0 0 10px rgb(var(--accent-rgb) / 0.55)",
          }}
        />
        <LegendRow
          label="Your free time"
          swatch={{
            borderLeft: "2px solid var(--accent)",
            outline: "1px solid rgb(var(--accent-rgb) / 0.35)",
            outlineOffset: "-1px",
            background: "rgb(var(--heat-rgb) / 0.12)",
          }}
        />
      </Section>
    </aside>
  );
}
