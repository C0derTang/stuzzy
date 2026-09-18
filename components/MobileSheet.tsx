"use client";

import { type KeyboardEvent, type RefObject, useEffect, useId, useRef } from "react";
import { AddTime } from "@/components/AddTime";
import { BestTimes } from "@/components/BestTimes";
import { Legend } from "@/components/Legend";
import { PeoplePanel } from "@/components/PeoplePanel";
import { Section } from "@/components/Section";
import { YourTimes } from "@/components/YourTimes";
import type { BestTime, Interval, SlotsPatch, User } from "@/lib/types";

/** Which half of the hidden sidebar the sheet is showing. */
export type SheetTab = "times" | "people";

const TABS: { id: SheetTab; label: string }[] = [
  { id: "times", label: "Times" },
  { id: "people", label: "People" },
];

export type MobileSheetProps = {
  tab: SheetTab;
  onTabChange: (tab: SheetTab) => void;
  onClose: () => void;
  /** The top bar's "+" button; focus goes back to it when the sheet closes. */
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  me: User;
  users: User[];
  included: Set<string>;
  activeIds: Set<string>;
  onToggle: (userId: string) => void;
  bestTimes: BestTime[];
  weekStart: Date;
  mine: Interval[];
  onCommit: (patch: SlotsPatch) => void;
};

/**
 * Phone-only bottom sheet holding everything the hidden sidebar would show.
 * Mounted only while open, so the mount/unmount effects double as open/close hooks.
 */
export function MobileSheet({
  tab,
  onTabChange,
  onClose,
  returnFocusRef,
  me,
  users,
  included,
  activeIds,
  onToggle,
  bestTimes,
  weekStart,
  mine,
  onCommit,
}: MobileSheetProps) {
  const id = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const tablistRef = useRef<HTMLDivElement>(null);

  // Move focus into the sheet on open and hand it back to the trigger on close.
  useEffect(() => {
    const trigger = returnFocusRef.current;
    sheetRef.current?.focus();
    return () => trigger?.focus();
  }, [returnFocusRef]);

  // Escape closes; `preventDefault` keeps the top bar's week shortcuts out of it.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      e.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock the page behind the sheet so only the sheet body scrolls.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const onTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = tab === "times" ? "people" : "times";
    onTabChange(next);
    tablistRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${next}"]`)?.focus();
  };

  return (
    // Both halves are position:fixed, so `md:hidden` goes on each one rather than
    // on a wrapper, which would sit in `.app-shell`'s flex flow and add a gap.
    <>
      {/* Pointer-only: Escape and the close button are the accessible ways out. */}
      <div className="sheet-backdrop md:hidden" role="presentation" onClick={onClose} />
      <div
        ref={sheetRef}
        className="sheet md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Your times and people"
        tabIndex={-1}
      >
        <span className="sheet-handle" aria-hidden />

        <div className="sheet-head">
          <div
            ref={tablistRef}
            className="sheet-tabs"
            role="tablist"
            aria-label="Sheet sections"
            onKeyDown={onTabKeyDown}
          >
            {TABS.map(({ id: tabId, label }) => {
              const selected = tabId === tab;
              return (
                <button
                  key={tabId}
                  type="button"
                  role="tab"
                  data-tab={tabId}
                  id={`${id}-${tabId}-tab`}
                  className="sheet-tab"
                  aria-selected={selected}
                  /* Only the selected tab's panel is mounted. */
                  aria-controls={selected ? `${id}-${tabId}-panel` : undefined}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => onTabChange(tabId)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <button type="button" className="btn btn-ghost sheet-close" aria-label="Close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div
          className="sheet-body"
          role="tabpanel"
          id={`${id}-${tab}-panel`}
          aria-labelledby={`${id}-${tab}-tab`}
          tabIndex={0}
        >
          {tab === "times" ? (
            <div className="flex flex-col gap-5">
              <AddTime weekStart={weekStart} onCommit={onCommit} />
              <YourTimes weekStart={weekStart} mine={mine} onCommit={onCommit} />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <PeoplePanel me={me} users={users} included={included} activeIds={activeIds} onToggle={onToggle} />
              <Section title="Best times">
                <BestTimes items={bestTimes} users={users} total={included.size} />
              </Section>
              <Legend />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
