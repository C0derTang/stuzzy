import type { CSSProperties } from "react";
import { Section } from "@/components/Section";

// Mirrors HeatLayer: alpha = 0.1 + 0.45 * (free / total).
const RAMP = [0.2, 0.32, 0.44, 0.55];

function LegendRow({ swatch, label }: { swatch: CSSProperties; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-xs text-muted">
      <span className="h-4 w-7 shrink-0 rounded-[5px]" style={swatch} />
      {label}
    </div>
  );
}

/** How to read the heatmap. Shared by the desktop sidebar and the mobile sheet. */
export function Legend() {
  return (
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
  );
}
