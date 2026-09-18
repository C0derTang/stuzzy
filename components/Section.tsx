import type { ReactNode } from "react";

/** A labelled block inside the sidebar panel or the mobile sheet. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-[11px] font-semibold tracking-wider text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}
