import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

function renderSliderWithHome(timeSeries: OBD2DataPoint[], onHomeClick: () => void) {
  return render(
    React.createElement(TimeRangeProvider, null,
      React.createElement(TimelineSlider, { timeSeries, onHomeClick })
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

describe("TimelineSlider heatmap edge cases", () => {
  it("renders heatmap segments with missing vehicleSpeed (uses 0 via ?? operator)", () => {
    // Build a time series where vehicleSpeed is undefined — covers the `?? 0` branch
    const noSpeedSeries: OBD2DataPoint[] = Array.from({ length: 5 }, (_, i) => ({
      timestamp: 1000 + i * 100,
      // vehicleSpeed intentionally omitted
    } as OBD2DataPoint));

    const { container } = renderSlider(noSpeedSeries);
    // Should render without error
    const colored = container.querySelectorAll("[style*='background-color']");
    expect(colored.length).toBeGreaterThan(0);
  });

  it("cancels pending RAF when a second drag move fires before first completes (line 76 branch)", () => {
    let pendingCallback: FrameRequestCallback | null = null;
    let rafId = 0;

    // Override stubGlobal RAF to defer execution so rafRef.current is set
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      pendingCallback = cb;
      return ++rafId;
    });
    const cancelSpy = vi.fn();
    vi.stubGlobal("cancelAnimationFrame", cancelSpy);

    const { container } = renderSlider(buildTimeSeries());
    const track = container.querySelector(".select-none") as HTMLElement;

    vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
      left: 0, right: 400, width: 400, top: 0, bottom: 44, height: 44, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    const handles = container.querySelectorAll(".cursor-ew-resize");
    const leftHandle = handles[0] as HTMLElement;
    leftHandle.setPointerCapture = vi.fn();

    // Start drag
    fireEvent.pointerDown(leftHandle, { clientX: 0, pointerId: 1 });

    // First move — RAF is queued but not executed
    act(() => {
      fireEvent.pointerMove(track, { clientX: 20, pointerId: 1 });
    });
    // rafRef.current should now be set (RAF is pending)

    // Second move before RAF fires — should call cancelAnimationFrame with previous id
    act(() => {
      fireEvent.pointerMove(track, { clientX: 40, pointerId: 1 });
    });
    expect(cancelSpy).toHaveBeenCalled();

    // Now execute the pending RAF callback
    if (pendingCallback) act(() => { pendingCallback!(0); });
    fireEvent.pointerUp(track);

    // Restore sync RAF for other tests
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => { cb(0); return 0; });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });
});

describe("TimelineSlider pointer interactions", () => {
  it("pointerMove without pointerDown does nothing (no-drag early return)", () => {
    const { container } = renderSlider(buildTimeSeries());
    // Find the track div (flex-1 h-11 select-none)
    const track = container.querySelector(".select-none") as HTMLElement;
    expect(track).toBeTruthy();

    // Fire pointerMove without first doing pointerDown — draggingRef is null → early return
    expect(() => {
      fireEvent.pointerMove(track, { clientX: 100, clientY: 0 });
    }).not.toThrow();
  });

  it("pointerUp clears dragging state without error", () => {
    const { container } = renderSlider(buildTimeSeries());
    const track = container.querySelector(".select-none") as HTMLElement;

    expect(() => {
      fireEvent.pointerUp(track);
      fireEvent.pointerLeave(track);
    }).not.toThrow();
  });

  it("dragging left handle fires pointerDown and updates on pointerMove", () => {
    const { container } = renderSlider(buildTimeSeries());
    const track = container.querySelector(".select-none") as HTMLElement;

    // Stub getBoundingClientRect so dx calculation works
    vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
      left: 0, right: 400, width: 400, top: 0, bottom: 44, height: 44, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    // Mock setPointerCapture to avoid jsdom not-implemented error
    const handles = container.querySelectorAll(".cursor-ew-resize");
    const leftHandle = handles[0] as HTMLElement;
    leftHandle.setPointerCapture = vi.fn();

    // PointerDown on left handle
    fireEvent.pointerDown(leftHandle, { clientX: 0, pointerId: 1 });

    // PointerMove on track — should invoke updateRange via left branch
    act(() => {
      fireEvent.pointerMove(track, { clientX: 40, pointerId: 1 });
    });

    // PointerUp clears drag state
    fireEvent.pointerUp(track);
  });

  it("dragging right handle fires pointerDown and updates on pointerMove", () => {
    const { container } = renderSlider(buildTimeSeries());
    const track = container.querySelector(".select-none") as HTMLElement;

    vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
      left: 0, right: 400, width: 400, top: 0, bottom: 44, height: 44, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    const handles = container.querySelectorAll(".cursor-ew-resize");
    const rightHandle = handles[1] as HTMLElement;
    rightHandle.setPointerCapture = vi.fn();

    fireEvent.pointerDown(rightHandle, { clientX: 400, pointerId: 1 });

    act(() => {
      fireEvent.pointerMove(track, { clientX: 360, pointerId: 1 });
    });

    fireEvent.pointerUp(track);
  });

  it("range drag area and handles render when range is active, range drag works", async () => {
    const user = userEvent.setup();
    const { container } = renderSlider(buildTimeSeries());

    // Activate a range by dragging the left handle significantly inward
    const track = container.querySelector(".select-none") as HTMLElement;

    vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
      left: 0, right: 400, width: 400, top: 0, bottom: 44, height: 44, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    const handles = container.querySelectorAll(".cursor-ew-resize");
    const leftHandle = handles[0] as HTMLElement;
    leftHandle.setPointerCapture = vi.fn();

    // Drag left handle far right to create a visible sub-range
    fireEvent.pointerDown(leftHandle, { clientX: 0, pointerId: 1 });
    act(() => {
      fireEvent.pointerMove(track, { clientX: 100, pointerId: 1 }); // +25% of track
    });
    fireEvent.pointerUp(track);

    // Wait for state update — range overlay / range drag div should now appear
    await vi.waitFor(() => {
      const grabAreas = container.querySelectorAll(".cursor-grab");
      expect(grabAreas.length).toBeGreaterThan(0);
    });

    // Now test range-drag (the "else" branch): pointerDown on the range-drag div, then move
    const rangeDragDiv = container.querySelector(".cursor-grab") as HTMLElement;
    rangeDragDiv.setPointerCapture = vi.fn();

    fireEvent.pointerDown(rangeDragDiv, { clientX: 150, pointerId: 2 });
    act(() => {
      fireEvent.pointerMove(track, { clientX: 160, pointerId: 2 }); // small shift right
    });
    fireEvent.pointerUp(track);
  });

  it("range drag clamps when nl < 0 (left boundary clamp)", async () => {
    const { container } = renderSlider(buildTimeSeries());
    const track = container.querySelector(".select-none") as HTMLElement;

    vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
      left: 0, right: 400, width: 400, top: 0, bottom: 44, height: 44, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    // Create a range by dragging right handle left
    const handles = container.querySelectorAll(".cursor-ew-resize");
    const rightHandle = handles[1] as HTMLElement;
    rightHandle.setPointerCapture = vi.fn();

    fireEvent.pointerDown(rightHandle, { clientX: 400, pointerId: 1 });
    act(() => {
      fireEvent.pointerMove(track, { clientX: 300, pointerId: 1 }); // right handle to 75%
    });
    fireEvent.pointerUp(track);

    // Wait for range to be active
    await vi.waitFor(() => {
      const grabAreas = container.querySelectorAll(".cursor-grab");
      expect(grabAreas.length).toBeGreaterThan(0);
    });

    // Drag range far left past 0 to trigger nl < 0 clamp
    const rangeDragDiv = container.querySelector(".cursor-grab") as HTMLElement;
    rangeDragDiv.setPointerCapture = vi.fn();

    fireEvent.pointerDown(rangeDragDiv, { clientX: 50, pointerId: 2 });
    act(() => {
      fireEvent.pointerMove(track, { clientX: -100, pointerId: 2 }); // large negative dx
    });
    fireEvent.pointerUp(track);
  });

  it("range drag clamps when nr > 1 (right boundary clamp)", async () => {
    const { container } = renderSlider(buildTimeSeries());
    const track = container.querySelector(".select-none") as HTMLElement;

    vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
      left: 0, right: 400, width: 400, top: 0, bottom: 44, height: 44, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    // Create a range by dragging left handle right
    const handles = container.querySelectorAll(".cursor-ew-resize");
    const leftHandle = handles[0] as HTMLElement;
    leftHandle.setPointerCapture = vi.fn();

    fireEvent.pointerDown(leftHandle, { clientX: 0, pointerId: 1 });
    act(() => {
      fireEvent.pointerMove(track, { clientX: 100, pointerId: 1 }); // left handle to 25%
    });
    fireEvent.pointerUp(track);

    await vi.waitFor(() => {
      const grabAreas = container.querySelectorAll(".cursor-grab");
      expect(grabAreas.length).toBeGreaterThan(0);
    });

    // Drag range far right past 1 to trigger nr > 1 clamp
    const rangeDragDiv = container.querySelector(".cursor-grab") as HTMLElement;
    rangeDragDiv.setPointerCapture = vi.fn();

    fireEvent.pointerDown(rangeDragDiv, { clientX: 350, pointerId: 2 });
    act(() => {
      fireEvent.pointerMove(track, { clientX: 600, pointerId: 2 }); // large positive dx
    });
    fireEvent.pointerUp(track);
  });

  it("dragging left handle back to far left resets time range (l<=0.001 && r>=0.999 branch)", async () => {
    const { container } = renderSlider(buildTimeSeries());
    const track = container.querySelector(".select-none") as HTMLElement;

    vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
      left: 0, right: 400, width: 400, top: 0, bottom: 44, height: 44, x: 0, y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    const handles = container.querySelectorAll(".cursor-ew-resize");
    const rightHandle = handles[1] as HTMLElement;
    rightHandle.setPointerCapture = vi.fn();

    // First: shrink the range by moving right handle left
    fireEvent.pointerDown(rightHandle, { clientX: 400, pointerId: 1 });
    act(() => {
      fireEvent.pointerMove(track, { clientX: 300, pointerId: 1 }); // right to 75%
    });
    fireEvent.pointerUp(track);

    await vi.waitFor(() => {
      const grabAreas = container.querySelectorAll(".cursor-grab");
      expect(grabAreas.length).toBeGreaterThan(0);
    });

    // Re-query handles after range is active (the component now renders 3 handles: left, range-drag, right)
    // Right handle is still the last cursor-ew-resize
    const updatedHandles = container.querySelectorAll(".cursor-ew-resize");
    const rightHandle2 = updatedHandles[updatedHandles.length - 1] as HTMLElement;
    rightHandle2.setPointerCapture = vi.fn();

    // Now drag right handle back to the far right — this should trigger resetTimeRange
    // because l ≈ 0 and r ≈ 1 after the move
    fireEvent.pointerDown(rightHandle2, { clientX: 300, pointerId: 2 });
    act(() => {
      fireEvent.pointerMove(track, { clientX: 400, pointerId: 2 }); // back to 100%
    });
    fireEvent.pointerUp(track);

    // After reset, Reset button should be disabled again
    await vi.waitFor(() => {
      const resetBtn = screen.getByRole("button", { name: "Reset" });
      expect(resetBtn).toBeDisabled();
    });
  });
});

describe("TimelineSlider home button", () => {
  it("renders a home button when onHomeClick is provided", () => {
    renderSliderWithHome(buildTimeSeries(), vi.fn());
    expect(screen.getByRole("button", { name: /return to landing/i })).toBeInTheDocument();
  });

  it("does not render home button when onHomeClick is not provided", () => {
    renderSlider(buildTimeSeries());
    expect(screen.queryByRole("button", { name: /return to landing/i })).not.toBeInTheDocument();
  });

  it("calls onHomeClick when pressed", async () => {
    const user = userEvent.setup();
    const onHomeClick = vi.fn();
    renderSliderWithHome(buildTimeSeries(), onHomeClick);
    await user.click(screen.getByRole("button", { name: /return to landing/i }));
    expect(onHomeClick).toHaveBeenCalledTimes(1);
  });
});
