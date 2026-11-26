export function ProgressRing({
  value,
  size = 92,
  stroke = 8,
  tone = "teal",
  children,
}: {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  tone?: "teal" | "gold";
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const color = tone === "gold" ? "var(--nx-gold)" : "var(--nx-teal)";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ overflow: "visible" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          style={{ transition: "stroke-dashoffset .9s cubic-bezier(.2,.7,.2,1)", filter: `drop-shadow(0 0 4px color-mix(in oklab, ${color} 60%, transparent))` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
