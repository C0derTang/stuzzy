import { Avatar } from "@/components/Avatar";
import { formatRange } from "@/lib/time";
import type { BestTime, User } from "@/lib/types";

export type BestTimesProps = { items: BestTime[]; users: User[]; total: number };

const MAX_FACES = 6;

export function BestTimes({ items, users, total }: BestTimesProps) {
  if (items.length === 0) {
    return <p className="text-[13px] text-muted">No overlaps yet this week — add your free time.</p>;
  }
  const byId = new Map(users.map((u) => [u.id, u]));
  return (
    <ul className="flex flex-col gap-1.5">
      {items.slice(0, 5).map((item) => {
        const everyone = item.free.length === total;
        return (
          <li
            key={`${item.start}:${item.end}:${item.free.length}`}
            className="rounded-xl border border-line bg-control px-3 py-2"
          >
            <div className="text-[13px] font-medium">{formatRange(item.start, item.end)}</div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className={`text-xs tabular-nums ${everyone ? "font-semibold text-accent" : "text-muted"}`}>
                {item.free.length}/{total} free
              </span>
              <span className="flex pl-1.5">
                {item.free.slice(0, MAX_FACES).map((id) => {
                  const user = byId.get(id);
                  return user ? (
                    <span key={id} className="-ml-1.5 flex rounded-full ring-2 ring-bg">
                      <Avatar user={user} size={20} />
                    </span>
                  ) : null;
                })}
                {item.free.length > MAX_FACES && (
                  <span className="ml-1 self-center text-[11px] text-muted">+{item.free.length - MAX_FACES}</span>
                )}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
