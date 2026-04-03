"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { OBD2DataPoint, CobbBoostMetrics } from "@/types";
import { ChartWrapper } from "@/components/ui/ChartWrapper";
import { TimeSeriesChart } from "@/components/features/charts/TimeSeriesChart";
import { ScatterChart } from "@/components/features/charts/ScatterChart";
import { HistogramChart } from "@/components/features/charts/HistogramChart";
import { BASE_LAYOUT, BASE_CONFIG, CHART_COLORS } from "@/lib/chartTheme";
import { CobbStatCard } from "@/components/features/tabs/CobbStatCard";
import { MetricTooltip } from "@/components/ui/MetricTooltip";
import { METRIC_TOOLTIPS } from "@/lib/data/metricTooltips";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface CobbBoostTabProps {
  timeSeries: OBD2DataPoint[];
  stats: CobbBoostMetrics;
}

// FA24 turbo: displacement = 2.387L
const DISPLACEMENT_M3 = 0.002387;
const AIR_DENSITY = 1.225;

export function CobbBoostTab({ timeSeries, stats }: CobbBoostTabProps) {
  const startTime = timeSeries[0]?.timestamp ?? 0;

  const veData = useMemo(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    for (const d of timeSeries) {
      if (
        typeof d.engineRpm !== "number" ||
        typeof d.mafAirFlowRate !== "number" ||
        d.engineRpm < 500
      )
        continue;
      // VE = (MAF_kg_s × 120) / (RPM × displacement × airDensity) × 100
      const mafKgS = d.mafAirFlowRate / 1000; // g/s → kg/s
      const ve = (mafKgS * 120) / (d.engineRpm * DISPLACEMENT_M3 * AIR_DENSITY) * 100;
      xs.push(d.engineRpm);
      ys.push(ve);
    }
    return { xs, ys };
  }, [timeSeries]);

  const boostErrorValues = useMemo(
    () =>
      timeSeries
        .filter((d) => typeof d.tdBoostErrorPsi === "number")
        .map((d) => d.tdBoostErrorPsi!),
    [timeSeries],
  );

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <CobbStatCard label="Avg Boost" value={stats.avgBoostPsi} unit="psi" />
        <CobbStatCard label="Max Boost" value={stats.maxBoostPsi} unit="psi" />
        <CobbStatCard label="Avg Target" value={stats.avgTargetBoostPsi} unit="psi" />
        <CobbStatCard label="Max Target" value={stats.maxTargetBoostPsi} unit="psi" />
        <CobbStatCard label="Avg Error" value={stats.avgBoostErrorPsi} unit="psi" />
        <CobbStatCard label="Max Error" value={stats.maxBoostErrorPsi} unit="psi" />
      </div>

      {/* Chart 1: MAF + Throttle + Manifold Pressure */}
      <ChartWrapper title="MAF, Throttle & Manifold Pressure" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbBoost} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "mafAirFlowRate", name: "MAF (g/s)", color: CHART_COLORS.primary },
            { field: "accelPosition", name: "Throttle (%)", color: CHART_COLORS.amber, yaxis: "y2" },
            { field: "manifoldAbsPressPsi", name: "MAP (psi)", color: CHART_COLORS.quaternary, yaxis: "y2" },
          ]}
          yAxisLabel="MAF (g/s)"
          y2AxisLabel="Throttle / MAP"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Chart 2: Boost + Target + Error */}
      <ChartWrapper title="Boost Pressure — Actual, Target & Error" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbBoostError} />}>
        <TimeSeriesChart
          data={timeSeries}
          traces={[
            { field: "boostPsi", name: "Actual (psi)", color: CHART_COLORS.primary },
            { field: "targetBoostFinalRelPsi", name: "Target (psi)", color: CHART_COLORS.amber },
            { field: "tdBoostErrorPsi", name: "Error (psi)", color: CHART_COLORS.subaruRed, yaxis: "y2" },
          ]}
          yAxisLabel="Boost (psi)"
          y2AxisLabel="Error (psi)"
          height={280}
          startTime={startTime}
        />
      </ChartWrapper>

      {/* Chart 3: Boost vs RPM colored by gear */}
      <ChartWrapper title="Boost vs RPM (by Gear)" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbBoostVsRpmGear} />}>
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="boostPsi"
          colorField="gearPosition"
          xLabel="RPM"
          yLabel="Boost (psi)"
          height={280}
        />
      </ChartWrapper>

      {/* Chart 4: Volumetric Efficiency vs RPM */}
      <ChartWrapper title="Volumetric Efficiency vs RPM" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.volumetricEfficiency} />}>
        {veData.xs.length > 0 ? (
          <Plot
            data={[
              {
                x: veData.xs,
                y: veData.ys,
                type: "scattergl" as const,
                mode: "markers" as const,
                marker: { color: CHART_COLORS.quaternary, size: 3, opacity: 0.6 },
                hovertemplate: "RPM: %{x:.0f}<br>VE: %{y:.1f}%<extra></extra>",
              },
            ]}
            layout={{
              ...BASE_LAYOUT,
              height: 280,
              xaxis: { ...BASE_LAYOUT.xaxis, title: { text: "RPM", font: { size: 10, color: CHART_COLORS.textMuted } } },
              yaxis: { ...BASE_LAYOUT.yaxis, title: { text: "VE (%)", font: { size: 10, color: CHART_COLORS.textMuted } } },
            }}
            config={BASE_CONFIG as Plotly.Config}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler
          />
        ) : (
          <div data-chart-empty className="hidden" />
        )}
      </ChartWrapper>

      {/* Chart 5: IAT Heat Soak */}
      <ChartWrapper title="Intake Air Temperature — Heat Soak" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.iatHeatSoak} />}>
        <ScatterChart
          data={timeSeries}
          xField="timestamp"
          yField="intakeTempManifold"
          colorField="calculatedLoadGRev"
          xLabel="Time"
          yLabel="IAT (°C)"
          height={280}
        />
      </ChartWrapper>

      {/* Chart 6: Boost Error Histogram */}
      <ChartWrapper title="Boost Error Distribution" height={260} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.cobbBoostErrorHist} />}>
        <HistogramChart
          data={boostErrorValues}
          xLabel="Boost Error (psi)"
          height={260}
        />
      </ChartWrapper>

      {/* Chart 7: MAF vs RPM */}
      <ChartWrapper title="MAF vs RPM" height={280} tooltipContent={<MetricTooltip content={METRIC_TOOLTIPS.mafVsRpm} />}>
        <ScatterChart
          data={timeSeries}
          xField="engineRpm"
          yField="mafAirFlowRate"
          xLabel="RPM"
          yLabel="MAF (g/s)"
          height={280}
        />
      </ChartWrapper>
    </div>
  );
}
