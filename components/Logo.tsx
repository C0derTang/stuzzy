// A 3×3 heatmap with one "everyone free" cell. 0 = accent, otherwise heat alpha.
const MARK = [0.2, 0.45, 0.2, 0.45, 0, 0.7, 0.2, 0.7, 0.45];

export function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden className="shrink-0">
      {MARK.map((alpha, i) => (
        <rect
          key={i}
          x={(i % 3) * 7}
          y={Math.floor(i / 3) * 7}
          width="6"
          height="6"
          rx="1.75"
          style={{ fill: alpha ? `rgb(var(--heat-rgb) / ${alpha})` : "var(--accent)" }}
        />
      ))}
    </svg>
  );
}
