"use client";

import { cn } from "@/lib/utils";
import { CategoryIcon, CATEGORY_LABELS } from "@/components/ui/CategoryIcon";
import { CategoryMetrics } from "./CategoryMetrics";
import type { CategoryMetricsType } from "@/types";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  motion: "Vehicle speed, distance traveled, and driving behavior patterns",
  engine: "Engine RPM, load, timing, and temperature readings",
  fuel: "Fuel consumption rates, economy metrics, and trim values",
  airIntake: "Mass air flow, boost pressure, throttle, and intake data",
  power: "Estimated engine power output from fuel and MAF calculations",
  transmission: "CVT fluid temperature, gear ratios, and pulley speeds",
  abs: "Individual wheel speed sensors and steering angle data",
  awd: "All-wheel drive transfer case solenoid current readings",
  electrical: "Battery voltage levels and electrical system health",
};

interface CategoryPanelProps {
  category: string;
  metrics: CategoryMetricsType;
}

export function CategoryPanel({ category, metrics }: CategoryPanelProps) {
  const metricsRecord = metrics as unknown as Record<string, number | null>;
  const hasData = Object.values(metricsRecord).some(
    (v) => v !== null && v !== undefined
  );

  return (
    <div className="space-y-5">
      {/* ── Category header ── */}
      <div className="flex items-start gap-3.5 px-0.5">
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl shrink-0",
            "bg-sapphire-800/50 border border-sapphire-700/25",
            "text-sapphire-400"
          )}
        >
          <CategoryIcon category={category} size={20} />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold text-sapphire-100 leading-tight">
            {CATEGORY_LABELS[category]}
          </h2>
          <p className="text-xs text-sapphire-500 mt-0.5 leading-relaxed">
            {CATEGORY_DESCRIPTIONS[category]}
          </p>
        </div>
      </div>

      {/* ── Metrics or empty state ── */}
      {hasData ? (
        <CategoryMetrics category={category} metrics={metrics} />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-2xl mb-4",
              "bg-sapphire-900/60 border border-sapphire-800/40",
              "text-sapphire-700"
            )}
          >
            <CategoryIcon category={category} size={28} />
          </div>
          <p className="text-sm font-medium text-sapphire-500 text-center">
            No data available
          </p>
          <p className="text-xs text-sapphire-600 mt-1 text-center max-w-[280px]">
            This category had no sensor readings in the uploaded file.
          </p>
        </div>
      )}
    </div>
  );
}
