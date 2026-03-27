interface CobbStatCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
}

export function CobbStatCard({ label, value, unit }: CobbStatCardProps) {
  const display =
    value != null ? `${value}${unit ? ` ${unit}` : ""}` : "—";
  return (
    <div className="rounded-lg bg-sapphire-900/40 border border-glass-edge p-3">
      <p className="text-xs text-sapphire-500 mb-1">{label}</p>
      <p className="text-lg font-mono font-semibold text-sapphire-100">{display}</p>
    </div>
  );
}
