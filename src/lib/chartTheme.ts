import type { Layout, Config, Shape } from "plotly.js";
import type { OBD2DataPoint, EventMarker } from "@/types";

/**
 * Shared Plotly theme configuration matching the sapphire glass-morphism design system.
 * All charts use these as base layout/config, with per-chart overrides.
 */

export const CHART_COLORS = {
  primary: "rgba(54, 112, 198, 0.9)",       // sapphire-500
  primaryFill: "rgba(54, 112, 198, 0.15)",   // sapphire-500 transparent fill
  secondary: "rgba(90, 146, 219, 0.9)",      // sapphire-400
  tertiary: "rgba(137, 180, 232, 0.9)",      // sapphire-300
  quaternary: "rgba(16, 185, 129, 0.9)",     // emerald-500
  subaruRed: "#E0202C",
  subaruRedFill: "rgba(224, 32, 44, 0.15)",
  subaruRedMedium: "rgba(224, 32, 44, 0.4)",
  amber: "rgba(245, 158, 11, 0.9)",          // amber-500
  amberFill: "rgba(245, 158, 11, 0.15)",
  emerald: "rgba(16, 185, 129, 0.9)",        // emerald-500
  emeraldFill: "rgba(16, 185, 129, 0.15)",
  text: "rgba(184, 212, 240, 0.9)",          // sapphire-200
  textMuted: "rgba(137, 180, 232, 0.5)",     // sapphire-300 muted
  grid: "rgba(22, 48, 96, 0.5)",             // sapphire-800
  background: "rgba(0,0,0,0)",               // transparent
} as const;

export const BASE_LAYOUT: Partial<Layout> = {
  paper_bgcolor: CHART_COLORS.background,
  plot_bgcolor: CHART_COLORS.background,
  font: {
    family: "var(--font-geist-sans), system-ui, sans-serif",
    color: CHART_COLORS.text,
    size: 11,
  },
  margin: { l: 50, r: 20, t: 10, b: 40 },
  xaxis: {
    gridcolor: CHART_COLORS.grid,
    zerolinecolor: CHART_COLORS.grid,
    tickfont: { size: 10, color: CHART_COLORS.textMuted },
  },
  yaxis: {
    gridcolor: CHART_COLORS.grid,
    zerolinecolor: CHART_COLORS.grid,
    tickfont: { size: 10, color: CHART_COLORS.textMuted },
  },
  hoverlabel: {
    bgcolor: "rgba(15, 34, 64, 0.95)",
    bordercolor: "rgba(54, 112, 198, 0.3)",
    font: {
      family: "var(--font-geist-sans), system-ui, sans-serif",
      color: CHART_COLORS.text,
      size: 12,
    },
  },
  legend: {
    font: { size: 10, color: CHART_COLORS.textMuted },
    bgcolor: "rgba(0,0,0,0)",
    borderwidth: 0,
  },
  dragmode: "zoom",
  hovermode: "x unified",
};

export const BASE_CONFIG: Partial<Config> = {
  displayModeBar: true,
  displaylogo: false,
  modeBarButtonsToRemove: [
    "lasso2d",
    "select2d",
    "autoScale2d",
    "toggleSpikelines",
  ] as Plotly.ModeBarDefaultButtons[],
  responsive: true,
};

/**
 * Format a Unix timestamp (seconds) to a human-readable time string.
 * Used for chart axis labels and hover text.
 */
export function formatTimestamp(seconds: number, startTime: number): string {
  const elapsed = seconds - startTime;
  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Create driving event markers (harsh braking + rapid acceleration) from time series data.
 */
export function createDrivingEventMarkers(timeSeries: OBD2DataPoint[]): EventMarker[] {
  const markers: EventMarker[] = [];
  for (const d of timeSeries) {
    if (d.vehicleAcceleration === undefined) continue;
    if (d.vehicleAcceleration < -0.4) {
      markers.push({ timestamp: d.timestamp, color: CHART_COLORS.subaruRed, label: "Harsh braking" });
    } else if (d.vehicleAcceleration > 0.3) {
      markers.push({ timestamp: d.timestamp, color: CHART_COLORS.amber, label: "Rapid acceleration" });
    }
  }
  return markers;
}

/**
 * Create threshold shape annotations for Plotly layout.
 * Returns Plotly shape objects for warning and danger bands.
 */
export function createThresholdShapes(
  yWarning: [number, number] | [number, number][],
  yDanger: [number, number] | [number, number][],
): Partial<Shape>[] {
  const shapes: Partial<Shape>[] = [];

  const warningRanges = Array.isArray(yWarning[0]) ? yWarning as [number, number][] : [yWarning as [number, number]];
  const dangerRanges = Array.isArray(yDanger[0]) ? yDanger as [number, number][] : [yDanger as [number, number]];

  for (const [y0, y1] of warningRanges) {
    shapes.push({
      type: "rect",
      xref: "paper",
      x0: 0, x1: 1,
      yref: "y",
      y0, y1,
      fillcolor: "rgba(245, 158, 11, 0.08)",
      line: { width: 0 },
      layer: "below",
    });
  }

  for (const [y0, y1] of dangerRanges) {
    shapes.push({
      type: "rect",
      xref: "paper",
      x0: 0, x1: 1,
      yref: "y",
      y0, y1,
      fillcolor: "rgba(224, 32, 44, 0.1)",
      line: { width: 0 },
      layer: "below",
    });
  }

  return shapes;
}
