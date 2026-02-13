"use client";

import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: number | null;
  unit: string;
  description?: string;
  /** Optional color override: "green" | "amber" | "red" | "default" */
  color?: "green" | "amber" | "red" | "default";
  /** Animation delay index for staggered fade-up (0-8) */
  delayIndex?: number;
}

const VALUE_COLOR_MAP: Record<string, string> = {
  green: "text-accent-emerald-400",
  amber: "text-accent-amber-400",
  red: "text-accent-red-400",
};

const BORDER_COLOR_MAP: Record<string, string> = {
  red: "border-accent-red-500/20 hover:border-accent-red-500/30",
  amber: "border-accent-amber-500/15 hover:border-accent-amber-500/25",
  default: "border-[rgba(54,112,198,0.12)] hover:border-[rgba(54,112,198,0.22)]",
};

const ACCENT_EDGE_MAP: Record<string, string> = {
  red: "bg-accent-red-400/60",
  amber: "bg-accent-amber-400/40",
  default: "bg-sapphire-500/0 group-hover:bg-sapphire-500/30",
};

function getValueColor(color: string): string {
  return VALUE_COLOR_MAP[color] ?? "text-sapphire-100";
}

export function MetricCard({
  label,
  value,
  unit,
  description,
  color = "default",
  delayIndex = 0,
}: MetricCardProps) {
  const isNull = value === null || value === undefined;

  let formattedValue: string;
  if (isNull) {
    formattedValue = "—";
  } else if (!Number.isInteger(value)) {
    formattedValue = value.toFixed(2);
  } else {
    formattedValue = value.toString();
  }

  const delayClass = `delay-${Math.min(delayIndex, 8)}`;

  return (
    /* Outer wrapper: staggered fade-up animation */
    <div className={cn("animate-fade-up opacity-0", delayClass)}>
      {/* Inner card: hover interactions (scale on md+ desktop only), 44px min touch area */}
      <div
        className={cn(
          "group relative overflow-hidden rounded-xl p-4 sm:p-5",
          "bg-sapphire-900/40 backdrop-blur-sm",
          "border min-h-[80px]",
          "transition-all duration-200 ease-out",
          "hover:bg-sapphire-900/55",
          "hover:shadow-[0_4px_20px_rgba(10,22,40,0.5)]",
          "md:hover:scale-[1.02] md:hover:-translate-y-0.5",
          BORDER_COLOR_MAP[color] ?? BORDER_COLOR_MAP.default
        )}
      >
        {/* Pearl edge highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(184,212,240,0.08)] to-transparent"
          aria-hidden="true"
        />

        {/* Warning indicator dot */}
        {color === "red" && (
          <div className="absolute top-3.5 right-3.5" aria-hidden="true">
            <span className="indicator-red" />
          </div>
        )}

        {/* Label */}
        <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-sapphire-400 mb-2 sm:mb-3">
          {label}
        </p>

        {/* Value + Unit */}
        <div className="flex items-baseline gap-1 sm:gap-1.5">
          <span
            className={cn(
              "font-mono text-xl sm:text-2xl font-semibold tracking-tight",
              isNull ? "text-sapphire-600" : getValueColor(color)
            )}
          >
            {formattedValue}
          </span>
          {!isNull && unit && (
            <span className="text-[10px] sm:text-xs font-medium text-sapphire-500 uppercase tracking-wide">
              {unit}
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-sapphire-500 leading-relaxed">
            {description}
          </p>
        )}

        {/* Left accent edge — warning states persist, default only on hover */}
        <div
          className={cn(
            "pointer-events-none absolute left-0 top-0 bottom-0 w-[2px] transition-colors duration-300",
            ACCENT_EDGE_MAP[color] ?? ACCENT_EDGE_MAP.default
          )}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
