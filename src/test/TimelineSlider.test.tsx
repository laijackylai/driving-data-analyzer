import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { TimeRangeProvider } from "@/hooks/useTimeRange";
import { TimelineSlider } from "@/components/features/TimelineSlider";
import type { OBD2DataPoint } from "@/types";

// Mock requestAnimationFrame
beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

function buildTimeSeries(count = 10, durationSeconds = 600): OBD2DataPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: 1000 + (i / (count - 1)) * durationSeconds,
    vehicleSpeed: i % 3 === 0 ? 20 : i % 3 === 1 ? 60 : 100,
  } as OBD2DataPoint));
}

function renderSlider(timeSeries: OBD2DataPoint[]) {
  return render(
    React.createElement(TimeRangeProvider, null,
      React.createElement(TimelineSlider, { timeSeries })
    )
  );
}

describe("TimelineSlider", () => {
  it("renders nothing when timeSeries is empty", () => {
    const { container } = renderSlider([]);
    expect(container.firstChild).toBeNull();
  });

  it("renders with timeSeries data", () => {
    renderSlider(buildTimeSeries());
    // Reset button is present
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  it("Reset button is disabled initially (no active range)", () => {
    renderSlider(buildTimeSeries());
    const btn = screen.getByRole("button", { name: "Reset" });
    expect(btn).toBeDisabled();
  });

  it("shows 0:00 as left time label initially", () => {
    renderSlider(buildTimeSeries());
    expect(screen.getByText("0:00")).toBeInTheDocument();
  });

  it("shows total duration as right time label initially", () => {
    // 600 seconds = 10:00
    renderSlider(buildTimeSeries(10, 600));
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });

  it("shows correct duration for short session", () => {
    // 90 seconds = 1:30
    renderSlider(buildTimeSeries(10, 90));
    expect(screen.getByText("1:30")).toBeInTheDocument();
  });

  it("renders two drag handles", () => {
    const { container } = renderSlider(buildTimeSeries());
    // Both handles are divs with cursor-ew-resize
    const handles = container.querySelectorAll(".cursor-ew-resize");
    expect(handles.length).toBe(2);
  });

  it("renders speed heatmap segments", () => {
    const { container } = renderSlider(buildTimeSeries());
    // The heatmap bar contains colored segment divs
    // Check that colored segments exist (inline background-color style)
    const colored = container.querySelectorAll("[style*='background-color']");
    expect(colored.length).toBeGreaterThan(0);
  });
});
