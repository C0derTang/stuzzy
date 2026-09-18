import { Avatar } from "@/components/Avatar";
import { Section } from "@/components/Section";
import type { User } from "@/lib/types";

export type PeoplePanelProps = {
  me: User;
  users: User[];
  /** Users currently counted in the heatmap. */
  included: Set<string>;
  /** Users with at least one free slot in the visible week. */
  activeIds: Set<string>;
  onToggle: (userId: string) => void;
};

/** The People checkbox list. Shared by the desktop sidebar and the mobile sheet. */
export function PeoplePanel({ me, users, included, activeIds, onToggle }: PeoplePanelProps) {
  const people = [...users.filter((u) => u.id === me.id), ...users.filter((u) => u.id !== me.id)];

  return (
    <Section title="People">
      {people.length === 0 ? (
        <p className="text-[13px] text-muted">No one here yet</p>
      ) : (
        <ul className="-mx-1.5 flex flex-col">
          {people.map((user) => {
            const active = activeIds.has(user.id);
            return (
              <li key={user.id}>
                <label className="people-row flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-control">
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
  );
}
