interface InsufficientDataProps {
  available: number;
  total: number;
  height?: number;
  onForceRender?: () => void;
}

/** Percentage of total data points below which a chart shows this message instead. */
export const INSUFFICIENT_DATA_THRESHOLD = 0.05;

export function InsufficientData({ available, total, height = 300, onForceRender }: InsufficientDataProps) {
  const pct = total > 0 ? ((available / total) * 100).toFixed(1) : "0";

  return (
    <div
      data-insufficient
      className="flex flex-col items-center justify-center gap-2 text-sapphire-400/70"
      style={{ height }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 opacity-50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
        />
      </svg>
      <p className="text-sm font-medium">Not enough data points</p>
      <p className="text-xs opacity-60">
        {available} of {total} points available ({pct}%)
      </p>
      {onForceRender && (
        <button
          onClick={onForceRender}
          className="mt-1 rounded-md border border-sapphire-400/30 px-3 py-1 text-xs font-medium text-sapphire-300 transition-colors hover:border-sapphire-400/60 hover:bg-sapphire-400/10"
        >
          Plot anyway
        </button>
      )}
    </div>
  );
}
