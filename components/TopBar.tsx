"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";
import { Avatar } from "@/components/Avatar";
import { LogoMark } from "@/components/Logo";
import { formatWeekLabel } from "@/lib/time";
import type { User } from "@/lib/types";

export type TopBarProps = {
  me: User;
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d={dir === "left" ? "M10 3.5 5.5 8l4.5 4.5" : "M6 3.5 10.5 8 6 12.5"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** True when the key press belongs to a text control rather than the calendar. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (
    target.isContentEditable ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
    return true;
  return target instanceof HTMLInputElement && target.type !== "checkbox";
}

export function TopBar({
  me,
  weekStart,
  onPrev,
  onNext,
  onToday,
}: TopBarProps) {
  const { signOut } = useClerk();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.defaultPrevented ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.shiftKey ||
        isTyping(e.target)
      )
        return;
      if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
      else if (e.key === "t") onToday();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPrev, onNext, onToday]);

  return (
    <header className="glass flex h-14 shrink-0 items-center gap-2 px-3 sm:gap-3 sm:px-4">
      <div className="hidden items-center gap-2 sm:mr-2 sm:flex">
        <LogoMark />
        <span className="text-[15px] font-semibold tracking-tight">stuzzy</span>
      </div>
      <button type="button" className="btn" onClick={onToday} title="Today (T)">
        Today
      </button>
      <div className="flex items-center">
        <button
          type="button"
          className="btn btn-ghost w-9 px-0"
          onClick={onPrev}
          aria-label="Previous week"
          title="Previous week (←)"
        >
          <Chevron dir="left" />
        </button>
        <button
          type="button"
          className="btn btn-ghost w-9 px-0"
          onClick={onNext}
          aria-label="Next week"
          title="Next week (→)"
        >
          <Chevron dir="right" />
        </button>
      </div>
      <h1
        className="min-w-0 truncate text-sm font-medium whitespace-nowrap sm:text-lg"
        aria-live="polite"
      >
        {formatWeekLabel(weekStart)}
      </h1>
      <div className="ml-auto flex shrink-0 items-center gap-2.5">
        <span className="hidden sm:inline-flex">
          <Avatar user={me} size={28} />
        </span>
        <span className="hidden text-[13px] font-medium md:inline">
          {me.name.split(" ")[0]}
        </span>
        <button
          type="button"
          className="btn btn-ghost text-muted"
          aria-label="Sign out"
          title="Sign out"
          onClick={() => signOut({ redirectUrl: "/" })}
        >
          <span className="hidden sm:inline">Sign out</span>
          <svg
            className="sm:hidden"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
          >
            <path
              d="M6.5 2.5h-3v11h3M10.5 5l3 3-3 3M13 8H6.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
