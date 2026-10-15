

export function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] text-white/50 leading-tight truncate">{label}</p>
      <p className="text-sm font-bold text-[var(--gold)] mt-0.5">{value}</p>
    </div>
  );
}

