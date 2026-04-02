"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { OBD2DataPoint } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { BASE_LAYOUT, BASE_CONFIG, CHART_COLORS } from "@/lib/chartTheme";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";
import { detectWOTPulls } from "@/lib/data/wotDetection";
import { computeAccelBasedPower, computeMafBasedPower, PowerPoint } from "@/lib/data/hpTorqueCalc";
import { useTimeRange } from "@/hooks/useTimeRange";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface PowerTabProps {
  timeSeries: OBD2DataPoint[];
}

const PULL_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.amber,
  CHART_COLORS.emerald,
  CHART_COLORS.subaruRed,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  "rgba(168, 85, 247, 0.9)",   // purple
  "rgba(236, 72, 153, 0.9)",   // pink
  "rgba(20, 184, 166, 0.9)",   // teal
  "rgba(251, 146, 60, 0.9)",   // orange
];

function NoDataMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full text-sapphire-400 text-sm">
      {message}
    </div>
  );
}

export function PowerTab({ timeSeries }: PowerTabProps) {
  const { timeRange, isRangeActive } = useTimeRange();
  const [curbWeightKg, setCurbWeightKg] = useState<number | null>(null);
  const [selectedPulls, setSelectedPulls] = useState<Set<number>>(new Set());

  const filteredTimeSeries = useMemo(() => {
    if (!isRangeActive) return timeSeries;
    return timeSeries.filter(
      (d) => d.timestamp >= timeRange.start! && d.timestamp <= timeRange.end!
    );
  }, [timeSeries, timeRange, isRangeActive]);

  const pulls = useMemo(() => detectWOTPulls(filteredTimeSeries, "throttlePosition"), [filteredTimeSeries]);

  const pullPowerData = useMemo(() => {
    if (!curbWeightKg) return [];
    return pulls.map((pull, i) => ({
      pull,
      index: i,
      accelPower: computeAccelBasedPower(pull.points, curbWeightKg),
      mafPower: computeMafBasedPower(pull.points),
    }));
  }, [pulls, curbWeightKg]);

  // Initialize selectedPulls when pulls change
  useMemo(() => {
    if (pulls.length > 0 && selectedPulls.size === 0) {
      setSelectedPulls(new Set(pulls.map((_, i) => i)));
    }
  }, [pulls.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Find best pull (highest peak wheelHp)
  const bestPullData = useMemo(() => {
    if (pullPowerData.length === 0) return null;
    let bestIdx = 0;
    let bestPeak = 0;
    for (let i = 0; i < pullPowerData.length; i++) {
      const peak = Math.max(0, ...pullPowerData[i].accelPower.map((p) => p.wheelHp));
      if (peak > bestPeak) {
        bestPeak = peak;
        bestIdx = i;
      }
    }
    return pullPowerData[bestIdx];
  }, [pullPowerData]);

  // MAF-based power from filtered time series (shown even without weight)
  const mafPowerAll = useMemo(() => computeMafBasedPower(filteredTimeSeries), [filteredTimeSeries]);

  const togglePull = (index: number) => {
    setSelectedPulls((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const hasPulls = pulls.length > 0;
  const hasWeight = curbWeightKg !== null && curbWeightKg > 0;

  return (
    <div className="space-y-4">
      {/* Weight input */}
      <div className="flex items-center gap-3 pt-4 pb-2">
        <label className="text-xs text-sapphire-400 font-medium">Curb Weight (kg)</label>
        <input
          type="number"
          placeholder="e.g. 1451"
          className="w-32 px-2 py-1 rounded bg-sapphire-900/50 border border-sapphire-700/50 text-sapphire-200 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-sapphire-500/50"
          value={curbWeightKg ?? ""}
          onChange={(e) => setCurbWeightKg(e.target.value ? Number(e.target.value) : null)}
        />
      </div>

      {!hasWeight && (
        <p className="text-xs text-sapphire-400/70 italic px-1">
          Enter vehicle curb weight (kg) to enable power analysis
        </p>
      )}

      {/* Chart 1: Dyno Chart — HP + Torque vs RPM from best pull */}
      {hasWeight && (
        <ChartWrapper
          title="Dyno Chart (Best Pull)"
          height={300}
          tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.dynoChart} />}
        >
          {bestPullData && bestPullData.accelPower.length > 0 ? (
            <Plot
              data={[
                {
                  x: bestPullData.accelPower.map((p) => p.rpm),
                  y: bestPullData.accelPower.map((p) => p.wheelHp),
                  type: "scatter" as const,
                  mode: "lines" as const,
                  name: "Wheel HP",
                  line: { color: CHART_COLORS.primary, width: 2 },
                  yaxis: "y",
                },
                {
                  x: bestPullData.accelPower.map((p) => p.rpm),
                  y: bestPullData.accelPower.map((p) => p.wheelTorqueNm),
                  type: "scatter" as const,
                  mode: "lines" as const,
                  name: "Wheel Torque (Nm)",
                  line: { color: CHART_COLORS.amber, width: 2 },
                  yaxis: "y2",
                },
              ]}
              layout={{
                ...BASE_LAYOUT,
                height: 300,
                xaxis: { ...BASE_LAYOUT.xaxis, title: { text: "RPM", font: { size: 11, color: CHART_COLORS.textMuted } } },
                yaxis: { ...BASE_LAYOUT.yaxis, title: { text: "Wheel HP", font: { size: 11, color: CHART_COLORS.primary } } },
                yaxis2: {
                  title: { text: "Torque (Nm)", font: { size: 11, color: CHART_COLORS.amber } },
                  overlaying: "y",
                  side: "right",
                  gridcolor: CHART_COLORS.grid,
                  tickfont: { size: 10, color: CHART_COLORS.textMuted },
                },
                legend: { ...BASE_LAYOUT.legend, x: 0.02, y: 0.98 },
                margin: { l: 55, r: 55, t: 10, b: 45 },
              }}
              config={BASE_CONFIG}
              useResizeHandler
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <NoDataMessage message="No WOT pulls detected — need sustained >90% throttle with rising RPM" />
          )}
        </ChartWrapper>
      )}

      {/* Chart 2: Per-pull overlay — HP vs RPM with checkboxes */}
      {hasWeight && hasPulls && (
        <ChartWrapper
          title="Per-Pull HP Overlay"
          height={320}
          tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.dynoChart} />}
        >
          <div className="px-3 pt-1 pb-0 flex flex-wrap gap-x-4 gap-y-1">
            {pulls.map((pull, i) => (
              <label key={i} className="flex items-center gap-1.5 text-xs text-sapphire-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPulls.has(i)}
                  onChange={() => togglePull(i)}
                  className="accent-sapphire-500 w-3 h-3"
                />
                <span style={{ color: PULL_COLORS[i % PULL_COLORS.length] }}>
                  Pull {i + 1}
                  {pull.gear !== undefined ? ` (G${Math.round(pull.gear)})` : ""}
                </span>
              </label>
            ))}
          </div>
          <Plot
            data={pullPowerData
              .filter((d) => selectedPulls.has(d.index))
              .map((d) => ({
                x: d.accelPower.map((p) => p.rpm),
                y: d.accelPower.map((p) => p.wheelHp),
                type: "scatter" as const,
                mode: "lines" as const,
                name: `Pull ${d.index + 1}${d.pull.gear !== undefined ? ` (G${Math.round(d.pull.gear)})` : ""}`,
                line: { color: PULL_COLORS[d.index % PULL_COLORS.length], width: 1.5 },
              }))}
            layout={{
              ...BASE_LAYOUT,
              height: 280,
              xaxis: { ...BASE_LAYOUT.xaxis, title: { text: "RPM", font: { size: 11, color: CHART_COLORS.textMuted } } },
              yaxis: { ...BASE_LAYOUT.yaxis, title: { text: "Wheel HP", font: { size: 11, color: CHART_COLORS.textMuted } } },
              legend: { ...BASE_LAYOUT.legend, x: 0.02, y: 0.98 },
              showlegend: true,
            }}
            config={BASE_CONFIG}
            useResizeHandler
            style={{ width: "100%", height: "280px" }}
          />
        </ChartWrapper>
      )}

      {/* Chart 3: Power vs Gear — group pulls by gear */}
      {hasWeight && hasPulls && (
        <ChartWrapper
          title="Power vs Gear"
          height={300}
        >
          {(() => {
            const gearGroups = new Map<number, PowerPoint[]>();
            for (const d of pullPowerData) {
              const gear = d.pull.gear !== undefined ? Math.round(d.pull.gear) : 0;
              const existing = gearGroups.get(gear) ?? [];
              existing.push(...d.accelPower);
              gearGroups.set(gear, existing);
            }
            const sortedGears = [...gearGroups.keys()].sort((a, b) => a - b);
            if (sortedGears.length === 0) {
              return <NoDataMessage message="No gear data available in WOT pulls" />;
            }
            return (
              <Plot
                data={sortedGears.map((gear, i) => {
                  const pts = gearGroups.get(gear)!;
                  return {
                    x: pts.map((p) => p.rpm),
                    y: pts.map((p) => p.wheelHp),
                    type: "scatter" as const,
                    mode: "markers" as const,
                    name: gear === 0 ? "Unknown Gear" : `Gear ${gear}`,
                    marker: { color: PULL_COLORS[i % PULL_COLORS.length], size: 4, opacity: 0.7 },
                  };
                })}
                layout={{
                  ...BASE_LAYOUT,
                  height: 300,
                  xaxis: { ...BASE_LAYOUT.xaxis, title: { text: "RPM", font: { size: 11, color: CHART_COLORS.textMuted } } },
                  yaxis: { ...BASE_LAYOUT.yaxis, title: { text: "Wheel HP", font: { size: 11, color: CHART_COLORS.textMuted } } },
                  legend: { ...BASE_LAYOUT.legend, x: 0.02, y: 0.98 },
                  showlegend: true,
                }}
                config={BASE_CONFIG}
                useResizeHandler
                style={{ width: "100%", height: "100%" }}
              />
            );
          })()}
        </ChartWrapper>
      )}

      {/* Chart 4: Peak HP/Torque Trend — bar chart per pull */}
      {hasWeight && hasPulls && (
        <ChartWrapper
          title="Peak HP / Torque per Pull"
          height={280}
          tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.peakTrend} />}
        >
          {pullPowerData.length > 0 ? (
            <Plot
              data={[
                {
                  x: pullPowerData.map((d) => `Pull ${d.index + 1}`),
                  y: pullPowerData.map((d) =>
                    d.accelPower.length > 0 ? Math.max(...d.accelPower.map((p) => p.wheelHp)) : 0
                  ),
                  type: "bar" as const,
                  name: "Peak HP",
                  marker: { color: CHART_COLORS.primary },
                },
                {
                  x: pullPowerData.map((d) => `Pull ${d.index + 1}`),
                  y: pullPowerData.map((d) =>
                    d.accelPower.length > 0 ? Math.max(...d.accelPower.map((p) => p.wheelTorqueNm)) : 0
                  ),
                  type: "bar" as const,
                  name: "Peak Torque (Nm)",
                  marker: { color: CHART_COLORS.amber },
                  yaxis: "y2",
                },
              ]}
              layout={{
                ...BASE_LAYOUT,
                height: 280,
                barmode: "group",
                xaxis: { ...BASE_LAYOUT.xaxis },
                yaxis: { ...BASE_LAYOUT.yaxis, title: { text: "HP", font: { size: 11, color: CHART_COLORS.primary } } },
                yaxis2: {
                  title: { text: "Torque (Nm)", font: { size: 11, color: CHART_COLORS.amber } },
                  overlaying: "y",
                  side: "right",
                  gridcolor: CHART_COLORS.grid,
                  tickfont: { size: 10, color: CHART_COLORS.textMuted },
                },
                legend: { ...BASE_LAYOUT.legend, x: 0.02, y: 0.98 },
                margin: { l: 50, r: 55, t: 10, b: 40 },
              }}
              config={BASE_CONFIG}
              useResizeHandler
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <NoDataMessage message="No WOT pull data to display" />
          )}
        </ChartWrapper>
      )}

      {/* Chart 5: Power-to-Weight — scatter of wheelHp/weight vs vehicleSpeed */}
      {hasWeight && hasPulls && (
        <ChartWrapper
          title="Power-to-Weight Ratio"
          height={280}
          tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.powerToWeight} />}
        >
          {(() => {
            const allWotPower = pullPowerData.flatMap((d) => d.accelPower);
            const speeds: number[] = [];
            const ratios: number[] = [];
            for (const d of pullPowerData) {
              for (let i = 0; i < d.accelPower.length; i++) {
                const pt = d.pull.points[d.accelPower[i] ? Math.min(i, d.pull.points.length - 1) : 0];
                const speed = pt?.vehicleSpeed;
                if (typeof speed === "number" && speed > 0) {
                  speeds.push(speed);
                  ratios.push(d.accelPower[i].wheelHp / curbWeightKg!);
                }
              }
            }
            if (speeds.length === 0) {
              return <NoDataMessage message="No power-to-weight data available" />;
            }
            return (
              <Plot
                data={[
                  {
                    x: speeds,
                    y: ratios,
                    type: "scatter" as const,
                    mode: "markers" as const,
                    name: "HP/kg",
                    marker: { color: CHART_COLORS.primary, size: 4, opacity: 0.6 },
                  },
                ]}
                layout={{
                  ...BASE_LAYOUT,
                  height: 280,
                  xaxis: { ...BASE_LAYOUT.xaxis, title: { text: "Speed (km/h)", font: { size: 11, color: CHART_COLORS.textMuted } } },
                  yaxis: { ...BASE_LAYOUT.yaxis, title: { text: "HP / kg", font: { size: 11, color: CHART_COLORS.textMuted } } },
                  showlegend: false,
                }}
                config={BASE_CONFIG}
                useResizeHandler
                style={{ width: "100%", height: "100%" }}
              />
            );
          })()}
        </ChartWrapper>
      )}

      {/* MAF-based power chart — always visible (no weight required) */}
      <ChartWrapper
        title="MAF-Based Engine Power vs RPM"
        height={280}
      >
        {mafPowerAll.length > 0 ? (
          <Plot
            data={[
              {
                x: mafPowerAll.map((p) => p.rpm),
                y: mafPowerAll.map((p) => p.engineHp),
                type: "scatter" as const,
                mode: "markers" as const,
                name: "Engine HP (MAF)",
                marker: { color: CHART_COLORS.emerald, size: 3, opacity: 0.5 },
              },
            ]}
            layout={{
              ...BASE_LAYOUT,
              height: 280,
              xaxis: { ...BASE_LAYOUT.xaxis, title: { text: "RPM", font: { size: 11, color: CHART_COLORS.textMuted } } },
              yaxis: { ...BASE_LAYOUT.yaxis, title: { text: "Engine HP", font: { size: 11, color: CHART_COLORS.textMuted } } },
              showlegend: false,
            }}
            config={BASE_CONFIG}
            useResizeHandler
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <NoDataMessage message="No MAF data available for power estimation" />
        )}
      </ChartWrapper>
    </div>
  );
}
